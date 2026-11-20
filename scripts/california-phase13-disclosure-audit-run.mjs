#!/usr/bin/env node
/**
 * Read-only California Phase 13 disclosure audit + expanded status runner.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase13-disclosure-audit-run.mjs \
 *     [--out dir] [--checkpoint path] [--max-requests N] [--resume]
 *
 * Begins with a predefined larger stratified sample (target N=120 disclosure,
 * N=48 status) expanded deterministically from DownloadStateData. Supports
 * resumable checkpointing for a future roster-wide run of all 15,451
 * publication candidates. Does not publish California. Does not send CDSS email.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CALIFORNIA_PHASE13_DISCLOSURE_SEED,
  CALIFORNIA_PHASE13_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE13_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE13_STATUS_SEED,
  CALIFORNIA_PHASE13_STATUS_STRATUM_QUOTAS,
  CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS,
  classifyCaliforniaPhase13DisclosureStratum,
  classifyCaliforniaPhase13StatusStratum,
} from "../lib/california-phase13-sample.ts";
import {
  CALIFORNIA_PHASE13_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  appendCaliforniaPhase13AuditResult,
  californiaPhase13AuditItemKey,
  californiaPhase13DefaultAuditConfig,
  classifyCaliforniaPhase13DisclosureLink,
  createCaliforniaPhase13AuditCheckpoint,
  finalizeCaliforniaPhase13AuditCheckpoint,
  generateCaliforniaPhase13DisclosureLinks,
  planCaliforniaPhase13StratifiedSample,
  remainingCaliforniaPhase13AuditQueue,
  shouldStopCaliforniaPhase13Audit,
  summarizeCaliforniaPhase13DisclosureLinks,
} from "../lib/california-phase13-disclosure-audit.ts";
import {
  observeCaliforniaPhase13StatusMapping,
  summarizeCaliforniaPhase13StatusMapping,
  CALIFORNIA_PHASE13_WITHDRAWN_EVIDENCE,
  isCaliforniaPhase13DownloadOnlyWithdrawnIndicator,
} from "../lib/california-phase13-status-verification.ts";
import {
  CALIFORNIA_PHASE13_READINESS_DECISION,
  californiaPhase13AllowsPublication,
} from "../lib/california-phase13-readiness.ts";
import {
  CALIFORNIA_PHASE13_OBSERVED_COUNTS,
  evaluateCaliforniaPhase13Quality,
} from "../lib/california-phase13-quality.ts";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
} from "../lib/california-phase6-publication-gate.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
} from "../lib/california-transparency-download.ts";
import {
  fetchCaliforniaFacilityDetail,
  parseCaliforniaFacilityDetail,
} from "../lib/california-status-verification.ts";

function parseArgs(argv) {
  const args = {
    outDir: "california-phase13-audit-out",
    checkpoint: null,
    maxRequests: 250,
    resume: false,
    skipPageProbe: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--checkpoint") args.checkpoint = argv[++i];
    else if (a === "--max-requests") args.maxRequests = Number(argv[++i]);
    else if (a === "--resume") args.resume = true;
    else if (a === "--skip-page-probe") args.skipPageProbe = true;
    else if (!a.startsWith("-") && args.outDir === "california-phase13-audit-out") {
      args.outDir = a;
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const observedOn = new Date().toISOString().slice(0, 10);
const guid = randomUUID();
const configHeader = californiaTransparencyConfigHeader({ guid });
const lastRequestAt = { value: 0 };
const sessionStartedAt = Date.now();

mkdirSync(args.outDir, { recursive: true });
const checkpointPath = args.checkpoint
  ?? join(args.outDir, "disclosure-audit-checkpoint.json");
const summaryPath = join(args.outDir, "live-run-summary.json");
const fullOutPath = join(args.outDir, "california-phase13-disclosure-audit-live.json");

async function downloadTransparency(file, downloadId) {
  const url = `${CALIFORNIA_PHASE6_DOWNLOAD_API}?${new URLSearchParams({
    id: downloadId,
    GUID: guid,
  })}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,*/*",
      "DSS-Transparency-Config": configHeader,
    },
  });
  const csvText = await response.text();
  return {
    file,
    httpStatus: response.status,
    contentDisposition: response.headers.get("content-disposition"),
    lastModified: response.headers.get("last-modified"),
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
    filenameDate: parseCaliforniaTransparencyDownloadFilenameDate(
      response.headers.get("content-disposition"),
    ),
    rows: parseCaliforniaTransparencyDownloadCsv(csvText),
  };
}

async function probePage(url) {
  if (!url || args.skipPageProbe) return { httpStatus: null, finalUrl: null };
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow" });
    return { httpStatus: response.status, finalUrl: response.url };
  } catch {
    return { httpStatus: 0, finalUrl: null };
  }
}

function writeCheckpoint(checkpoint) {
  writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

console.log("Phase 13: downloading DownloadStateData for sample expansion + sha256...");
const [rcfeDownload, arfDownload] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
]);

const allRows = [
  ...rcfeDownload.rows.map(row => ({ file: "RCFE", row })),
  ...arfDownload.rows.map(row => ({ file: "ARF", row })),
];
const downloadById = new Map(
  allRows.map(({ row }) => [String(row.facilityNumber).trim(), row]),
);

const closedRows = allRows
  .map(({ row }) => row)
  .filter(row => String(row.facilityStatus).trim().toUpperCase() === "CLOSED");
const downloadClosedEmptyLicenseFirst = closedRows.filter(
  row => String(row.licenseFirstDate ?? "").trim() === "",
).length;
const downloadClosedWithLicenseFirst = closedRows.filter(
  row => String(row.licenseFirstDate ?? "").trim() !== "",
).length;

const disclosurePool = [];
for (const { file, row } of allRows) {
  const classified = classifyCaliforniaPhase13DisclosureStratum(file, row);
  if (classified) disclosurePool.push(classified);
}

const statusPool = [];
for (const { file, row } of allRows) {
  const classified = classifyCaliforniaPhase13StatusStratum(file, row);
  if (classified) statusPool.push(classified);
}

const disclosurePlan = planCaliforniaPhase13StratifiedSample(
  disclosurePool,
  CALIFORNIA_PHASE13_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE13_DISCLOSURE_SEED,
).slice(0, Math.max(
  CALIFORNIA_PHASE13_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE13_DISCLOSURE_SEED.length,
));

// Ensure seed controls are present even if slice truncated oddly
const disclosureByKey = new Map();
for (const row of [...CALIFORNIA_PHASE13_DISCLOSURE_SEED, ...disclosurePlan]) {
  disclosureByKey.set(
    `${row.facilityNumber}::${row.label}::${row.requestFacilityNumber ?? ""}`,
    row,
  );
}
const disclosureSample = [...disclosureByKey.values()];

const statusPlan = planCaliforniaPhase13StratifiedSample(
  statusPool,
  CALIFORNIA_PHASE13_STATUS_STRATUM_QUOTAS,
  CALIFORNIA_PHASE13_STATUS_SEED,
);
const statusByKey = new Map();
for (const row of [...CALIFORNIA_PHASE13_STATUS_SEED, ...statusPlan]) {
  statusByKey.set(`${row.facilityNumber}::${row.label}`, row);
}
let statusSample = [...statusByKey.values()];
if (statusSample.length > CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE) {
  // Prefer seed + regression controls, then fill from plan
  const preferred = new Set(
    CALIFORNIA_PHASE13_STATUS_SEED.map(r => `${r.facilityNumber}::${r.label}`),
  );
  const extras = statusSample.filter(r => !preferred.has(`${r.facilityNumber}::${r.label}`));
  statusSample = [
    ...CALIFORNIA_PHASE13_STATUS_SEED,
    ...extras.slice(0, Math.max(0, CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE - CALIFORNIA_PHASE13_STATUS_SEED.length)),
  ];
}

writeFileSync(
  join(args.outDir, "disclosure-sample-plan.json"),
  JSON.stringify({
    targetSize: CALIFORNIA_PHASE13_DISCLOSURE_SAMPLE_TARGET_SIZE,
    plannedSize: disclosureSample.length,
    seedSize: CALIFORNIA_PHASE13_DISCLOSURE_SEED.length,
    sample: disclosureSample,
  }, null, 2),
);
writeFileSync(
  join(args.outDir, "status-sample-plan.json"),
  JSON.stringify({
    targetSize: CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE,
    plannedSize: statusSample.length,
    seedSize: CALIFORNIA_PHASE13_STATUS_SEED.length,
    regressionIds: CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS,
    sample: statusSample,
  }, null, 2),
);

const auditQueue = disclosureSample.map(target => ({
  facilityNumber: target.facilityNumber,
  requestFacilityNumber: target.requestFacilityNumber,
  file: target.file,
  downloadStatus: target.downloadStatus,
  downloadType: target.downloadType,
  stratum: target.stratum,
  label: target.label,
  publicationCandidate: target.publicationCandidate === true,
}));

const auditConfig = californiaPhase13DefaultAuditConfig({
  maxRequests: args.maxRequests,
  minIntervalMs: 450,
  checkpointEvery: 10,
  rosterDenominator: CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

let checkpoint;
if (args.resume && existsSync(checkpointPath)) {
  checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  checkpoint.requestsThisSession = 0;
  checkpoint.config = { ...checkpoint.config, ...auditConfig };
  console.log(
    `Phase 13: resuming checkpoint with ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} completed`,
  );
} else {
  checkpoint = createCaliforniaPhase13AuditCheckpoint({
    mode: "stratified-sample",
    observedOn,
    queue: auditQueue,
    config: auditConfig,
  });
  writeCheckpoint(checkpoint);
}

console.log(
  `Phase 13: auditing ${auditQueue.length} disclosure links (roster denominator ${CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE})...`,
);

let remaining = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
while (remaining.length > 0) {
  const stop = shouldStopCaliforniaPhase13Audit({
    requestsThisSession: checkpoint.requestsThisSession,
    elapsedMs: Date.now() - sessionStartedAt,
    consecutiveInconclusive: checkpoint.consecutiveInconclusive,
    remainingCount: remaining.length,
    config: checkpoint.config,
  });
  if (stop) {
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, stop);
    writeCheckpoint(checkpoint);
    console.log(`Phase 13: stopping disclosure audit — ${stop}`);
    break;
  }

  const item = remaining[0];
  const requestId = item.requestFacilityNumber ?? item.facilityNumber;
  const generatedForOfficial = generateCaliforniaPhase13DisclosureLinks(item.facilityNumber);
  const pageProbe = await probePage(generatedForOfficial.pageUrl);
  const fetched = await fetchCaliforniaFacilityDetail(requestId, {
    minIntervalMs: checkpoint.config.minIntervalMs,
    maxAttempts: checkpoint.config.maxAttempts,
    backoffMs: checkpoint.config.backoffMs,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const classified = classifyCaliforniaPhase13DisclosureLink({
    facilityNumber: requestId,
    file: item.file,
    stratum: item.stratum,
    downloadStatus: item.downloadStatus,
    downloadType: item.downloadType,
    apiHttpStatus: fetched.httpStatus,
    liveFacilityNumber: parse?.facilityNumber ?? null,
    apiFound: parse?.found ?? false,
    pageHttpStatus: pageProbe.httpStatus,
    pageFinalUrl: pageProbe.finalUrl,
    timedOut: fetched.timedOut,
  });
  checkpoint = appendCaliforniaPhase13AuditResult(checkpoint, item, classified, {
    liveStatus: parse?.status ?? null,
    attempts: fetched.attempts,
  });

  if (checkpoint.results.length % checkpoint.config.checkpointEvery === 0) {
    writeCheckpoint(checkpoint);
    console.log(
      `Phase 13: checkpoint ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} `
        + `(session requests ${checkpoint.requestsThisSession})`,
    );
  }

  remaining = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
}

if (!checkpoint.stopReason) {
  checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "queue-exhausted");
}
writeCheckpoint(checkpoint);

const disclosureSummary = summarizeCaliforniaPhase13DisclosureLinks(
  checkpoint.results,
  {
    observedOn,
    rosterDenominator: CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  },
);

console.log(
  `Phase 13: mapping ${statusSample.length} licensing statuses (regression controls retained)...`,
);
const statusObservations = [];
for (const target of statusSample) {
  const downloadRow = downloadById.get(target.facilityNumber);
  const downloadStatus = downloadRow?.facilityStatus ?? target.downloadStatus;
  const downloadType = downloadRow?.facilityType ?? target.downloadType;
  const fetched = await fetchCaliforniaFacilityDetail(target.facilityNumber, {
    minIntervalMs: 450,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const isRegression = CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS.includes(target.facilityNumber)
    || target.regressionControl === true;
  statusObservations.push(
    observeCaliforniaPhase13StatusMapping(
      {
        facilityNumber: target.facilityNumber,
        file: target.file,
        downloadStatus,
        downloadType: downloadType || target.downloadType,
        stratum: target.stratum,
        label: target.label,
        regressionControl: isRegression,
      },
      {
        httpStatus: fetched.httpStatus,
        attempts: fetched.attempts,
        timedOut: fetched.timedOut,
        liveFacilityNumber: parse?.facilityNumber ?? null,
        liveStatus: parse?.status ?? null,
        liveFacilityType: parse?.facilityType ?? null,
        liveDateClosed: parse?.dateClosed ?? null,
        liveLicenseFirstDate: parse?.licenseFirstDate ?? null,
        liveLicenseEffectiveDate: parse?.licenseEffectiveDate ?? null,
        downloadClosedDate: downloadRow?.closedDate ?? null,
        downloadLicenseFirstDate: downloadRow?.licenseFirstDate ?? null,
        found: Boolean(parse?.found),
      },
    ),
  );
}
const statusSummary = summarizeCaliforniaPhase13StatusMapping(
  statusObservations,
  observedOn,
);

const quality = evaluateCaliforniaPhase13Quality({
  observedOn,
  disclosure: {
    sampleSize: disclosureSummary.sampleSize,
    working: disclosureSummary.working,
    missing: disclosureSummary.missing,
    ambiguous: disclosureSummary.ambiguous,
    invalid: disclosureSummary.invalid,
    inconclusive: disclosureSummary.inconclusive,
    verifiedCount: disclosureSummary.sampleSize,
    rosterDenominator: CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  },
  status: {
    sampleSize: statusSummary.sampleSize,
    match: statusSummary.match,
    documentedCoarsening: statusSummary["documented-coarsening"],
    conflict: statusSummary.conflict,
    missing: statusSummary.missing,
    inconclusive: statusSummary.inconclusive,
    invalidId: statusSummary["invalid-id"],
    regressionControlsResolved: statusSummary.regressionControlsResolvedAsDocumentedCoarsening,
  },
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
});

const output = {
  observedOn,
  urlPatterns: CALIFORNIA_PHASE13_DISCLOSURE_URL_PATTERNS,
  withdrawnEvidence: CALIFORNIA_PHASE13_WITHDRAWN_EVIDENCE,
  downloadOnlyWithdrawnIndicatorNote:
    "Download CLOSED + empty License First Date is a download-only indicator; official withdrawn status requires FacilityDetail Application Withdrawn + never-licensed markers.",
  download: {
    rcfe: {
      httpStatus: rcfeDownload.httpStatus,
      contentDisposition: rcfeDownload.contentDisposition,
      bytes: rcfeDownload.bytes,
      sha256: rcfeDownload.sha256,
      rows: rcfeDownload.rows.length,
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
      filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
    },
    authoritativeIsoExportDate: null,
    sha256MatchesPhase10Baseline: quality.downloadSha256MatchesBaseline,
    baselineSha256: CALIFORNIA_PHASE13_OBSERVED_COUNTS.downloadSha256,
    closedBucket: {
      total: closedRows.length,
      emptyLicenseFirstDate: downloadClosedEmptyLicenseFirst,
      withLicenseFirstDate: downloadClosedWithLicenseFirst,
      downloadOnlyWithdrawnIndicatorCount: closedRows.filter(row =>
        isCaliforniaPhase13DownloadOnlyWithdrawnIndicator({
          downloadStatus: row.facilityStatus,
          downloadLicenseFirstDate: row.licenseFirstDate,
        }),
      ).length,
      note:
        "Download-only counts; empty License First Date is consistent with Application Withdrawn coarsening but is not FacilityDetail-verified statewide.",
    },
  },
  auditHarness: {
    checkpointPath,
    stopReason: checkpoint.stopReason,
    queueTotal: checkpoint.queueTotal,
    completed: checkpoint.completedKeys.length,
    mode: checkpoint.mode,
    config: checkpoint.config,
    statewideCoverageClaimed: false,
  },
  disclosureLinks: disclosureSummary,
  statusMapping: statusSummary,
  readiness: CALIFORNIA_PHASE13_READINESS_DECISION,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase13AllowsPublication(),
  gate: "blocked",
  cdssClarification: {
    status: "sent-awaiting-response",
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: CALIFORNIA_PHASE13_READINESS_DECISION.baselinePreserved,
};

writeFileSync(fullOutPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  disclosure: {
    sampleSize: disclosureSummary.sampleSize,
    working: disclosureSummary.working,
    missing: disclosureSummary.missing,
    ambiguous: disclosureSummary.ambiguous,
    invalid: disclosureSummary.invalid,
    inconclusive: disclosureSummary.inconclusive,
    leadingZeroPreservedWorking: disclosureSummary.leadingZeroPreservedWorking,
    verifiedCoverage: disclosureSummary.verifiedCoverage,
    statewideCoverageClaimed: false,
    stopReason: checkpoint.stopReason,
  },
  status: {
    sampleSize: statusSummary.sampleSize,
    match: statusSummary.match,
    documentedCoarsening: statusSummary["documented-coarsening"],
    conflict: statusSummary.conflict,
    missing: statusSummary.missing,
    inconclusive: statusSummary.inconclusive,
    invalidId: statusSummary["invalid-id"],
    applicationWithdrawnDocumented: statusSummary.applicationWithdrawnDocumented,
    regressionControlsResolvedAsDocumentedCoarsening:
      statusSummary.regressionControlsResolvedAsDocumentedCoarsening,
    regressionControlCount: statusSummary.regressionControlCount,
    byEvidenceKind: statusSummary.byEvidenceKind,
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    sampleIsStatewideConclusion: false,
  },
  downloadClosedBucket: {
    total: closedRows.length,
    emptyLicenseFirstDate: downloadClosedEmptyLicenseFirst,
    withLicenseFirstDate: downloadClosedWithLicenseFirst,
  },
  downloadSha256MatchesBaseline: quality.downloadSha256MatchesBaseline,
  baseline: CALIFORNIA_PHASE13_READINESS_DECISION.baselinePreserved,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  cdssClarification: "sent-awaiting-response",
  outDir: args.outDir,
  checkpointPath,
  fullOutPath,
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

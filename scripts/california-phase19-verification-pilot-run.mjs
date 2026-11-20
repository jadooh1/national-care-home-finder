#!/usr/bin/env node
/**
 * Read-only California Phase 19 limited verification pilot (≤250 unique).
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase19-verification-pilot-run.mjs \
 *     [--out dir] [--checkpoint path] [--max-requests N] [--resume]
 *
 * Executes the user-approved ≤250 previously-unverified pilot using the
 * Phase 13 rate-limited resumable disclosure-audit harness. Excludes the
 * existing 462 disclosure samples. Applies Phase 18 exclusion policy for
 * offline classification only (not activated in app/DB). Does not start
 * staged statewide. Does not publish California. Does not send CDSS email.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE19_DISCLOSURE_SEED,
  CALIFORNIA_PHASE19_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE19_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE19_PILOT_FACILITY_CAP,
  CALIFORNIA_PHASE19_GEOGRAPHIC_QUOTAS,
  balanceCaliforniaPhase19GeographicDiversity,
  classifyCaliforniaPhase19DisclosureStratum,
} from "../lib/california-phase19-sample.ts";
import {
  CALIFORNIA_PHASE19_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE19_PHASE16_CUMULATIVE_VERIFIED_COUNT as PHASE16_BASELINE,
  CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  classifyCaliforniaPhase19DisclosureLink,
  generateCaliforniaPhase19DisclosureLinks,
  planCaliforniaPhase19StratifiedSample,
  summarizeCaliforniaPhase19Coverage,
} from "../lib/california-phase19-disclosure-audit.ts";
import {
  appendCaliforniaPhase13AuditResult,
  californiaPhase13DefaultAuditConfig,
  createCaliforniaPhase13AuditCheckpoint,
  finalizeCaliforniaPhase13AuditCheckpoint,
  remainingCaliforniaPhase13AuditQueue,
  shouldStopCaliforniaPhase13Audit,
  summarizeCaliforniaPhase13DisclosureLinks,
} from "../lib/california-phase13-disclosure-audit.ts";
import {
  observeCaliforniaPhase13StatusMapping,
  summarizeCaliforniaPhase13StatusMapping,
} from "../lib/california-phase13-status-verification.ts";
import {
  summarizeCaliforniaPhase19ExclusionClassification,
  CALIFORNIA_PHASE19_EXCLUSION_ADOPTION,
} from "../lib/california-phase19-exclusion-classification.ts";
import {
  CALIFORNIA_PHASE19_OBSERVED_COUNTS,
  evaluateCaliforniaPhase19Quality,
} from "../lib/california-phase19-quality.ts";
import {
  evaluateCaliforniaPhase19Readiness,
  californiaPhase19AllowsPublication,
} from "../lib/california-phase19-readiness.ts";
import {
  CALIFORNIA_PHASE19_PILOT_AUTHORIZATION,
  assembleCaliforniaPhase19PilotDossier,
  recommendCaliforniaPhase19NextStage,
  californiaPhase19StagedStatewideStarted,
} from "../lib/california-phase19-pilot.ts";
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
    outDir: "california-phase19-audit-out",
    checkpoint: null,
    maxRequests: CALIFORNIA_PHASE19_PILOT_FACILITY_CAP,
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
    else if (!a.startsWith("-") && args.outDir === "california-phase19-audit-out") {
      args.outDir = a;
    }
  }
  args.maxRequests = Math.min(
    Math.max(1, Number.isFinite(args.maxRequests) ? args.maxRequests : 250),
    CALIFORNIA_PHASE19_PILOT_FACILITY_CAP,
  );
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
const fullOutPath = join(args.outDir, "california-phase19-verification-pilot-live.json");

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

console.log(
  "Phase 19: downloading DownloadStateData for previously-unverified pilot planning + sha256...",
);
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
  const classified = classifyCaliforniaPhase19DisclosureStratum(file, {
    ...row,
    facilityZip: row.facilityZip,
  });
  if (classified) disclosurePool.push(classified);
}

let disclosurePlan = planCaliforniaPhase19StratifiedSample(
  disclosurePool,
  CALIFORNIA_PHASE19_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE19_DISCLOSURE_SEED,
);
disclosurePlan = balanceCaliforniaPhase19GeographicDiversity(
  disclosurePlan,
  disclosurePool,
  CALIFORNIA_PHASE19_GEOGRAPHIC_QUOTAS,
);

const disclosureByKey = new Map();
for (const row of disclosurePlan) {
  disclosureByKey.set(
    `${row.facilityNumber}::${row.label}::${row.requestFacilityNumber ?? ""}`,
    row,
  );
}
let disclosureSample = [...disclosureByKey.values()];
const hardCap = Math.min(
  CALIFORNIA_PHASE19_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE19_PILOT_FACILITY_CAP,
  args.maxRequests,
);
if (disclosureSample.length > hardCap) {
  disclosureSample = disclosureSample.slice(0, hardCap);
}

writeFileSync(
  join(args.outDir, "disclosure-sample-plan.json"),
  JSON.stringify({
    targetSize: CALIFORNIA_PHASE19_DISCLOSURE_SAMPLE_TARGET_SIZE,
    plannedSize: disclosureSample.length,
    seedSize: CALIFORNIA_PHASE19_DISCLOSURE_SEED.length,
    phase13Through16Excluded: true,
    phase16CumulativeBaseline: PHASE16_BASELINE,
    pilotFacilityCap: CALIFORNIA_PHASE19_PILOT_FACILITY_CAP,
    geographicQuotas: CALIFORNIA_PHASE19_GEOGRAPHIC_QUOTAS,
    byRegion: Object.fromEntries(
      ["southern", "central", "bay-northern", "unknown"].map(region => [
        region,
        disclosureSample.filter(r => r.geographicRegion === region).length,
      ]),
    ),
    sample: disclosureSample,
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
  maxRequests: hardCap,
  minIntervalMs: 450,
  checkpointEvery: 10,
  maxDurationMs: 60 * 60 * 1000,
  maxConsecutiveInconclusive: 8,
  rosterDenominator: CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

let checkpoint;
if (args.resume && existsSync(checkpointPath)) {
  checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  checkpoint.requestsThisSession = 0;
  checkpoint.config = { ...checkpoint.config, ...auditConfig };
  console.log(
    `Phase 19: resuming checkpoint with ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} completed`,
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
  `Phase 19: auditing ${auditQueue.length} previously-unverified disclosure links `
    + `(roster denominator ${CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE}; `
    + `Phase 16 cumulative ${PHASE16_BASELINE}; cap ${hardCap})...`,
);

let remaining = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
let rateLimitedOrAccessRestricted = false;
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
    console.log(`Phase 19: stopping disclosure audit — ${stop}`);
    break;
  }

  const item = remaining[0];
  const requestId = item.requestFacilityNumber ?? item.facilityNumber;
  const generatedForOfficial = generateCaliforniaPhase19DisclosureLinks(item.facilityNumber);
  const pageProbe = await probePage(generatedForOfficial.pageUrl);
  const fetched = await fetchCaliforniaFacilityDetail(requestId, {
    minIntervalMs: checkpoint.config.minIntervalMs,
    maxAttempts: checkpoint.config.maxAttempts,
    backoffMs: checkpoint.config.backoffMs,
    lastRequestAt,
  });

  if (fetched.httpStatus === 429 || fetched.httpStatus === 403) {
    rateLimitedOrAccessRestricted = true;
    checkpoint = appendCaliforniaPhase13AuditResult(
      checkpoint,
      item,
      classifyCaliforniaPhase19DisclosureLink({
        facilityNumber: requestId,
        file: item.file,
        stratum: item.stratum,
        downloadStatus: item.downloadStatus,
        downloadType: item.downloadType,
        apiHttpStatus: fetched.httpStatus,
        liveFacilityNumber: null,
        apiFound: false,
        pageHttpStatus: pageProbe.httpStatus,
        pageFinalUrl: pageProbe.finalUrl,
        timedOut: fetched.timedOut,
      }),
      {
        liveStatus: null,
        attempts: fetched.attempts,
      },
    );
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(
      checkpoint,
      "consecutive-inconclusive",
    );
    writeCheckpoint(checkpoint);
    console.log(
      `Phase 19: automatic stop on access restriction / rate limit (HTTP ${fetched.httpStatus})`,
    );
    break;
  }

  if (fetched.httpStatus >= 500 && fetched.httpStatus < 600 && fetched.attempts >= 3) {
    // Sustained server error after retries — stop rather than thrash CDSS.
    const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
    checkpoint = appendCaliforniaPhase13AuditResult(
      checkpoint,
      item,
      classifyCaliforniaPhase19DisclosureLink({
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
      }),
      {
        liveStatus: parse?.status ?? null,
        attempts: fetched.attempts,
      },
    );
    if (checkpoint.consecutiveInconclusive >= checkpoint.config.maxConsecutiveInconclusive) {
      checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(
        checkpoint,
        "consecutive-inconclusive",
      );
      writeCheckpoint(checkpoint);
      console.log("Phase 19: automatic stop on sustained server errors");
      break;
    }
  } else {
    const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
    const classified = classifyCaliforniaPhase19DisclosureLink({
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
    // Attach parse fields used by offline exclusion / status derivation
    const last = checkpoint.results[checkpoint.results.length - 1];
    if (last) {
      last.liveFacilityNumber = parse?.facilityNumber ?? null;
      last.apiFound = parse?.found ?? false;
      last.apiHttpStatus = fetched.httpStatus;
      last.pageHttpStatus = pageProbe.httpStatus;
      last.pageFinalUrl = pageProbe.finalUrl;
      last.liveLicenseFirstDate = parse?.licenseFirstDate ?? null;
      last.liveLicenseEffectiveDate = parse?.licenseEffectiveDate ?? null;
      last.liveFacilityType = parse?.facilityType ?? null;
      last.liveDateClosed = parse?.dateClosed ?? null;
      last.found = Boolean(parse?.found);
      last.timedOut = fetched.timedOut;
      last.httpStatus = fetched.httpStatus;
    }
  }

  if (checkpoint.results.length % checkpoint.config.checkpointEvery === 0) {
    writeCheckpoint(checkpoint);
    console.log(
      `Phase 19: checkpoint ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} `
        + `(session requests ${checkpoint.requestsThisSession})`,
    );
  }

  remaining = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
}

if (!checkpoint.stopReason) {
  checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "queue-exhausted");
}
writeCheckpoint(checkpoint);

const incrementalSummary = summarizeCaliforniaPhase13DisclosureLinks(
  checkpoint.results,
  {
    observedOn,
    rosterDenominator: CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  },
);
const coverageRollup = summarizeCaliforniaPhase19Coverage({
  phase16CumulativeVerifiedCount: PHASE16_BASELINE,
  incrementalResults: checkpoint.results,
  rosterDenominator: CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

console.log(
  "Phase 19: deriving status consistency from pilot FacilityDetail responses "
    + "(no duplicate CDSS probes for prior 462)...",
);
const statusObservations = [];
for (const row of checkpoint.results) {
  const downloadRow = downloadById.get(row.facilityNumber)
    ?? downloadById.get(row.officialFacilityNumber ?? row.facilityNumber);
  const downloadStatus = row.downloadStatus ?? downloadRow?.facilityStatus ?? "";
  const downloadType = row.downloadType ?? downloadRow?.facilityType ?? "";
  statusObservations.push(
    observeCaliforniaPhase13StatusMapping(
      {
        facilityNumber: row.facilityNumber,
        file: row.file,
        downloadStatus,
        downloadType,
        stratum: row.stratum,
        label: row.label,
        regressionControl: false,
      },
      {
        httpStatus: row.httpStatus ?? row.apiHttpStatus ?? null,
        attempts: row.attempts ?? 1,
        timedOut: row.timedOut === true,
        liveFacilityNumber: row.liveFacilityNumber ?? null,
        liveStatus: row.liveStatus ?? null,
        liveFacilityType: row.liveFacilityType ?? null,
        liveDateClosed: row.liveDateClosed ?? null,
        liveLicenseFirstDate: row.liveLicenseFirstDate ?? null,
        liveLicenseEffectiveDate: row.liveLicenseEffectiveDate ?? null,
        downloadClosedDate: downloadRow?.closedDate ?? null,
        downloadLicenseFirstDate: downloadRow?.licenseFirstDate ?? null,
        found: row.found ?? row.apiFound ?? false,
      },
    ),
  );
}
const statusSummary = summarizeCaliforniaPhase13StatusMapping(
  statusObservations,
  observedOn,
);

console.log("Phase 19: offline exclusion classification (not activated in app/DB)...");
const exclusionSummary = summarizeCaliforniaPhase19ExclusionClassification({
  observedOn,
  disclosureRows: checkpoint.results.map(row => {
    const downloadRow = downloadById.get(row.facilityNumber)
      ?? downloadById.get(row.officialFacilityNumber ?? row.facilityNumber);
    return {
      facilityNumber: row.requestFacilityNumber ?? row.facilityNumber,
      classification: row.classification,
      identifierRelation: row.identifierRelation,
      downloadStatus: row.downloadStatus,
      liveStatus: row.liveStatus,
      publicationCandidate: row.publicationCandidate,
      liveFacilityNumber: row.liveFacilityNumber,
      downloadLicenseFirstDate: downloadRow?.licenseFirstDate ?? null,
    };
  }),
  statusRows: statusObservations.map(obs => ({
    facilityNumber: obs.facilityNumber,
    relation: obs.relation,
    downloadStatus: obs.downloadStatus,
    liveStatus: obs.liveStatus,
    eligibility: obs.eligibility,
    regressionControl: obs.regressionControl === true,
  })),
  unresolvedCoordinateCount: 28,
  includeCoordinateClass: true,
});
writeFileSync(
  join(args.outDir, "exclusion-classification.json"),
  JSON.stringify({
    ...exclusionSummary,
    // Keep full findings in out dir; fixture copy may be summarized later.
  }, null, 2),
);

const shaMatches =
  rcfeDownload.sha256 === CALIFORNIA_PHASE19_OBSERVED_COUNTS.downloadSha256.rcfe
  && arfDownload.sha256 === CALIFORNIA_PHASE19_OBSERVED_COUNTS.downloadSha256.arf;

if (!shaMatches) {
  console.log(
    "Phase 19: WARNING — DownloadStateData sha256 drifted from Phase 10–18 baseline. "
      + "Pilot results remain sample evidence; do not claim baseline accounting without revalidation.",
  );
}

const quality = evaluateCaliforniaPhase19Quality({
  observedOn,
  disclosure: {
    sampleSize: incrementalSummary.sampleSize,
    working: incrementalSummary.working,
    missing: incrementalSummary.missing,
    ambiguous: incrementalSummary.ambiguous,
    invalid: incrementalSummary.invalid,
    inconclusive: incrementalSummary.inconclusive,
    verifiedCount: coverageRollup.cumulativeVerifiedCount,
    rosterDenominator: CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE,
    phase16CumulativeVerifiedCount: coverageRollup.phase16CumulativeVerifiedCount,
    incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
  },
  status: {
    sampleSize: statusSummary.sampleSize,
    match: statusSummary.match,
    documentedCoarsening: statusSummary["documented-coarsening"],
    conflict: statusSummary.conflict,
    missing: statusSummary.missing,
    inconclusive: statusSummary.inconclusive,
    invalidId: statusSummary["invalid-id"],
    regressionControlsResolved:
      statusSummary.regressionControlsResolvedAsDocumentedCoarsening,
  },
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
  unresolvedCoords: 28,
  verifiedCoords: 15423,
});

const readiness = evaluateCaliforniaPhase19Readiness({
  incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
  cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
});

const recommendation = recommendCaliforniaPhase19NextStage({
  incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
  stopReason: checkpoint.stopReason,
  inconclusiveCount: incrementalSummary.inconclusive,
  conflictCount: statusSummary.conflict,
  workingCount: incrementalSummary.working,
  sampleSize: incrementalSummary.sampleSize,
  downloadSha256MatchesBaseline: shaMatches,
  consecutiveInconclusiveStop: checkpoint.stopReason === "consecutive-inconclusive",
  rateLimitedOrAccessRestricted,
  cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
});

const auditHarness = {
  checkpointPath,
  stopReason: checkpoint.stopReason,
  queueTotal: checkpoint.queueTotal,
  completed: checkpoint.completedKeys.length,
  mode: checkpoint.mode,
  config: checkpoint.config,
  concurrency: 1,
  minIntervalMs: 450,
  statewideCoverageClaimed: false,
  phase16CumulativeVerifiedCount: PHASE16_BASELINE,
  rateLimitedOrAccessRestricted,
  elapsedMs: Date.now() - sessionStartedAt,
};

const dossier = assembleCaliforniaPhase19PilotDossier({
  observedOn,
  incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
  cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
  stopReason: checkpoint.stopReason,
  disclosureSummary: {
    incremental: incrementalSummary,
    coverage: coverageRollup,
    priorBaseline: PHASE16_BASELINE,
  },
  statusSummary,
  exclusionSummary: {
    adoption: CALIFORNIA_PHASE19_EXCLUSION_ADOPTION,
    totalFindings: exclusionSummary.totalFindings,
    byClass: exclusionSummary.byClass,
    uniqueFacilitiesWithFindings: exclusionSummary.uniqueFacilitiesWithFindings,
    workingDisclosureWithoutExclusionSignal:
      exclusionSummary.workingDisclosureWithoutExclusionSignal,
    activatedInApplicationOrDatabase: false,
  },
  quality,
  readiness,
  recommendation,
  auditHarness,
});

const output = {
  observedOn,
  authorization: CALIFORNIA_PHASE19_PILOT_AUTHORIZATION,
  urlPatterns: CALIFORNIA_PHASE19_DISCLOSURE_URL_PATTERNS,
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
    sha256MatchesPhase10Baseline: shaMatches,
    baselineSha256: CALIFORNIA_PHASE19_OBSERVED_COUNTS.downloadSha256,
    closedBucket: {
      total: closedRows.length,
      emptyLicenseFirstDate: downloadClosedEmptyLicenseFirst,
      withLicenseFirstDate: downloadClosedWithLicenseFirst,
    },
  },
  auditHarness,
  disclosureLinks: {
    incremental: incrementalSummary,
    coverage: coverageRollup,
    results: checkpoint.results,
  },
  statusMapping: statusSummary,
  exclusionOfflineClassification: exclusionSummary,
  recommendation,
  readiness,
  quality,
  dossier,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase19AllowsPublication(),
  gate: "blocked",
  stagedStatewideStarted: californiaPhase19StagedStatewideStarted(),
  exclusionActivatedInAppOrDb: false,
  cdssClarification: {
    status: "sent-awaiting-response",
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: readiness.baselinePreserved,
};

writeFileSync(fullOutPath, JSON.stringify(output, null, 2));
writeFileSync(
  join(args.outDir, "pilot-dossier.json"),
  JSON.stringify(dossier, null, 2),
);
writeFileSync(
  join(args.outDir, "recommendation.json"),
  JSON.stringify(recommendation, null, 2),
);

const summary = {
  observedOn,
  disclosure: {
    phase16CumulativeVerifiedCount: coverageRollup.phase16CumulativeVerifiedCount,
    incrementalSampleSize: incrementalSummary.sampleSize,
    incrementalWorking: incrementalSummary.working,
    incrementalMissing: incrementalSummary.missing,
    incrementalAmbiguous: incrementalSummary.ambiguous,
    incrementalInvalid: incrementalSummary.invalid,
    incrementalInconclusive: incrementalSummary.inconclusive,
    leadingZeroPreservedWorking: incrementalSummary.leadingZeroPreservedWorking,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
    rosterDenominator: coverageRollup.rosterDenominator,
    incrementalCoveragePercentRounded: coverageRollup.incrementalCoveragePercentRounded,
    cumulativeCoveragePercentRounded: coverageRollup.cumulativeCoveragePercentRounded,
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
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    sampleIsStatewideConclusion: false,
  },
  exclusion: {
    adoptedForOfflineClassification: true,
    activatedInApplicationOrDatabase: false,
    byClass: exclusionSummary.byClass,
    totalFindings: exclusionSummary.totalFindings,
    uniqueFacilitiesWithFindings: exclusionSummary.uniqueFacilitiesWithFindings,
  },
  recommendation: {
    id: recommendation.id,
    requestStagedStatewide: recommendation.requestStagedStatewide,
    startStagedStatewideNow: false,
  },
  downloadSha256MatchesBaseline: shaMatches,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  stagedStatewideStarted: false,
  cdssClarification: "sent-awaiting-response",
  outDir: args.outDir,
  checkpointPath,
  fullOutPath,
  elapsedMs: Date.now() - sessionStartedAt,
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

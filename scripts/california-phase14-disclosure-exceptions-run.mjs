#!/usr/bin/env node
/**
 * Read-only California Phase 14 disclosure expansion + exception investigation.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase14-disclosure-exceptions-run.mjs \
 *     [--out dir] [--checkpoint path] [--max-requests N] [--resume]
 *
 * Expands a predefined additional previously-unverified stratified disclosure
 * batch using the Phase 13 rate-limited resumable harness. Investigates
 * ambiguous/invalid disclosure cases and the 28 unresolved candidate
 * coordinates with official FacilityDetail + ArcGIS evidence only.
 * Does not publish California. Does not send CDSS email.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE14_DISCLOSURE_SEED,
  CALIFORNIA_PHASE14_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE14_STATUS_SEED,
  CALIFORNIA_PHASE14_STATUS_STRATUM_QUOTAS,
  CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS,
  CALIFORNIA_PHASE14_GEOGRAPHIC_QUOTAS,
  balanceCaliforniaPhase14GeographicDiversity,
  classifyCaliforniaPhase14DisclosureStratum,
  classifyCaliforniaPhase14StatusStratum,
} from "../lib/california-phase14-sample.ts";
import {
  CALIFORNIA_PHASE14_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE14_PHASE13_BASELINE_VERIFIED_COUNT,
  CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  classifyCaliforniaPhase14DisclosureLink,
  generateCaliforniaPhase14DisclosureLinks,
  planCaliforniaPhase14StratifiedSample,
  summarizeCaliforniaPhase14Coverage,
} from "../lib/california-phase14-disclosure-audit.ts";
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
  CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE,
  CALIFORNIA_PHASE14_UNRESOLVED_COORDINATE_CASES,
  californiaPhase14GisQueryUrl,
  classifyCaliforniaPhase14CoordinateException,
  investigateCaliforniaPhase14AmbiguousDisclosure,
  investigateCaliforniaPhase14InvalidDisclosure,
  summarizeCaliforniaPhase14Exceptions,
} from "../lib/california-phase14-exceptions.ts";
import {
  CALIFORNIA_PHASE14_WITHDRAWN_EVIDENCE,
  isCaliforniaPhase14DownloadOnlyWithdrawnIndicator,
} from "../lib/california-phase14-status-verification.ts";
import {
  observeCaliforniaPhase13StatusMapping,
  summarizeCaliforniaPhase13StatusMapping,
} from "../lib/california-phase13-status-verification.ts";
import {
  CALIFORNIA_PHASE14_READINESS_DECISION,
  californiaPhase14AllowsPublication,
  withCaliforniaPhase14CoordinateResolution,
} from "../lib/california-phase14-readiness.ts";
import {
  CALIFORNIA_PHASE14_OBSERVED_COUNTS,
  evaluateCaliforniaPhase14Quality,
} from "../lib/california-phase14-quality.ts";
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
    outDir: "california-phase14-audit-out",
    checkpoint: null,
    maxRequests: 250,
    resume: false,
    skipPageProbe: false,
    skipExceptions: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--checkpoint") args.checkpoint = argv[++i];
    else if (a === "--max-requests") args.maxRequests = Number(argv[++i]);
    else if (a === "--resume") args.resume = true;
    else if (a === "--skip-page-probe") args.skipPageProbe = true;
    else if (a === "--skip-exceptions") args.skipExceptions = true;
    else if (!a.startsWith("-") && args.outDir === "california-phase14-audit-out") {
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
const fullOutPath = join(args.outDir, "california-phase14-disclosure-exceptions-live.json");

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

async function queryGisByFacilityNumber(facilityNumber) {
  const url = californiaPhase14GisQueryUrl(facilityNumber);
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      return { httpStatus: response.status, rows: [], timedOut: false };
    }
    const payload = await response.json();
    const rows = Array.isArray(payload?.features)
      ? payload.features.map(f => f.attributes ?? {})
      : [];
    return { httpStatus: response.status, rows, timedOut: false };
  } catch {
    return { httpStatus: 0, rows: [], timedOut: true };
  }
}

function writeCheckpoint(checkpoint) {
  writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

console.log("Phase 14: downloading DownloadStateData for sample expansion + sha256...");
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
  const classified = classifyCaliforniaPhase14DisclosureStratum(file, {
    ...row,
    facilityZip: row.facilityZip,
  });
  if (classified) disclosurePool.push(classified);
}

const statusPool = [];
for (const { file, row } of allRows) {
  const classified = classifyCaliforniaPhase14StatusStratum(file, {
    ...row,
    facilityZip: row.facilityZip,
  });
  if (classified) statusPool.push(classified);
}

// Enrich disclosure seed with live download fields when available
const enrichedSeed = CALIFORNIA_PHASE14_DISCLOSURE_SEED.map(seed => {
  const live = downloadById.get(seed.facilityNumber);
  if (!live) return seed;
  return {
    ...seed,
    downloadStatus: live.facilityStatus || seed.downloadStatus,
    downloadType: live.facilityType || seed.downloadType,
    geographicRegion: seed.geographicRegion,
  };
});

let disclosurePlan = planCaliforniaPhase14StratifiedSample(
  disclosurePool,
  CALIFORNIA_PHASE14_DISCLOSURE_STRATUM_QUOTAS,
  enrichedSeed,
);
disclosurePlan = balanceCaliforniaPhase14GeographicDiversity(
  disclosurePlan,
  disclosurePool,
  CALIFORNIA_PHASE14_GEOGRAPHIC_QUOTAS,
);

const disclosureByKey = new Map();
for (const row of [...enrichedSeed, ...disclosurePlan]) {
  disclosureByKey.set(
    `${row.facilityNumber}::${row.label}::${row.requestFacilityNumber ?? ""}`,
    row,
  );
}
let disclosureSample = [...disclosureByKey.values()];
if (disclosureSample.length > CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE) {
  const preferred = new Set(
    enrichedSeed.map(r => `${r.facilityNumber}::${r.label}`),
  );
  const preferredRows = disclosureSample.filter(r =>
    preferred.has(`${r.facilityNumber}::${r.label}`),
  );
  const extras = disclosureSample.filter(r =>
    !preferred.has(`${r.facilityNumber}::${r.label}`),
  );
  disclosureSample = [
    ...preferredRows,
    ...extras.slice(
      0,
      Math.max(0, CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE - preferredRows.length),
    ),
  ];
}

const statusPlan = planCaliforniaPhase14StratifiedSample(
  statusPool,
  CALIFORNIA_PHASE14_STATUS_STRATUM_QUOTAS,
  CALIFORNIA_PHASE14_STATUS_SEED,
);
const statusByKey = new Map();
for (const row of [...CALIFORNIA_PHASE14_STATUS_SEED, ...statusPlan]) {
  statusByKey.set(`${row.facilityNumber}::${row.label}`, row);
}
let statusSample = [...statusByKey.values()];
if (statusSample.length > CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE) {
  const preferred = new Set(
    CALIFORNIA_PHASE14_STATUS_SEED.map(r => `${r.facilityNumber}::${r.label}`),
  );
  const extras = statusSample.filter(r => !preferred.has(`${r.facilityNumber}::${r.label}`));
  statusSample = [
    ...CALIFORNIA_PHASE14_STATUS_SEED,
    ...extras.slice(
      0,
      Math.max(0, CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE - CALIFORNIA_PHASE14_STATUS_SEED.length),
    ),
  ];
}

writeFileSync(
  join(args.outDir, "disclosure-sample-plan.json"),
  JSON.stringify({
    targetSize: CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE,
    plannedSize: disclosureSample.length,
    seedSize: enrichedSeed.length,
    phase13Excluded: true,
    geographicQuotas: CALIFORNIA_PHASE14_GEOGRAPHIC_QUOTAS,
    byRegion: Object.fromEntries(
      ["southern", "central", "bay-northern", "unknown"].map(region => [
        region,
        disclosureSample.filter(r => r.geographicRegion === region).length,
      ]),
    ),
    sample: disclosureSample,
  }, null, 2),
);
writeFileSync(
  join(args.outDir, "status-sample-plan.json"),
  JSON.stringify({
    targetSize: CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE,
    plannedSize: statusSample.length,
    seedSize: CALIFORNIA_PHASE14_STATUS_SEED.length,
    regressionIds: CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS,
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
  rosterDenominator: CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

let checkpoint;
if (args.resume && existsSync(checkpointPath)) {
  checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  checkpoint.requestsThisSession = 0;
  checkpoint.config = { ...checkpoint.config, ...auditConfig };
  console.log(
    `Phase 14: resuming checkpoint with ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} completed`,
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
  `Phase 14: auditing ${auditQueue.length} previously-unverified disclosure links `
    + `(roster denominator ${CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE}; `
    + `Phase 13 baseline ${CALIFORNIA_PHASE14_PHASE13_BASELINE_VERIFIED_COUNT})...`,
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
    console.log(`Phase 14: stopping disclosure audit — ${stop}`);
    break;
  }

  const item = remaining[0];
  const requestId = item.requestFacilityNumber ?? item.facilityNumber;
  const generatedForOfficial = generateCaliforniaPhase14DisclosureLinks(item.facilityNumber);
  const pageProbe = await probePage(generatedForOfficial.pageUrl);
  const fetched = await fetchCaliforniaFacilityDetail(requestId, {
    minIntervalMs: checkpoint.config.minIntervalMs,
    maxAttempts: checkpoint.config.maxAttempts,
    backoffMs: checkpoint.config.backoffMs,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const classified = classifyCaliforniaPhase14DisclosureLink({
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
      `Phase 14: checkpoint ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} `
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
    rosterDenominator: CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  },
);
const coverageRollup = summarizeCaliforniaPhase14Coverage({
  phase13BaselineVerifiedCount: CALIFORNIA_PHASE14_PHASE13_BASELINE_VERIFIED_COUNT,
  incrementalResults: checkpoint.results,
  rosterDenominator: CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

console.log(
  `Phase 14: mapping ${statusSample.length} licensing statuses (regression controls retained)...`,
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
  const isRegression = CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS.includes(target.facilityNumber)
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

console.log("Phase 14: investigating disclosure + coordinate exceptions...");
const disclosureFindings = [];
const invalidFinding = investigateCaliforniaPhase14InvalidDisclosure();
disclosureFindings.push(invalidFinding);

if (!args.skipExceptions) {
  const truncatedFetched = await fetchCaliforniaFacilityDetail(
    CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.truncatedRequest,
    { minIntervalMs: 450, lastRequestAt },
  );
  const truncatedParse = truncatedFetched.payload == null
    ? null
    : parseCaliforniaFacilityDetail(truncatedFetched.payload);
  const canonicalFetched = await fetchCaliforniaFacilityDetail(
    CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
    { minIntervalMs: 450, lastRequestAt },
  );
  const canonicalParse = canonicalFetched.payload == null
    ? null
    : parseCaliforniaFacilityDetail(canonicalFetched.payload);
  disclosureFindings.unshift(
    investigateCaliforniaPhase14AmbiguousDisclosure({
      truncated: {
        apiHttpStatus: truncatedFetched.httpStatus,
        liveFacilityNumber: truncatedParse?.facilityNumber ?? null,
        apiFound: truncatedParse?.found ?? false,
        timedOut: truncatedFetched.timedOut,
      },
      canonical: {
        apiHttpStatus: canonicalFetched.httpStatus,
        liveFacilityNumber: canonicalParse?.facilityNumber ?? null,
        apiFound: canonicalParse?.found ?? false,
        timedOut: canonicalFetched.timedOut,
      },
    }),
  );
}

const coordinateFindings = [];
if (!args.skipExceptions) {
  let coordIndex = 0;
  for (const target of CALIFORNIA_PHASE14_UNRESOLVED_COORDINATE_CASES) {
    coordIndex += 1;
    const downloadRow = downloadById.get(target.facilityNumber);
    const fetched = await fetchCaliforniaFacilityDetail(target.facilityNumber, {
      minIntervalMs: 450,
      lastRequestAt,
    });
    const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
    // Small pause before GIS to stay polite to both services
    const gis = await queryGisByFacilityNumber(target.facilityNumber);
    coordinateFindings.push(
      classifyCaliforniaPhase14CoordinateException({
        facilityNumber: target.facilityNumber,
        file: target.file,
        priorMatchKind: target.priorMatchKind,
        facilityDetail: {
          found: fetched.timedOut ? null : Boolean(parse?.found),
          liveFacilityNumber: parse?.facilityNumber ?? null,
          liveStatus: parse?.status ?? null,
          timedOut: fetched.timedOut || gis.timedOut,
        },
        gisRows: gis.rows,
        download: downloadRow
          ? {
            facilityName: downloadRow.facilityName,
            facilityAddress: downloadRow.facilityAddress,
            facilityCity: downloadRow.facilityCity,
            facilityZip: downloadRow.facilityZip,
            facilityType: downloadRow.facilityType,
          }
          : undefined,
      }),
    );
    if (coordIndex % 5 === 0) {
      console.log(
        `Phase 14: coordinate exceptions ${coordIndex}/${CALIFORNIA_PHASE14_UNRESOLVED_COORDINATE_CASES.length}`,
      );
    }
  }
}

const exceptionSummary = summarizeCaliforniaPhase14Exceptions({
  observedOn,
  disclosureFindings,
  coordinateFindings,
});
const coordResolution = withCaliforniaPhase14CoordinateResolution({
  resolvedWithOfficialCoords:
    exceptionSummary.coordinateExceptions.resolvedWithOfficialCoords,
});

const quality = evaluateCaliforniaPhase14Quality({
  observedOn,
  disclosure: {
    sampleSize: incrementalSummary.sampleSize,
    working: incrementalSummary.working,
    missing: incrementalSummary.missing,
    ambiguous: incrementalSummary.ambiguous,
    invalid: incrementalSummary.invalid,
    inconclusive: incrementalSummary.inconclusive,
    verifiedCount: coverageRollup.cumulativeVerifiedCount,
    rosterDenominator: CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE,
    phase13BaselineVerifiedCount: coverageRollup.phase13BaselineVerifiedCount,
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
    regressionControlsResolved: statusSummary.regressionControlsResolvedAsDocumentedCoarsening,
  },
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
  unresolvedCoords: coordResolution.unresolvedCoords,
  verifiedCoords: coordResolution.verifiedCoords,
});

const readiness = {
  ...CALIFORNIA_PHASE14_READINESS_DECISION,
  baselinePreserved: {
    ...CALIFORNIA_PHASE14_READINESS_DECISION.baselinePreserved,
    verifiedCoords: coordResolution.verifiedCoords,
    unresolvedCoords: coordResolution.unresolvedCoords,
  },
  disclosureAudit: {
    ...CALIFORNIA_PHASE14_READINESS_DECISION.disclosureAudit,
    incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
  },
  coordinateResolution: coordResolution,
};

const output = {
  observedOn,
  urlPatterns: CALIFORNIA_PHASE14_DISCLOSURE_URL_PATTERNS,
  withdrawnEvidence: CALIFORNIA_PHASE14_WITHDRAWN_EVIDENCE,
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
    baselineSha256: CALIFORNIA_PHASE14_OBSERVED_COUNTS.downloadSha256,
    closedBucket: {
      total: closedRows.length,
      emptyLicenseFirstDate: downloadClosedEmptyLicenseFirst,
      withLicenseFirstDate: downloadClosedWithLicenseFirst,
      downloadOnlyWithdrawnIndicatorCount: closedRows.filter(row =>
        isCaliforniaPhase14DownloadOnlyWithdrawnIndicator({
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
    phase13BaselineVerifiedCount: CALIFORNIA_PHASE14_PHASE13_BASELINE_VERIFIED_COUNT,
  },
  disclosureLinks: {
    incremental: incrementalSummary,
    coverage: coverageRollup,
  },
  statusMapping: statusSummary,
  exceptions: {
    summary: exceptionSummary,
    disclosureFindings,
    coordinateFindings,
  },
  readiness,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase14AllowsPublication(),
  gate: "blocked",
  cdssClarification: {
    status: "sent-awaiting-response",
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: readiness.baselinePreserved,
};

writeFileSync(fullOutPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  disclosure: {
    phase13BaselineVerifiedCount: coverageRollup.phase13BaselineVerifiedCount,
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
    applicationWithdrawnDocumented: statusSummary.applicationWithdrawnDocumented,
    regressionControlsResolvedAsDocumentedCoarsening:
      statusSummary.regressionControlsResolvedAsDocumentedCoarsening,
    regressionControlCount: statusSummary.regressionControlCount,
    byEvidenceKind: statusSummary.byEvidenceKind,
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    sampleIsStatewideConclusion: false,
  },
  exceptions: exceptionSummary,
  coordinateResolution: coordResolution,
  downloadClosedBucket: {
    total: closedRows.length,
    emptyLicenseFirstDate: downloadClosedEmptyLicenseFirst,
    withLicenseFirstDate: downloadClosedWithLicenseFirst,
  },
  downloadSha256MatchesBaseline: quality.downloadSha256MatchesBaseline,
  baseline: readiness.baselinePreserved,
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

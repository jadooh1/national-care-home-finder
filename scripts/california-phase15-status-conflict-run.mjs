#!/usr/bin/env node
/**
 * Read-only California Phase 15 status-conflict investigation + disclosure expansion.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase15-status-conflict-run.mjs \
 *     [--out dir] [--checkpoint path] [--max-requests N] [--resume]
 *
 * Investigates status conflict 502701867 (Download LICENSED vs FacilityDetail
 * Pending Incomplete Application). Expands a previously-unverified stratified
 * disclosure batch using the Phase 13 rate-limited resumable harness from the
 * Phase 14 cumulative 233/15451 baseline. Preserves exception safeguards;
 * does NOT re-probe the 28 unresolved coords without new evidence.
 * Does not publish California. Does not send CDSS email.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE15_DISCLOSURE_SEED,
  CALIFORNIA_PHASE15_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE15_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE15_STATUS_SEED,
  CALIFORNIA_PHASE15_STATUS_STRATUM_QUOTAS,
  CALIFORNIA_PHASE15_STATUS_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE15_WITHDRAWN_REGRESSION_IDS,
  CALIFORNIA_PHASE15_GEOGRAPHIC_QUOTAS,
  CALIFORNIA_PHASE15_STATUS_CONFLICT_ID,
  balanceCaliforniaPhase15GeographicDiversity,
  classifyCaliforniaPhase15DisclosureStratum,
  classifyCaliforniaPhase15StatusStratum,
} from "../lib/california-phase15-sample.ts";
import {
  CALIFORNIA_PHASE15_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE15_PHASE14_CUMULATIVE_VERIFIED_COUNT,
  CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  classifyCaliforniaPhase15DisclosureLink,
  generateCaliforniaPhase15DisclosureLinks,
  planCaliforniaPhase15StratifiedSample,
  summarizeCaliforniaPhase15Coverage,
} from "../lib/california-phase15-disclosure-audit.ts";
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
  investigateCaliforniaPhase15InvalidDisclosure,
  preserveCaliforniaPhase15AmbiguousDisclosure,
  summarizeCaliforniaPhase15Exceptions,
  californiaPhase15ShouldReprobeUnresolvedCoordinates,
} from "../lib/california-phase15-exceptions.ts";
import {
  CALIFORNIA_PHASE15_STATUS_CONFLICT_BASELINE_EVIDENCE,
  CALIFORNIA_PHASE15_STATUS_CONFLICT_FACILITY_NUMBER,
  californiaPhase15ConflictFacilityAllowsOwnerClaim,
  californiaPhase15ConflictFacilityAllowsPublication,
  investigateCaliforniaPhase15StatusConflict,
} from "../lib/california-phase15-status-conflict.ts";
import {
  CALIFORNIA_PHASE15_WITHDRAWN_EVIDENCE,
  isCaliforniaPhase15DownloadOnlyWithdrawnIndicator,
} from "../lib/california-phase15-status-verification.ts";
import {
  observeCaliforniaPhase13StatusMapping,
  summarizeCaliforniaPhase13StatusMapping,
} from "../lib/california-phase13-status-verification.ts";
import {
  CALIFORNIA_PHASE15_READINESS_DECISION,
  californiaPhase15AllowsPublication,
} from "../lib/california-phase15-readiness.ts";
import {
  CALIFORNIA_PHASE15_OBSERVED_COUNTS,
  evaluateCaliforniaPhase15Quality,
} from "../lib/california-phase15-quality.ts";
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
    outDir: "california-phase15-audit-out",
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
    else if (!a.startsWith("-") && args.outDir === "california-phase15-audit-out") {
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
const fullOutPath = join(args.outDir, "california-phase15-status-conflict-live.json");

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
  const collapsed = String(facilityNumber).replace(/^0+/, "") || "0";
  const params = new URLSearchParams({
    where: `FAC_NBR=${collapsed}`,
    outFields: "FAC_NBR,FAC_LATITUDE,FAC_LONGITUDE,NAME,RES_STREET_ADDR,RES_CITY,RES_ZIP_CODE,PROGRAM_TYPE,STATUS",
    returnGeometry: "false",
    f: "json",
  });
  const url =
    `https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0/query?${params}`;
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

console.log("Phase 15: downloading DownloadStateData for sample expansion + sha256...");
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
  const classified = classifyCaliforniaPhase15DisclosureStratum(file, {
    ...row,
    facilityZip: row.facilityZip,
  });
  if (classified) disclosurePool.push(classified);
}

const statusPool = [];
for (const { file, row } of allRows) {
  const classified = classifyCaliforniaPhase15StatusStratum(file, {
    ...row,
    facilityZip: row.facilityZip,
  });
  if (classified) statusPool.push(classified);
}

let disclosurePlan = planCaliforniaPhase15StratifiedSample(
  disclosurePool,
  CALIFORNIA_PHASE15_DISCLOSURE_STRATUM_QUOTAS,
  CALIFORNIA_PHASE15_DISCLOSURE_SEED,
);
disclosurePlan = balanceCaliforniaPhase15GeographicDiversity(
  disclosurePlan,
  disclosurePool,
  CALIFORNIA_PHASE15_GEOGRAPHIC_QUOTAS,
);

const disclosureByKey = new Map();
for (const row of disclosurePlan) {
  disclosureByKey.set(
    `${row.facilityNumber}::${row.label}::${row.requestFacilityNumber ?? ""}`,
    row,
  );
}
let disclosureSample = [...disclosureByKey.values()];
if (disclosureSample.length > CALIFORNIA_PHASE15_DISCLOSURE_SAMPLE_TARGET_SIZE) {
  disclosureSample = disclosureSample.slice(
    0,
    CALIFORNIA_PHASE15_DISCLOSURE_SAMPLE_TARGET_SIZE,
  );
}

const statusPlan = planCaliforniaPhase15StratifiedSample(
  statusPool,
  CALIFORNIA_PHASE15_STATUS_STRATUM_QUOTAS,
  CALIFORNIA_PHASE15_STATUS_SEED,
);
const statusByKey = new Map();
for (const row of [...CALIFORNIA_PHASE15_STATUS_SEED, ...statusPlan]) {
  statusByKey.set(`${row.facilityNumber}::${row.label}`, row);
}
let statusSample = [...statusByKey.values()];
if (statusSample.length > CALIFORNIA_PHASE15_STATUS_SAMPLE_TARGET_SIZE) {
  const preferred = new Set(
    CALIFORNIA_PHASE15_STATUS_SEED.map(r => `${r.facilityNumber}::${r.label}`),
  );
  const extras = statusSample.filter(r => !preferred.has(`${r.facilityNumber}::${r.label}`));
  statusSample = [
    ...CALIFORNIA_PHASE15_STATUS_SEED,
    ...extras.slice(
      0,
      Math.max(0, CALIFORNIA_PHASE15_STATUS_SAMPLE_TARGET_SIZE - CALIFORNIA_PHASE15_STATUS_SEED.length),
    ),
  ];
}

writeFileSync(
  join(args.outDir, "disclosure-sample-plan.json"),
  JSON.stringify({
    targetSize: CALIFORNIA_PHASE15_DISCLOSURE_SAMPLE_TARGET_SIZE,
    plannedSize: disclosureSample.length,
    seedSize: CALIFORNIA_PHASE15_DISCLOSURE_SEED.length,
    phase13And14Excluded: true,
    geographicQuotas: CALIFORNIA_PHASE15_GEOGRAPHIC_QUOTAS,
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
    targetSize: CALIFORNIA_PHASE15_STATUS_SAMPLE_TARGET_SIZE,
    plannedSize: statusSample.length,
    seedSize: CALIFORNIA_PHASE15_STATUS_SEED.length,
    regressionIds: CALIFORNIA_PHASE15_WITHDRAWN_REGRESSION_IDS,
    statusConflictId: CALIFORNIA_PHASE15_STATUS_CONFLICT_ID,
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
  rosterDenominator: CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

let checkpoint;
if (args.resume && existsSync(checkpointPath)) {
  checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  checkpoint.requestsThisSession = 0;
  checkpoint.config = { ...checkpoint.config, ...auditConfig };
  console.log(
    `Phase 15: resuming checkpoint with ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} completed`,
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
  `Phase 15: auditing ${auditQueue.length} previously-unverified disclosure links `
    + `(roster denominator ${CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE}; `
    + `Phase 14 cumulative ${CALIFORNIA_PHASE15_PHASE14_CUMULATIVE_VERIFIED_COUNT})...`,
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
    console.log(`Phase 15: stopping disclosure audit — ${stop}`);
    break;
  }

  const item = remaining[0];
  const requestId = item.requestFacilityNumber ?? item.facilityNumber;
  const generatedForOfficial = generateCaliforniaPhase15DisclosureLinks(item.facilityNumber);
  const pageProbe = await probePage(generatedForOfficial.pageUrl);
  const fetched = await fetchCaliforniaFacilityDetail(requestId, {
    minIntervalMs: checkpoint.config.minIntervalMs,
    maxAttempts: checkpoint.config.maxAttempts,
    backoffMs: checkpoint.config.backoffMs,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const classified = classifyCaliforniaPhase15DisclosureLink({
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
      `Phase 15: checkpoint ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} `
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
    rosterDenominator: CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  },
);
const coverageRollup = summarizeCaliforniaPhase15Coverage({
  phase14CumulativeVerifiedCount: CALIFORNIA_PHASE15_PHASE14_CUMULATIVE_VERIFIED_COUNT,
  incrementalResults: checkpoint.results,
  rosterDenominator: CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

console.log(
  `Phase 15: mapping ${statusSample.length} licensing statuses `
    + `(regression controls + conflict ${CALIFORNIA_PHASE15_STATUS_CONFLICT_ID})...`,
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
  const isRegression = CALIFORNIA_PHASE15_WITHDRAWN_REGRESSION_IDS.includes(target.facilityNumber)
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

console.log("Phase 15: investigating status conflict 502701867...");
const conflictDownloadRow = downloadById.get(CALIFORNIA_PHASE15_STATUS_CONFLICT_FACILITY_NUMBER)
  ?? CALIFORNIA_PHASE15_STATUS_CONFLICT_BASELINE_EVIDENCE.download;
const conflictFetched = await fetchCaliforniaFacilityDetail(
  CALIFORNIA_PHASE15_STATUS_CONFLICT_FACILITY_NUMBER,
  { minIntervalMs: 450, lastRequestAt },
);
const conflictParse = conflictFetched.payload == null
  ? null
  : parseCaliforniaFacilityDetail(conflictFetched.payload);
const conflictRawDetail = (() => {
  const payload = conflictFetched.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)
    && payload.FacilityDetail && typeof payload.FacilityDetail === "object") {
    return payload.FacilityDetail;
  }
  return null;
})();
const conflictGis = await queryGisByFacilityNumber(
  CALIFORNIA_PHASE15_STATUS_CONFLICT_FACILITY_NUMBER,
);
const statusConflictFinding = investigateCaliforniaPhase15StatusConflict({
  observedOn,
  download: {
    facilityNumber: conflictDownloadRow.facilityNumber
      ?? CALIFORNIA_PHASE15_STATUS_CONFLICT_FACILITY_NUMBER,
    facilityName: conflictDownloadRow.facilityName,
    facilityAddress: conflictDownloadRow.facilityAddress,
    facilityCity: conflictDownloadRow.facilityCity,
    facilityZip: conflictDownloadRow.facilityZip,
    facilityType: conflictDownloadRow.facilityType
      ?? conflictDownloadRow.facilityType,
    status: conflictDownloadRow.facilityStatus
      ?? conflictDownloadRow.status,
    licenseFirstDate: conflictDownloadRow.licenseFirstDate,
    closedDate: conflictDownloadRow.closedDate,
    lastVisitDate: conflictDownloadRow.lastVisitDate,
    capacity: conflictDownloadRow.facilityCapacity
      ?? conflictDownloadRow.capacity,
    httpStatus: arfDownload.httpStatus,
    sha256: arfDownload.sha256,
    filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
  },
  facilityDetail: {
    facilityNumber: conflictParse?.facilityNumber ?? null,
    facilityName: conflictParse?.facilityName ?? null,
    facilityAddress: conflictParse?.streetAddress ?? null,
    facilityCity: conflictParse?.city ?? null,
    facilityZip: conflictParse?.zipCode ?? null,
    facilityType: conflictParse?.facilityType ?? null,
    status: conflictParse?.status ?? null,
    licenseFirstDate: conflictParse?.licenseFirstDate ?? null,
    licenseEffectiveDate: conflictParse?.licenseEffectiveDate ?? null,
    closedDate: conflictParse?.dateClosed ?? null,
    lastVisitDate: conflictRawDetail?.LASTVISITDATE
      ?? CALIFORNIA_PHASE15_STATUS_CONFLICT_BASELINE_EVIDENCE.facilityDetail.lastVisitDate,
    capacity: conflictRawDetail?.CAPACITY
      ?? CALIFORNIA_PHASE15_STATUS_CONFLICT_BASELINE_EVIDENCE.facilityDetail.capacity,
    httpStatus: conflictFetched.httpStatus,
    timedOut: conflictFetched.timedOut,
    found: Boolean(conflictParse?.found),
  },
  gisHitCount: conflictGis.rows.length,
});

console.log("Phase 15: preserving disclosure exception safeguards (no coord re-probe)...");
const disclosureFindings = [
  preserveCaliforniaPhase15AmbiguousDisclosure(),
  investigateCaliforniaPhase15InvalidDisclosure(),
];
const shouldReprobeCoords = californiaPhase15ShouldReprobeUnresolvedCoordinates({
  genuinelyNewAuthoritativeEvidence: false,
});
const exceptionSummary = summarizeCaliforniaPhase15Exceptions({
  observedOn,
  disclosureFindings,
  coordinateReprobePerformed: shouldReprobeCoords,
  resolvedWithOfficialCoords: 0,
});

const quality = evaluateCaliforniaPhase15Quality({
  observedOn,
  disclosure: {
    sampleSize: incrementalSummary.sampleSize,
    working: incrementalSummary.working,
    missing: incrementalSummary.missing,
    ambiguous: incrementalSummary.ambiguous,
    invalid: incrementalSummary.invalid,
    inconclusive: incrementalSummary.inconclusive,
    verifiedCount: coverageRollup.cumulativeVerifiedCount,
    rosterDenominator: CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE,
    phase14CumulativeVerifiedCount: coverageRollup.phase14CumulativeVerifiedCount,
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
    statusConflictUnresolved:
      statusConflictFinding.resolution === "unresolved-conflict-keep-unknown-ineligible"
        ? 1
        : 0,
  },
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
  unresolvedCoords: 28,
  verifiedCoords: 15423,
});

const readiness = {
  ...CALIFORNIA_PHASE15_READINESS_DECISION,
  disclosureAudit: {
    ...CALIFORNIA_PHASE15_READINESS_DECISION.disclosureAudit,
    incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
  },
  statusConflictFinding: {
    facilityNumber: statusConflictFinding.facilityNumber,
    relation: statusConflictFinding.relation,
    eligibility: statusConflictFinding.eligibility,
    resolution: statusConflictFinding.resolution,
    publicationEligible: statusConflictFinding.publicationEligible,
    ownerClaimEligible: statusConflictFinding.ownerClaimEligible,
    adoptedHypothesis: statusConflictFinding.adoptedHypothesis,
    neverLicensedMarkersPresent: statusConflictFinding.neverLicensedMarkersPresent,
    identityMatched: statusConflictFinding.identity.overallIdentityMatched,
    gisHitCount: statusConflictFinding.gisHitCount,
  },
};

const output = {
  observedOn,
  urlPatterns: CALIFORNIA_PHASE15_DISCLOSURE_URL_PATTERNS,
  withdrawnEvidence: CALIFORNIA_PHASE15_WITHDRAWN_EVIDENCE,
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
    baselineSha256: CALIFORNIA_PHASE15_OBSERVED_COUNTS.downloadSha256,
    closedBucket: {
      total: closedRows.length,
      emptyLicenseFirstDate: downloadClosedEmptyLicenseFirst,
      withLicenseFirstDate: downloadClosedWithLicenseFirst,
      downloadOnlyWithdrawnIndicatorCount: closedRows.filter(row =>
        isCaliforniaPhase15DownloadOnlyWithdrawnIndicator({
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
    phase14CumulativeVerifiedCount: CALIFORNIA_PHASE15_PHASE14_CUMULATIVE_VERIFIED_COUNT,
  },
  disclosureLinks: {
    incremental: incrementalSummary,
    coverage: coverageRollup,
  },
  statusMapping: statusSummary,
  statusConflict: statusConflictFinding,
  exceptions: {
    summary: exceptionSummary,
    disclosureFindings,
    coordinateReprobePerformed: shouldReprobeCoords,
  },
  readiness,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase15AllowsPublication(),
  conflictFacilityAllowsPublication:
    californiaPhase15ConflictFacilityAllowsPublication(statusConflictFinding),
  conflictFacilityAllowsOwnerClaim:
    californiaPhase15ConflictFacilityAllowsOwnerClaim(statusConflictFinding),
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
    phase14CumulativeVerifiedCount: coverageRollup.phase14CumulativeVerifiedCount,
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
  statusConflict: {
    facilityNumber: statusConflictFinding.facilityNumber,
    relation: statusConflictFinding.relation,
    eligibility: statusConflictFinding.eligibility,
    resolution: statusConflictFinding.resolution,
    neverLicensedMarkersPresent: statusConflictFinding.neverLicensedMarkersPresent,
    identityMatched: statusConflictFinding.identity.overallIdentityMatched,
    recordReuseSupported: statusConflictFinding.identity.recordReuseSupported,
    gisHitCount: statusConflictFinding.gisHitCount,
    adoptedHypothesis: statusConflictFinding.adoptedHypothesis,
    publicationEligible: false,
    ownerClaimEligible: false,
    canPublish: false,
    canClaim: false,
  },
  exceptions: exceptionSummary,
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

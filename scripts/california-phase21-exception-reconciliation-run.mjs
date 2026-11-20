#!/usr/bin/env node
/**
 * Read-only California Phase 21 exception reconciliation.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase21-exception-reconciliation-run.mjs \
 *     [--out dir] [--skip-inconclusive-retry]
 *
 * Investigates the 71 Phase 20 licensing conflicts + 2 HTTP 500 inconclusive
 * IDs with narrow FacilityDetail probes only. Does NOT repeat the statewide
 * crawl. Offline exclusion classification only — not activated in app/DB.
 * Does not send CDSS email. Gate stays BLOCKED.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS,
  CALIFORNIA_PHASE21_INCONCLUSIVE_IDS,
  CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT,
} from "../lib/california-phase21-conflict-ids.ts";
import {
  classifyCaliforniaPhase21LicensingDiscrepancy,
  summarizeCaliforniaPhase21Classifications,
} from "../lib/california-phase21-conflict-classification.ts";
import { buildCaliforniaPhase21ExceptionLedger } from "../lib/california-phase21-exception-ledger.ts";
import {
  CALIFORNIA_PHASE21_OBSERVED_COUNTS,
  evaluateCaliforniaPhase21Quality,
} from "../lib/california-phase21-quality.ts";
import {
  evaluateCaliforniaPhase21Readiness,
  californiaPhase21AllowsPublication,
} from "../lib/california-phase21-readiness.ts";
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
    outDir: "california-phase21-audit-out",
    skipInconclusiveRetry: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--skip-inconclusive-retry") args.skipInconclusiveRetry = true;
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
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
    filenameDate: parseCaliforniaTransparencyDownloadFilenameDate(
      response.headers.get("content-disposition"),
    ),
    rows: parseCaliforniaTransparencyDownloadCsv(csvText),
  };
}

async function probeFacility(facilityNumber) {
  const fetched = await fetchCaliforniaFacilityDetail(facilityNumber, {
    minIntervalMs: 450,
    maxAttempts: 3,
    backoffMs: [500, 1500, 3000],
    lastRequestAt,
  });
  const parse = fetched.payload == null
    ? null
    : parseCaliforniaFacilityDetail(fetched.payload);
  return {
    facilityNumber,
    httpStatus: fetched.httpStatus,
    timedOut: fetched.timedOut,
    attempts: fetched.attempts,
    found: Boolean(parse?.found),
    liveFacilityNumber: parse?.facilityNumber ?? null,
    liveStatus: parse?.status ?? null,
    liveLicenseFirstDate: parse?.licenseFirstDate ?? null,
    liveLicenseEffectiveDate: parse?.licenseEffectiveDate ?? null,
    liveFacilityType: parse?.facilityType ?? null,
    liveDateClosed: parse?.dateClosed ?? null,
  };
}

if (CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS.length !== CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT) {
  throw new Error(
    `Conflict ID list length ${CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS.length} `
      + `!= expected ${CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT}`,
  );
}

console.log("Phase 21: downloading DownloadStateData for conflict identity + sha256...");
const [rcfeDownload, arfDownload] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
]);
const downloadById = new Map([
  ...rcfeDownload.rows.map(r => [String(r.facilityNumber).trim(), { ...r, file: "RCFE" }]),
  ...arfDownload.rows.map(r => [String(r.facilityNumber).trim(), { ...r, file: "ARF" }]),
]);

const shaMatches =
  rcfeDownload.sha256 === CALIFORNIA_PHASE21_OBSERVED_COUNTS.downloadSha256.rcfe
  && arfDownload.sha256 === CALIFORNIA_PHASE21_OBSERVED_COUNTS.downloadSha256.arf;

console.log(
  `Phase 21: investigating ${CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS.length} licensing conflicts `
    + `(concurrency=1, minIntervalMs=450; NOT a statewide crawl)...`,
);

const conflictProbes = [];
let rateLimitedOrAccessRestricted = false;
for (let i = 0; i < CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS.length; i += 1) {
  const id = CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS[i];
  const probe = await probeFacility(id);
  conflictProbes.push(probe);
  if (probe.httpStatus === 429 || probe.httpStatus === 403) {
    rateLimitedOrAccessRestricted = true;
    console.log(`Phase 21: automatic stop on HTTP ${probe.httpStatus} at ${id}`);
    break;
  }
  if ((i + 1) % 10 === 0) {
    console.log(`Phase 21: conflict probes ${i + 1}/${CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS.length}`);
  }
}

const discrepancyClassifications = [];
for (const probe of conflictProbes) {
  const downloadRow = downloadById.get(probe.facilityNumber);
  discrepancyClassifications.push(
    classifyCaliforniaPhase21LicensingDiscrepancy({
      facilityNumber: probe.facilityNumber,
      downloadStatus: downloadRow?.facilityStatus ?? null,
      liveStatus: probe.liveStatus,
      liveFacilityNumber: probe.liveFacilityNumber,
      httpStatus: probe.httpStatus,
      timedOut: probe.timedOut,
      found: probe.found,
      downloadLicenseFirstDate: downloadRow?.licenseFirstDate ?? null,
      liveLicenseFirstDate: probe.liveLicenseFirstDate,
      source: "phase20-conflict",
    }),
  );
}

console.log(
  "Phase 21: inspecting Phase 20 HTTP 500 evidence for inconclusive IDs "
    + `(${CALIFORNIA_PHASE21_INCONCLUSIVE_IDS.join(", ")})...`,
);

const inconclusiveClassifications = [];
const inconclusiveProbes = [];
if (!args.skipInconclusiveRetry && !rateLimitedOrAccessRestricted) {
  console.log("Phase 21: narrowly scoped inconclusive retries (justified by prior HTTP 500)...");
  for (const id of CALIFORNIA_PHASE21_INCONCLUSIVE_IDS) {
    const probe = await probeFacility(id);
    inconclusiveProbes.push(probe);
    if (probe.httpStatus === 429 || probe.httpStatus === 403) {
      rateLimitedOrAccessRestricted = true;
      console.log(`Phase 21: automatic stop on HTTP ${probe.httpStatus} during inconclusive retry`);
      break;
    }
    const downloadRow = downloadById.get(id);
    inconclusiveClassifications.push(
      classifyCaliforniaPhase21LicensingDiscrepancy({
        facilityNumber: id,
        downloadStatus: downloadRow?.facilityStatus ?? null,
        liveStatus: probe.liveStatus,
        liveFacilityNumber: probe.liveFacilityNumber,
        httpStatus: probe.httpStatus,
        timedOut: probe.timedOut,
        found: probe.found,
        downloadLicenseFirstDate: downloadRow?.licenseFirstDate ?? null,
        liveLicenseFirstDate: probe.liveLicenseFirstDate,
        source: "phase20-inconclusive-retry",
      }),
    );
  }
} else {
  for (const id of CALIFORNIA_PHASE21_INCONCLUSIVE_IDS) {
    const downloadRow = downloadById.get(id);
    inconclusiveClassifications.push(
      classifyCaliforniaPhase21LicensingDiscrepancy({
        facilityNumber: id,
        downloadStatus: downloadRow?.facilityStatus ?? null,
        liveStatus: null,
        httpStatus: 500,
        timedOut: false,
        found: false,
        source: "phase20-inconclusive-retry",
      }),
    );
  }
}

const discrepancySummary = summarizeCaliforniaPhase21Classifications(
  discrepancyClassifications,
);
const inconclusiveSummary = summarizeCaliforniaPhase21Classifications(
  inconclusiveClassifications,
);

const ledger = buildCaliforniaPhase21ExceptionLedger({
  observedOn,
  discrepancyClassifications,
  inconclusiveClassifications,
});

const quality = evaluateCaliforniaPhase21Quality({
  observedOn,
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
  discrepancySummary: discrepancySummary.byClass,
  inconclusiveResolved: inconclusiveClassifications.filter(
    r => r.classId !== "inconclusive-transport-or-server-error",
  ).length,
  inconclusiveStillOpen: inconclusiveClassifications.filter(
    r => r.classId === "inconclusive-transport-or-server-error",
  ).length,
});

const readiness = evaluateCaliforniaPhase21Readiness();

const liveStatusPairs = {};
for (const row of discrepancyClassifications) {
  const key = `${row.downloadStatus ?? ""}=>${row.liveStatus ?? ""}`;
  liveStatusPairs[key] = (liveStatusPairs[key] ?? 0) + 1;
}

const output = {
  observedOn,
  scope: {
    statewideCrawlRepeated: false,
    conflictIdsInvestigated: conflictProbes.length,
    inconclusiveIdsInvestigated: inconclusiveProbes.length || CALIFORNIA_PHASE21_INCONCLUSIVE_IDS.length,
    concurrency: 1,
    minIntervalMs: 450,
    rateLimitedOrAccessRestricted,
  },
  download: {
    rcfe: {
      httpStatus: rcfeDownload.httpStatus,
      sha256: rcfeDownload.sha256,
      rows: rcfeDownload.rows.length,
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
      filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
    },
    sha256MatchesBaseline: shaMatches,
    authoritativeIsoExportDate: null,
  },
  discrepancyInvestigation: {
    expectedCount: CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT,
    probedCount: conflictProbes.length,
    summary: discrepancySummary,
    downloadVsLivePairs: liveStatusPairs,
    classifications: discrepancyClassifications,
    probes: conflictProbes,
  },
  inconclusiveInvestigation: {
    phase20Evidence: [
      { facilityNumber: "365530371", httpStatus: 500, timedOut: false },
      { facilityNumber: "331881723", httpStatus: 500, timedOut: false },
    ],
    retryPerformed: !args.skipInconclusiveRetry && inconclusiveProbes.length > 0,
    summary: inconclusiveSummary,
    classifications: inconclusiveClassifications,
    probes: inconclusiveProbes,
  },
  exceptionLedger: ledger,
  readiness,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase21AllowsPublication(),
  gate: "blocked",
  exclusionActivatedInAppOrDb: false,
  cdssClarification: readiness.cdssClarification,
  elapsedMs: Date.now() - sessionStartedAt,
};

writeFileSync(
  join(args.outDir, "california-phase21-exception-reconciliation-live.json"),
  JSON.stringify(output, null, 2),
);
writeFileSync(
  join(args.outDir, "exception-ledger.json"),
  JSON.stringify(ledger, null, 2),
);
writeFileSync(
  join(args.outDir, "discrepancy-classifications.json"),
  JSON.stringify({
    summary: discrepancySummary,
    downloadVsLivePairs: liveStatusPairs,
    classifications: discrepancyClassifications,
  }, null, 2),
);
writeFileSync(
  join(args.outDir, "inconclusive-investigation.json"),
  JSON.stringify({
    phase20Evidence: output.inconclusiveInvestigation.phase20Evidence,
    retryPerformed: output.inconclusiveInvestigation.retryPerformed,
    summary: inconclusiveSummary,
    classifications: inconclusiveClassifications,
    probes: inconclusiveProbes,
  }, null, 2),
);
writeFileSync(
  join(args.outDir, "readiness-report.json"),
  JSON.stringify(readiness, null, 2),
);
writeFileSync(
  join(args.outDir, "quality-report.json"),
  JSON.stringify(quality, null, 2),
);

const summary = {
  observedOn,
  conflicts: {
    expected: 71,
    probed: conflictProbes.length,
    byClass: discrepancySummary.byClass,
    downloadVsLivePairs: liveStatusPairs,
  },
  inconclusive: {
    ids: [...CALIFORNIA_PHASE21_INCONCLUSIVE_IDS],
    retryPerformed: output.inconclusiveInvestigation.retryPerformed,
    byClass: inconclusiveSummary.byClass,
  },
  ledger: {
    totalEntries: ledger.summary.totalEntries,
    byCategory: ledger.summary.byCategory,
    unresolvedCoordinateCount: 28,
    missingLicenseEvidenceCount: 14,
  },
  downloadSha256MatchesBaseline: shaMatches,
  rateLimitedOrAccessRestricted,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  exclusionActivatedInAppOrDb: false,
  statewideCrawlRepeated: false,
  cdssClarification: "sent-awaiting-response",
  mailboxCheckAvailable: false,
  stopGo: "STOP",
  elapsedMs: Date.now() - sessionStartedAt,
  outDir: args.outDir,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

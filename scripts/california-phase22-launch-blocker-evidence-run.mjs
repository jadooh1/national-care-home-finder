#!/usr/bin/env node
/**
 * Read-only California Phase 22 launch-blocker evidence.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase22-launch-blocker-evidence-run.mjs \
 *     [--out dir] [--skip-provisional-probe]
 *
 * Reassesses freshness channels, unique-ID/capacity policy cases, and the five
 * Provisional License conflicts (+ three prior controls). Does NOT repeat the
 * statewide crawl. Does not send CDSS email. Gate stays BLOCKED. STOP.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS,
  CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS,
  californiaPhase22NarrowProbeIds,
} from "../lib/california-phase22-ids.ts";
import {
  evaluateCaliforniaPhase22Freshness,
  CALIFORNIA_PHASE22_BASELINE_DOWNLOAD_SHA256,
} from "../lib/california-phase22-freshness.ts";
import {
  CALIFORNIA_PHASE22_POLICY_CASES,
  summarizeCaliforniaPhase22PolicyCases,
  CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY,
} from "../lib/california-phase22-unique-id-capacity.ts";
import {
  assessCaliforniaPhase22ProvisionalConflict,
  summarizeCaliforniaPhase22ProvisionalAssessments,
} from "../lib/california-phase22-provisional-review.ts";
import {
  CALIFORNIA_PHASE22_DECISION_MATRIX,
  summarizeCaliforniaPhase22DecisionMatrix,
} from "../lib/california-phase22-decision-matrix.ts";
import { buildCaliforniaPhase22LaunchBlockerLedger } from "../lib/california-phase22-ledger.ts";
import {
  CALIFORNIA_PHASE22_OBSERVED_COUNTS,
  evaluateCaliforniaPhase22Quality,
} from "../lib/california-phase22-quality.ts";
import {
  evaluateCaliforniaPhase22Readiness,
  californiaPhase22AllowsPublication,
} from "../lib/california-phase22-readiness.ts";
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
    outDir: "california-phase22-audit-out",
    skipProvisionalProbe: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--skip-provisional-probe") args.skipProvisionalProbe = true;
  }
  return args;
}

const args = parseArgs(process.argv);
const observedOn = new Date().toISOString().slice(0, 10);
const captureTimeUtc = new Date().toISOString();
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
  const headerObj = {};
  response.headers.forEach((v, k) => {
    headerObj[k] = v;
  });
  const interesting = {};
  for (const k of [
    "date",
    "last-modified",
    "etag",
    "cache-control",
    "content-type",
    "content-disposition",
    "expires",
  ]) {
    if (headerObj[k]) interesting[k] = headerObj[k];
  }
  return {
    file,
    httpStatus: response.status,
    responseHeaders: interesting,
    allHeaderKeys: Object.keys(headerObj).sort(),
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
    probedAtUtc: new Date().toISOString(),
  };
}

console.log("Phase 22: downloading DownloadStateData for freshness + roster scan...");
const [rcfeDownload, arfDownload] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
]);

const shaMatches =
  rcfeDownload.sha256 === CALIFORNIA_PHASE22_BASELINE_DOWNLOAD_SHA256.rcfe
  && arfDownload.sha256 === CALIFORNIA_PHASE22_BASELINE_DOWNLOAD_SHA256.arf;

const downloadById = new Map([
  ...rcfeDownload.rows.map(r => [String(r.facilityNumber).trim(), { ...r, file: "RCFE" }]),
  ...arfDownload.rows.map(r => [String(r.facilityNumber).trim(), { ...r, file: "ARF" }]),
]);

const allRows = [...rcfeDownload.rows, ...arfDownload.rows];
const idCounts = new Map();
for (const r of allRows) {
  const id = String(r.facilityNumber).trim();
  idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
}
const duplicates = [...idCounts.entries()]
  .filter(([, n]) => n > 1)
  .map(([id, n]) => ({ id, count: n }));

const rosterScan = {
  ...CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY,
  liveOfficialRows: allRows.length,
  liveDistinctFacilityNumbers: idCounts.size,
  liveDuplicateCount: duplicates.length,
  liveInvalidFacilityNumbers: [...idCounts.keys()].filter(id => !/^\d{8,9}$/.test(id)),
  downloadSha256MatchesBaseline: shaMatches,
};

const freshness = evaluateCaliforniaPhase22Freshness();
const policySummary = summarizeCaliforniaPhase22PolicyCases(
  CALIFORNIA_PHASE22_POLICY_CASES,
);

const probeIds = californiaPhase22NarrowProbeIds();
const probes = [];
const assessments = [];
let rateLimitedOrAccessRestricted = false;

if (!args.skipProvisionalProbe) {
  console.log(
    `Phase 22: narrow FacilityDetail probes for ${probeIds.length} IDs `
      + `(concurrency=1, minIntervalMs=450; NOT a statewide crawl)...`,
  );
  for (let i = 0; i < probeIds.length; i += 1) {
    const id = probeIds[i];
    const probe = await probeFacility(id);
    const downloadRow = downloadById.get(id) ?? null;
    const role = CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS.includes(id)
      ? "provisional-conflict"
      : "prior-control";
    const row = {
      ...probe,
      downloadStatus: downloadRow?.facilityStatus ?? null,
      downloadLicenseFirstDate: downloadRow?.licenseFirstDate ?? null,
      downloadFacilityType: downloadRow?.facilityType ?? null,
      downloadCapacity: downloadRow?.facilityCapacity ?? null,
      downloadFile: downloadRow?.file ?? null,
      role,
    };
    probes.push(row);
    assessments.push(
      assessCaliforniaPhase22ProvisionalConflict({
        facilityNumber: id,
        role,
        downloadStatus: row.downloadStatus,
        liveStatus: row.liveStatus,
        liveFacilityNumber: row.liveFacilityNumber,
        httpStatus: row.httpStatus,
        timedOut: row.timedOut,
        found: row.found,
        downloadLicenseFirstDate: row.downloadLicenseFirstDate,
        liveLicenseFirstDate: row.liveLicenseFirstDate,
        liveFacilityType: row.liveFacilityType,
        downloadFacilityType: row.downloadFacilityType,
        downloadCapacity: row.downloadCapacity,
        phase21LiveStatus: role === "provisional-conflict"
          ? "Provisional License"
          : null,
      }),
    );
    console.log(
      `  ${id}: download=${row.downloadStatus ?? "?"} live=${row.liveStatus ?? "?"} http=${row.httpStatus}`,
    );
    if (probe.httpStatus === 429 || probe.httpStatus === 403) {
      rateLimitedOrAccessRestricted = true;
      console.log(`Phase 22: automatic stop on HTTP ${probe.httpStatus} at ${id}`);
      break;
    }
  }
} else {
  // Prefer prior live probe fixture if present; else Phase 21 evidence.
  const priorPath = join(args.outDir, "provisional-and-control-probes.json");
  const phase21Path =
    "supabase/proposals/fixtures/california-phase21-exception-reconciliation/discrepancy-classifications.json";
  if (existsSync(priorPath)) {
    const prior = JSON.parse(readFileSync(priorPath, "utf8"));
    for (const row of prior.probes ?? []) {
      probes.push(row);
      assessments.push(
        assessCaliforniaPhase22ProvisionalConflict({
          facilityNumber: row.facilityNumber,
          role: row.role,
          downloadStatus: row.downloadStatus,
          liveStatus: row.liveStatus,
          liveFacilityNumber: row.liveFacilityNumber,
          httpStatus: row.httpStatus,
          timedOut: row.timedOut,
          found: row.found,
          downloadLicenseFirstDate: row.downloadLicenseFirstDate,
          liveLicenseFirstDate: row.liveLicenseFirstDate,
          liveFacilityType: row.liveFacilityType,
          downloadFacilityType: row.downloadFacilityType,
          downloadCapacity: row.downloadCapacity,
        }),
      );
    }
  } else if (existsSync(phase21Path)) {
    const phase21 = JSON.parse(readFileSync(phase21Path, "utf8"));
    const byId = new Map(
      (phase21.classifications ?? []).map(c => [c.facilityNumber, c]),
    );
    for (const id of CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS) {
      const c = byId.get(id);
      const downloadRow = downloadById.get(id);
      assessments.push(
        assessCaliforniaPhase22ProvisionalConflict({
          facilityNumber: id,
          role: "provisional-conflict",
          downloadStatus: c?.downloadStatus ?? downloadRow?.facilityStatus ?? "LICENSED",
          liveStatus: c?.liveStatus ?? "Provisional License",
          liveFacilityNumber: id,
          httpStatus: 200,
          found: true,
          phase21LiveStatus: "Provisional License",
        }),
      );
    }
    for (const id of CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS) {
      const downloadRow = downloadById.get(id);
      const live =
        id === "502701867"
          ? "Pending Incomplete Application"
          : "Licensed/Pending Increase";
      assessments.push(
        assessCaliforniaPhase22ProvisionalConflict({
          facilityNumber: id,
          role: "prior-control",
          downloadStatus: downloadRow?.facilityStatus ?? "LICENSED",
          liveStatus: live,
          liveFacilityNumber: id,
          httpStatus: 200,
          found: true,
        }),
      );
    }
  }
}

const provisionalSummary = summarizeCaliforniaPhase22ProvisionalAssessments(
  assessments,
);
const ledger = buildCaliforniaPhase22LaunchBlockerLedger({
  observedOn,
  provisionalAssessments: assessments,
  policyCases: CALIFORNIA_PHASE22_POLICY_CASES,
});
const matrixSummary = summarizeCaliforniaPhase22DecisionMatrix(
  CALIFORNIA_PHASE22_DECISION_MATRIX,
);
const quality = evaluateCaliforniaPhase22Quality({
  observedOn,
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
  provisionalUnresolved: provisionalSummary.provisionalUnresolved,
  policyCasesUnresolvedForLaunch: policySummary.unresolvedForLaunch,
});
const readiness = evaluateCaliforniaPhase22Readiness();

const downloadEvidence = {
  captureTimeUtc,
  observedOn,
  baselineSha256: CALIFORNIA_PHASE22_BASELINE_DOWNLOAD_SHA256,
  sha256MatchesBaseline: shaMatches,
  rcfe: {
    httpStatus: rcfeDownload.httpStatus,
    bytes: rcfeDownload.bytes,
    sha256: rcfeDownload.sha256,
    rows: rcfeDownload.rows.length,
    responseHeaders: rcfeDownload.responseHeaders,
    allHeaderKeys: rcfeDownload.allHeaderKeys,
    filenameDate: rcfeDownload.filenameDate,
    contentDisposition: rcfeDownload.contentDisposition,
  },
  arf: {
    httpStatus: arfDownload.httpStatus,
    bytes: arfDownload.bytes,
    sha256: arfDownload.sha256,
    rows: arfDownload.rows.length,
    responseHeaders: arfDownload.responseHeaders,
    allHeaderKeys: arfDownload.allHeaderKeys,
    filenameDate: arfDownload.filenameDate,
    contentDisposition: arfDownload.contentDisposition,
  },
  distinctions: {
    websiteUpdateTime:
      "downloadstatedata.html Last-Modified Fri, 08 May 2026 03:01:06 GMT (static page asset; not dataset export)",
    downloadFilenameStamp: rcfeDownload.filenameDate,
    httpTransportClocks: {
      date: rcfeDownload.responseHeaders.date ?? null,
      lastModified: rcfeDownload.responseHeaders["last-modified"] ?? null,
      etag: rcfeDownload.responseHeaders.etag ?? null,
    },
    datasetExportIso: null,
  },
  authoritativeIsoExportDate: null,
};

const output = {
  observedOn,
  captureTimeUtc,
  scope: {
    statewideCrawlRepeated: false,
    provisionalIdsInvestigated: CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS.length,
    priorControlsInvestigated: CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS.length,
    concurrency: 1,
    minIntervalMs: 450,
    rateLimitedOrAccessRestricted,
    skipProvisionalProbe: args.skipProvisionalProbe,
  },
  download: downloadEvidence,
  freshness,
  rosterScan,
  policyCases: {
    summary: policySummary,
    cases: CALIFORNIA_PHASE22_POLICY_CASES,
  },
  provisionalInvestigation: {
    summary: provisionalSummary,
    assessments,
    probes,
  },
  decisionMatrix: {
    summary: matrixSummary,
    rows: CALIFORNIA_PHASE22_DECISION_MATRIX,
  },
  launchBlockerLedger: ledger,
  readiness,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase22AllowsPublication(),
  gate: "blocked",
  stopGo: "STOP",
  exclusionActivatedInAppOrDb: false,
  cdssClarification: readiness.cdssClarification,
  nextApprovalsOnly: readiness.nextApprovalsOnly,
  elapsedMs: Date.now() - sessionStartedAt,
};

writeFileSync(
  join(args.outDir, "california-phase22-launch-blocker-evidence-live.json"),
  JSON.stringify(output, null, 2),
);
writeFileSync(
  join(args.outDir, "download-freshness-evidence.json"),
  JSON.stringify(downloadEvidence, null, 2),
);
writeFileSync(
  join(args.outDir, "freshness-channels.json"),
  JSON.stringify(freshness, null, 2),
);
writeFileSync(
  join(args.outDir, "unique-id-capacity-review.json"),
  JSON.stringify(
    { rosterScan, summary: policySummary, cases: CALIFORNIA_PHASE22_POLICY_CASES },
    null,
    2,
  ),
);
writeFileSync(
  join(args.outDir, "provisional-and-control-probes.json"),
  JSON.stringify(
    {
      captureTimeUtc,
      concurrency: 1,
      minIntervalMs: 450,
      statewideCrawlRepeated: false,
      rateLimitedOrAccessRestricted,
      probes,
      assessments,
      summary: provisionalSummary,
    },
    null,
    2,
  ),
);
writeFileSync(
  join(args.outDir, "decision-matrix.json"),
  JSON.stringify(
    { summary: matrixSummary, rows: CALIFORNIA_PHASE22_DECISION_MATRIX },
    null,
    2,
  ),
);
writeFileSync(
  join(args.outDir, "launch-blocker-ledger.json"),
  JSON.stringify(ledger, null, 2),
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
  captureTimeUtc,
  downloadSha256MatchesBaseline: shaMatches,
  authoritativeIsoExportDate: null,
  provisional: {
    expected: 5,
    unresolved: provisionalSummary.provisionalUnresolved,
    byClass: provisionalSummary.byClass,
  },
  controls: {
    expected: 3,
    assessed: assessments.filter(a => a.role === "prior-control").length,
  },
  policyCases: {
    total: policySummary.total,
    unresolvedForLaunch: policySummary.unresolvedForLaunch,
  },
  ledger: {
    totalEntries: ledger.summary.totalEntries,
    byCategory: ledger.summary.byCategory,
    provisionalUnresolved: ledger.summary.provisionalUnresolved,
  },
  baseline: {
    officialRecords: 24377,
    publicationCandidates: 15451,
    verifiedOfficialCoords: 15423,
    unresolvedCoords: 28,
  },
  rateLimitedOrAccessRestricted,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  exclusionActivatedInAppOrDb: false,
  statewideCrawlRepeated: false,
  cdssClarification: "sent-awaiting-response",
  mailboxCheckAvailable: false,
  duplicateCdssInquirySent: false,
  stopGo: "STOP",
  elapsedMs: Date.now() - sessionStartedAt,
  outDir: args.outDir,
  observedCountsRowCount: CALIFORNIA_PHASE22_OBSERVED_COUNTS.rowCount,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

#!/usr/bin/env node
/**
 * Read-only California Phase 23 eligibility matrix + launch-controls package.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase23-eligibility-matrix-run.mjs \
 *     [--out dir] [--skip-download]
 *
 * Builds offline eligibility matrix for 15,451 candidates from Phase 16–22
 * ledgers. Optional DownloadStateData sha revalidation only (NOT a statewide
 * FacilityDetail crawl). Does not send CDSS email. Gate stays BLOCKED. STOP.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE23_EXCEPTION_COUNTS,
  CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS,
  CALIFORNIA_PHASE23_PENDING_INCREASE_IDS,
  CALIFORNIA_PHASE23_ROSTER_DENOMINATOR,
} from "../lib/california-phase23-exception-sets.ts";
import { evaluateCaliforniaPhase23Freshness } from "../lib/california-phase23-freshness.ts";
import { classifyCaliforniaPhase23Eligibility } from "../lib/california-phase23-eligibility.ts";
import { buildCaliforniaPhase23EligibilityMatrix } from "../lib/california-phase23-eligibility-matrix.ts";
import { evaluateCaliforniaPhase23LaunchControls } from "../lib/california-phase23-launch-controls.ts";
import {
  CALIFORNIA_PHASE23_OBSERVED_COUNTS,
  evaluateCaliforniaPhase23Quality,
} from "../lib/california-phase23-quality.ts";
import {
  evaluateCaliforniaPhase23Readiness,
  californiaPhase23AllowsPublication,
} from "../lib/california-phase23-readiness.ts";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
} from "../lib/california-phase6-publication-gate.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadFilenameDate,
} from "../lib/california-transparency-download.ts";

function parseArgs(argv) {
  const args = { outDir: "california-phase23-audit-out", skipDownload: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--skip-download") args.skipDownload = true;
  }
  return args;
}

const args = parseArgs(process.argv);
const observedOn = new Date().toISOString().slice(0, 10);
const captureTimeUtc = new Date().toISOString();
mkdirSync(args.outDir, { recursive: true });

async function downloadTransparency(file, downloadId, guid, configHeader) {
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
  };
}

const freshness = evaluateCaliforniaPhase23Freshness();
const matrix = buildCaliforniaPhase23EligibilityMatrix({ observedOn });
const launchControls = evaluateCaliforniaPhase23LaunchControls();
const readiness = evaluateCaliforniaPhase23Readiness();

let downloadEvidence = {
  skipped: args.skipDownload,
  sha256MatchesBaseline: null,
  authoritativeIsoExportDate: null,
};

if (!args.skipDownload) {
  console.log("Phase 23: revalidating DownloadStateData sha256 (no FacilityDetail crawl)...");
  const guid = randomUUID();
  const configHeader = californiaTransparencyConfigHeader({ guid });
  const [rcfe, arf] = await Promise.all([
    downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe, guid, configHeader),
    downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf, guid, configHeader),
  ]);
  const shaMatches =
    rcfe.sha256 === CALIFORNIA_PHASE23_OBSERVED_COUNTS.downloadSha256.rcfe
    && arf.sha256 === CALIFORNIA_PHASE23_OBSERVED_COUNTS.downloadSha256.arf;
  downloadEvidence = {
    skipped: false,
    captureTimeUtc,
    sha256MatchesBaseline: shaMatches,
    authoritativeIsoExportDate: null,
    rcfe: {
      httpStatus: rcfe.httpStatus,
      sha256: rcfe.sha256,
      bytes: rcfe.bytes,
      filenameDate: rcfe.filenameDate,
    },
    arf: {
      httpStatus: arf.httpStatus,
      sha256: arf.sha256,
      bytes: arf.bytes,
      filenameDate: arf.filenameDate,
    },
  };
}

const quality = evaluateCaliforniaPhase23Quality({
  observedOn,
  downloadSha256: downloadEvidence.rcfe && downloadEvidence.arf
    ? { rcfe: downloadEvidence.rcfe.sha256, arf: downloadEvidence.arf.sha256 }
    : undefined,
  listingExcludedInCandidates:
    CALIFORNIA_PHASE23_ROSTER_DENOMINATOR
    - matrix.accounting.otherwiseClearOfflineEstimate,
  otherwiseClearOfflineEstimate: matrix.accounting.otherwiseClearOfflineEstimate,
});

const sampleClassifications = [
  ...CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS,
  ...CALIFORNIA_PHASE23_PENDING_INCREASE_IDS.slice(0, 3),
  "345920416",
  "502701867",
  "95354",
].map(id => classifyCaliforniaPhase23Eligibility(id));

const output = {
  observedOn,
  captureTimeUtc,
  scope: {
    statewideCrawlRepeated: false,
    exclusionActivatedInAppOrDb: false,
    duplicateCdssInquirySent: false,
  },
  exceptionCounts: CALIFORNIA_PHASE23_EXCEPTION_COUNTS,
  freshness,
  download: downloadEvidence,
  eligibilityMatrix: matrix,
  sampleClassifications,
  launchControls,
  readiness,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase23AllowsPublication(),
  gate: "blocked",
  stopGo: "STOP",
};

writeFileSync(
  join(args.outDir, "california-phase23-eligibility-matrix-live.json"),
  JSON.stringify(output, null, 2),
);
writeFileSync(join(args.outDir, "freshness-reaffirmation.json"), JSON.stringify(freshness, null, 2));
writeFileSync(join(args.outDir, "download-freshness-evidence.json"), JSON.stringify(downloadEvidence, null, 2));
writeFileSync(join(args.outDir, "eligibility-matrix.json"), JSON.stringify(matrix, null, 2));
writeFileSync(join(args.outDir, "sample-classifications.json"), JSON.stringify(sampleClassifications, null, 2));
writeFileSync(join(args.outDir, "launch-controls.json"), JSON.stringify(launchControls, null, 2));
writeFileSync(join(args.outDir, "readiness-report.json"), JSON.stringify(readiness, null, 2));
writeFileSync(join(args.outDir, "quality-report.json"), JSON.stringify(quality, null, 2));

const summary = {
  observedOn,
  captureTimeUtc,
  rosterDenominator: 15451,
  otherwiseClearOfflineEstimate: matrix.accounting.otherwiseClearOfflineEstimate,
  uniqueListingExcludedIds: matrix.accounting.uniqueListingExcludedIds,
  uniqueMapSuppressedOnlyIds: matrix.accounting.uniqueMapSuppressedOnlyIds,
  downloadSha256MatchesBaseline: downloadEvidence.sha256MatchesBaseline,
  authoritativeIsoExportDate: null,
  provisionalConflicts: 5,
  pendingIncreaseOverlays: 66,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  exclusionActivatedInAppOrDb: false,
  statewideCrawlRepeated: false,
  cdssClarification: "sent-awaiting-response",
  mailboxCheckAvailable: false,
  duplicateCdssInquirySent: false,
  stopGo: "STOP",
  outDir: args.outDir,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

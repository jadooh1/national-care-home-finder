#!/usr/bin/env node
/**
 * Read-only California Phase 24 freshness + count reconciliation + launch deps.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase24-freshness-launch-decisions-run.mjs \
 *     [--out dir] [--skip-download]
 *
 * Does NOT send CDSS email. Does NOT repeat statewide crawl. Gate stays BLOCKED.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateCaliforniaPhase24Freshness,
  CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT,
  CALIFORNIA_PHASE24_BASELINE_DOWNLOAD_SHA256,
} from "../lib/california-phase24-freshness.ts";
import { reconcileCaliforniaPhase24EligibilityCounts } from "../lib/california-phase24-count-reconciliation.ts";
import { evaluateCaliforniaPhase24LaunchDependencies } from "../lib/california-phase24-launch-dependencies.ts";
import {
  CALIFORNIA_PHASE24_OBSERVED_COUNTS,
  evaluateCaliforniaPhase24Quality,
} from "../lib/california-phase24-quality.ts";
import {
  evaluateCaliforniaPhase24Readiness,
  californiaPhase24AllowsPublication,
} from "../lib/california-phase24-readiness.ts";
import { buildCaliforniaPhase23EligibilityMatrix } from "../lib/california-phase23-eligibility-matrix.ts";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
} from "../lib/california-phase6-publication-gate.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadFilenameDate,
} from "../lib/california-transparency-download.ts";

function parseArgs(argv) {
  const args = { outDir: "california-phase24-audit-out", skipDownload: false };
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

const freshness = evaluateCaliforniaPhase24Freshness();
const phase23Matrix = buildCaliforniaPhase23EligibilityMatrix({ observedOn });
const listingInCandidates =
  15451 - phase23Matrix.accounting.otherwiseClearOfflineEstimate;
const reconciliation = reconcileCaliforniaPhase24EligibilityCounts({
  observedOn,
  listingExclusionsInCandidates: listingInCandidates,
  otherwiseClearOffline: phase23Matrix.accounting.otherwiseClearOfflineEstimate,
  mapOnlySuppressions: phase23Matrix.accounting.uniqueMapSuppressedOnlyIds,
  underlyingUnresolvedCoordinates: 28,
});
const launchDependencies = evaluateCaliforniaPhase24LaunchDependencies();
const readiness = evaluateCaliforniaPhase24Readiness();

let downloadEvidence = {
  skipped: args.skipDownload,
  sha256MatchesBaseline: null,
  authoritativeIsoExportDate: null,
};

if (!args.skipDownload) {
  console.log("Phase 24: revalidating DownloadStateData sha256 (no FacilityDetail crawl)...");
  const guid = randomUUID();
  const configHeader = californiaTransparencyConfigHeader({ guid });
  const [rcfe, arf] = await Promise.all([
    downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe, guid, configHeader),
    downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf, guid, configHeader),
  ]);
  const shaMatches =
    rcfe.sha256 === CALIFORNIA_PHASE24_BASELINE_DOWNLOAD_SHA256.rcfe
    && arf.sha256 === CALIFORNIA_PHASE24_BASELINE_DOWNLOAD_SHA256.arf;
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

const quality = evaluateCaliforniaPhase24Quality({
  observedOn,
  downloadSha256: downloadEvidence.rcfe && downloadEvidence.arf
    ? { rcfe: downloadEvidence.rcfe.sha256, arf: downloadEvidence.arf.sha256 }
    : undefined,
  countsMatchPhase23: reconciliation.matchesPhase23,
});

const draftMarkdown = [
  "Status: DRAFT — DO NOT SEND without human approval.",
  "Prior inquiry: sent-awaiting-response. Prefer mailbox check before any follow-up.",
  "",
  `To: ${CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.toSuggested.join(", ")}`,
  `Subject: ${CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.subject}`,
  "",
  CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.body,
  "",
].join("\n");

const output = {
  observedOn,
  captureTimeUtc,
  scope: {
    statewideCrawlRepeated: false,
    exclusionActivatedInAppOrDb: false,
    duplicateCdssInquirySent: false,
    clarificationFollowUpDraftStatus: "draft-do-not-send",
  },
  freshness,
  download: downloadEvidence,
  countReconciliation: reconciliation,
  phase23MatrixAccounting: phase23Matrix.accounting,
  launchDependencies,
  readiness,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase24AllowsPublication(),
  gate: "blocked",
  stopGo: "STOP",
  observedCountsRowCount: CALIFORNIA_PHASE24_OBSERVED_COUNTS.rowCount,
};

writeFileSync(
  join(args.outDir, "california-phase24-freshness-launch-decisions-live.json"),
  JSON.stringify(output, null, 2),
);
writeFileSync(join(args.outDir, "freshness-findings.json"), JSON.stringify(freshness, null, 2));
writeFileSync(join(args.outDir, "download-freshness-evidence.json"), JSON.stringify(downloadEvidence, null, 2));
writeFileSync(join(args.outDir, "count-reconciliation.json"), JSON.stringify(reconciliation, null, 2));
writeFileSync(join(args.outDir, "launch-dependencies.json"), JSON.stringify(launchDependencies, null, 2));
writeFileSync(join(args.outDir, "readiness-report.json"), JSON.stringify(readiness, null, 2));
writeFileSync(join(args.outDir, "quality-report.json"), JSON.stringify(quality, null, 2));
writeFileSync(
  join(args.outDir, "cdss-clarification-followup-draft.md"),
  draftMarkdown,
);
writeFileSync(
  join(args.outDir, "cdss-clarification-followup-draft.json"),
  JSON.stringify(CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT, null, 2),
);

const summary = {
  observedOn,
  captureTimeUtc,
  authoritativeIsoExportDate: null,
  downloadSha256MatchesBaseline: downloadEvidence.sha256MatchesBaseline,
  countsMatchPhase23: reconciliation.matchesPhase23,
  rosterDenominator: 15451,
  listingExclusionsInCandidates: reconciliation.observed.listingExclusionsInCandidates,
  otherwiseClearOffline: reconciliation.observed.otherwiseClearOffline,
  mapOnlySuppressions: reconciliation.observed.mapOnlySuppressions,
  unresolvedCoordinates: 28,
  coordinateOverlapId: "502701867",
  clarificationFollowUpDraftStatus: "draft-do-not-send",
  duplicateCdssInquirySent: false,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  exclusionActivatedInAppOrDb: false,
  statewideCrawlRepeated: false,
  cdssClarification: "sent-awaiting-response",
  stopGo: "STOP",
  outDir: args.outDir,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

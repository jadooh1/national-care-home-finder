#!/usr/bin/env node
/**
 * Read-only California Phase 17 launch-readiness dossier run.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase17-launch-readiness-run.mjs \
 *     [--out dir]
 *
 * Probes DownloadStateData sha256 + official FAQ/docs freshness channels,
 * assembles the decision matrix / exception / disclosure strategy dossier.
 * Does NOT publish California. Does NOT send CDSS email. Does NOT open the gate.
 * Does NOT perform large-scale FacilityDetail crawls.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeCaliforniaPhase17DecisionMatrix } from "../lib/california-phase17-decision-matrix.ts";
import {
  CALIFORNIA_PHASE17_BASELINE_DOWNLOAD_SHA256,
  CALIFORNIA_PHASE17_CDSS_CLARIFICATION,
  evaluateCaliforniaPhase17Freshness,
} from "../lib/california-phase17-freshness.ts";
import { summarizeCaliforniaPhase17ExceptionRisks } from "../lib/california-phase17-exceptions.ts";
import { evaluateCaliforniaPhase17DisclosureStrategy } from "../lib/california-phase17-disclosure-strategy.ts";
import {
  CALIFORNIA_PHASE17_OBSERVED_COUNTS,
  evaluateCaliforniaPhase17Quality,
} from "../lib/california-phase17-quality.ts";
import {
  CALIFORNIA_PHASE17_READINESS_DECISION,
  californiaPhase17AllowsPublication,
  evaluateCaliforniaPhase17Readiness,
} from "../lib/california-phase17-readiness.ts";
import {
  assembleCaliforniaPhase17LaunchDossier,
  californiaPhase17LaunchAllowsPublication,
} from "../lib/california-phase17-launch-readiness.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadFilenameDate,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_API,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS,
} from "../lib/california-transparency-download.ts";

function parseArgs(argv) {
  const args = { outDir: "california-phase17-audit-out" };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (!a.startsWith("-") && args.outDir === "california-phase17-audit-out") {
      args.outDir = a;
    }
  }
  return args;
}

async function downloadProbe(kind) {
  const id = CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS[kind];
  const url = `${CALIFORNIA_TRANSPARENCY_DOWNLOAD_API}/${id}`;
  const res = await fetch(url, {
    headers: { Config: californiaTransparencyConfigHeader({ guid: randomUUID() }) },
    redirect: "follow",
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const sha = createHash("sha256").update(buf).digest("hex");
  const cd = res.headers.get("content-disposition");
  return {
    kind,
    url,
    status: res.status,
    sha,
    contentDisposition: cd,
    lastModified: res.headers.get("last-modified"),
    etag: res.headers.get("etag"),
    date: res.headers.get("date"),
    cacheControl: res.headers.get("cache-control"),
    filenameDate: parseCaliforniaTransparencyDownloadFilenameDate(cd),
    bytes: buf.length,
  };
}

async function probeFaqWeekly() {
  const url = "https://www.ccld.dss.ca.gov/transparencyapi/api/FAQ?mode=Public&id=context";
  try {
    const res = await fetch(url);
    const text = await res.text();
    const weekly = /The data is updated weekly\./i.test(text);
    const noDateOnFile = /No date on file/i.test(text)
      || /exact first license date may not be available/i.test(text);
    return { url, status: res.status, weeklyCadencePresent: weekly, noDateOnFileMention: noDateOnFile };
  } catch (err) {
    return { url, status: null, error: String(err), weeklyCadencePresent: false, noDateOnFileMention: false };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  mkdirSync(args.outDir, { recursive: true });

  const rcfe = await downloadProbe("rcfe");
  const arf = await downloadProbe("arf");
  const downloadSha256 = { rcfe: rcfe.sha, arf: arf.sha };
  const faq = await probeFaqWeekly();

  const freshness = evaluateCaliforniaPhase17Freshness({
    downloadSha256,
    cdssReplyObserved: false,
  });
  const decisionMatrix = summarizeCaliforniaPhase17DecisionMatrix();
  const exceptions = summarizeCaliforniaPhase17ExceptionRisks();
  const disclosure = evaluateCaliforniaPhase17DisclosureStrategy();
  const quality = evaluateCaliforniaPhase17Quality({ downloadSha256 });
  const readiness = evaluateCaliforniaPhase17Readiness();

  const dossier = assembleCaliforniaPhase17LaunchDossier({
    decisionMatrixSummary: {
      statewidePublicationBlockersOpen: decisionMatrix.statewidePublicationBlockersOpen,
      facilityExcludableExceptions: decisionMatrix.facilityExcludableExceptions,
      humanApprovalsRequired: decisionMatrix.humanApprovalsRequired,
    },
    freshness: {
      authoritativeIsoExportDate: null,
      downloadSha256MatchesBaseline: freshness.downloadSha256MatchesBaseline,
      cdssReplyObserved: false,
      mailboxAvailable: false,
      gate: "blocked",
    },
    exceptions: {
      phase16SampledFindings: exceptions.phase16SampledFindings,
      phase16StatewideLicensedMissingDate: exceptions.phase16StatewideLicensedMissingDate,
      preservesFailClosed: exceptions.preservesFailClosed,
      avoidsRepeatingUnsuccessfulCoordChecks: exceptions.avoidsRepeatingUnsuccessfulCoordChecks,
    },
    disclosure: {
      cumulativeVerifiedCount: disclosure.coverage.cumulativeVerifiedCount,
      rosterDenominator: disclosure.coverage.rosterDenominator,
      additionalSmallSamplesRecommended: false,
      fullRosterCrawlRequiresSeparateApproval: true,
      statewideCoverageClaimed: false,
    },
    accounting: {
      officialRecords: CALIFORNIA_PHASE17_OBSERVED_COUNTS.rowCount,
      activeRestrictedCandidates:
        CALIFORNIA_PHASE17_OBSERVED_COUNTS.publicationCandidatesIfGateOpened,
      verifiedCoords: CALIFORNIA_PHASE17_OBSERVED_COUNTS.coordinates.verifiedOfficialCoords,
      unresolvedCoords: CALIFORNIA_PHASE17_OBSERVED_COUNTS.coordinates.unresolved,
    },
    stopGo: {
      recommendation: "STOP",
      publicationReady: false,
    },
    humanDecisionsRequired: [...readiness.humanDecisionsRequired],
  });

  const liveSummary = {
    observedOn: "2026-11-20",
    gate: "blocked",
    publicationReady: false,
    allowsPublication: californiaPhase17AllowsPublication(),
    launchAllowsPublication: californiaPhase17LaunchAllowsPublication(),
    downloadProbe: { rcfe, arf },
    downloadSha256MatchesBaseline:
      downloadSha256.rcfe === CALIFORNIA_PHASE17_BASELINE_DOWNLOAD_SHA256.rcfe
      && downloadSha256.arf === CALIFORNIA_PHASE17_BASELINE_DOWNLOAD_SHA256.arf,
    faq,
    cdssClarification: CALIFORNIA_PHASE17_CDSS_CLARIFICATION,
    decisionMatrix: decisionMatrix.statewidePublicationBlockersOpen,
    disclosureCumulative: disclosure.coverage.cumulativeVerifiedCount,
    exceptionRisks: exceptions.genuineEligibilityRiskRows,
    readinessGate: readiness.gate,
  };

  const readinessReport = {
    gate: readiness.gate,
    publicationReady: readiness.publicationReady,
    publication: readiness.publication,
    ownerClaimEligible: readiness.ownerClaimEligible,
    allowsPublication: readiness.allowsPublication,
    baselinePreserved: readiness.baselinePreserved,
    cdssClarification: readiness.cdssClarification,
    disclosureAudit: readiness.disclosureAudit,
    exceptions: readiness.exceptions,
    stopGo: readiness.stopGo,
    humanDecisionsRequired: readiness.humanDecisionsRequired,
    launchBlockingFailures: readiness.launchBlockingFailures,
  };

  const decisionMatrixReport = {
    observedOn: decisionMatrix.observedOn,
    statewidePublicationBlockersOpen: decisionMatrix.statewidePublicationBlockersOpen,
    facilityExcludableExceptions: decisionMatrix.facilityExcludableExceptions,
    humanApprovalsRequired: decisionMatrix.humanApprovalsRequired,
    rows: decisionMatrix.rows,
  };

  writeFileSync(join(args.outDir, "download-probe.json"), `${JSON.stringify({ rcfe, arf }, null, 2)}\n`);
  writeFileSync(join(args.outDir, "freshness-channels.json"), `${JSON.stringify(freshness, null, 2)}\n`);
  writeFileSync(join(args.outDir, "decision-matrix.json"), `${JSON.stringify(decisionMatrixReport, null, 2)}\n`);
  writeFileSync(join(args.outDir, "exception-risks.json"), `${JSON.stringify(exceptions, null, 2)}\n`);
  writeFileSync(join(args.outDir, "disclosure-strategy.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
  writeFileSync(join(args.outDir, "quality-report.json"), `${JSON.stringify(quality, null, 2)}\n`);
  writeFileSync(join(args.outDir, "readiness-report.json"), `${JSON.stringify(readinessReport, null, 2)}\n`);
  writeFileSync(join(args.outDir, "launch-readiness-dossier.json"), `${JSON.stringify(dossier, null, 2)}\n`);
  writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(liveSummary, null, 2)}\n`);
  writeFileSync(
    join(args.outDir, "observed-live-counts.json"),
    `${JSON.stringify({
      ...CALIFORNIA_PHASE17_OBSERVED_COUNTS,
      liveDownloadSha256: downloadSha256,
      downloadSha256MatchesBaseline: liveSummary.downloadSha256MatchesBaseline,
      readiness: CALIFORNIA_PHASE17_READINESS_DECISION.gate,
    }, null, 2)}\n`,
  );

  console.log(JSON.stringify({
    outDir: args.outDir,
    gate: "blocked",
    publicationReady: false,
    allowsPublication: false,
    downloadSha256MatchesBaseline: liveSummary.downloadSha256MatchesBaseline,
    cdssClarification: CALIFORNIA_PHASE17_CDSS_CLARIFICATION.status,
    mailboxAvailable: false,
    duplicateInquirySent: false,
    disclosureCumulative: `${disclosure.coverage.cumulativeVerifiedCount}/${disclosure.coverage.rosterDenominator}`,
    statewideBlockers: decisionMatrix.statewidePublicationBlockersOpen,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

#!/usr/bin/env node
/**
 * Read-only California Phase 18 verification-plan + exclusion-policy dossier run.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase18-verification-exclusion-run.mjs \
 *     [--out dir]
 *
 * Assembles the approval-ready verification plan, draft exclusion policy,
 * readiness report, and separate approval options from deterministic modules.
 * Optionally probes DownloadStateData sha256 for baseline integrity.
 *
 * Does NOT publish California.
 * Does NOT send CDSS email.
 * Does NOT open the gate.
 * Does NOT start any FacilityDetail crawl.
 * Does NOT activate the exclusion policy.
 * Does NOT request permission to open the publication gate.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateCaliforniaPhase18VerificationPlan,
  californiaPhase18CrawlStarted,
} from "../lib/california-phase18-verification-plan.ts";
import {
  evaluateCaliforniaPhase18ExclusionPolicy,
  californiaPhase18ExclusionPolicyActivated,
} from "../lib/california-phase18-exclusion-policy.ts";
import {
  evaluateCaliforniaPhase18ApprovalOptions,
  californiaPhase18RequestsPublicationGateOpen,
} from "../lib/california-phase18-approval-options.ts";
import {
  CALIFORNIA_PHASE18_OBSERVED_COUNTS,
  evaluateCaliforniaPhase18Quality,
} from "../lib/california-phase18-quality.ts";
import {
  CALIFORNIA_PHASE18_READINESS_DECISION,
  californiaPhase18AllowsPublication,
  evaluateCaliforniaPhase18Readiness,
} from "../lib/california-phase18-readiness.ts";
import {
  assembleCaliforniaPhase18VerificationExclusionDossier,
  californiaPhase18VerificationExclusionAllowsPublication,
} from "../lib/california-phase18-verification-exclusion.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadFilenameDate,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_API,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS,
} from "../lib/california-transparency-download.ts";

function parseArgs(argv) {
  const args = { outDir: "california-phase18-audit-out", skipDownload: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--skip-download") args.skipDownload = true;
    else if (!a.startsWith("-") && args.outDir === "california-phase18-audit-out") {
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

function writeJson(dir, name, value) {
  writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv);
  mkdirSync(args.outDir, { recursive: true });

  const verificationPlan = evaluateCaliforniaPhase18VerificationPlan();
  const exclusionPolicy = evaluateCaliforniaPhase18ExclusionPolicy();
  const approvalOptions = evaluateCaliforniaPhase18ApprovalOptions();
  const readiness = evaluateCaliforniaPhase18Readiness();
  const quality = evaluateCaliforniaPhase18Quality();

  let downloadProbeResult = null;
  if (!args.skipDownload) {
    try {
      const rcfe = await downloadProbe("rcfe");
      const arf = await downloadProbe("arf");
      downloadProbeResult = { rcfe, arf };
      const qualityLive = evaluateCaliforniaPhase18Quality({
        downloadSha256: { rcfe: rcfe.sha, arf: arf.sha },
      });
      writeJson(args.outDir, "quality-report.json", qualityLive);
      writeJson(args.outDir, "download-probe.json", downloadProbeResult);
    } catch (err) {
      downloadProbeResult = { error: String(err) };
      writeJson(args.outDir, "download-probe.json", downloadProbeResult);
      writeJson(args.outDir, "quality-report.json", quality);
    }
  } else {
    writeJson(args.outDir, "quality-report.json", quality);
  }

  const dossier = assembleCaliforniaPhase18VerificationExclusionDossier({
    verificationPlan: {
      performNow: false,
      crawlStarted: false,
      requiresSeparateHumanApproval: true,
      remainingFacilitiesApprox: verificationPlan.sampleEvidence.remainingUnverifiedApprox,
      recommendedOptionIfCrawlAuthorized: verificationPlan.recommendedOptionIfCrawlAuthorized,
      minWallHoursApprox: verificationPlan.durationEstimate.minWallHoursApprox,
      conservativeWallHoursApprox: verificationPlan.durationEstimate.conservativeWallHoursApprox,
      estimatedSessionsAtCap: verificationPlan.durationEstimate.estimatedSessionsAtCap,
    },
    exclusionPolicy: {
      status: "draft-for-approval",
      activated: false,
      adopted: false,
      ruleCount: exclusionPolicy.rules.length,
      preservesAuthoritativeRecordsUnaltered: true,
    },
    approvalOptions: {
      requestsPublicationGateOpen: false,
      crawlAuthorized: false,
      exclusionPolicyAdopted: false,
      optionIds: approvalOptions.options.map(o => o.id),
    },
    accounting: {
      officialRecords: readiness.baselinePreserved.officialRecords,
      activeRestrictedCandidates: readiness.baselinePreserved.activeRestrictedCandidates,
      verifiedCoords: readiness.baselinePreserved.verifiedCoords,
      unresolvedCoords: readiness.baselinePreserved.unresolvedCoords,
      disclosureSamples: readiness.baselinePreserved.disclosureSamples,
      statewideMissingLicenseDateFlags:
        readiness.baselinePreserved.statewideMissingLicenseDateFlags,
    },
    globalLaunchBlockers: [...readiness.globalLaunchBlockers],
    facilitySpecificExceptions: [...readiness.facilitySpecificExceptions],
    stopGo: { recommendation: "STOP", publicationReady: false },
    humanDecisionsRequired: [...readiness.humanDecisionsRequired],
  });

  writeJson(args.outDir, "verification-plan.json", verificationPlan);
  writeJson(args.outDir, "exclusion-policy.json", exclusionPolicy);
  writeJson(args.outDir, "approval-options.json", approvalOptions);
  writeJson(args.outDir, "readiness-report.json", readiness);
  writeJson(args.outDir, "verification-exclusion-dossier.json", dossier);
  writeJson(args.outDir, "observed-baseline-counts.json", CALIFORNIA_PHASE18_OBSERVED_COUNTS);
  writeJson(args.outDir, "live-run-summary.json", {
    observedOn: "2026-11-20",
    phase: 18,
    gate: "blocked",
    allowsPublication: californiaPhase18AllowsPublication(),
    dossierAllowsPublication: californiaPhase18VerificationExclusionAllowsPublication(),
    crawlStarted: californiaPhase18CrawlStarted(),
    exclusionPolicyActivated: californiaPhase18ExclusionPolicyActivated(),
    requestsPublicationGateOpen: californiaPhase18RequestsPublicationGateOpen(),
    stopGo: "STOP",
    readinessVerdict: CALIFORNIA_PHASE18_READINESS_DECISION.verdict,
    downloadProbe: downloadProbeResult ? "attempted" : "skipped",
  });

  console.log(JSON.stringify({
    outDir: args.outDir,
    gate: "blocked",
    stopGo: "STOP",
    crawlStarted: false,
    exclusionPolicyActivated: false,
    requestsPublicationGateOpen: false,
    allowsPublication: false,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

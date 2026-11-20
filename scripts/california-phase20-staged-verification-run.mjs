#!/usr/bin/env node
/**
 * Read-only California Phase 20 staged statewide verification.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase20-staged-verification-run.mjs \
 *     [--out dir] [--checkpoint path] [--batch-size 250] [--max-additional 14744] \
 *     [--resume] [--skip-page-probe] [--max-batches N]
 *
 * User-authorized staged crawl of up to 14,744 previously-unverified publication
 * candidates in batches ≤250. Uses Phase 13 rate-limited resumable harness.
 * Excludes Phase 13–19 probed IDs (coverage baseline 707). Applies Phase 18
 * exclusion policy offline only. Does not publish California. Does not send
 * CDSS email. Gate stays BLOCKED.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL,
  CALIFORNIA_PHASE20_BATCH_FACILITY_CAP,
  CALIFORNIA_PHASE20_COVERAGE_BASELINE,
  CALIFORNIA_PHASE20_ROSTER_DENOMINATOR,
  classifyCaliforniaPhase20RemainingCandidate,
  planCaliforniaPhase20RemainingQueue,
} from "../lib/california-phase20-sample.ts";
import {
  CALIFORNIA_PHASE20_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  classifyCaliforniaPhase20DisclosureLink,
  generateCaliforniaPhase20DisclosureLinks,
  summarizeCaliforniaPhase20Coverage,
} from "../lib/california-phase20-disclosure-audit.ts";
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
  summarizeCaliforniaPhase20ExclusionClassification,
  CALIFORNIA_PHASE20_EXCLUSION_ADOPTION,
} from "../lib/california-phase20-exclusion-classification.ts";
import {
  CALIFORNIA_PHASE20_OBSERVED_COUNTS,
  evaluateCaliforniaPhase20Quality,
} from "../lib/california-phase20-quality.ts";
import {
  evaluateCaliforniaPhase20Readiness,
  californiaPhase20AllowsPublication,
} from "../lib/california-phase20-readiness.ts";
import {
  CALIFORNIA_PHASE20_STAGED_AUTHORIZATION,
  assembleCaliforniaPhase20StagedDossier,
  assembleCaliforniaPhase20StagedProgress,
  californiaPhase20StagedStatewideStarted,
} from "../lib/california-phase20-staged.ts";
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
    outDir: "california-phase20-audit-out",
    checkpoint: null,
    batchSize: CALIFORNIA_PHASE20_BATCH_FACILITY_CAP,
    maxAdditional: CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL,
    maxBatches: Infinity,
    resume: false,
    skipPageProbe: true,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
    else if (a === "--checkpoint") args.checkpoint = argv[++i];
    else if (a === "--batch-size") args.batchSize = Number(argv[++i]);
    else if (a === "--max-additional") args.maxAdditional = Number(argv[++i]);
    else if (a === "--max-batches") args.maxBatches = Number(argv[++i]);
    else if (a === "--resume") args.resume = true;
    else if (a === "--skip-page-probe") args.skipPageProbe = true;
    else if (a === "--with-page-probe") args.skipPageProbe = false;
    else if (!a.startsWith("-") && args.outDir === "california-phase20-audit-out") {
      args.outDir = a;
    }
  }
  args.batchSize = Math.min(
    Math.max(1, Number.isFinite(args.batchSize) ? args.batchSize : 250),
    CALIFORNIA_PHASE20_BATCH_FACILITY_CAP,
  );
  args.maxAdditional = Math.min(
    Math.max(1, Number.isFinite(args.maxAdditional) ? args.maxAdditional : 14744),
    CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL,
  );
  if (!Number.isFinite(args.maxBatches) || args.maxBatches < 1) {
    args.maxBatches = Infinity;
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
const progressPath = join(args.outDir, "batch-progress.json");
const summaryPath = join(args.outDir, "live-run-summary.json");
const fullOutPath = join(args.outDir, "california-phase20-staged-verification-live.json");
const handoffPath = join(args.outDir, "handoff.json");

async function sleepUntilInterval() {
  const minIntervalMs = 450;
  const elapsed = Date.now() - lastRequestAt.value;
  if (lastRequestAt.value > 0 && elapsed < minIntervalMs) {
    await new Promise(r => setTimeout(r, minIntervalMs - elapsed));
  }
  lastRequestAt.value = Date.now();
}

async function downloadTransparency(file, downloadId) {
  await sleepUntilInterval();
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
    await sleepUntilInterval();
    const response = await fetch(url, { method: "GET", redirect: "follow" });
    return { httpStatus: response.status, finalUrl: response.url };
  } catch {
    return { httpStatus: 0, finalUrl: null };
  }
}

function writeCheckpoint(checkpoint) {
  writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

function writeProgress(progress) {
  writeFileSync(progressPath, JSON.stringify(progress, null, 2));
}

console.log(
  "Phase 20: downloading DownloadStateData for remaining-roster planning + sha256...",
);
// Sequential downloads so the shared ≥450 ms interval covers every request.
const rcfeDownload = await downloadTransparency(
  "RCFE",
  CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe,
);
const arfDownload = await downloadTransparency(
  "ARF",
  CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf,
);

const allRows = [
  ...rcfeDownload.rows.map(row => ({ file: "RCFE", row })),
  ...arfDownload.rows.map(row => ({ file: "ARF", row })),
];
const downloadById = new Map(
  allRows.map(({ row }) => [String(row.facilityNumber).trim(), row]),
);

const remainingPool = [];
for (const { file, row } of allRows) {
  const classified = classifyCaliforniaPhase20RemainingCandidate(file, row);
  if (classified) remainingPool.push(classified);
}

const remainingQueue = planCaliforniaPhase20RemainingQueue(remainingPool, {
  authorizedAdditional: args.maxAdditional,
});

writeFileSync(
  join(args.outDir, "remaining-queue-plan.json"),
  JSON.stringify({
    coverageBaseline: CALIFORNIA_PHASE20_COVERAGE_BASELINE,
    authorizedAdditional: args.maxAdditional,
    batchSize: args.batchSize,
    poolSize: remainingPool.length,
    plannedUnique: remainingQueue.length,
    skipPageProbe: args.skipPageProbe,
    rosterDenominator: CALIFORNIA_PHASE20_ROSTER_DENOMINATOR,
    byStratum: Object.fromEntries(
      ["active-licensed", "restricted-probation", "leading-zero-active", "leading-zero-probation"]
        .map(s => [s, remainingQueue.filter(r => r.stratum === s).length]),
    ),
    sampleHead: remainingQueue.slice(0, 20),
  }, null, 2),
);

const auditQueue = remainingQueue.map(target => ({
  facilityNumber: target.facilityNumber,
  requestFacilityNumber: target.facilityNumber,
  file: target.file,
  downloadStatus: target.downloadStatus,
  downloadType: target.downloadType,
  stratum: target.stratum,
  label: target.label,
  publicationCandidate: true,
}));

const auditConfig = californiaPhase13DefaultAuditConfig({
  maxRequests: args.batchSize,
  minIntervalMs: 450,
  checkpointEvery: 10,
  maxDurationMs: 8 * 60 * 60 * 1000,
  maxConsecutiveInconclusive: 8,
  rosterDenominator: CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
});

let checkpoint;
let batchProgressLog = [];
if (args.resume && existsSync(checkpointPath)) {
  checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
  checkpoint.requestsThisSession = 0;
  checkpoint.config = { ...checkpoint.config, ...auditConfig };
  if (existsSync(progressPath)) {
    batchProgressLog = JSON.parse(readFileSync(progressPath, "utf8")).batches ?? [];
  }
  console.log(
    `Phase 20: resuming checkpoint with ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} completed`,
  );
} else {
  checkpoint = createCaliforniaPhase13AuditCheckpoint({
    mode: "roster-resume",
    observedOn,
    queue: auditQueue,
    config: auditConfig,
  });
  writeCheckpoint(checkpoint);
}

console.log(
  `Phase 20: auditing up to ${auditQueue.length} remaining publication candidates `
    + `(baseline ${CALIFORNIA_PHASE20_COVERAGE_BASELINE}; batch ${args.batchSize}; `
    + `roster ${CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE})...`,
);

let rateLimitedOrAccessRestricted = false;
let hardStopReason = null;
let batchesThisRun = 0;
const overallStartedAt = Date.now();

while (true) {
  let remaining = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
  if (remaining.length === 0) {
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "queue-exhausted");
    writeCheckpoint(checkpoint);
    console.log("Phase 20: remaining queue exhausted");
    break;
  }
  if (batchesThisRun >= args.maxBatches) {
    hardStopReason = "max-batches";
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "max-requests");
    writeCheckpoint(checkpoint);
    console.log(`Phase 20: reached --max-batches ${args.maxBatches}`);
    break;
  }
  if (checkpoint.completedKeys.length >= args.maxAdditional) {
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "queue-exhausted");
    writeCheckpoint(checkpoint);
    console.log("Phase 20: authorized additional cap reached");
    break;
  }

  // Start a new batch session counter
  checkpoint.requestsThisSession = 0;
  checkpoint.stopReason = null;
  const batchIndex = batchProgressLog.length;
  const batchStartedAt = Date.now();
  const batchStartCompleted = checkpoint.completedKeys.length;
  // Fix session budget once per batch — do not shrink maxRequests as
  // completedKeys grows mid-batch (that would stop early, e.g. 3/5).
  const batchRequestBudget = Math.min(
    args.batchSize,
    Math.max(0, args.maxAdditional - batchStartCompleted),
    remaining.length,
  );
  console.log(
    `Phase 20: starting batch ${batchIndex + 1} `
      + `(completed ${batchStartCompleted}/${auditQueue.length}; remaining ${remaining.length}; `
      + `budget ${batchRequestBudget})`,
  );

  let batchStopReason = null;
  while (remaining.length > 0) {
    const stop = shouldStopCaliforniaPhase13Audit({
      requestsThisSession: checkpoint.requestsThisSession,
      elapsedMs: Date.now() - overallStartedAt,
      consecutiveInconclusive: checkpoint.consecutiveInconclusive,
      remainingCount: remaining.length,
      config: {
        ...checkpoint.config,
        maxRequests: batchRequestBudget,
      },
    });
    if (stop) {
      batchStopReason = stop;
      checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, stop);
      writeCheckpoint(checkpoint);
      console.log(`Phase 20: batch ${batchIndex + 1} stop — ${stop}`);
      break;
    }

    const item = remaining[0];
    const requestId = item.requestFacilityNumber ?? item.facilityNumber;
    const generatedForOfficial = generateCaliforniaPhase20DisclosureLinks(item.facilityNumber);
    const pageProbe = await probePage(generatedForOfficial.pageUrl);
    const fetched = await fetchCaliforniaFacilityDetail(requestId, {
      minIntervalMs: checkpoint.config.minIntervalMs,
      maxAttempts: checkpoint.config.maxAttempts,
      backoffMs: checkpoint.config.backoffMs,
      lastRequestAt,
    });

    if (fetched.httpStatus === 429 || fetched.httpStatus === 403) {
      rateLimitedOrAccessRestricted = true;
      hardStopReason = `http-${fetched.httpStatus}`;
      checkpoint = appendCaliforniaPhase13AuditResult(
        checkpoint,
        item,
        classifyCaliforniaPhase20DisclosureLink({
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
        { liveStatus: null, attempts: fetched.attempts },
      );
      checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(
        checkpoint,
        "consecutive-inconclusive",
      );
      writeCheckpoint(checkpoint);
      batchStopReason = "consecutive-inconclusive";
      console.log(
        `Phase 20: automatic stop on access restriction / rate limit (HTTP ${fetched.httpStatus})`,
      );
      break;
    }

    const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
    const classified = classifyCaliforniaPhase20DisclosureLink({
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

    if (
      fetched.httpStatus >= 500
      && fetched.httpStatus < 600
      && fetched.attempts >= 3
      && checkpoint.consecutiveInconclusive >= checkpoint.config.maxConsecutiveInconclusive
    ) {
      hardStopReason = "sustained-5xx";
      checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(
        checkpoint,
        "consecutive-inconclusive",
      );
      writeCheckpoint(checkpoint);
      batchStopReason = "consecutive-inconclusive";
      console.log("Phase 20: automatic stop on sustained server errors");
      break;
    }

    if (checkpoint.results.length % checkpoint.config.checkpointEvery === 0) {
      writeCheckpoint(checkpoint);
      console.log(
        `Phase 20: checkpoint ${checkpoint.completedKeys.length}/${checkpoint.queueTotal} `
          + `(batch session ${checkpoint.requestsThisSession})`,
      );
    }

    remaining = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
  }

  if (!batchStopReason && remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint).length === 0) {
    batchStopReason = "queue-exhausted";
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "queue-exhausted");
    writeCheckpoint(checkpoint);
  } else if (!batchStopReason && checkpoint.requestsThisSession >= args.batchSize) {
    batchStopReason = "max-requests";
  } else if (!checkpoint.stopReason && batchStopReason) {
    checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, batchStopReason);
    writeCheckpoint(checkpoint);
  }

  const batchResults = checkpoint.results.slice(batchStartCompleted);
  const batchSummary = {
    batchIndex,
    planned: Math.min(args.batchSize, auditQueue.length - batchStartCompleted),
    completed: batchResults.length,
    working: batchResults.filter(r => r.classification === "working").length,
    missing: batchResults.filter(r => r.classification === "missing").length,
    ambiguous: batchResults.filter(r => r.classification === "ambiguous").length,
    invalid: batchResults.filter(r => r.classification === "invalid").length,
    inconclusive: batchResults.filter(r => r.classification === "inconclusive").length,
    stopReason: batchStopReason,
    elapsedMs: Date.now() - batchStartedAt,
  };
  batchProgressLog.push(batchSummary);
  writeProgress({
    updatedAt: new Date().toISOString(),
    completedTotal: checkpoint.completedKeys.length,
    queueTotal: checkpoint.queueTotal,
    batches: batchProgressLog,
  });
  batchesThisRun += 1;
  console.log(`Phase 20: batch ${batchIndex + 1} complete`, JSON.stringify(batchSummary));

  if (hardStopReason || rateLimitedOrAccessRestricted) break;
  if (batchStopReason === "consecutive-inconclusive") break;
  if (batchStopReason === "queue-exhausted") break;
  if (batchStopReason === "max-duration") {
    hardStopReason = "max-duration";
    break;
  }
  // max-requests ends the batch; continue to next batch autonomously
}

if (!checkpoint.stopReason) {
  const rem = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
  checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(
    checkpoint,
    rem.length === 0 ? "queue-exhausted" : "max-requests",
  );
}
writeCheckpoint(checkpoint);

const incrementalSummary = summarizeCaliforniaPhase13DisclosureLinks(
  checkpoint.results,
  {
    observedOn,
    rosterDenominator: CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  },
);
const queueExhausted = checkpoint.stopReason === "queue-exhausted"
  && remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint).length === 0;
const coverageRollup = summarizeCaliforniaPhase20Coverage({
  coverageBaseline: CALIFORNIA_PHASE20_COVERAGE_BASELINE,
  incrementalResults: checkpoint.results,
  rosterDenominator: CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  authorizedAdditional: args.maxAdditional,
  queueExhausted,
});

console.log(
  "Phase 20: deriving status consistency from FacilityDetail responses...",
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

console.log("Phase 20: offline exclusion classification (not activated in app/DB)...");
const exclusionSummary = summarizeCaliforniaPhase20ExclusionClassification({
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
  JSON.stringify(exclusionSummary, null, 2),
);

const shaMatches =
  rcfeDownload.sha256 === CALIFORNIA_PHASE20_OBSERVED_COUNTS.downloadSha256.rcfe
  && arfDownload.sha256 === CALIFORNIA_PHASE20_OBSERVED_COUNTS.downloadSha256.arf;

if (!shaMatches) {
  console.log(
    "Phase 20: WARNING — DownloadStateData sha256 drifted from Phase 10–19 baseline.",
  );
}

const progress = assembleCaliforniaPhase20StagedProgress({
  newlyVerified: coverageRollup.incrementalVerifiedCount,
  disclosureFailures: {
    missing: incrementalSummary.missing,
    ambiguous: incrementalSummary.ambiguous,
    invalid: incrementalSummary.invalid,
    inconclusive: incrementalSummary.inconclusive,
  },
  licensingConflicts: statusSummary.conflict,
  rateLimitOrAccessStops: rateLimitedOrAccessRestricted ? 1 : 0,
  hardStopReason,
  batchProgress: batchProgressLog,
  queueExhausted,
});

const quality = evaluateCaliforniaPhase20Quality({
  observedOn,
  disclosure: {
    sampleSize: incrementalSummary.sampleSize,
    working: incrementalSummary.working,
    missing: incrementalSummary.missing,
    ambiguous: incrementalSummary.ambiguous,
    invalid: incrementalSummary.invalid,
    inconclusive: incrementalSummary.inconclusive,
    verifiedCount: coverageRollup.cumulativeVerifiedCount,
    rosterDenominator: CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
    coverageBaseline: coverageRollup.coverageBaseline,
    incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
    statewideCoverageClaimed: coverageRollup.statewideCoverageClaimed,
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

const readiness = evaluateCaliforniaPhase20Readiness({
  incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
  cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
  statewideRosterVerificationComplete:
    coverageRollup.statewideRosterVerificationComplete,
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
  skipPageProbe: args.skipPageProbe,
  statewideCoverageClaimed: coverageRollup.statewideCoverageClaimed,
  coverageBaseline: CALIFORNIA_PHASE20_COVERAGE_BASELINE,
  rateLimitedOrAccessRestricted,
  hardStopReason,
  elapsedMs: Date.now() - sessionStartedAt,
  batchesThisRun,
};

const dossier = assembleCaliforniaPhase20StagedDossier({
  observedOn,
  progress,
  disclosureSummary: {
    incremental: incrementalSummary,
    coverage: coverageRollup,
    priorBaseline: CALIFORNIA_PHASE20_COVERAGE_BASELINE,
  },
  statusSummary,
  exclusionSummary: {
    adoption: CALIFORNIA_PHASE20_EXCLUSION_ADOPTION,
    totalFindings: exclusionSummary.totalFindings,
    byClass: exclusionSummary.byClass,
    uniqueFacilitiesWithFindings: exclusionSummary.uniqueFacilitiesWithFindings,
    workingDisclosureWithoutExclusionSignal:
      exclusionSummary.workingDisclosureWithoutExclusionSignal,
    activatedInApplicationOrDatabase: false,
  },
  quality,
  readiness,
  auditHarness,
  downloadSha256MatchesBaseline: shaMatches,
});

const output = {
  observedOn,
  authorization: CALIFORNIA_PHASE20_STAGED_AUTHORIZATION,
  urlPatterns: CALIFORNIA_PHASE20_DISCLOSURE_URL_PATTERNS,
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
    baselineSha256: CALIFORNIA_PHASE20_OBSERVED_COUNTS.downloadSha256,
  },
  auditHarness,
  progress,
  disclosureLinks: {
    incremental: incrementalSummary,
    coverage: coverageRollup,
    // Full results live in checkpoint; keep summary-sized payload here.
    resultCount: checkpoint.results.length,
  },
  statusMapping: statusSummary,
  exclusionOfflineClassification: exclusionSummary,
  readiness,
  quality,
  dossier,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase20AllowsPublication(),
  gate: "blocked",
  stagedStatewideStarted: californiaPhase20StagedStatewideStarted(),
  exclusionActivatedInAppOrDb: false,
  cdssClarification: {
    status: "sent-awaiting-response",
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: readiness.baselinePreserved,
};

writeFileSync(fullOutPath, JSON.stringify(output, null, 2));
writeFileSync(join(args.outDir, "staged-dossier.json"), JSON.stringify(dossier, null, 2));
writeFileSync(join(args.outDir, "progress.json"), JSON.stringify(progress, null, 2));

// Compact disclosure sample for fixtures (first 50 + any non-working)
const sampleResults = [
  ...checkpoint.results.filter(r => r.classification !== "working"),
  ...checkpoint.results.filter(r => r.classification === "working").slice(0, 50),
].slice(0, 100);
writeFileSync(
  join(args.outDir, "disclosure-link-sample.json"),
  JSON.stringify({
    sampleSize: checkpoint.results.length,
    coverageBaseline: CALIFORNIA_PHASE20_COVERAGE_BASELINE,
    incrementalVerifiedCount: coverageRollup.incrementalVerifiedCount,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
    summary: incrementalSummary,
    results: sampleResults.map(row => ({
      facilityNumber: row.facilityNumber,
      officialFacilityNumber: row.officialFacilityNumber,
      requestFacilityNumber: row.requestFacilityNumber,
      classification: row.classification,
      identifierRelation: row.identifierRelation,
      stratum: row.stratum,
      label: row.label,
      publicationCandidate: row.publicationCandidate,
      liveStatus: row.liveStatus,
      downloadStatus: row.downloadStatus,
    })),
  }, null, 2),
);

const remAfter = remainingCaliforniaPhase13AuditQueue(auditQueue, checkpoint);
const handoff = {
  observedOn,
  incomplete: remAfter.length > 0 || !queueExhausted,
  checkpointPath,
  completed: checkpoint.completedKeys.length,
  queueTotal: checkpoint.queueTotal,
  remaining: remAfter.length,
  stopReason: checkpoint.stopReason,
  hardStopReason,
  rateLimitedOrAccessRestricted,
  coverageBaseline: CALIFORNIA_PHASE20_COVERAGE_BASELINE,
  newlyVerified: coverageRollup.incrementalVerifiedCount,
  cumulativeVerified: coverageRollup.cumulativeVerifiedCount,
  remainingApprox: coverageRollup.remainingApprox,
  resumeCommand:
    `node --experimental-strip-types scripts/california-phase20-staged-verification-run.mjs `
    + `--out ${args.outDir} --checkpoint ${checkpointPath} --resume `
    + `--batch-size ${args.batchSize} --max-additional ${args.maxAdditional}`,
  gate: "blocked",
  allowsPublication: false,
};
writeFileSync(handoffPath, JSON.stringify(handoff, null, 2));

const summary = {
  observedOn,
  disclosure: {
    coverageBaseline: coverageRollup.coverageBaseline,
    incrementalSampleSize: incrementalSummary.sampleSize,
    incrementalWorking: incrementalSummary.working,
    incrementalMissing: incrementalSummary.missing,
    incrementalAmbiguous: incrementalSummary.ambiguous,
    incrementalInvalid: incrementalSummary.invalid,
    incrementalInconclusive: incrementalSummary.inconclusive,
    leadingZeroPreservedWorking: incrementalSummary.leadingZeroPreservedWorking,
    cumulativeVerifiedCount: coverageRollup.cumulativeVerifiedCount,
    rosterDenominator: coverageRollup.rosterDenominator,
    remainingApprox: coverageRollup.remainingApprox,
    incrementalCoveragePercentRounded: coverageRollup.incrementalCoveragePercentRounded,
    cumulativeCoveragePercentRounded: coverageRollup.cumulativeCoveragePercentRounded,
    statewideCoverageClaimed: coverageRollup.statewideCoverageClaimed,
    statewideRosterVerificationComplete:
      coverageRollup.statewideRosterVerificationComplete,
    stopReason: checkpoint.stopReason,
    hardStopReason,
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
  progress,
  downloadSha256MatchesBaseline: shaMatches,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  stagedStatewideStarted: true,
  stagedStatewideAuthorized: true,
  cdssClarification: "sent-awaiting-response",
  outDir: args.outDir,
  checkpointPath,
  fullOutPath,
  handoffPath,
  elapsedMs: Date.now() - sessionStartedAt,
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

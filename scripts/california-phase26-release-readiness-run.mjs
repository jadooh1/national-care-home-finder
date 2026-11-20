#!/usr/bin/env node
/**
 * Read-only California Phase 26 release-readiness consolidation.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase26-release-readiness-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish California. Does NOT activate exclusions.
 * Does NOT crawl. Does NOT send CDSS mail. Does NOT write production/Supabase.
 * Gate stays BLOCKED.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCaliforniaPhase26ReadinessManifest } from "../lib/california-phase26-readiness-manifest.ts";
import { evaluateCaliforniaPhase26PublicationRestrictions } from "../lib/california-phase26-publication-restrictions.ts";
import { evaluateCaliforniaPhase26SecurityRollback } from "../lib/california-phase26-security-rollback.ts";
import { evaluateCaliforniaPhase26CdssDependency } from "../lib/california-phase26-cdss-dependency.ts";
import { evaluateCaliforniaPhase26RiskMatrix } from "../lib/california-phase26-risk-matrix.ts";
import { evaluateCaliforniaPhase26Quality } from "../lib/california-phase26-quality.ts";
import {
  evaluateCaliforniaPhase26Readiness,
  CALIFORNIA_PHASE26_PUBLICATION_STOP_GO,
  californiaPhase26AllowsPublication,
} from "../lib/california-phase26-readiness.ts";
import { californiaDirectoryReady, californiaProfileUrl } from "../lib/california-directory.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "california-phase26-audit-out" };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.outDir = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv);
const observedOn = new Date().toISOString().slice(0, 10);
const captureTimeUtc = new Date().toISOString();
mkdirSync(args.outDir, { recursive: true });

const manifest = buildCaliforniaPhase26ReadinessManifest();
const restrictions = evaluateCaliforniaPhase26PublicationRestrictions();
const security = evaluateCaliforniaPhase26SecurityRollback();
const cdss = evaluateCaliforniaPhase26CdssDependency();
const risks = evaluateCaliforniaPhase26RiskMatrix();
const quality = evaluateCaliforniaPhase26Quality({
  restrictionPass: restrictions.summary.allPass,
  leakPossibleCount: restrictions.summary.leakPossibleCount,
  securityPass: security.allPass,
  cdssIsoPresent: cdss.authoritativeIsoExportDate != null,
  mailSent: cdss.mailSentThisPhase,
  productionWrites: security.productionWrites,
  riskBlockerCount: risks.blockerCount,
});
const readiness = evaluateCaliforniaPhase26Readiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  phase: 26,
  manifestVersion: manifest.version,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: californiaPhase26AllowsPublication(),
  californiaDirectoryReady: californiaDirectoryReady(),
  californiaProfileUrl: californiaProfileUrl(),
  directoryPublication: directoryContract("California")?.publication ?? null,
  directoryHref: directoryHref("California", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("California"),
  baselineMatches: manifest.baseline.matches,
  officialRecords: manifest.baseline.observed.official,
  californiaCandidates: manifest.baseline.observed.candidates,
  listingExclusionsInCandidates: manifest.baseline.observed.listing,
  otherwiseClearOffline: manifest.baseline.observed.otherwise,
  unresolvedCoordinates: manifest.baseline.observed.coords,
  mapOnlySuppressions: manifest.baseline.observed.mapOnly,
  leakPossibleCount: restrictions.summary.leakPossibleCount,
  securityAllPass: security.allPass,
  authoritativeIsoExportDate: cdss.authoritativeIsoExportDate,
  mailSentThisPhase: cdss.mailSentThisPhase,
  followUpDraftStatus: cdss.followUpDraftStatus,
  exactEvidenceStillNeeded: cdss.exactEvidenceStillNeeded,
  riskBlockerCount: risks.blockerCount,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: CALIFORNIA_PHASE26_PUBLICATION_STOP_GO,
  crawlExecuted: false,
  exclusionsActivated: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "readiness-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(
  join(args.outDir, "publication-restrictions.json"),
  `${JSON.stringify(restrictions, null, 2)}\n`,
);
writeFileSync(
  join(args.outDir, "security-rollback.json"),
  `${JSON.stringify(security, null, 2)}\n`,
);
writeFileSync(join(args.outDir, "cdss-dependency.json"), `${JSON.stringify(cdss, null, 2)}\n`);
writeFileSync(join(args.outDir, "risk-matrix.json"), `${JSON.stringify(risks, null, 2)}\n`);

const markdown = `# California Phase 26 — release readiness rehearsal

**Observed:** ${observedOn}  
**Manifest:** ${manifest.version}  
**Gate:** BLOCKED  
**Stop/go:** STOP  
**Allows publication:** false  

## Baseline

| Metric | Count |
| --- | ---: |
| Official records | ${summary.officialRecords} |
| Candidates | ${summary.californiaCandidates} |
| Listing exclusions | ${summary.listingExclusionsInCandidates} |
| Otherwise-clear offline | ${summary.otherwiseClearOffline} |
| Unresolved coordinates | ${summary.unresolvedCoordinates} |
| Map-only | ${summary.mapOnlySuppressions} |

Matches: ${summary.baselineMatches}

## Restrictions

Leak possible: ${summary.leakPossibleCount}

## CDSS / freshness

ISO export date: ${summary.authoritativeIsoExportDate}  
Mail sent this phase: ${summary.mailSentThisPhase}  
Evidence still needed: ${summary.exactEvidenceStillNeeded}

## Risks blocking GO

${risks.blockerCount}

## Constraints honored

- No crawl
- No CDSS send
- No exclusion activation
- No production / Supabase writes
- California unpublished
`;

writeFileSync(join(args.outDir, "phase26-readiness-report.md"), markdown);

console.log(JSON.stringify({
  outDir: args.outDir,
  gate: summary.gate,
  stopGo: summary.stopGo,
  allowsPublication: summary.allowsPublication,
  baselineMatches: summary.baselineMatches,
  leakPossibleCount: summary.leakPossibleCount,
  qualityAllPass: summary.qualityAllPass,
  authoritativeIsoExportDate: summary.authoritativeIsoExportDate,
}, null, 2));

#!/usr/bin/env node
/**
 * Read-only California Phase 25 launch QA / security rehearsal.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-phase25-launch-qa-security-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish California. Does NOT activate exclusions.
 * Does NOT crawl. Does NOT send CDSS mail. Does NOT write production/Supabase.
 * Gate stays BLOCKED.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateCaliforniaPhase25SecurityAudit,
  summarizeCaliforniaPhase25SecurityFindings,
} from "../lib/california-phase25-security-audit.ts";
import { evaluateCaliforniaPhase25EligibilityRegression } from "../lib/california-phase25-eligibility-regression.ts";
import { evaluateCaliforniaPhase25SourceDataSecurity } from "../lib/california-phase25-source-data-security.ts";
import { evaluateCaliforniaPhase25LaunchAcceptance } from "../lib/california-phase25-launch-acceptance.ts";
import { evaluateCaliforniaPhase25Quality } from "../lib/california-phase25-quality.ts";
import {
  evaluateCaliforniaPhase25Readiness,
  CALIFORNIA_PHASE25_PUBLICATION_STOP_GO,
} from "../lib/california-phase25-readiness.ts";
import { californiaDirectoryReady, californiaProfileUrl } from "../lib/california-directory.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";
import { PRIVATE_INDEX_PREFIXES, robotsPolicy, sitemapPaths } from "../lib/public-indexing.ts";

function parseArgs(argv) {
  const args = { outDir: "california-phase25-audit-out" };
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

const security = evaluateCaliforniaPhase25SecurityAudit();
const securitySummary = summarizeCaliforniaPhase25SecurityFindings(security.findings);
const eligibility = evaluateCaliforniaPhase25EligibilityRegression();
const source = evaluateCaliforniaPhase25SourceDataSecurity();
const acceptance = evaluateCaliforniaPhase25LaunchAcceptance();
const quality = evaluateCaliforniaPhase25Quality({
  securityFindings: security.findings.length,
  unpublishedLeakPossibleCount: securitySummary.unpublishedLeakPossibleCount,
  sourceSecurityPassCount: source.checks.filter(c => c.status === "pass").length,
  productionDeployed: acceptance.productionDeployed,
});
const readiness = evaluateCaliforniaPhase25Readiness(quality.allPass);

const indexing = {
  privateIndexIncludesDevelopment: PRIVATE_INDEX_PREFIXES.includes("/development"),
  robotsDisallowsDevelopment: robotsPolicy(true).disallow.includes("/development"),
  sitemapHasCalifornia: sitemapPaths(true, ["100001"]).some(p =>
    p.toLowerCase().includes("california"),
  ),
  sitemapHasDevelopment: sitemapPaths(true, ["100001"]).some(p => p.startsWith("/development")),
};

const summary = {
  observedOn,
  captureTimeUtc,
  phase: 25,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: false,
  californiaDirectoryReady: californiaDirectoryReady(),
  californiaProfileUrl: californiaProfileUrl(),
  directoryPublication: directoryContract("California")?.publication ?? null,
  directoryHref: directoryHref("California", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("California"),
  unpublishedLeakPossibleCount: securitySummary.unpublishedLeakPossibleCount,
  securityFindings: security.findings.length,
  credentialedProbesExecuted: security.credentialedProbesExecuted,
  eligibilityMatches: eligibility.assertion.matches,
  rosterDenominator: eligibility.assertion.observed.roster,
  listingExclusionsInCandidates: eligibility.assertion.observed.listing,
  otherwiseClearOffline: eligibility.assertion.observed.otherwise,
  unresolvedCoordinates: eligibility.assertion.observed.coords,
  mapOnlySuppressions: eligibility.assertion.observed.mapOnly,
  sourceAllPass: source.allPass,
  developmentDefectsFixedThisPhase: source.developmentDefectsFixedThisPhase,
  productionDeployed: acceptance.productionDeployed,
  acceptanceByResult: acceptance.byResult,
  remainingApprovals: acceptance.remainingApprovals,
  qualityAllPass: quality.allPass,
  readiness,
  indexing,
  publicationStopGo: CALIFORNIA_PHASE25_PUBLICATION_STOP_GO,
  crawlExecuted: false,
  cdssMailSent: false,
  exclusionsActivated: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(
  join(args.outDir, "security-findings.json"),
  `${JSON.stringify({ observedOn, findings: security.findings, summary: securitySummary }, null, 2)}\n`,
);
writeFileSync(
  join(args.outDir, "eligibility-regression.json"),
  `${JSON.stringify(eligibility, null, 2)}\n`,
);
writeFileSync(
  join(args.outDir, "source-data-security.json"),
  `${JSON.stringify(source, null, 2)}\n`,
);
writeFileSync(
  join(args.outDir, "launch-acceptance.json"),
  `${JSON.stringify(acceptance, null, 2)}\n`,
);

const markdown = `# California Phase 25 — launch QA / security rehearsal

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  
**Allows publication:** false  

## Security

- Findings: ${security.findings.length}
- Unpublished leak possible: ${securitySummary.unpublishedLeakPossibleCount}
- Credentialed probes executed: ${security.credentialedProbesExecuted}

## Eligibility regression

| Metric | Count |
| --- | ---: |
| Candidates | ${summary.rosterDenominator} |
| Listing exclusions | ${summary.listingExclusionsInCandidates} |
| Otherwise-clear offline | ${summary.otherwiseClearOffline} |
| Unresolved coordinates | ${summary.unresolvedCoordinates} |
| Map-only | ${summary.mapOnlySuppressions} |

Matches targets: ${summary.eligibilityMatches}

## Source-data security

All pass: ${source.allPass}  
Development defects fixed this phase: ${source.developmentDefectsFixedThisPhase.length}

## Indexing

- /development in PRIVATE_INDEX_PREFIXES: ${indexing.privateIndexIncludesDevelopment}
- robots disallow /development: ${indexing.robotsDisallowsDevelopment}
- sitemap California: ${indexing.sitemapHasCalifornia}
- sitemap /development: ${indexing.sitemapHasDevelopment}

## Acceptance

\`\`\`json
${JSON.stringify(acceptance.byResult, null, 2)}
\`\`\`

## Constraints honored

- No crawl
- No CDSS send
- No exclusion activation
- No production / Supabase writes
- California unpublished
`;

writeFileSync(join(args.outDir, "phase25-rehearsal-report.md"), markdown);

console.log(JSON.stringify({
  outDir: args.outDir,
  gate: summary.gate,
  stopGo: summary.stopGo,
  allowsPublication: summary.allowsPublication,
  unpublishedLeakPossibleCount: summary.unpublishedLeakPossibleCount,
  eligibilityMatches: summary.eligibilityMatches,
  sourceAllPass: summary.sourceAllPass,
  qualityAllPass: summary.qualityAllPass,
}, null, 2));

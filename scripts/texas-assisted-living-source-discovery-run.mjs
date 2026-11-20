#!/usr/bin/env node
/**
 * Read-only Texas assisted-living source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/texas-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Texas. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateTexasSourceVerification,
  texasDirectoryReady,
} from "../lib/texas-source-verification.ts";
import { evaluateTexasSampleQuality } from "../lib/texas-sample-quality.ts";
import { evaluateTexasDisclosureInvestigation } from "../lib/texas-disclosure-investigation.ts";
import { buildTexasEligibilityMatrix } from "../lib/texas-eligibility-matrix.ts";
import { evaluateTexasInvestigationQuality } from "../lib/texas-investigation-quality.ts";
import {
  evaluateTexasInvestigationReadiness,
  TEXAS_INVESTIGATION_STOP_GO,
  texasInvestigationAllowsPublication,
} from "../lib/texas-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "texas-investigation-out" };
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

const source = evaluateTexasSourceVerification();
const sample = evaluateTexasSampleQuality();
const disclosure = evaluateTexasDisclosureInvestigation();
const matrix = buildTexasEligibilityMatrix();
const quality = evaluateTexasInvestigationQuality({
  rows: source.current.workbook.rows,
  typeA: source.current.workbook.serviceType["TYPE A"],
  typeB: source.current.workbook.serviceType["TYPE B"],
  typeC: source.current.workbook.serviceType["TYPE C"],
  sampleRows: sample.result.rowsSampled,
  geoPairs: source.current.workbook.geoPairs,
  geoCommaOnly: source.current.workbook.geoCommaOnly,
  closureOverlap: source.current.closures.overlapExactWithActiveWorkbook,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinatesClaimedAsLicensing: source.current.workbook.coordinatesAreLicensingCoordinates,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateTexasInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: texasInvestigationAllowsPublication(),
  texasDirectoryReady: texasDirectoryReady(),
  directoryPublication: directoryContract("Texas")?.publication ?? null,
  directoryHref: directoryHref("Texas", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Texas"),
  rows: source.current.workbook.rows,
  typeA: source.current.workbook.serviceType["TYPE A"],
  typeB: source.current.workbook.serviceType["TYPE B"],
  typeC: source.current.workbook.serviceType["TYPE C"],
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinatesAreLicensing: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: TEXAS_INVESTIGATION_STOP_GO,
  mostActionableNextStep: TEXAS_INVESTIGATION_STOP_GO.mostActionableNextStep,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "sample-quality.json"), `${JSON.stringify(sample, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Texas assisted-living source discovery

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## Summary

- Active ALF workbook rows: **${source.current.workbook.rows}**  
- Type A / B / C: **${source.current.workbook.serviceType["TYPE A"]} / ${source.current.workbook.serviceType["TYPE B"]} / ${source.current.workbook.serviceType["TYPE C"]}**  
- As-of label: **${source.current.workbook.activeAsOfLabel}** (not ISO export)  
- Disclosure prefix verified: **${disclosure.disclosurePrefixVerified}**  
- Publication eligible: **0**  
- Owner claims: **disabled**  

## Most actionable next step

${TEXAS_INVESTIGATION_STOP_GO.mostActionableNextStep}

## Blockers

${readiness.blockers.map((b) => `- ${b}`).join("\n")}
`;

writeFileSync(join(args.outDir, "texas-investigation-report.md"), markdown);
console.log(JSON.stringify(summary, null, 2));

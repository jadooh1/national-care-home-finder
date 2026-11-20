#!/usr/bin/env node
/**
 * Read-only Arizona care-home source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/arizona-care-home-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Arizona. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateArizonaSourceVerification,
  arizonaDirectoryReady,
} from "../lib/arizona-source-verification.ts";
import { evaluateArizonaSampleQuality } from "../lib/arizona-sample-quality.ts";
import { evaluateArizonaDisclosureInvestigation } from "../lib/arizona-disclosure-investigation.ts";
import { buildArizonaEligibilityMatrix } from "../lib/arizona-eligibility-matrix.ts";
import { evaluateArizonaInvestigationQuality } from "../lib/arizona-investigation-quality.ts";
import {
  evaluateArizonaInvestigationReadiness,
  ARIZONA_INVESTIGATION_STOP_GO,
  arizonaInvestigationAllowsPublication,
} from "../lib/arizona-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "arizona-investigation-out" };
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

const source = evaluateArizonaSourceVerification();
const sample = evaluateArizonaSampleQuality();
const disclosure = evaluateArizonaDisclosureInvestigation();
const matrix = buildArizonaEligibilityMatrix();
const quality = evaluateArizonaInvestigationQuality({
  homeRows: source.current.assistedLivingHome.rows,
  centerRows: source.current.assistedLivingCenter.rows,
  facidOverlap: source.current.facidOverlapHomeCenter,
  sampleRows: sample.result.rowsSampled,
  homeCapacityMax: source.current.assistedLivingHome.capacityMax,
  centerCapacityMin: source.current.assistedLivingCenter.capacityMin,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinatesClaimedAsLicensing: source.current.gis.coordinatesAreLicensingCoordinates,
  statewideCrawl: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateArizonaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: arizonaInvestigationAllowsPublication(),
  arizonaDirectoryReady: arizonaDirectoryReady(),
  directoryPublication: directoryContract("Arizona")?.publication ?? null,
  directoryHref: directoryHref("Arizona", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Arizona"),
  homeRows: source.current.assistedLivingHome.rows,
  centerRows: source.current.assistedLivingCenter.rows,
  combinedRows: source.current.combinedHomeCenterRows,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinatesAreLicensing: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: ARIZONA_INVESTIGATION_STOP_GO,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "sample-quality.json"), `${JSON.stringify(sample, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Arizona care-home source discovery

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## Summary

- Assisted Living Home: **${source.current.assistedLivingHome.rows}** (capacity ≤10)  
- Assisted Living Center: **${source.current.assistedLivingCenter.rows}** (capacity ≥13)  
- Combined: **${source.current.combinedHomeCenterRows}**  
- Bounded sample rows: **${sample.result.rowsSampled}**  
- Disclosure prefix verified: **${disclosure.disclosurePrefixVerified}**  
- Export date: **null**  
- Coordinates are licensing coords: **false**  
- Publication eligible: **0**  
- Owner claims: **disabled**  
- Arizona directory ready: **${arizonaDirectoryReady()}**  

## Blockers

${readiness.blockers.map((b) => `- ${b}`).join("\n")}
`;

writeFileSync(join(args.outDir, "arizona-investigation-report.md"), markdown);
console.log(JSON.stringify(summary, null, 2));

#!/usr/bin/env node
/**
 * Read-only Colorado care-home source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/colorado-care-home-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Colorado. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateColoradoSourceVerification,
  coloradoDirectoryReady,
} from "../lib/colorado-source-verification.ts";
import { evaluateColoradoSampleQuality } from "../lib/colorado-sample-quality.ts";
import { evaluateColoradoDisclosureInvestigation } from "../lib/colorado-disclosure-investigation.ts";
import { buildColoradoEligibilityMatrix } from "../lib/colorado-eligibility-matrix.ts";
import { evaluateColoradoInvestigationQuality } from "../lib/colorado-investigation-quality.ts";
import {
  evaluateColoradoInvestigationReadiness,
  COLORADO_INVESTIGATION_STOP_GO,
  coloradoInvestigationAllowsPublication,
} from "../lib/colorado-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "colorado-investigation-out" };
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

const source = evaluateColoradoSourceVerification();
const sample = evaluateColoradoSampleQuality();
const disclosure = evaluateColoradoDisclosureInvestigation();
const matrix = buildColoradoEligibilityMatrix();
const quality = evaluateColoradoInvestigationQuality({
  alrRows: source.current.assistedLivingResidence.rows,
  uniqueFacilityIds: source.current.assistedLivingResidence.uniqueFacilityIds,
  sampleRows: sample.result.rowsSampled,
  blankAddress: source.current.assistedLivingResidence.blankAddress,
  zeroBeds: source.current.assistedLivingResidence.zeroBeds,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinatesClaimedAsLicensing:
    source.current.featureServer.coordinatesAreLicensingCoordinates,
  statewideCrawl: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateColoradoInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: coloradoInvestigationAllowsPublication(),
  coloradoDirectoryReady: coloradoDirectoryReady(),
  directoryPublication: directoryContract("Colorado")?.publication ?? null,
  directoryHref: directoryHref("Colorado", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Colorado"),
  alrRows: source.current.assistedLivingResidence.rows,
  layerRows: source.current.featureServer.totalLayerRows,
  sampleRows: sample.result.rowsSampled,
  zeroBeds: source.current.assistedLivingResidence.zeroBeds,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinatesAreLicensing: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: COLORADO_INVESTIGATION_STOP_GO,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "sample-quality.json"), `${JSON.stringify(sample, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Colorado care-home source discovery

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## Summary

- CDPHE FeatureServer ALR filter: **${source.current.assistedLivingResidence.rows}** rows  
- Layer total (mixed types): **${source.current.featureServer.totalLayerRows}**  
- Bounded sample rows: **${sample.result.rowsSampled}**  
- Disclosure prefix verified: **${disclosure.disclosurePrefixVerified}**  
- Export date: **null** (portal clocks rejected)  
- Coordinates are licensing coords: **false** (address geocode)  
- Publication eligible: **0**  
- Owner claims: **disabled**  
- Colorado directory ready: **${coloradoDirectoryReady()}**  
- Quality gate: **${quality.allPass ? "pass (blocked)" : "failed-closed"}**

## Blockers

${readiness.blockers.map((b) => `- ${b}`).join("\n")}

## Future approvals

${readiness.futureApprovals.map((a) => `- ${a}`).join("\n")}
`;

writeFileSync(join(args.outDir, "colorado-investigation-report.md"), markdown);
console.log(JSON.stringify(summary, null, 2));

#!/usr/bin/env node
/**
 * Read-only New Jersey assisted living source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/new-jersey-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish New Jersey. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateNewJerseySourceVerification,
  newJerseyDirectoryReady,
} from "../lib/new-jersey-source-verification.ts";
import { evaluateNewJerseySampleQuality } from "../lib/new-jersey-sample-quality.ts";
import { evaluateNewJerseyDisclosureInvestigation } from "../lib/new-jersey-disclosure-investigation.ts";
import { buildNewJerseyEligibilityMatrix } from "../lib/new-jersey-eligibility-matrix.ts";
import { evaluateNewJerseyInvestigationQuality } from "../lib/new-jersey-investigation-quality.ts";
import {
  evaluateNewJerseyInvestigationReadiness,
  NEW_JERSEY_INVESTIGATION_STOP_GO,
  newJerseyInvestigationAllowsPublication,
} from "../lib/new-jersey-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "new-jersey-investigation-out" };
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

const source = evaluateNewJerseySourceVerification();
const sample = evaluateNewJerseySampleQuality();
const disclosure = evaluateNewJerseyDisclosureInvestigation();
const matrix = buildNewJerseyEligibilityMatrix();
const quality = evaluateNewJerseyInvestigationQuality({
  alrRows: source.current.assistedLivingResidence.rows,
  cpchRows: source.current.comprehensivePersonalCareHome.rows,
  alpRows: source.current.assistedLivingProgram.rows,
  combinedRows: source.current.combined.rows,
  sampleRows: sample.result.rowsSampled,
  facIdOverlapAcrossTypes: source.current.combined.facIdOverlapAcrossTypes,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  alpBedsAllZero: source.current.assistedLivingProgram.bedsZero === 17,
  coordinatesAreLicensingCoordinates:
    source.current.combined.coordinatesAreLicensingCoordinates,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateNewJerseyInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: newJerseyInvestigationAllowsPublication(),
  newJerseyDirectoryReady: newJerseyDirectoryReady(),
  directoryPublication: directoryContract("New Jersey")?.publication ?? null,
  directoryHref: directoryHref("New Jersey", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("New Jersey"),
  alrRows: source.current.assistedLivingResidence.rows,
  cpchRows: source.current.comprehensivePersonalCareHome.rows,
  alpRows: source.current.assistedLivingProgram.rows,
  combinedRows: source.current.combined.rows,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: true,
  coordinatesAreLicensingCoordinates: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: NEW_JERSEY_INVESTIGATION_STOP_GO,
  mostActionableNextStep: NEW_JERSEY_INVESTIGATION_STOP_GO.mostActionableNextStep,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "sample-quality.json"), `${JSON.stringify(sample, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
writeFileSync(join(args.outDir, "investigation-quality.json"), `${JSON.stringify(quality, null, 2)}\n`);
writeFileSync(join(args.outDir, "investigation-readiness.json"), `${JSON.stringify(readiness, null, 2)}\n`);

console.log(JSON.stringify({
  stopGo: summary.stopGo,
  alrRows: summary.alrRows,
  cpchRows: summary.cpchRows,
  alpRows: summary.alpRows,
  combinedRows: summary.combinedRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

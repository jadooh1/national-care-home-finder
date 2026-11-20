#!/usr/bin/env node
/**
 * Read-only Virginia assisted living source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/virginia-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Virginia. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateVirginiaSourceVerification,
  virginiaDirectoryReady,
} from "../lib/virginia-source-verification.ts";
import { evaluateVirginiaSampleQuality } from "../lib/virginia-sample-quality.ts";
import { evaluateVirginiaDisclosureInvestigation } from "../lib/virginia-disclosure-investigation.ts";
import { buildVirginiaEligibilityMatrix } from "../lib/virginia-eligibility-matrix.ts";
import { evaluateVirginiaInvestigationQuality } from "../lib/virginia-investigation-quality.ts";
import {
  evaluateVirginiaInvestigationReadiness,
  VIRGINIA_INVESTIGATION_STOP_GO,
  virginiaInvestigationAllowsPublication,
} from "../lib/virginia-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "virginia-investigation-out" };
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

const source = evaluateVirginiaSourceVerification();
const sample = evaluateVirginiaSampleQuality();
const disclosure = evaluateVirginiaDisclosureInvestigation();
const matrix = buildVirginiaEligibilityMatrix();
const quality = evaluateVirginiaInvestigationQuality({
  uniqueLicenseId: source.current.assistedLiving.uniqueLicenseId,
  listTotalReported: source.current.alfSearch.listTotalReported,
  sampleRows: sample.result.rowsSampled,
  duplicateLicenseIdRows: source.current.alfSearch.duplicateLicenseIdRows,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  capacityOnList: source.current.assistedLiving.capacityOnList,
  coordinateColumnsPresent: source.current.assistedLiving.coordinateColumns,
  statewideCrawl: false,
  automaticGeocoding: false,
  sampleCapacityExtrapolatedStatewide: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateVirginiaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: virginiaInvestigationAllowsPublication(),
  virginiaDirectoryReady: virginiaDirectoryReady(),
  directoryPublication: directoryContract("Virginia")?.publication ?? null,
  directoryHref: directoryHref("Virginia", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Virginia"),
  uniqueLicenseId: source.current.assistedLiving.uniqueLicenseId,
  listTotalReported: source.current.alfSearch.listTotalReported,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: VIRGINIA_INVESTIGATION_STOP_GO,
  mostActionableNextStep: VIRGINIA_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  uniqueLicenseId: summary.uniqueLicenseId,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

#!/usr/bin/env node
/**
 * Read-only Maryland assisted living program source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/maryland-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Maryland. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateMarylandSourceVerification,
  marylandDirectoryReady,
} from "../lib/maryland-source-verification.ts";
import { evaluateMarylandSampleQuality } from "../lib/maryland-sample-quality.ts";
import { evaluateMarylandDisclosureInvestigation } from "../lib/maryland-disclosure-investigation.ts";
import { buildMarylandEligibilityMatrix } from "../lib/maryland-eligibility-matrix.ts";
import { evaluateMarylandInvestigationQuality } from "../lib/maryland-investigation-quality.ts";
import {
  evaluateMarylandInvestigationReadiness,
  MARYLAND_INVESTIGATION_STOP_GO,
  marylandInvestigationAllowsPublication,
} from "../lib/maryland-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "maryland-investigation-out" };
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

const source = evaluateMarylandSourceVerification();
const sample = evaluateMarylandSampleQuality();
const disclosure = evaluateMarylandDisclosureInvestigation();
const matrix = buildMarylandEligibilityMatrix();
const quality = evaluateMarylandInvestigationQuality({
  excelRows: source.current.assistedLivingExcel.rows,
  uniqueLicenseNumber: source.current.assistedLivingExcel.uniqueLicenseNumber,
  sampleRows: sample.result.rowsSampled,
  duplicateLicenseGroups: source.current.assistedLivingExcel.duplicateLicenseGroups,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  perRowStatusColumn: source.current.assistedLivingExcel.perRowStatusColumn,
  coordinateColumnsPresent: source.current.assistedLivingExcel.coordinateColumns,
  openDataAcceptedAsAuthoritativeLicensingRoster:
    source.current.openDataImap.acceptedAsAuthoritativeLicensingRoster,
  openDataCoordinatesAreLicensingCoordinates:
    source.current.openDataImap.coordinatesAreLicensingCoordinates,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateMarylandInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: marylandInvestigationAllowsPublication(),
  marylandDirectoryReady: marylandDirectoryReady(),
  directoryPublication: directoryContract("Maryland")?.publication ?? null,
  directoryHref: directoryHref("Maryland", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Maryland"),
  excelRows: source.current.assistedLivingExcel.rows,
  uniqueLicenseNumber: source.current.assistedLivingExcel.uniqueLicenseNumber,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: MARYLAND_INVESTIGATION_STOP_GO,
  mostActionableNextStep: MARYLAND_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  excelRows: summary.excelRows,
  uniqueLicenseNumber: summary.uniqueLicenseNumber,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

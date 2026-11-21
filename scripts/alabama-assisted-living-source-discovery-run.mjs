#!/usr/bin/env node
/**
 * Read-only Alabama assisted living facility source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/alabama-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Alabama. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateAlabamaSourceVerification,
  alabamaDirectoryReady,
} from "../lib/alabama-source-verification.ts";
import { evaluateAlabamaSampleQuality } from "../lib/alabama-sample-quality.ts";
import { evaluateAlabamaDisclosureInvestigation } from "../lib/alabama-disclosure-investigation.ts";
import { buildAlabamaEligibilityMatrix } from "../lib/alabama-eligibility-matrix.ts";
import { evaluateAlabamaInvestigationQuality } from "../lib/alabama-investigation-quality.ts";
import {
  evaluateAlabamaInvestigationReadiness,
  ALABAMA_INVESTIGATION_STOP_GO,
  alabamaInvestigationAllowsPublication,
} from "../lib/alabama-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "alabama-investigation-out" };
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

const source = evaluateAlabamaSourceVerification();
const sample = evaluateAlabamaSampleQuality();
const disclosure = evaluateAlabamaDisclosureInvestigation();
const matrix = buildAlabamaEligibilityMatrix();
const quality = evaluateAlabamaInvestigationQuality({
  alfRows: source.current.facilitiesDirectory.alf.rows,
  scalfRows: source.current.facilitiesDirectory.scalf.rows,
  combinedRows: source.current.facilitiesDirectory.combinedRows,
  sampleRows: sample.result.rowsSampled,
  dupFacIdGroups: source.current.facilitiesDirectory.dupFacIdGroups,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  nursingMergedIntoAlfScalf: source.current.peerTypes.adoptedAsAlfOrScalfRoster,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: source.current.facilitiesDirectory.recordedExportDate != null,
  coordinateColumnsPresent: source.current.facilitiesDirectory.coordinateColumns,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateAlabamaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: alabamaInvestigationAllowsPublication(),
  alabamaDirectoryReady: alabamaDirectoryReady(),
  directoryPublication: directoryContract("Alabama")?.publication ?? null,
  directoryHref: directoryHref("Alabama", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Alabama"),
  alfRows: source.current.facilitiesDirectory.alf.rows,
  scalfRows: source.current.facilitiesDirectory.scalf.rows,
  combinedRows: source.current.facilitiesDirectory.combinedRows,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: ALABAMA_INVESTIGATION_STOP_GO,
  mostActionableNextStep: ALABAMA_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  alfRows: summary.alfRows,
  scalfRows: summary.scalfRows,
  combinedRows: summary.combinedRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

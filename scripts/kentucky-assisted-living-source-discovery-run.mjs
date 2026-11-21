#!/usr/bin/env node
/**
 * Read-only Kentucky assisted living community source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/kentucky-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Kentucky. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateKentuckySourceVerification,
  kentuckyDirectoryReady,
} from "../lib/kentucky-source-verification.ts";
import { evaluateKentuckySampleQuality } from "../lib/kentucky-sample-quality.ts";
import { evaluateKentuckyDisclosureInvestigation } from "../lib/kentucky-disclosure-investigation.ts";
import { buildKentuckyEligibilityMatrix } from "../lib/kentucky-eligibility-matrix.ts";
import { evaluateKentuckyInvestigationQuality } from "../lib/kentucky-investigation-quality.ts";
import {
  evaluateKentuckyInvestigationReadiness,
  KENTUCKY_INVESTIGATION_STOP_GO,
  kentuckyInvestigationAllowsPublication,
} from "../lib/kentucky-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "kentucky-investigation-out" };
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

const source = evaluateKentuckySourceVerification();
const sample = evaluateKentuckySampleQuality();
const disclosure = evaluateKentuckyDisclosureInvestigation();
const matrix = buildKentuckyEligibilityMatrix();
const quality = evaluateKentuckyInvestigationQuality({
  directoryTypeRows: source.current.alcDirectory.directoryTypeRows,
  uniqueLicenseNbr: source.current.alcDirectory.uniqueLicenseNbr,
  blankLicense: source.current.alcDirectory.blankLicense,
  dupLicenseGroups: source.current.alcDirectory.dupLicenseGroups,
  sampleRows: sample.result.rowsSampled,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  peerDirectoriesMergedIntoAlc: source.current.peerDirectories.adoptedAsAlcRoster,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: source.current.alcDirectory.recordedExportDate != null,
  coordinateColumnsPresent: source.current.alcDirectory.coordinateColumns,
  pendingRenewalTreatedAsOperatingStatus: false,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateKentuckyInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: kentuckyInvestigationAllowsPublication(),
  kentuckyDirectoryReady: kentuckyDirectoryReady(),
  directoryPublication: directoryContract("Kentucky")?.publication ?? null,
  directoryHref: directoryHref("Kentucky", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Kentucky"),
  directoryTypeRows: source.current.alcDirectory.directoryTypeRows,
  uniqueLicenseNbr: source.current.alcDirectory.uniqueLicenseNbr,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: KENTUCKY_INVESTIGATION_STOP_GO,
  mostActionableNextStep: KENTUCKY_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  directoryTypeRows: summary.directoryTypeRows,
  uniqueLicenseNbr: summary.uniqueLicenseNbr,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

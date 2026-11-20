#!/usr/bin/env node
/**
 * Read-only South Carolina Community Residential Care Facility source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/south-carolina-crcf-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish South Carolina. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateSouthCarolinaSourceVerification,
  southCarolinaDirectoryReady,
} from "../lib/south-carolina-source-verification.ts";
import { evaluateSouthCarolinaSampleQuality } from "../lib/south-carolina-sample-quality.ts";
import { evaluateSouthCarolinaDisclosureInvestigation } from "../lib/south-carolina-disclosure-investigation.ts";
import { buildSouthCarolinaEligibilityMatrix } from "../lib/south-carolina-eligibility-matrix.ts";
import { evaluateSouthCarolinaInvestigationQuality } from "../lib/south-carolina-investigation-quality.ts";
import {
  evaluateSouthCarolinaInvestigationReadiness,
  SOUTH_CAROLINA_INVESTIGATION_STOP_GO,
  southCarolinaInvestigationAllowsPublication,
} from "../lib/south-carolina-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "south-carolina-investigation-out" };
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

const source = evaluateSouthCarolinaSourceVerification();
const sample = evaluateSouthCarolinaSampleQuality();
const disclosure = evaluateSouthCarolinaDisclosureInvestigation();
const matrix = buildSouthCarolinaEligibilityMatrix();
const quality = evaluateSouthCarolinaInvestigationQuality({
  crcfRows: source.current.crcfLayer.rows,
  actRows: source.current.crcfLayer.permitOperatingCodeCounts.ACT,
  sampleRows: sample.result.rowsSampled,
  dupLicenseGroups: source.current.crcfLayer.dupLicenseGroups,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  nursingOrIcfMergedIntoCrcf: source.current.peerTypes.adoptedAsCrcfRoster,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: source.current.crcfLayer.recordedExportDate != null,
  coordinatesAcceptedAsLicensing:
    source.current.crcfLayer.coordinatesAcceptedAsLicensingCoordinates,
  crcBedsConflictIgnored: false,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateSouthCarolinaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: southCarolinaInvestigationAllowsPublication(),
  southCarolinaDirectoryReady: southCarolinaDirectoryReady(),
  directoryPublication: directoryContract("South Carolina")?.publication ?? null,
  directoryHref: directoryHref("South Carolina", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("South Carolina"),
  crcfRows: source.current.crcfLayer.rows,
  actRows: source.current.crcfLayer.permitOperatingCodeCounts.ACT,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: true,
  coordinatesAcceptedAsLicensingCoordinates: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: SOUTH_CAROLINA_INVESTIGATION_STOP_GO,
  mostActionableNextStep: SOUTH_CAROLINA_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  crcfRows: summary.crcfRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

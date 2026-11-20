#!/usr/bin/env node
/**
 * Read-only North Carolina care-home source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/north-carolina-care-home-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish North Carolina. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateNorthCarolinaSourceVerification } from "../lib/north-carolina-source-verification.ts";
import { evaluateNorthCarolinaSampleQuality } from "../lib/north-carolina-sample-quality.ts";
import { evaluateNorthCarolinaDisclosureInvestigation } from "../lib/north-carolina-disclosure-investigation.ts";
import { buildNorthCarolinaEligibilityMatrix } from "../lib/north-carolina-eligibility-matrix.ts";
import { evaluateNorthCarolinaInvestigationQuality } from "../lib/north-carolina-investigation-quality.ts";
import {
  evaluateNorthCarolinaInvestigationReadiness,
  NORTH_CAROLINA_INVESTIGATION_STOP_GO,
  northCarolinaInvestigationAllowsPublication,
} from "../lib/north-carolina-investigation-readiness.ts";
import { northCarolinaDirectoryReady } from "../lib/north-carolina-onboarding.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "north-carolina-investigation-out" };
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

const source = evaluateNorthCarolinaSourceVerification();
const sample = evaluateNorthCarolinaSampleQuality();
const disclosure = evaluateNorthCarolinaDisclosureInvestigation();
const matrix = buildNorthCarolinaEligibilityMatrix();
const quality = evaluateNorthCarolinaInvestigationQuality({
  adultRows: source.current.adult.licensedRows,
  familyRows: source.current.family.licensedRows,
  uniqueLicenses: source.current.combined.uniqueLicenses,
  blankRows: source.current.combined.blankRows,
  licenseOverlap: source.current.combined.licenseOverlap,
  sampleRows: sample.result.rowsSampled,
  identicalMailing: source.current.combined.identicalMailing,
  distinctMailing: source.current.combined.distinctMailing,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinateColumnsPresent: source.current.adult.coordinateColumns,
  perRowStatusPresent: source.current.adult.perRowStatusColumn,
  staleFchTxtAcceptedAsCurrent: !source.current.staleFchTxt.rejectedAsCurrentLicensingSource,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateNorthCarolinaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: northCarolinaInvestigationAllowsPublication(),
  northCarolinaDirectoryReady: northCarolinaDirectoryReady(),
  directoryPublication: directoryContract("North Carolina")?.publication ?? null,
  directoryHref: directoryHref("North Carolina", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("North Carolina"),
  adultRows: source.current.adult.licensedRows,
  familyRows: source.current.family.licensedRows,
  uniqueLicenses: source.current.combined.uniqueLicenses,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinatesPresent: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: NORTH_CAROLINA_INVESTIGATION_STOP_GO,
  mostActionableNextStep: NORTH_CAROLINA_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  uniqueLicenses: summary.uniqueLicenses,
  adultRows: summary.adultRows,
  familyRows: summary.familyRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

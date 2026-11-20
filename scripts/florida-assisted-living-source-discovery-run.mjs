#!/usr/bin/env node
/**
 * Read-only Florida assisted-living source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/florida-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Florida. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateFloridaSourceVerification,
  floridaDirectoryReady,
} from "../lib/florida-source-verification.ts";
import { evaluateFloridaSampleQuality } from "../lib/florida-sample-quality.ts";
import { evaluateFloridaDisclosureInvestigation } from "../lib/florida-disclosure-investigation.ts";
import { buildFloridaEligibilityMatrix } from "../lib/florida-eligibility-matrix.ts";
import { evaluateFloridaInvestigationQuality } from "../lib/florida-investigation-quality.ts";
import {
  evaluateFloridaInvestigationReadiness,
  FLORIDA_INVESTIGATION_STOP_GO,
  floridaInvestigationAllowsPublication,
} from "../lib/florida-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "florida-investigation-out" };
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

const source = evaluateFloridaSourceVerification();
const sample = evaluateFloridaSampleQuality();
const disclosure = evaluateFloridaDisclosureInvestigation();
const matrix = buildFloridaEligibilityMatrix();
const status = source.current.alf.licenseStatus;
const quality = evaluateFloridaInvestigationQuality({
  rows: source.current.alf.rows,
  licensed: status.LICENSED,
  inReview: status["IN REVIEW"],
  provisional: status.PROVISIONAL,
  inLitigation: status["IN LITIGATION"],
  provLitigation: status["PROV LITIGATION"],
  inactive: status.INACTIVE,
  pendingDeniedRenewal: status["PENDING DENIED RENEWAL"],
  suspended: status.SUSPENDED,
  sampleRows: sample.result.rowsSampled,
  coordinatePairs: source.current.alf.coordinatePairs,
  afchRows: source.current.afch.rows,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinatesClaimedAsLicensing: source.current.alf.coordinatesAreLicensingCoordinates,
  dohGisAcceptedAsCurrent: !source.current.dohGis2013.rejectedAsCurrentLicensingSource,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateFloridaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: floridaInvestigationAllowsPublication(),
  floridaDirectoryReady: floridaDirectoryReady(),
  directoryPublication: directoryContract("Florida")?.publication ?? null,
  directoryHref: directoryHref("Florida", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Florida"),
  rows: source.current.alf.rows,
  licenseStatus: status,
  afchRows: source.current.afch.rows,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  inspectionPrefixVerified: disclosure.inspectionPrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinatesAreLicensing: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: FLORIDA_INVESTIGATION_STOP_GO,
  mostActionableNextStep: FLORIDA_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  rows: summary.rows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

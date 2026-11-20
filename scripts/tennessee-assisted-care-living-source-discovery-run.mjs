#!/usr/bin/env node
/**
 * Read-only Tennessee assisted-care living facility source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/tennessee-assisted-care-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Tennessee. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateTennesseeSourceVerification,
  tennesseeDirectoryReady,
} from "../lib/tennessee-source-verification.ts";
import { evaluateTennesseeSampleQuality } from "../lib/tennessee-sample-quality.ts";
import { evaluateTennesseeDisclosureInvestigation } from "../lib/tennessee-disclosure-investigation.ts";
import { buildTennesseeEligibilityMatrix } from "../lib/tennessee-eligibility-matrix.ts";
import { evaluateTennesseeInvestigationQuality } from "../lib/tennessee-investigation-quality.ts";
import {
  evaluateTennesseeInvestigationReadiness,
  TENNESSEE_INVESTIGATION_STOP_GO,
  tennesseeInvestigationAllowsPublication,
} from "../lib/tennessee-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "tennessee-investigation-out" };
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

const source = evaluateTennesseeSourceVerification();
const sample = evaluateTennesseeSampleQuality();
const disclosure = evaluateTennesseeDisclosureInvestigation();
const matrix = buildTennesseeEligibilityMatrix();
const quality = evaluateTennesseeInvestigationQuality({
  aclfRows: source.current.aclfFullBedsReport.rows,
  licensedRows: source.current.aclfFullBedsReport.statusCounts.Licensed,
  sampleRows: sample.result.rowsSampled,
  dupLicGroups: source.current.aclfFullBedsReport.dupLicGroups,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: source.current.aclfFullBedsReport.recordedExportDate != null,
  coordinateColumnsPresent: source.current.aclfFullBedsReport.coordinateColumns,
  rhaAdoptedAsAclfRoster: source.current.residentialHomeForAged.adoptedAsAclfRoster,
  rhaUndatedPdfAcceptedAsCurrent:
    source.current.residentialHomeForAged.undatedPdfAcceptedAsCurrentOctober2026Roster,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateTennesseeInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: tennesseeInvestigationAllowsPublication(),
  tennesseeDirectoryReady: tennesseeDirectoryReady(),
  directoryPublication: directoryContract("Tennessee")?.publication ?? null,
  directoryHref: directoryHref("Tennessee", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Tennessee"),
  aclfRows: source.current.aclfFullBedsReport.rows,
  licensedRows: source.current.aclfFullBedsReport.statusCounts.Licensed,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: TENNESSEE_INVESTIGATION_STOP_GO,
  mostActionableNextStep: TENNESSEE_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  aclfRows: summary.aclfRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

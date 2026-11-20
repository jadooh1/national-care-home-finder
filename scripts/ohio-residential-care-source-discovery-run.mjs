#!/usr/bin/env node
/**
 * Read-only Ohio residential care source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/ohio-residential-care-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Ohio. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateOhioSourceVerification,
  ohioDirectoryReady,
} from "../lib/ohio-source-verification.ts";
import { evaluateOhioSampleQuality } from "../lib/ohio-sample-quality.ts";
import { evaluateOhioDisclosureInvestigation } from "../lib/ohio-disclosure-investigation.ts";
import { buildOhioEligibilityMatrix } from "../lib/ohio-eligibility-matrix.ts";
import { evaluateOhioInvestigationQuality } from "../lib/ohio-investigation-quality.ts";
import {
  evaluateOhioInvestigationReadiness,
  OHIO_INVESTIGATION_STOP_GO,
  ohioInvestigationAllowsPublication,
} from "../lib/ohio-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "ohio-investigation-out" };
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

const source = evaluateOhioSourceVerification();
const sample = evaluateOhioSampleQuality();
const disclosure = evaluateOhioDisclosureInvestigation();
const matrix = buildOhioEligibilityMatrix();
const quality = evaluateOhioInvestigationQuality({
  l12Rows: source.current.residentialCare.l12Rows,
  activeRows: source.current.residentialCare.activeCount,
  sampleRows: sample.result.rowsSampled,
  facidDuplicates: source.current.residentialCare.facidDuplicates,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinateColumnsPresent: source.current.residentialCare.coordinateColumns,
  arcgisAcceptedAsAuthoritativeExport:
    source.current.arcgisDerivative.acceptedAsAuthoritativeExport,
  programApproxAcceptedAsRosterCount: source.current.programPage.acceptedAsRosterCount,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateOhioInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: ohioInvestigationAllowsPublication(),
  ohioDirectoryReady: ohioDirectoryReady(),
  directoryPublication: directoryContract("Ohio")?.publication ?? null,
  directoryHref: directoryHref("Ohio", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Ohio"),
  l12Rows: source.current.residentialCare.l12Rows,
  activeRows: source.current.residentialCare.activeCount,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: OHIO_INVESTIGATION_STOP_GO,
  mostActionableNextStep: OHIO_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  l12Rows: summary.l12Rows,
  activeRows: summary.activeRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

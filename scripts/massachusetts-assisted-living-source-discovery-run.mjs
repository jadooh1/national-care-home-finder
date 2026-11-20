#!/usr/bin/env node
/**
 * Read-only Massachusetts assisted living residence source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/massachusetts-assisted-living-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Massachusetts. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateMassachusettsSourceVerification,
  massachusettsDirectoryReady,
} from "../lib/massachusetts-source-verification.ts";
import { evaluateMassachusettsSampleQuality } from "../lib/massachusetts-sample-quality.ts";
import { evaluateMassachusettsDisclosureInvestigation } from "../lib/massachusetts-disclosure-investigation.ts";
import { buildMassachusettsEligibilityMatrix } from "../lib/massachusetts-eligibility-matrix.ts";
import { evaluateMassachusettsInvestigationQuality } from "../lib/massachusetts-investigation-quality.ts";
import {
  evaluateMassachusettsInvestigationReadiness,
  MASSACHUSETTS_INVESTIGATION_STOP_GO,
  massachusettsInvestigationAllowsPublication,
} from "../lib/massachusetts-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "massachusetts-investigation-out" };
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

const source = evaluateMassachusettsSourceVerification();
const sample = evaluateMassachusettsSampleQuality();
const disclosure = evaluateMassachusettsDisclosureInvestigation();
const matrix = buildMassachusettsEligibilityMatrix();
const quality = evaluateMassachusettsInvestigationQuality({
  certifiedUsableRows: source.current.certifiedList.certifiedUsableRows,
  statusAnomalyRows: source.current.certifiedList.statusAnomalyRows,
  sampleRows: sample.result.rowsSampled,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  dphLicenseEquivalenceClaimed: false,
  massHealthAfcEquivalenceClaimed: false,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  certificationIdentifierColumn:
    source.current.certifiedList.certificationIdentifierColumn,
  coordinateColumnsPresent: source.current.certifiedList.coordinateColumns,
  massGisAcceptedAsAuthoritativeRoster: source.current.massGis.acceptedAsAuthoritativeRoster,
  massGisCoordinatesAreLicensingCoordinates:
    source.current.massGis.coordinatesAreLicensingCoordinates,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateMassachusettsInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: massachusettsInvestigationAllowsPublication(),
  massachusettsDirectoryReady: massachusettsDirectoryReady(),
  directoryPublication: directoryContract("Massachusetts")?.publication ?? null,
  directoryHref: directoryHref("Massachusetts", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Massachusetts"),
  certifiedUsableRows: source.current.certifiedList.certifiedUsableRows,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinateColumns: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: MASSACHUSETTS_INVESTIGATION_STOP_GO,
  mostActionableNextStep: MASSACHUSETTS_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  certifiedUsableRows: summary.certifiedUsableRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

#!/usr/bin/env node
/**
 * Read-only Georgia care-home source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/georgia-care-home-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Georgia. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateGeorgiaSourceVerification,
  georgiaDirectoryReady,
} from "../lib/georgia-source-verification.ts";
import { evaluateGeorgiaSampleQuality } from "../lib/georgia-sample-quality.ts";
import { evaluateGeorgiaDisclosureInvestigation } from "../lib/georgia-disclosure-investigation.ts";
import { buildGeorgiaEligibilityMatrix } from "../lib/georgia-eligibility-matrix.ts";
import { evaluateGeorgiaInvestigationQuality } from "../lib/georgia-investigation-quality.ts";
import {
  evaluateGeorgiaInvestigationReadiness,
  GEORGIA_INVESTIGATION_STOP_GO,
  georgiaInvestigationAllowsPublication,
} from "../lib/georgia-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "georgia-investigation-out" };
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

const source = evaluateGeorgiaSourceVerification();
const sample = evaluateGeorgiaSampleQuality();
const disclosure = evaluateGeorgiaDisclosureInvestigation();
const matrix = buildGeorgiaEligibilityMatrix();
const quality = evaluateGeorgiaInvestigationQuality({
  pchRows: source.current.personalCareHome.rows,
  alcRows: source.current.assistedLivingCommunity.rows,
  sampleRows: sample.result.rowsSampled,
  facidOverlap: source.current.combined.facidOverlap,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  coordinatesClaimedAsLicensing: source.current.combined.coordinatesAreLicensingCoordinates,
  regulatedPdfAcceptedAsCurrent: !source.current.regulatedPdf.rejectedAsCurrentLicensingSource,
  statewideCrawl: false,
  automaticGeocoding: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateGeorgiaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: georgiaInvestigationAllowsPublication(),
  georgiaDirectoryReady: georgiaDirectoryReady(),
  directoryPublication: directoryContract("Georgia")?.publication ?? null,
  directoryHref: directoryHref("Georgia", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Georgia"),
  pchRows: source.current.personalCareHome.rows,
  alcRows: source.current.assistedLivingCommunity.rows,
  rows: source.current.combined.rows,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  coordinatesAreLicensing: false,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: GEORGIA_INVESTIGATION_STOP_GO,
  mostActionableNextStep: GEORGIA_INVESTIGATION_STOP_GO.mostActionableNextStep,
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
  pchRows: summary.pchRows,
  alcRows: summary.alcRows,
  disclosurePrefixVerified: summary.disclosurePrefixVerified,
  exportDate: summary.exportDate,
  qualityAllPass: summary.qualityAllPass,
  mostActionableNextStep: summary.mostActionableNextStep,
}, null, 2));

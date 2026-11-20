#!/usr/bin/env node
/**
 * Read-only Minnesota care-home source discovery.
 *
 * Usage:
 *   node --experimental-strip-types scripts/minnesota-care-home-source-discovery-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Minnesota. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateMinnesotaSourceVerification,
  minnesotaDirectoryReady,
} from "../lib/minnesota-source-verification.ts";
import { evaluateMinnesotaSampleQuality } from "../lib/minnesota-sample-quality.ts";
import { evaluateMinnesotaDisclosureInvestigation } from "../lib/minnesota-disclosure-investigation.ts";
import { buildMinnesotaEligibilityMatrix } from "../lib/minnesota-eligibility-matrix.ts";
import { evaluateMinnesotaInvestigationQuality } from "../lib/minnesota-investigation-quality.ts";
import {
  evaluateMinnesotaInvestigationReadiness,
  MINNESOTA_INVESTIGATION_STOP_GO,
  minnesotaInvestigationAllowsPublication,
} from "../lib/minnesota-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "minnesota-investigation-out" };
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

const source = evaluateMinnesotaSourceVerification();
const sample = evaluateMinnesotaSampleQuality();
const disclosure = evaluateMinnesotaDisclosureInvestigation();
const matrix = buildMinnesotaEligibilityMatrix();
const quality = evaluateMinnesotaInvestigationQuality({
  interactiveAvailable: source.current.mdhInteractiveDirectory.interactiveAvailableThisRun,
  facilityLevelRows: source.current.mdhInteractiveDirectory.facilityLevelSampleTaken ? 1 : 0,
  sampleRows: sample.result.rowsSampled,
  annualPdfHasFacilityRows: source.current.mdhAnnualPdf2026.containsFacilityLevelRows,
  washingtonAfhEquivalenceClaimed: source.current.categoryEquivalenceToWashingtonAfh,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
  statewideCrawl: false,
});
const readiness = evaluateMinnesotaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: minnesotaInvestigationAllowsPublication(),
  minnesotaDirectoryReady: minnesotaDirectoryReady(),
  directoryPublication: directoryContract("Minnesota")?.publication ?? null,
  directoryHref: directoryHref("Minnesota", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Minnesota"),
  assistedLivingFacilities: source.current.mdhAnnualPdf2026.classificationsAsOf2026_03_13.assistedLivingFacilities.facilities,
  assistedLivingDementiaCare: source.current.mdhAnnualPdf2026.classificationsAsOf2026_03_13.assistedLivingFacilityDementiaCare.facilities,
  provisionalAssistedLiving: source.current.mdhAnnualPdf2026.classificationsAsOf2026_03_13.provisionalAssistedLivingFacility.facilities,
  interactiveAvailable: source.current.mdhInteractiveDirectory.interactiveAvailableThisRun,
  sampleRows: sample.result.rowsSampled,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  pdfSha256: source.current.mdhAnnualPdf2026.sha256,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: MINNESOTA_INVESTIGATION_STOP_GO,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "sample-quality.json"), `${JSON.stringify(sample, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Minnesota care-home source discovery

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## MDH annual PDF (as of 2026-03-13)

Assisted Living Facilities: ${summary.assistedLivingFacilities}  
Assisted Living Dementia Care: ${summary.assistedLivingDementiaCare}  
Provisional Assisted Living: ${summary.provisionalAssistedLiving}  
Facility-level rows in PDF: no  

## Interactive directory

Available this run: ${summary.interactiveAvailable}  
Facility-level sample rows: ${summary.sampleRows}  

## Policy

- MN Assisted Living ≠ Washington AFH
- No invented identifiers / addresses / coordinates
- Minnesota unpublished; owner claims disabled
`;

writeFileSync(join(args.outDir, "minnesota-investigation-report.md"), markdown);

console.log(JSON.stringify({
  gate: summary.gate,
  stopGo: summary.stopGo,
  assistedLivingFacilities: summary.assistedLivingFacilities,
  interactiveAvailable: summary.interactiveAvailable,
  sampleRows: summary.sampleRows,
  qualityAllPass: summary.qualityAllPass,
  outDir: args.outDir,
}, null, 2));

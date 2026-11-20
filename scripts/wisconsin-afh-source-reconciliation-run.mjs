#!/usr/bin/env node
/**
 * Read-only Wisconsin AFH source reconciliation.
 *
 * Usage:
 *   node --experimental-strip-types scripts/wisconsin-afh-source-reconciliation-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Wisconsin. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateWisconsinSourceVerification, wisconsinDirectoryReady } from "../lib/wisconsin-source-verification.ts";
import { evaluateWisconsinSourceReconciliation } from "../lib/wisconsin-source-reconciliation.ts";
import { evaluateWisconsinDisclosureInvestigation } from "../lib/wisconsin-disclosure-investigation.ts";
import { buildWisconsinEligibilityMatrix } from "../lib/wisconsin-eligibility-matrix.ts";
import { evaluateWisconsinInvestigationQuality } from "../lib/wisconsin-investigation-quality.ts";
import {
  evaluateWisconsinInvestigationReadiness,
  WISCONSIN_INVESTIGATION_STOP_GO,
  wisconsinInvestigationAllowsPublication,
} from "../lib/wisconsin-investigation-readiness.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "wisconsin-investigation-out" };
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

const source = evaluateWisconsinSourceVerification();
const reconciliation = evaluateWisconsinSourceReconciliation();
const disclosure = evaluateWisconsinDisclosureInvestigation();
const matrix = buildWisconsinEligibilityMatrix();
const quality = evaluateWisconsinInvestigationQuality({
  excelRows: reconciliation.ledger.excelRows,
  gisFeatures: reconciliation.ledger.gisFeatures,
  matchedUnique: reconciliation.ledger.matchedUnique,
  matchedAmbiguous: reconciliation.ledger.matchedAmbiguous,
  excelOnly: reconciliation.ledger.excelOnly,
  gisOnlyWithLicense: reconciliation.ledger.gisOnlyWithLicense,
  gisBlankLicense: reconciliation.ledger.gisBlankLicense,
  mailingSubstituted: false,
  gisAcceptedAsDirectory: false,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  exportDatePresent: false,
  publicationEligible: 0,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluateWisconsinInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: wisconsinInvestigationAllowsPublication(),
  wisconsinDirectoryReady: wisconsinDirectoryReady(),
  directoryPublication: directoryContract("Wisconsin")?.publication ?? null,
  directoryHref: directoryHref("Wisconsin", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Wisconsin"),
  priorPdfIds: source.prior.pdfDistinctParentheticalIds,
  priorGisFeatures: source.prior.gisFeatures,
  excelRows: source.current.excel.rows,
  pdfUniqueIds: source.current.pdf.uniqueParentheticalIds,
  gisFeatures: source.current.gis.features,
  matchedUnique: reconciliation.ledger.matchedUnique,
  matchedAmbiguous: reconciliation.ledger.matchedAmbiguous,
  excelOnly: reconciliation.ledger.excelOnly,
  gisOnlyWithLicense: reconciliation.ledger.gisOnlyWithLicense,
  gisBlankLicense: reconciliation.ledger.gisBlankLicense,
  disclosurePrefixVerified: disclosure.disclosurePrefixVerified,
  ownerClaimEligible: false,
  exportDate: null,
  excelSha256: source.current.excel.sha256,
  pdfSha256: source.current.pdf.sha256,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: WISCONSIN_INVESTIGATION_STOP_GO,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "reconciliation.json"), `${JSON.stringify(reconciliation, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Wisconsin AFH source reconciliation

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## Sources

Excel rows: ${summary.excelRows}  
PDF unique IDs: ${summary.pdfUniqueIds} (prior ${summary.priorPdfIds})  
GIS features: ${summary.gisFeatures} (prior ${summary.priorGisFeatures})  

## Reconciliation (Facility ID int == WI_LICENSE_NUM)

Matched unique: ${summary.matchedUnique}  
Matched ambiguous: ${summary.matchedAmbiguous}  
Excel-only: ${summary.excelOnly}  
GIS-only: ${summary.gisOnlyWithLicense}  
GIS blank license: ${summary.gisBlankLicense}  

## Policy

- GIS is not the accepted directory
- Mailing street is not substituted for facility street
- No verified Facility-ID disclosure URL prefix
- Wisconsin unpublished; owner claims disabled
`;

writeFileSync(join(args.outDir, "wisconsin-investigation-report.md"), markdown);

console.log(JSON.stringify({
  gate: summary.gate,
  stopGo: summary.stopGo,
  excelRows: summary.excelRows,
  gisFeatures: summary.gisFeatures,
  matchedUnique: summary.matchedUnique,
  qualityAllPass: summary.qualityAllPass,
  outDir: args.outDir,
}, null, 2));

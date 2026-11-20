#!/usr/bin/env node
/**
 * Read-only Michigan onboarding investigation.
 *
 * Usage:
 *   node --experimental-strip-types scripts/michigan-onboarding-investigation-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Michigan. Does NOT write Supabase/production.
 * Does NOT recrawl California or activate exclusions.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateMichiganSourceVerification } from "../lib/michigan-source-verification.ts";
import { evaluateMichiganAddressExceptions } from "../lib/michigan-address-exceptions.ts";
import { evaluateMichiganExemptInvestigation } from "../lib/michigan-exempt-investigation.ts";
import { buildMichiganEligibilityMatrix } from "../lib/michigan-eligibility-matrix.ts";
import { evaluateMichiganInvestigationQuality } from "../lib/michigan-investigation-quality.ts";
import {
  evaluateMichiganInvestigationReadiness,
  MICHIGAN_INVESTIGATION_STOP_GO,
  michiganInvestigationAllowsPublication,
} from "../lib/michigan-investigation-readiness.ts";
import { michiganDirectoryReady } from "../lib/michigan-licensing.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "michigan-investigation-out" };
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

const source = evaluateMichiganSourceVerification();
const addresses = evaluateMichiganAddressExceptions();
const exempt = evaluateMichiganExemptInvestigation();
const matrix = buildMichiganEligibilityMatrix();
const quality = evaluateMichiganInvestigationQuality({
  rows: source.current.rows,
  blankStreet: source.current.streetBlank,
  usableStreet: source.current.streetLetterAndDigit,
  xhRows: source.current.undescribedXhRows,
  exemptRows: source.current.statuses.EXEMPT,
  supplementalAdoptedAsPhysical: false,
  xhInclusionAuthorized: exempt.inclusionAuthorized,
  publicationEligible: 0,
  ownerClaimEligible: false,
  exportDatePresent: source.current.recordedExportDate != null,
  productionWrites: false,
});
const readiness = evaluateMichiganInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: michiganInvestigationAllowsPublication(),
  michiganDirectoryReady: michiganDirectoryReady(),
  directoryPublication: directoryContract("Michigan")?.publication ?? null,
  directoryHref: directoryHref("Michigan", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Michigan"),
  priorRows: source.prior.rows,
  currentRows: source.current.rows,
  rowDelta: source.comparison.rowDelta,
  blankStreetRows: source.current.streetBlank,
  usableStreetRows: source.current.streetLetterAndDigit,
  xhRows: source.current.undescribedXhRows,
  exemptRows: source.current.statuses.EXEMPT,
  xhInclusionAuthorized: exempt.inclusionAuthorized,
  ownerClaimEligible: false,
  exportDate: null,
  sha256: source.current.sha256,
  lastModified: source.current.lastModified,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: MICHIGAN_INVESTIGATION_STOP_GO,
  californiaRecrawl: false,
  exclusionActivation: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "address-exceptions.json"), `${JSON.stringify(addresses, null, 2)}\n`);
writeFileSync(join(args.outDir, "exempt-investigation.json"), `${JSON.stringify(exempt, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Michigan onboarding investigation

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## Source

Prior rows: ${summary.priorRows}  
Current rows: ${summary.currentRows} (delta ${summary.rowDelta})  
Blank streets: ${summary.blankStreetRows}  
Usable streets: ${summary.usableStreetRows}  
XH/EXEMPT: ${summary.xhRows}  
sha256: ${summary.sha256}  
Last-Modified: ${summary.lastModified} (rejected as export date)

## Policy

- Supplemental / profile Address: not adopted as physical
- XH remains ineligible
- Michigan unpublished; owner claims disabled
`;

writeFileSync(join(args.outDir, "michigan-investigation-report.md"), markdown);

console.log(JSON.stringify({
  outDir: args.outDir,
  gate: summary.gate,
  stopGo: summary.stopGo,
  currentRows: summary.currentRows,
  blankStreetRows: summary.blankStreetRows,
  xhRows: summary.xhRows,
  qualityAllPass: summary.qualityAllPass,
}, null, 2));

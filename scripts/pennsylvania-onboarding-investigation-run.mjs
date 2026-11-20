#!/usr/bin/env node
/**
 * Read-only Pennsylvania onboarding investigation.
 *
 * Usage:
 *   node --experimental-strip-types scripts/pennsylvania-onboarding-investigation-run.mjs \
 *     [--out dir]
 *
 * Does NOT publish Pennsylvania. Does NOT write Supabase/production.
 * Does NOT recrawl California or send CDSS mail.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluatePennsylvaniaAddressExceptions } from "../lib/pennsylvania-address-exceptions.ts";
import { evaluatePennsylvaniaDisclosureInvestigation } from "../lib/pennsylvania-disclosure-investigation.ts";
import { buildPennsylvaniaEligibilityMatrix } from "../lib/pennsylvania-eligibility-matrix.ts";
import { evaluatePennsylvaniaSourceVerification } from "../lib/pennsylvania-source-verification.ts";
import { evaluatePennsylvaniaInvestigationQuality } from "../lib/pennsylvania-investigation-quality.ts";
import {
  evaluatePennsylvaniaInvestigationReadiness,
  PENNSYLVANIA_INVESTIGATION_STOP_GO,
  pennsylvaniaInvestigationAllowsPublication,
} from "../lib/pennsylvania-investigation-readiness.ts";
import { pennsylvaniaDirectoryReady, pennsylvaniaMapReady } from "../lib/pennsylvania-licensing.ts";
import { directoryContract, directoryHref, mapHref } from "../lib/state-directory.ts";

function parseArgs(argv) {
  const args = { outDir: "pennsylvania-investigation-out" };
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

const source = evaluatePennsylvaniaSourceVerification();
const addresses = evaluatePennsylvaniaAddressExceptions();
const disclosure = evaluatePennsylvaniaDisclosureInvestigation();
const matrix = buildPennsylvaniaEligibilityMatrix();
const quality = evaluatePennsylvaniaInvestigationQuality({
  rows: source.verification.rows,
  usableStreetRows: source.verification.usableStreetRows,
  addressExceptions: addresses.summary.total,
  exceptionLedgerSize: addresses.exceptions.length,
  facilitySpecificDisclosures: disclosure.verifiedFacilitySpecificCount,
  publicationEligible: matrix.counts.publicationEligible,
  ownerClaimEligible: false,
  productionWrites: false,
});
const readiness = evaluatePennsylvaniaInvestigationReadiness(quality.allPass);

const summary = {
  observedOn,
  captureTimeUtc,
  gate: "blocked",
  stopGo: "STOP",
  allowsPublication: pennsylvaniaInvestigationAllowsPublication(),
  pennsylvaniaDirectoryReady: pennsylvaniaDirectoryReady(),
  pennsylvaniaMapReady: pennsylvaniaMapReady(),
  directoryPublication: directoryContract("Pennsylvania")?.publication ?? null,
  directoryHref: directoryHref("Pennsylvania", "https://ajjsyloyihcqdomywhik.supabase.co"),
  mapHref: mapHref("Pennsylvania"),
  rows: source.verification.rows,
  usableStreetRows: source.verification.usableStreetRows,
  addressExceptions: addresses.summary.total,
  verifiedFacilitySpecificCount: disclosure.verifiedFacilitySpecificCount,
  ownerClaimEligible: false,
  publicationEligible: 0,
  sha256: source.verification.sha256,
  qualityAllPass: quality.allPass,
  readiness,
  publicationStopGo: PENNSYLVANIA_INVESTIGATION_STOP_GO,
  californiaRecrawl: false,
  cdssFollowUpSent: false,
  productionWrites: false,
};

writeFileSync(join(args.outDir, "live-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(args.outDir, "source-verification.json"), `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(join(args.outDir, "address-exceptions.json"), `${JSON.stringify(addresses, null, 2)}\n`);
writeFileSync(join(args.outDir, "disclosure-investigation.json"), `${JSON.stringify(disclosure, null, 2)}\n`);
writeFileSync(join(args.outDir, "eligibility-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);

const markdown = `# Pennsylvania onboarding investigation

**Observed:** ${observedOn}  
**Gate:** BLOCKED  
**Stop/go:** STOP  

## Source

Rows: ${summary.rows}  
Usable streets: ${summary.usableStreetRows}  
Address exceptions: ${summary.addressExceptions}  
sha256: ${summary.sha256}

## Disclosure

Verified facility-specific links: ${summary.verifiedFacilitySpecificCount}

## Constraints

- Pennsylvania unpublished / owner claims disabled
- No production / Supabase writes
- No California recrawl / CDSS follow-up
`;

writeFileSync(join(args.outDir, "pennsylvania-investigation-report.md"), markdown);

console.log(JSON.stringify({
  outDir: args.outDir,
  gate: summary.gate,
  stopGo: summary.stopGo,
  rows: summary.rows,
  addressExceptions: summary.addressExceptions,
  verifiedFacilitySpecificCount: summary.verifiedFacilitySpecificCount,
  qualityAllPass: summary.qualityAllPass,
}, null, 2));

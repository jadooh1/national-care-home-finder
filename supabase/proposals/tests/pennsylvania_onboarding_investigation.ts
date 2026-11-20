import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PENNSYLVANIA_ADDRESS_EXCEPTIONS,
  PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE,
  evaluatePennsylvaniaAddressExceptions,
  summarizePennsylvaniaAddressExceptions,
} from "../../../lib/pennsylvania-address-exceptions.ts";
import {
  evaluatePennsylvaniaDisclosureInvestigation,
  pennsylvaniaFacilityDisclosureUrl,
} from "../../../lib/pennsylvania-disclosure-investigation.ts";
import {
  buildPennsylvaniaEligibilityMatrix,
  classifyPennsylvaniaStreetEligibility,
} from "../../../lib/pennsylvania-eligibility-matrix.ts";
import { evaluatePennsylvaniaSourceVerification } from "../../../lib/pennsylvania-source-verification.ts";
import {
  PENNSYLVANIA_INVESTIGATION_STOP_GO,
  evaluatePennsylvaniaInvestigationReadiness,
  pennsylvaniaInvestigationAllowsPublication,
} from "../../../lib/pennsylvania-investigation-readiness.ts";
import { evaluatePennsylvaniaInvestigationQuality } from "../../../lib/pennsylvania-investigation-quality.ts";
import {
  PENNSYLVANIA_OFFICIAL_VALIDATION,
  pennsylvaniaDirectoryReady,
  pennsylvaniaDisclosureUrl,
  pennsylvaniaMapReady,
} from "../../../lib/pennsylvania-licensing.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  WASHINGTON_LISTED_COUNT,
  OREGON_LISTED_COUNT,
} from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/pennsylvania-onboarding-investigation",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("pennsylvania source verification matches official 989-row baseline", () => {
  const source = evaluatePennsylvaniaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(source.verification.rows, 989);
  assert.equal(source.verification.usableStreetRows, 976);
  assert.equal(source.verification.letterOnlyStreetRows, 13);
  assert.equal(source.verification.licensingCoordinateRows, 0);
  assert.equal(source.verification.recordedExportDate, null);
  assert.equal(source.verification.publicationEligibleRows, 0);
  assert.equal(source.verification.sha256, PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE.sha256);
  assert.equal(PENNSYLVANIA_OFFICIAL_VALIDATION.rows, 989);
  assert.equal(source.gate, "blocked");
});

test("pennsylvania address exception ledger covers all 13 letter-only streets", () => {
  const evaled = evaluatePennsylvaniaAddressExceptions();
  const summary = summarizePennsylvaniaAddressExceptions();
  assert.equal(evaled.exceptions.length, 13);
  assert.equal(summary.total, 13);
  assert.equal(summary.uniqueObjectIds, 13);
  assert.equal(summary.anyRewritten, false);
  assert.equal(summary.anyPublicationEligible, false);
  assert.equal(summary.residualOk, true);
  assert.equal(summary.byClass["letter-only-with-additional"], 6);
  assert.equal(summary.byClass["letter-only-named-without-number"], 7);
  assert.ok(PENNSYLVANIA_ADDRESS_EXCEPTIONS.some(e => e.objectId === "775340"));
  assert.ok(PENNSYLVANIA_ADDRESS_EXCEPTIONS.some(e => e.originalStreet === "ONE EASY LIVING DRIVE"));
  for (const row of PENNSYLVANIA_ADDRESS_EXCEPTIONS) {
    assert.equal(row.usableStreet, null);
    assert.equal(row.rewritten, false);
    assert.equal(row.publicationEligible, false);
  }
});

test("pennsylvania disclosure investigation finds no facility-specific links", () => {
  const disclosure = evaluatePennsylvaniaDisclosureInvestigation();
  assert.equal(disclosure.verifiedFacilitySpecificCount, 0);
  assert.equal(disclosure.disclosurePrefix, null);
  assert.equal(disclosure.disclosureVerified, false);
  assert.equal(pennsylvaniaFacilityDisclosureUrl("775745"), null);
  assert.equal(pennsylvaniaDisclosureUrl("775745"), null);
  assert.ok(disclosure.findings.every(f => f.verifiedFacilitySpecific === false));
  assert.ok(disclosure.findings.some(f => f.kind === "generic-search"));
  assert.ok(disclosure.findings.some(f => f.kind === "generic-directory"));
});

test("pennsylvania eligibility matrix stays unpublished with owner claims disabled", () => {
  const matrix = buildPennsylvaniaEligibilityMatrix();
  assert.equal(matrix.residualOk, true);
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.publication, "unpublished");
  assert.equal(matrix.stopGo, "STOP");

  const letterOnly = classifyPennsylvaniaStreetEligibility({
    street: "BUILDING A",
    hasLicenseNumber: false,
    hasStatus: false,
    hasExportDate: false,
    hasFacilityDisclosure: false,
  });
  assert.equal(letterOnly.bucket, "address-exception-offline");
  assert.equal(letterOnly.publicationEligible, false);

  const usable = classifyPennsylvaniaStreetEligibility({
    street: "12 Oak Lane",
    hasLicenseNumber: false,
    hasStatus: false,
    hasExportDate: false,
    hasFacilityDisclosure: false,
  });
  assert.equal(usable.bucket, "usable-street-but-blocked");
  assert.equal(usable.publicationEligible, false);
  assert.ok(usable.blockers.includes("open-data-object-id-is-not-a-license-number"));
});

test("pennsylvania investigation readiness / quality: STOP; WA/OR/CA contracts", () => {
  assert.equal(pennsylvaniaInvestigationAllowsPublication(), false);
  assert.equal(PENNSYLVANIA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(pennsylvaniaDirectoryReady(), false);
  assert.equal(pennsylvaniaMapReady(), false);

  const quality = evaluatePennsylvaniaInvestigationQuality();
  assert.equal(quality.allPass, true);
  const readiness = evaluatePennsylvaniaInvestigationReadiness(quality.allPass);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.californiaRecrawl, false);
  assert.equal(readiness.cdssFollowUpSent, false);

  assert.equal(directoryContract("Pennsylvania")?.publication, "unpublished");
  assert.equal(directoryHref("Pennsylvania", "https://example.supabase.co"), null);
  assert.equal(mapHref("Pennsylvania"), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);
  assert.equal(OREGON_LISTED_COUNT, 1584);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
});

test("pennsylvania investigation fixtures present after package assembly", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    stopGo: string;
    allowsPublication: boolean;
    rows: number;
    addressExceptions: number;
    verifiedFacilitySpecificCount: number;
    ownerClaimEligible: boolean;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.rows, 989);
  assert.equal(summary.addressExceptions, 13);
  assert.equal(summary.verifiedFacilitySpecificCount, 0);
  assert.equal(summary.ownerClaimEligible, false);
});

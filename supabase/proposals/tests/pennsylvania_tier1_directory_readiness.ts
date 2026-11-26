import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  PENNSYLVANIA_ADDRESS_EXCEPTIONS,
  PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE,
  evaluatePennsylvaniaAddressExceptions,
} from "../../../lib/pennsylvania-address-exceptions.ts";
import {
  PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT,
  PENNSYLVANIA_OFFICIAL_VALIDATION,
  PENNSYLVANIA_PRIOR_CATALOG_ROWS_UPDATED_AT,
  PENNSYLVANIA_RECORDED_EXPORT_DATE,
  adoptPennsylvaniaLicensingDate,
  pennsylvaniaDirectoryReady,
  pennsylvaniaDisclosureUrl,
} from "../../../lib/pennsylvania-licensing.ts";
import { evaluatePennsylvaniaSourceVerification } from "../../../lib/pennsylvania-source-verification.ts";
import {
  PENNSYLVANIA_TIER1_DIRECTORY_BLOCKERS,
  PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST,
  PENNSYLVANIA_TIER1_DIRECTORY_CONTROLS,
  PENNSYLVANIA_TIER1_DIRECTORY_EXCLUSIONS,
  PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY,
  PENNSYLVANIA_TIER1_DIRECTORY_SOURCE,
  PENNSYLVANIA_TIER1_SURFACE_SEPARATION,
  pennsylvaniaTier1DirectoryChecklistComplete,
  pennsylvaniaTier1DirectoryReadyForPublic,
  pennsylvaniaTier1DirectoryVerdict,
  pennsylvaniaTier1MapReady,
} from "../../../lib/pennsylvania-tier1-directory-readiness.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("Pennsylvania Tier 1 directory readiness is STOP; Pennsylvania stays unpublished", () => {
  const verdict = pennsylvaniaTier1DirectoryVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.tier1DirectoryRequirementsMet, false);
  assert.equal(verdict.publicPublicationAuthorized, false);
  assert.equal(verdict.pennsylvaniaPublished, false);
  assert.equal(verdict.mapEnabled, false);
  assert.equal(verdict.rosterRows, 989);
  assert.equal(verdict.usableStreetRows, 976);
  assert.equal(verdict.letterOnlyExclusions, 13);
  assert.equal(verdict.publicationEligible, 0);
  assert.equal(verdict.addressExceptionsDeterministicallyExcluded, true);
  assert.deepEqual([...verdict.blockers], [...PENNSYLVANIA_TIER1_DIRECTORY_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 4);

  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_CONTROLS.stopGo, "STOP");
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_CONTROLS.pennsylvaniaPublished, false);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_CONTROLS.addressExceptionsDeterministicallyExcluded, true);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_CONTROLS.publicPublicationAuthorized, false);
  assert.equal(pennsylvaniaTier1DirectoryReadyForPublic(), false);
  assert.equal(pennsylvaniaTier1MapReady(), false);
  assert.equal(pennsylvaniaTier1DirectoryChecklistComplete(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
});

test("roster re-verify, freshness, capacity, disclosure, and 13 exclusions stay aligned", () => {
  assert.equal(PENNSYLVANIA_RECORDED_EXPORT_DATE, null);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_SOURCE.recordedExportDateIso, null);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_SOURCE.contentUnchangedSincePriorAudit, true);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_SOURCE.sha256, PENNSYLVANIA_ADDRESS_SOURCE_CAPTURE.sha256);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_SOURCE.catalogRowsUpdatedAt, PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT);
  assert.equal(
    PENNSYLVANIA_TIER1_DIRECTORY_SOURCE.priorCatalogRowsUpdatedAt,
    PENNSYLVANIA_PRIOR_CATALOG_ROWS_UPDATED_AT,
  );
  assert.equal(adoptPennsylvaniaLicensingDate(PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT), null);
  assert.equal(adoptPennsylvaniaLicensingDate("2026-11-22"), null);
  assert.equal(pennsylvaniaDisclosureUrl("775745"), null);

  const source = evaluatePennsylvaniaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(source.verification.rows, 989);
  assert.equal(source.verification.contentUnchangedSha256Match, true);
  assert.equal(source.verification.publicationEligibleRows, 0);

  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.rosterRows, PENNSYLVANIA_OFFICIAL_VALIDATION.rows);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.usableStreetRows, 976);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.letterOnlyStreetExclusions, 13);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.publicationEligible, 0);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.capacityMin, 4);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.capacityMax, 250);

  const address = evaluatePennsylvaniaAddressExceptions();
  assert.equal(address.addressExceptionsResolvedByExclusion, true);
  assert.equal(address.summary.allDeterministicallyExcluded, true);
  assert.equal(address.summary.total, 13);
  assert.equal(PENNSYLVANIA_ADDRESS_EXCEPTIONS.length, 13);
  for (const row of PENNSYLVANIA_ADDRESS_EXCEPTIONS) {
    assert.equal(row.deterministicExclusion, true);
    assert.equal(row.publicationEligible, false);
    assert.equal(row.rewritten, false);
  }
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_EXCLUSIONS.deterministicExclusionComplete, true);
  assert.equal(PENNSYLVANIA_TIER1_DIRECTORY_EXCLUSIONS.inventedHouseNumbers, false);

  const freshness = PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "freshness-iso-export-date");
  const license = PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "license-identifiers");
  const exclusions = PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST.find(
    (i) => i.id === "address-exceptions-deterministic-exclusion",
  );
  const disclosure = PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "facility-specific-disclosure");
  const capacity = PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "physical-address-and-capacity");
  assert.equal(freshness?.complete, false);
  assert.equal(license?.complete, false);
  assert.equal(exclusions?.complete, true);
  assert.equal(disclosure?.complete, false);
  assert.equal(capacity?.complete, true);
});

test("directory readiness is separated from map; PUBLICATION_READINESS includes Pennsylvania STOP", () => {
  assert.equal(PENNSYLVANIA_TIER1_SURFACE_SEPARATION.directoryPath, null);
  assert.equal(PENNSYLVANIA_TIER1_SURFACE_SEPARATION.mapPath, null);
  assert.equal(PENNSYLVANIA_TIER1_SURFACE_SEPARATION.mapEnabled, false);
  assert.equal(directoryContract("Pennsylvania")?.publication, "unpublished");
  assert.equal(directoryContract("Pennsylvania")?.directoryPath, null);
  assert.equal(mapHref("Pennsylvania"), null);

  const pennsylvania = PUBLICATION_READINESS_SUMMARIES.find((row) => row.state === "Pennsylvania");
  assert.ok(pennsylvania);
  assert.equal(pennsylvania.stopGo, "STOP");
  assert.equal(pennsylvania.tierCounts.tier0, 989);
  assert.equal(pennsylvania.tierCounts.tier1, 0);
  assert.equal(pennsylvania.stateAuthorization, "unpublished");
  assert.ok(pennsylvania.blockers.includes("no-authoritative-iso-export-date"));
  assert.ok(pennsylvania.blockers.includes("thirteen-letter-only-streets-deterministically-excluded"));
  assert.ok(pennsylvania.blockers.includes("open-data-object-id-is-not-a-license-number"));
});

test("safeguards keep Washington public and Pennsylvania unpublished", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.notEqual(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("Pennsylvania")?.publication, "unpublished");
  assert.equal(existsSync("lib/pennsylvania-tier1-directory-readiness.ts"), true);
  assert.equal(existsSync("app/pennsylvania"), false);
  assert.equal(PENNSYLVANIA_TIER1_SURFACE_SEPARATION.washingtonPreserved, true);
  assert.equal(PENNSYLVANIA_TIER1_SURFACE_SEPARATION.californiaPreserved, true);
  assert.equal(PENNSYLVANIA_TIER1_SURFACE_SEPARATION.oregonPreserved, true);

  const oregonLayout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(oregonLayout.includes("PUBLIC_PRODUCTION_HOSTS"));
});

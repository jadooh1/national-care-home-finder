import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  NORTH_CAROLINA_CURRENT_CAPTURE,
  NORTH_CAROLINA_PRIOR_NOV13_BASELINE,
} from "../../../lib/north-carolina-source-verification.ts";
import { NORTH_CAROLINA_INVESTIGATION_STOP_GO } from "../../../lib/north-carolina-investigation-readiness.ts";
import { evaluateNorthCarolinaDisclosureInvestigation } from "../../../lib/north-carolina-disclosure-investigation.ts";
import {
  northCarolinaDirectoryReady,
  NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS,
  NORTH_CAROLINA_UNIQUE_LICENSES,
} from "../../../lib/north-carolina-onboarding.ts";
import {
  NORTH_CAROLINA_TIER1_CAPTURE,
  NORTH_CAROLINA_TIER1_CATEGORIES,
  NORTH_CAROLINA_TIER1_DIRECTORY_BLOCKERS,
  NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST,
  NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS,
  NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS,
  NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY,
  NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE,
  NORTH_CAROLINA_TIER1_SURFACE_SEPARATION,
  northCarolinaTier1DirectoryChecklistComplete,
  northCarolinaTier1DirectoryReadyForPublic,
  northCarolinaTier1DirectoryVerdict,
  northCarolinaTier1MapReady,
} from "../../../lib/north-carolina-tier1-directory-readiness.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("North Carolina Tier 1 directory readiness is STOP; NC stays unpublished", () => {
  const verdict = northCarolinaTier1DirectoryVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.tier1DirectoryRequirementsMet, false);
  assert.equal(verdict.publicPublicationAuthorized, false);
  assert.equal(verdict.northCarolinaPublished, false);
  assert.equal(verdict.mapEnabled, false);
  assert.equal(verdict.inventoryUniqueLicenses, 1086);
  assert.equal(verdict.publicationEligible, 0);
  assert.deepEqual([...verdict.blockers], [...NORTH_CAROLINA_TIER1_DIRECTORY_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 5);

  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.stopGo, "STOP");
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.northCarolinaPublished, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.northCarolinaDirectoryReady, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.mapEnabled, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.supabaseWrites, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.publicPublicationAuthorized, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.releaseCandidatePrepared, true);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS.workbookShaReconfirmed, true);
  assert.equal(northCarolinaTier1DirectoryReadyForPublic(), false);
  assert.equal(northCarolinaTier1MapReady(), false);
  assert.equal(northCarolinaTier1DirectoryChecklistComplete(), false);
  assert.equal(northCarolinaDirectoryReady(), false);
  assert.equal(NORTH_CAROLINA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS, 0);
  assert.equal(NORTH_CAROLINA_UNIQUE_LICENSES, 1086);
});

test("HAL/FCL sources, identity, site address, capacity, and freshness stay evidence-aligned", () => {
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE.recordedExportDateIso, null);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE.listingsPageUpdatedIsExportDate, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE.workbookAsOfIsExportDate, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE.disclosurePrefixVerified, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE.identityField, "License #");
  assert.equal(NORTH_CAROLINA_TIER1_CATEGORIES.length, 2);

  const hal = NORTH_CAROLINA_TIER1_CATEGORIES.find((c) => c.id === "hal");
  const fcl = NORTH_CAROLINA_TIER1_CATEGORIES.find((c) => c.id === "fcl");
  assert.equal(hal?.licensePrefix, "HAL");
  assert.equal(hal?.licensedRows, 566);
  assert.equal(hal?.washingtonAfhEquivalent, false);
  assert.equal(fcl?.licensePrefix, "FCL");
  assert.equal(fcl?.licensedRows, 520);
  assert.equal(fcl?.washingtonAfhEquivalent, false);

  // Capture continuity — SHA and counts match Nov 20 investigation; reconfirmed 2026-11-26.
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.sha256, NORTH_CAROLINA_CURRENT_CAPTURE.adult.sha256);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.sha256, NORTH_CAROLINA_CURRENT_CAPTURE.family.sha256);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.bytes, NORTH_CAROLINA_CURRENT_CAPTURE.adult.bytes);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.bytes, NORTH_CAROLINA_CURRENT_CAPTURE.family.bytes);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.licensedRows, 566);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.licensedRows, 520);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.combined.uniqueLicenses, 1086);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.combined.licenseOverlap, 0);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.combined.blankTrailingRows, 2);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.combined.siteAddresses, 1086);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.combined.fiveDigitSiteZips, 1086);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.blankSiteAddress, 0);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.blankSiteAddress, 0);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.bedMin, 9);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.bedMax, 201);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.bedMin, 2);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.bedMax, 6);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.bedsOutside2to6, 0);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.perRowStatusColumn, false);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.perRowStatusColumn, false);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.coordinateColumns, false);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.coordinateColumns, false);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.adult.lastModifiedIsExportDate, false);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.family.lastModifiedIsExportDate, false);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.staleFchTxtRejected, true);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.publicationEligible, 0);
  assert.equal(NORTH_CAROLINA_TIER1_CAPTURE.reconfirmedOn, "2026-11-26");
  assert.equal(
    NORTH_CAROLINA_TIER1_CAPTURE.combined.uniqueLicenses,
    NORTH_CAROLINA_PRIOR_NOV13_BASELINE.uniqueLicenses,
  );

  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY.adultCareHomesHal, 566);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY.familyCareHomesFcl, 520);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY.uniqueLicenses, 1086);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY.publicationEligible, 0);

  const disclosure = evaluateNorthCarolinaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.allowsPublication, false);
  assert.equal(disclosure.mailingSubstitutionAllowed, false);

  const freshness = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "freshness-iso-export-date");
  const status = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "per-row-operating-status");
  const disclosureItem = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "facility-specific-disclosure");
  const taxonomy = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "hal-fcl-category-taxonomy");
  const site = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "physical-site-address-and-capacity");
  const identity = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "facility-identity-license-number");
  const source = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "authoritative-dhsr-hal-fcl-workbooks");
  assert.equal(source?.complete, true);
  assert.equal(identity?.complete, true);
  assert.equal(site?.complete, true);
  assert.equal(freshness?.complete, false);
  assert.equal(status?.complete, false);
  assert.equal(disclosureItem?.complete, false);
  assert.equal(taxonomy?.complete, false);
});

test("directory readiness is separated from map; exclusions keep stale and mailing out", () => {
  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.directoryPath, null);
  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.mapPath, null);
  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.mapEnabled, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.blankTrailingWorkbookRows, 2);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.staleFchTxtRejected, true);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.facilityMailingNotSubstitutedForSite, true);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.starRatingNotLicensingStatus, true);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.expiryDateNotLicensingStatus, true);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.specialCareUnitsWorkbookNotPrimaryRoster, true);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.washingtonAfhEquivalence, false);
  assert.equal(NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS.inventedCoordinates, false);

  const mapItem = NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "map-coordinates-separate");
  assert.equal(mapItem?.surface, "map");
  assert.equal(mapItem?.complete, false);
});

test("safeguards keep WA public, CA/OR contracts, Design 2 untouched; NC unpublished", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.notEqual(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("North Carolina")?.publication, "unpublished");
  assert.equal(directoryContract("North Carolina")?.directoryPath, null);
  assert.equal(mapHref("North Carolina"), null);

  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.washingtonPreserved, true);
  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.californiaPreserved, true);
  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.oregonPreserved, true);
  assert.equal(NORTH_CAROLINA_TIER1_SURFACE_SEPARATION.design2Preserved, true);

  const northCarolina = PUBLICATION_READINESS_SUMMARIES.find((row) => row.state === "North Carolina");
  assert.ok(northCarolina);
  assert.equal(northCarolina.stopGo, "STOP");
  assert.equal(northCarolina.stateAuthorization, "unpublished");
  assert.equal(northCarolina.tierCounts.tier0, 1086);
  assert.equal(northCarolina.tierCounts.tier1, 0);
  assert.equal(northCarolina.ownerClaimsEnabled, false);
  assert.ok(northCarolina.blockers.includes("no-authoritative-iso-export-date"));
  assert.ok(northCarolina.blockers.includes("no-per-row-licensing-status"));
  assert.ok(northCarolina.blockers.includes("no-verified-license-disclosure-prefix"));
  assert.ok(northCarolina.blockers.includes("hal-fcl-category-mapping-unapproved"));

  assert.equal(existsSync("lib/north-carolina-tier1-directory-readiness.ts"), true);
  assert.equal(
    existsSync("supabase/proposals/20261126260000_north_carolina_tier1_directory_readiness.md"),
    true,
  );
  assert.ok(readFileSync("lib/north-carolina-tier1-directory-readiness.ts", "utf8").includes("STOP"));
});

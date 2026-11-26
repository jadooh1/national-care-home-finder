import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  WISCONSIN_CURRENT_CAPTURE,
  wisconsinDirectoryReady,
} from "../../../lib/wisconsin-source-verification.ts";
import { WISCONSIN_INVESTIGATION_STOP_GO } from "../../../lib/wisconsin-investigation-readiness.ts";
import { WISCONSIN_ELIGIBILITY_COUNTS } from "../../../lib/wisconsin-eligibility-matrix.ts";
import { evaluateWisconsinDisclosureInvestigation } from "../../../lib/wisconsin-disclosure-investigation.ts";
import {
  WISCONSIN_TIER1_AFH_CAPTURE,
  WISCONSIN_TIER1_CATEGORIES,
  WISCONSIN_TIER1_CBRF_CAPTURE,
  WISCONSIN_TIER1_DIRECTORY_BLOCKERS,
  WISCONSIN_TIER1_DIRECTORY_CHECKLIST,
  WISCONSIN_TIER1_DIRECTORY_CONTROLS,
  WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS,
  WISCONSIN_TIER1_DIRECTORY_INVENTORY,
  WISCONSIN_TIER1_DIRECTORY_SOURCE,
  WISCONSIN_TIER1_RCAC_CAPTURE,
  WISCONSIN_TIER1_SURFACE_SEPARATION,
  wisconsinTier1DirectoryChecklistComplete,
  wisconsinTier1DirectoryReadyForPublic,
  wisconsinTier1DirectoryVerdict,
  wisconsinTier1MapReady,
} from "../../../lib/wisconsin-tier1-directory-readiness.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("Wisconsin Tier 1 directory readiness is STOP; Wisconsin stays unpublished", () => {
  const verdict = wisconsinTier1DirectoryVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.tier1DirectoryRequirementsMet, false);
  assert.equal(verdict.publicPublicationAuthorized, false);
  assert.equal(verdict.wisconsinPublished, false);
  assert.equal(verdict.mapEnabled, false);
  assert.equal(verdict.inventoryExcelRows, 4373);
  assert.equal(verdict.publicationEligible, 0);
  assert.deepEqual([...verdict.blockers], [...WISCONSIN_TIER1_DIRECTORY_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 5);

  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.stopGo, "STOP");
  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.wisconsinPublished, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.wisconsinDirectoryReady, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.mapEnabled, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.supabaseWrites, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.publicPublicationAuthorized, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_CONTROLS.releaseCandidatePrepared, true);
  assert.equal(wisconsinTier1DirectoryReadyForPublic(), false);
  assert.equal(wisconsinTier1MapReady(), false);
  assert.equal(wisconsinTier1DirectoryChecklistComplete(), false);
  assert.equal(wisconsinDirectoryReady(), false);
  assert.equal(WISCONSIN_INVESTIGATION_STOP_GO.decision, "STOP");
});

test("AFH/CBRF/RCAC sources, pathways, streets, capacity, and freshness stay evidence-aligned", () => {
  assert.equal(WISCONSIN_TIER1_DIRECTORY_SOURCE.recordedExportDateIso, null);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_SOURCE.disclosurePrefixVerified, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_SOURCE.providerSearchIsSearchOnly, true);
  assert.equal(WISCONSIN_TIER1_CATEGORIES.length, 3);

  const afh = WISCONSIN_TIER1_CATEGORIES.find((c) => c.id === "afh");
  const cbrf = WISCONSIN_TIER1_CATEGORIES.find((c) => c.id === "cbrf");
  const rcac = WISCONSIN_TIER1_CATEGORIES.find((c) => c.id === "rcac");
  assert.equal(afh?.regulatoryPathway, "licensed");
  assert.equal(cbrf?.regulatoryPathway, "licensed");
  assert.equal(rcac?.regulatoryPathway, "certified-or-registered");

  // AFH research reused — SHA and row counts match prior capture.
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.excelRows, WISCONSIN_CURRENT_CAPTURE.excel.rows);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.excelSha256, WISCONSIN_CURRENT_CAPTURE.excel.sha256);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.blankStreet, 0);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.publicationEligible, 0);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.matchedUnique, WISCONSIN_ELIGIBILITY_COUNTS.matchedUnique);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.classIsAmbulatorySubclassNotLicenseStatus, true);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.perRowLicensingStatusColumn, false);
  assert.equal(WISCONSIN_TIER1_AFH_CAPTURE.pdfStampIsExportDate, false);

  // CBRF new capture
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.excelRows, 1534);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.uniqueFacilityIds, 1534);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.blankStreet, 0);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.blankCapacity, 0);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.capacityMin, 5);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.perRowLicensingStatusColumn, false);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.pdfStampIsExportDate, false);
  assert.equal(WISCONSIN_TIER1_CBRF_CAPTURE.publicationEligible, 0);
  assert.equal(
    Object.values(WISCONSIN_TIER1_CBRF_CAPTURE.classCounts).reduce((a, b) => a + b, 0),
    1534,
  );

  // RCAC certified vs registered
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.excelRows, 360);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.certified, 265);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.registered, 95);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.certified + WISCONSIN_TIER1_RCAC_CAPTURE.registered, 360);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.classIsCertifiedOrRegisteredPathway, true);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.quarterlyNoticeIsExportDate, false);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.blankStreet, 0);
  assert.equal(WISCONSIN_TIER1_RCAC_CAPTURE.publicationEligible, 0);

  assert.equal(WISCONSIN_TIER1_DIRECTORY_INVENTORY.totalExcelRows, 2479 + 1534 + 360);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_INVENTORY.publicationEligible, 0);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_INVENTORY.gisNotAcceptedAsDirectory, true);

  const disclosure = evaluateWisconsinDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.allowsPublication, false);

  const freshness = WISCONSIN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "freshness-iso-export-date");
  const status = WISCONSIN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "per-row-operating-status");
  const disclosureItem = WISCONSIN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "facility-specific-disclosure");
  const taxonomy = WISCONSIN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "licensed-certified-registered-taxonomy");
  const street = WISCONSIN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "street-address-and-capacity");
  assert.equal(freshness?.complete, false);
  assert.equal(status?.complete, false);
  assert.equal(disclosureItem?.complete, false);
  assert.equal(taxonomy?.complete, true);
  assert.equal(street?.complete, true);
});

test("directory readiness is separated from map; exclusions keep GIS residuals out", () => {
  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.directoryPath, null);
  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.mapPath, null);
  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.mapEnabled, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS.countyRegulatedOneTwoBedAfhOutsideStateDirectory, true);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS.mailingStreetNotSubstitutedForFacilityStreet, true);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS.gisOnlyResidualsIneligibleUntilReconciled, true);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS.rcacRegisteredDistinctFromCertified, true);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS.washingtonAfhEquivalence, false);
  assert.equal(WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS.inventedCoordinates, false);

  const mapItem = WISCONSIN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "map-coordinates-separate");
  assert.equal(mapItem?.surface, "map");
  assert.equal(mapItem?.complete, false);
});

test("safeguards keep WA public, CA/OR unpublished contracts, Design 2 untouched", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.notEqual(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("Wisconsin")?.publication, "unpublished");
  assert.equal(directoryContract("Wisconsin")?.directoryPath, null);
  assert.equal(mapHref("Wisconsin"), null);

  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.washingtonPreserved, true);
  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.californiaPreserved, true);
  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.oregonPreserved, true);
  assert.equal(WISCONSIN_TIER1_SURFACE_SEPARATION.design2Preserved, true);

  const wisconsin = PUBLICATION_READINESS_SUMMARIES.find((row) => row.state === "Wisconsin");
  assert.ok(wisconsin);
  assert.equal(wisconsin.stopGo, "STOP");
  assert.equal(wisconsin.stateAuthorization, "unpublished");
  assert.equal(wisconsin.tierCounts.tier0, 4373);
  assert.equal(wisconsin.tierCounts.tier1, 0);
  assert.equal(wisconsin.ownerClaimsEnabled, false);
  assert.ok(wisconsin.blockers.includes("no-authoritative-iso-export-date"));
  assert.ok(wisconsin.blockers.includes("excel-gis-identifier-reconciliation-incomplete"));

  assert.equal(existsSync("lib/wisconsin-tier1-directory-readiness.ts"), true);
  assert.equal(
    existsSync("supabase/proposals/20261126230000_wisconsin_tier1_directory_readiness.md"),
    true,
  );
  assert.ok(readFileSync("lib/wisconsin-tier1-directory-readiness.ts", "utf8").includes("STOP"));
});

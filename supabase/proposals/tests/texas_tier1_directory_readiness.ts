import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  TEXAS_ACTIVE_AS_OF,
  TEXAS_CLOSURE_ACTIVE_ID_OVERLAP,
  TEXAS_CLOSURE_FACILITY_IDS,
  TEXAS_FACILITY_ID_LEADING_ZEROS,
  TEXAS_FILE_LAST_MODIFIED,
  TEXAS_GEO_COMMA_ONLY,
  TEXAS_GEO_PAIRS,
  TEXAS_OBSERVED_ON,
  TEXAS_PUBLICATION,
  TEXAS_RECORDED_EXPORT_DATE,
  TEXAS_ROWS,
  TEXAS_SOURCE_URL,
  TEXAS_TYPE_A,
  TEXAS_TYPE_B,
  TEXAS_TYPE_C,
  TEXAS_WORKBOOK_SHA256,
  adoptTexasExportDate,
  texasDirectoryReady,
  texasDisclosureUrl,
} from "../../../lib/texas-alf-directory.ts";
import { TEXAS_ELIGIBILITY_COUNTS, buildTexasEligibilityMatrix } from "../../../lib/texas-eligibility-matrix.ts";
import { TEXAS_INVESTIGATION_STOP_GO } from "../../../lib/texas-investigation-readiness.ts";
import {
  TEXAS_TIER1_DIRECTORY_BLOCKERS,
  TEXAS_TIER1_DIRECTORY_CHECKLIST,
  TEXAS_TIER1_DIRECTORY_CONTROLS,
  TEXAS_TIER1_DIRECTORY_EXCLUSIONS,
  TEXAS_TIER1_DIRECTORY_INVENTORY,
  TEXAS_TIER1_DIRECTORY_SOURCE,
  TEXAS_TIER1_SURFACE_SEPARATION,
  texasTier1DirectoryChecklistComplete,
  texasTier1DirectoryReadyForPublic,
  texasTier1DirectoryVerdict,
  texasTier1MapReady,
} from "../../../lib/texas-tier1-directory-readiness.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("Texas Tier 1 directory readiness is STOP; Texas stays unpublished", () => {
  const verdict = texasTier1DirectoryVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.tier1DirectoryRequirementsMet, false);
  assert.equal(verdict.publicPublicationAuthorized, false);
  assert.equal(verdict.texasPublished, false);
  assert.equal(verdict.mapEnabled, false);
  assert.equal(verdict.inventoryActiveRows, 2019);
  assert.equal(verdict.publicationEligible, 0);
  assert.deepEqual([...verdict.blockers], [...TEXAS_TIER1_DIRECTORY_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 4);

  assert.equal(TEXAS_TIER1_DIRECTORY_CONTROLS.stopGo, "STOP");
  assert.equal(TEXAS_TIER1_DIRECTORY_CONTROLS.texasPublished, false);
  assert.equal(TEXAS_TIER1_DIRECTORY_CONTROLS.texasDirectoryReady, false);
  assert.equal(TEXAS_TIER1_DIRECTORY_CONTROLS.mapEnabled, false);
  assert.equal(TEXAS_TIER1_DIRECTORY_CONTROLS.publicPublicationAuthorized, false);
  assert.equal(TEXAS_TIER1_DIRECTORY_CONTROLS.releaseCandidatePrepared, true);
  assert.equal(texasTier1DirectoryReadyForPublic(), false);
  assert.equal(texasTier1MapReady(), false);
  assert.equal(texasTier1DirectoryChecklistComplete(), false);
  assert.equal(texasDirectoryReady(), false);
  assert.equal(TEXAS_INVESTIGATION_STOP_GO.decision, "STOP");
});

test("freshness, identity, eligibility, capacity, and disclosure evidence stay aligned", () => {
  assert.equal(TEXAS_RECORDED_EXPORT_DATE, null);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.recordedExportDateIso, null);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.disclosurePrefixVerified, false);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.workbookUrl, TEXAS_SOURCE_URL);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.workbookSha256, TEXAS_WORKBOOK_SHA256);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.activeAsOfLabel, TEXAS_ACTIVE_AS_OF);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.fileLastModified, TEXAS_FILE_LAST_MODIFIED);
  assert.equal(TEXAS_TIER1_DIRECTORY_SOURCE.captureObservedOn, TEXAS_OBSERVED_ON);
  assert.equal(adoptTexasExportDate("11/19/2026"), null);
  assert.equal(adoptTexasExportDate("2026-11-19"), null);
  assert.equal(texasDisclosureUrl("000123"), null);

  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.activeRows, TEXAS_ROWS);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.typeA, TEXAS_TYPE_A);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.typeB, TEXAS_TYPE_B);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.typeC, TEXAS_TYPE_C);
  assert.equal(
    TEXAS_TIER1_DIRECTORY_INVENTORY.typeA
      + TEXAS_TIER1_DIRECTORY_INVENTORY.typeB
      + TEXAS_TIER1_DIRECTORY_INVENTORY.typeC,
    TEXAS_TIER1_DIRECTORY_INVENTORY.activeRows,
  );
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.geoPairs, TEXAS_GEO_PAIRS);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.geoCommaOnly, TEXAS_GEO_COMMA_ONLY);
  assert.equal(
    TEXAS_TIER1_DIRECTORY_INVENTORY.geoPairs + TEXAS_TIER1_DIRECTORY_INVENTORY.geoCommaOnly,
    TEXAS_TIER1_DIRECTORY_INVENTORY.activeRows,
  );
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.facilityIdLeadingZerosPreserved, TEXAS_FACILITY_ID_LEADING_ZEROS);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.closureFacilityIds, TEXAS_CLOSURE_FACILITY_IDS);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.closureActiveOverlap, TEXAS_CLOSURE_ACTIVE_ID_OVERLAP);
  assert.equal(TEXAS_TIER1_DIRECTORY_INVENTORY.publicationEligible, 0);
  assert.equal(TEXAS_ELIGIBILITY_COUNTS.publicationEligible, 0);

  const matrix = buildTexasEligibilityMatrix();
  assert.equal(matrix.stopGo, "STOP");
  assert.equal(matrix.allowsPublication, false);
  assert.equal(matrix.typeResidualOk, true);

  const freshness = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "freshness-iso-export-date");
  const identity = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "license-identifiers");
  const address = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "physical-address-and-capacity");
  const status = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "operating-status-semantics");
  const disclosure = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "facility-specific-disclosure");
  const taxonomy = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "type-a-b-c-taxonomy");
  assert.equal(freshness?.complete, false);
  assert.equal(identity?.complete, true);
  assert.equal(address?.complete, true);
  assert.equal(status?.complete, false);
  assert.equal(disclosure?.complete, false);
  assert.equal(taxonomy?.complete, false);
});

test("directory readiness is separated from map readiness; exclusions stay enumerated", () => {
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.directoryPath, null);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.mapPath, null);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.mapEnabled, false);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.directorySurface, "unpublished-evidence-only");
  assert.equal(directoryContract("Texas")?.publication, TEXAS_PUBLICATION);
  assert.equal(directoryContract("Texas")?.directoryPath, null);
  assert.equal(directoryContract("Texas")?.mapPath, null);
  assert.equal(mapHref("Texas"), null);

  assert.equal(TEXAS_TIER1_DIRECTORY_EXCLUSIONS.typeCLegacyRows, 8);
  assert.equal(TEXAS_TIER1_DIRECTORY_EXCLUSIONS.geoCommaOnlyNotCoordinates, 82);
  assert.equal(TEXAS_TIER1_DIRECTORY_EXCLUSIONS.closureHistoricalIds, 1515);
  assert.equal(TEXAS_TIER1_DIRECTORY_EXCLUSIONS.washingtonAfhEquivalence, false);
  assert.equal(TEXAS_TIER1_DIRECTORY_EXCLUSIONS.inventedCoordinates, false);

  const mapItem = TEXAS_TIER1_DIRECTORY_CHECKLIST.find((item) => item.id === "map-coordinates-separate");
  assert.equal(mapItem?.surface, "map");
  assert.equal(mapItem?.complete, false);

  const texas = PUBLICATION_READINESS_SUMMARIES.find((row) => row.state === "Texas");
  assert.ok(texas);
  assert.equal(texas.stopGo, "STOP");
  assert.equal(texas.stateAuthorization, "unpublished");
  assert.equal(texas.tierCounts.tier0, 2019);
  assert.equal(texas.tierCounts.tier1, 0);
  assert.equal(texas.ownerClaimsEnabled, false);
  assert.ok(texas.blockers.includes("no-authoritative-iso-export-date"));
  assert.ok(texas.blockers.includes("no-verified-tulip-disclosure-url-prefix"));
  assert.ok(texas.blockers.includes("type-a-b-c-taxonomy-unapproved"));
});

test("safeguards keep Washington public and Texas unpublished; WA/CA/OR preserved", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.notEqual(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("Texas")?.publication, "unpublished");

  assert.equal(existsSync("lib/texas-tier1-directory-readiness.ts"), true);
  assert.equal(existsSync("app/texas"), false);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.washingtonPreserved, true);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.californiaPreserved, true);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.oregonPreserved, true);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.ownerClaimsEnabled, false);
  assert.equal(TEXAS_TIER1_SURFACE_SEPARATION.enhancedFeaturesEnabled, false);

  const oregonLayout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(oregonLayout.includes("PUBLIC_PRODUCTION_HOSTS"));
  assert.ok(oregonLayout.includes("notFound()"));
});

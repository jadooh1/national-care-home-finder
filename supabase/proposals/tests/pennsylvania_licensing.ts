import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { onboardingProfile, publicPublicationPermitted } from "../../../lib/nationwide-onboarding.ts";
import {
  PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT,
  PENNSYLVANIA_OFFICIAL_VALIDATION,
  adoptPennsylvaniaLicensingDate,
  pennsylvaniaDirectoryReady,
  pennsylvaniaMapReady,
  retainedPennsylvaniaAddress,
  usablePennsylvaniaStreet,
  pennsylvaniaZip,
  validatePennsylvaniaRoster,
} from "../../../lib/pennsylvania-licensing.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";

const OBSERVED = PENNSYLVANIA_OFFICIAL_VALIDATION;

test("the official Pennsylvania counts stay intact and do not invent a license number", () => {
  assert.equal(OBSERVED.rows, 989);
  assert.equal(OBSERVED.objectIdsUnique, OBSERVED.rows);
  assert.equal(OBSERVED.duplicateObjectIds, 0);
  assert.equal(OBSERVED.licenseNumberColumn, false);
  assert.equal(OBSERVED.statusColumn, false);
  assert.equal(OBSERVED.typePersonalCareHomes, OBSERVED.rows);
  assert.equal(OBSERVED.programOfficeRows, OBSERVED.rows);
  assert.equal(OBSERVED.statePa, OBSERVED.rows);
  assert.equal(OBSERVED.fiveDigitZips, OBSERVED.rows);
  assert.equal(OBSERVED.usableStreetRows + OBSERVED.letterOnlyStreetRows, OBSERVED.rows);
  assert.equal(OBSERVED.letterOnlyWithAdditionalText + OBSERVED.letterOnlyNamedStreetWithoutNumber, OBSERVED.letterOnlyStreetRows);
  assert.equal(OBSERVED.georeferencedRows, OBSERVED.rows);
  assert.equal(OBSERVED.licensingCoordinateRows, 0);
  assert.equal(OBSERVED.accuracyInterpolated + OBSERVED.accuracyStreetCentroid + OBSERVED.accuracyZip4Centroid + OBSERVED.accuracyZipCentroid + OBSERVED.accuracyIntersection, OBSERVED.rows);
  assert.equal(OBSERVED.sharedAddressSameNameGroups + OBSERVED.sharedAddressDifferentNameGroups, OBSERVED.sharedStreetCityZipGroups);
  assert.equal(OBSERVED.capacityUnderFour, 0);
  assert.equal(OBSERVED.publicationEligibleRows, 0);
  assert.equal(pennsylvaniaDirectoryReady(), false);
  assert.equal(pennsylvaniaMapReady(), false);
});

test("street additional information is not copied into a letter-only street", () => {
  const original = { street: "OAK LANE", streetAdditional: "12 BUILDING A" };
  const kept = retainedPennsylvaniaAddress(original);
  assert.equal(kept.usableStreet, null);
  assert.equal(kept.publicationEligible, false);
  assert.equal(original.street, "OAK LANE");
  assert.equal(original.streetAdditional, "12 BUILDING A");
  assert.equal(usablePennsylvaniaStreet("12 Oak Lane"), "12 Oak Lane");
  assert.equal(pennsylvaniaZip("19605"), "19605");
  assert.equal(pennsylvaniaZip("1960"), null);
  const report = validatePennsylvaniaRoster([
    { objectId: "100001", typeServed: "PERSONAL CARE HOMES", street: "OAK LANE", streetAdditional: "12" },
    { objectId: "100001", typeServed: "PERSONAL CARE HOMES", street: "4 MAIN STREET", streetAdditional: "" },
  ]);
  assert.equal(report.duplicateObjectIds, 1);
  assert.equal(report.usableStreetRows, 1);
  assert.equal(report.letterOnlyStreetRows, 1);
  assert.equal(report.rows[0].originalStreet, "OAK LANE");
  assert.equal(report.rows[0].originalStreetAdditional, "12");
  assert.equal(report.rows[0].licensingCoordinates, null);
  assert.equal(report.directoryReady, false);
  assert.equal(report.mapReady, false);
  assert.equal(report.recordedExportDate, null);
  assert.equal(adoptPennsylvaniaLicensingDate(PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT), null);
});

test("Pennsylvania stays unpublished and the earlier states keep their contracts", () => {
  const pennsylvania = onboardingProfile("Pennsylvania");
  assert.equal(publicPublicationPermitted(pennsylvania), false);
  assert.equal(pennsylvania.coordinateColumns, false);
  assert.equal(pennsylvania.disclosurePrefix, null);
  assert.ok(pennsylvania.blockers.includes("georeferenced-coordinates-are-not-licensing-coordinates"));
  assert.ok(pennsylvania.blockers.includes("open-data-object-id-is-not-a-license-number"));
  assert.ok(pennsylvania.blockers.includes("no-per-row-licensing-status"));
  assert.equal(directoryContract("Pennsylvania")?.directoryPath, null);
  assert.equal(directoryHref("Pennsylvania", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Pennsylvania"), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("Michigan")?.publication, "unpublished");
  const page = readFileSync(new URL("../../../app/development/pennsylvania/page.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../../../app/page.tsx", import.meta.url), "utf8");
  const source = readFileSync(new URL("../../../lib/pennsylvania-licensing.ts", import.meta.url), "utf8");
  assert.equal(page.includes("Pennsylvania is unpublished"), true);
  assert.equal(page.includes("not an available placement"), true);
  assert.equal(page.includes("No map is published"), true);
  assert.equal(page.includes("not copied into the street column"), true);
  assert.equal(page.includes("supabase"), false);
  assert.equal(page.includes("fetch("), false);
  assert.equal(home.includes("/development/pennsylvania"), false);
  assert.equal(home.includes("/pennsylvania"), false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("insert"), false);
});

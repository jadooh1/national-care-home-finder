import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NORTH_CAROLINA_FEASIBILITY } from "../../../lib/nationwide-onboarding.ts";
import {
  NORTH_CAROLINA_ADULT_CARE_HOMES,
  NORTH_CAROLINA_BLANK_ROWS,
  NORTH_CAROLINA_DISTINCT_MAILING_ADDRESSES,
  NORTH_CAROLINA_EXPIRY_BEFORE_OBSERVATION,
  NORTH_CAROLINA_FAMILY_CARE_HOMES,
  NORTH_CAROLINA_FIVE_DIGIT_SITE_ZIPS,
  NORTH_CAROLINA_IDENTICAL_MAILING_ADDRESSES,
  NORTH_CAROLINA_LICENSE_OVERLAP,
  NORTH_CAROLINA_LISTINGS_PAGE_UPDATED,
  NORTH_CAROLINA_RECORDED_EXPORT_DATE,
  NORTH_CAROLINA_UNIQUE_LICENSES,
  NORTH_CAROLINA_WORKBOOK_AS_OF,
  adoptNorthCarolinaExportDate,
  mayRepresentNorthCarolinaRecordAsCurrentlyActive,
  northCarolinaDirectoryReady,
  northCarolinaDisclosureUrl,
  northCarolinaMapReady,
  northCarolinaPublicationReadiness,
} from "../../../lib/north-carolina-onboarding.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";

test("licensed rows stay unique and publication stays closed", () => {
  const report = northCarolinaPublicationReadiness();
  assert.equal(NORTH_CAROLINA_ADULT_CARE_HOMES + NORTH_CAROLINA_FAMILY_CARE_HOMES, NORTH_CAROLINA_UNIQUE_LICENSES);
  assert.equal(NORTH_CAROLINA_UNIQUE_LICENSES, NORTH_CAROLINA_FEASIBILITY.uniqueLicenseIdentifiers);
  assert.equal(NORTH_CAROLINA_LICENSE_OVERLAP, 0);
  assert.equal(NORTH_CAROLINA_BLANK_ROWS, 2);
  assert.equal(NORTH_CAROLINA_FIVE_DIGIT_SITE_ZIPS, NORTH_CAROLINA_UNIQUE_LICENSES);
  assert.equal(NORTH_CAROLINA_IDENTICAL_MAILING_ADDRESSES + NORTH_CAROLINA_DISTINCT_MAILING_ADDRESSES, NORTH_CAROLINA_UNIQUE_LICENSES);
  assert.equal(report.structurallyEligibleRows, 1086);
  assert.equal(report.publicationEligibleRows, 0);
  assert.equal(report.publication, "unpublished");
  assert.equal(report.directoryReady, false);
  assert.equal(report.mapReady, false);
  assert.equal(report.disclosureReady, false);
  assert.equal(report.currentStatusReady, false);
  assert.equal(report.currentlyActive, false);
  assert.equal(northCarolinaDirectoryReady(), false);
  assert.equal(northCarolinaMapReady(), false);
  assert.equal(mayRepresentNorthCarolinaRecordAsCurrentlyActive(), false);
});

test("page dates, file clocks, and star-result identifiers are not adopted", () => {
  assert.equal(NORTH_CAROLINA_RECORDED_EXPORT_DATE, null);
  assert.equal(adoptNorthCarolinaExportDate(null), null);
  assert.equal(adoptNorthCarolinaExportDate(NORTH_CAROLINA_LISTINGS_PAGE_UPDATED), null);
  assert.equal(adoptNorthCarolinaExportDate(NORTH_CAROLINA_WORKBOOK_AS_OF), null);
  assert.equal(adoptNorthCarolinaExportDate("2026-10-28"), null);
  assert.equal(adoptNorthCarolinaExportDate("Wed, 28 Oct 2026 17:10:30 GMT"), null);
  assert.equal(northCarolinaDisclosureUrl("HAL-000-000"), null);
  assert.equal(northCarolinaDisclosureUrl("FCL-000-000"), null);
  assert.equal(NORTH_CAROLINA_EXPIRY_BEFORE_OBSERVATION, 5);
  assert.equal(directoryContract("North Carolina")?.publication, "unpublished");
  assert.equal(directoryContract("North Carolina")?.directoryPath, null);
  assert.equal(directoryHref("North Carolina", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("North Carolina"), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

test("the development review does not list facilities or open a public route", () => {
  const page = readFileSync("app/development/north-carolina/page.tsx", "utf8");
  const home = readFileSync("app/page.tsx", "utf8");
  assert.equal(page.includes("North Carolina is unpublished"), true);
  assert.equal(page.includes("not an active home"), true);
  assert.equal(page.includes("not an available placement"), true);
  assert.equal(page.includes("does not list facilities or profile links"), true);
  assert.equal(page.includes("supabase"), false);
  assert.equal(page.includes("fetch("), false);
  assert.equal(page.includes("latitude"), false);
  assert.equal(home.includes("/north-carolina"), false);
  assert.equal(home.includes("/development/north-carolina"), false);
});

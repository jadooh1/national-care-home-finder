import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MICHIGAN_ADDRESS_COUNTS,
  MICHIGAN_ADDRESS_INTERPRETATION,
  MICHIGAN_DESCRIBED_TYPES,
  MICHIGAN_OFFICIAL_VALIDATION,
  MICHIGAN_PROFILE_PREFIX,
  MICHIGAN_RECORDED_EXPORT_DATE,
  MICHIGAN_STREET_TEXT_BY_TYPE,
  MICHIGAN_UNDESCRIBED_TYPE,
  adoptMichiganExportDate,
  michiganDirectoryReady,
  michiganFacilityProfileUrl,
  normalizedZip,
  retainedAddressFields,
  usablePhysicalStreet,
  validateMichiganRoster,
} from "../../../lib/michigan-licensing.ts";
import { MICHIGAN_PROFILE_PREFIX as FRAMEWORK_PREFIX, onboardingProfile, publicPublicationPermitted } from "../../../lib/nationwide-onboarding.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";

const OBSERVED = MICHIGAN_OFFICIAL_VALIDATION;

function row(values: Record<number, string>): string[] {
  const cells = Array.from({ length: 31 }, () => "");
  for (const [index, value] of Object.entries(values)) cells[Number(index)] = value;
  return cells;
}

test("the official Michigan file observation keeps every row and does not assign XH a category", () => {
  const typeTotal = Object.values(OBSERVED.types).reduce((sum, count) => sum + count, 0);
  const statusTotal = Object.values(OBSERVED.statuses).reduce((sum, count) => sum + count, 0);
  assert.equal(typeTotal, OBSERVED.rows);
  assert.equal(statusTotal, OBSERVED.rows);
  assert.equal(OBSERVED.describedRows + OBSERVED.undescribedRows, OBSERVED.rows);
  assert.equal(OBSERVED.types.XH, 234);
  assert.equal(OBSERVED.statuses.EXEMPT, 234);
  assert.equal(MICHIGAN_DESCRIBED_TYPES.some(type => type.code === MICHIGAN_UNDESCRIBED_TYPE), false);
  assert.equal(OBSERVED.fiveDigitZips + OBSERVED.nineDigitZips, OBSERVED.rows);
  assert.equal(OBSERVED.streetBlank + OBSERVED.streetLetterAndDigit, OBSERVED.rows);
  assert.equal(OBSERVED.supplementalLetterAndDigit + OBSERVED.supplementalLetterOnly + OBSERVED.supplementalDigitOnly, OBSERVED.rows);
  assert.equal(OBSERVED.eightDigitDatePairs + OBSERVED.blankDatePairs, OBSERVED.rows);
  assert.equal(OBSERVED.slashDates, 0);
  assert.equal(OBSERVED.isoDates, 0);
  assert.equal(OBSERVED.blankLicenses, 0);
  assert.equal(OBSERVED.duplicateLicenses, 0);
  assert.equal(OBSERVED.profileShapeMatches, OBSERVED.rows);
  assert.equal(OBSERVED.profilePathsRequested, 8);
  assert.equal(OBSERVED.capacityOutsideDescribedRange, 0);
  assert.equal(MICHIGAN_RECORDED_EXPORT_DATE, null);
  assert.equal(michiganDirectoryReady(), false);
});

test("ZIP normalization and profile paths do not change original values or infer an export date", () => {
  const original = row({
    1: "AF",
    2: "AF000000001",
    3: "Synthetic Home",
    4: "1 Example Street",
    6: "Lansing",
    7: "MI",
    8: "489331234",
    10: "6",
    11: "20260101",
    12: "20270101",
    13: "REGULAR",
  });
  const undescribed = row({
    1: "XH",
    2: "XH000000001",
    3: "Synthetic Exempt",
    4: "2 Example Street",
    6: "Lansing",
    7: "MI",
    8: "48933",
    10: "4",
    13: "EXEMPT",
  });
  const outside = row({
    1: "AF",
    2: "AF000000002",
    3: "Synthetic Capacity",
    8: "48933",
    10: "99",
    11: "2026/01/01",
    12: "2026-01-01",
    13: "NONE",
  });
  const before = original[8];
  const report = validateMichiganRoster([original, undescribed, outside, ["short"]]);
  assert.equal(original[8], before);
  assert.equal(report.originalFieldsRewritten, false);
  assert.equal(report.positionalFieldsOk, false);
  assert.equal(report.recordedExportDate, null);
  assert.equal(report.directoryReady, false);
  assert.equal(report.availabilityInferred, false);
  assert.equal(report.coordinateColumns, false);
  assert.equal(report.rows[0].originalZip, "489331234");
  assert.equal(report.rows[0].normalizedZip, "48933");
  assert.equal(normalizedZip("48933"), "48933");
  assert.equal(normalizedZip("4893"), null);
  assert.equal(report.rows[1].typeCode, "XH");
  assert.equal(report.rows[1].describedType, false);
  assert.equal(report.rows[1].originalZip, "48933");
  assert.equal(report.capacityOutsideDescribedRange, 1);
  assert.equal(report.rows[2].typeCode, "AF");
  assert.equal(report.slashDates, 1);
  assert.equal(report.isoDates, 1);
  assert.equal(adoptMichiganExportDate(null, ["20260101"]), null);
  assert.equal(adoptMichiganExportDate("2026-11-09", ["20260101"]), null);
  assert.equal(michiganFacilityProfileUrl("AF000000001"), `${MICHIGAN_PROFILE_PREFIX}AF000000001`);
  assert.equal(MICHIGAN_PROFILE_PREFIX, FRAMEWORK_PREFIX);
  assert.equal(michiganFacilityProfileUrl("af000000001"), null);
});

test("Michigan stays unpublished and the existing states keep their contracts", () => {
  const michigan = onboardingProfile("Michigan");
  assert.equal(publicPublicationPermitted(michigan), false);
  assert.ok(michigan.blockers.includes("street-address-column-is-not-filled-from-the-supplemental-column"));
  assert.ok(michigan.blockers.includes("supplemental-address-is-not-defined-as-a-physical-or-mailing-address"));
  assert.ok(michigan.blockers.includes("nine-digit-zips-are-not-corrected"));
  assert.equal(directoryContract("Michigan")?.publication, "unpublished");
  assert.equal(directoryContract("Michigan")?.directoryPath, null);
  assert.equal(directoryHref("Michigan", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("California")?.directoryPath, null);
  const page = readFileSync(new URL("../../../app/development/michigan/page.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../../../app/page.tsx", import.meta.url), "utf8");
  const source = readFileSync(new URL("../../../lib/michigan-licensing.ts", import.meta.url), "utf8");
  assert.equal(page.includes("Michigan is unpublished"), true);
  assert.equal(page.includes("not an available placement"), true);
  assert.equal(page.includes("No category name is assigned"), true);
  assert.equal(page.includes("original value is not modified"), true);
  assert.equal(page.includes("Publication-eligible records"), true);
  assert.equal(page.includes("not copied into the street column"), true);
  assert.equal(page.includes("supabase"), false);
  assert.equal(page.includes("fetch("), false);
  assert.equal(page.includes("latitude"), false);
  assert.equal(home.includes("/development/michigan"), false);
  assert.equal(home.includes("/michigan"), false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("insert"), false);
});

test("a supplemental value is not copied into a blank street field", () => {
  const described = MICHIGAN_DESCRIBED_TYPES.reduce((sum, type) => sum + MICHIGAN_STREET_TEXT_BY_TYPE[type.code], 0);
  const total = described + MICHIGAN_STREET_TEXT_BY_TYPE.XH;
  assert.equal(MICHIGAN_ADDRESS_INTERPRETATION, "unresolved");
  assert.equal(total, MICHIGAN_ADDRESS_COUNTS.usablePhysicalStreetRows);
  assert.equal(total, OBSERVED.streetLetterAndDigit);
  assert.equal(described, MICHIGAN_ADDRESS_COUNTS.describedUsablePhysicalStreetRows);
  assert.equal(MICHIGAN_STREET_TEXT_BY_TYPE.XH, MICHIGAN_ADDRESS_COUNTS.undescribedStreetTextRows);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.unresolvedBlankStreetRows, OBSERVED.streetBlank);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.usablePhysicalStreetRows + MICHIGAN_ADDRESS_COUNTS.unresolvedBlankStreetRows, OBSERVED.rows);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.publicationEligibleRows, 0);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.supplementalEqualsStreet, 0);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.profileShowsStreetBeforeSupplemental + MICHIGAN_ADDRESS_COUNTS.profileShowsSupplementalBeforeStreet, OBSERVED.streetLetterAndDigit);
  const blank = { street: "", supplemental: "100 Oak Street" };
  const kept = retainedAddressFields(blank);
  assert.equal(kept.usablePhysicalStreet, null);
  assert.equal(kept.publicationEligible, false);
  assert.equal(blank.street, "");
  assert.equal(blank.supplemental, "100 Oak Street");
  assert.equal(usablePhysicalStreet(" 12 Oak Street "), "12 Oak Street");
  assert.equal(usablePhysicalStreet("Oak"), null);
});

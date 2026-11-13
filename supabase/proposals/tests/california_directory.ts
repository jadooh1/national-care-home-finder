import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_ARF_ELIGIBLE_BY_STATUS,
  CALIFORNIA_EXCLUDED_RECORDS,
  CALIFORNIA_FACILITY_SEARCH_LAST_OBSERVED,
  CALIFORNIA_RAW_FILE_DATES,
  CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS,
  CALIFORNIA_RECORDED_EXPORT_DATE,
  californiaDirectoryReady,
  californiaEligibleCount,
  californiaExcludedCount,
  californiaProfileUrl,
  countStatuses,
} from "../../../lib/california-directory.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";

const DEVELOPMENT_URL = "https://ajjsyloyihcqdomywhik.supabase.co";

test("California directory counts stay separated and unpublished", () => {
  assert.equal(countStatuses(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS), 12521);
  assert.equal(countStatuses(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS), 8610);
  assert.equal(californiaEligibleCount(), 21131);
  assert.equal(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS.LICENSED, 7939);
  assert.equal(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS.CLOSED, 3821);
  assert.equal(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS.PENDING, 738);
  assert.equal(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS["ON PROBATION"], 23);
  assert.equal(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS.LICENSED, 6332);
  assert.equal(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS.CLOSED, 1840);
  assert.equal(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS.PENDING, 429);
  assert.equal(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS["ON PROBATION"], 9);
  assert.equal(californiaExcludedCount(), 1889);
  assert.equal(
    CALIFORNIA_EXCLUDED_RECORDS.blankCategory
      + CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory
      + CALIFORNIA_EXCLUDED_RECORDS.shiftedRow,
    1889,
  );
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(californiaProfileUrl(), null);
  assert.equal(CALIFORNIA_RECORDED_EXPORT_DATE, null);
  assert.equal(CALIFORNIA_RAW_FILE_DATES.rcfe, "5252025");
  assert.equal(CALIFORNIA_RAW_FILE_DATES.arf, "05252025");
  assert.equal(CALIFORNIA_FACILITY_SEARCH_LAST_OBSERVED.status, 200);
  assert.equal(CALIFORNIA_FACILITY_SEARCH_LAST_OBSERVED.observedOn, "2026-11-13");
  assert.equal(CALIFORNIA_FACILITY_SEARCH_LAST_OBSERVED.rechecked, true);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryHref("California", DEVELOPMENT_URL), null);
  assert.equal(mapHref("California"), null);
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
});

test("the development review does not list facilities or invent a profile link", () => {
  const page = readFileSync("app/development/california/page.tsx", "utf8");
  const source = readFileSync("lib/california-directory.ts", "utf8");
  assert.equal(page.includes("not an active home"), true);
  assert.equal(page.includes("not an available placement"), true);
  assert.equal(page.includes("California is unpublished"), true);
  assert.equal(page.includes("supabase"), false);
  assert.equal(page.includes("fetch("), false);
  assert.equal(page.includes("latitude"), false);
  assert.equal(page.includes("/washington/map"), false);
  assert.equal(page.includes("carefacilitysearch"), false);
  assert.equal(page.includes("does not list facilities or profile links"), true);
  assert.equal(page.includes("live status text was not the open-data status"), true);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("2025-05-25"), false);
  assert.equal(readFileSync("app/page.tsx", "utf8").includes("/development/california"), false);
  assert.equal(readFileSync("app/page.tsx", "utf8").includes("/california"), false);
});

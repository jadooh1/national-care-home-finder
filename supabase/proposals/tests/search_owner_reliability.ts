import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";

const cities = readFileSync(new URL("../../../app/washington/cities/page.tsx", import.meta.url), "utf8");
const counties = readFileSync(new URL("../../../app/washington/counties/page.tsx", import.meta.url), "utf8");
const demographics = readFileSync(new URL("../../../app/washington/demographics/page.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("../../../app/washington/page.tsx", import.meta.url), "utf8");
const map = readFileSync(new URL("../../../app/washington/map/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");

test("a market query error stays distinct from an empty comparison", () => {
  assert.match(cities, /\.from\("wa_city_market_summary"\)/);
  assert.match(cities, /if \(queryError\) setError\("unavailable"\)/);
  assert.match(counties, /\.from\("wa_county_market_summary"\)/);
  assert.match(counties, /if \(queryError\) setError\("unavailable"\)/);
  assert.match(demographics, /\.from\("wa_zip_market_income"\)/);
  assert.doesNotMatch(cities, /setData\(\[\]\);\s*setError\("unavailable"\)/);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

test("completed search and owner safeguards remain in place", () => {
  assert.match(directory, /params\.get\("q"\)/);
  assert.match(directory, /params\.get\("city"\)/);
  assert.match(directory, /params\.get\("county"\)/);
  assert.match(directory, /\.from\("wa_dshs_listed_facilities"\)/);
  assert.match(map, /washingtonZipFromSearch/);
  assert.match(dashboard, /reduceFacilitySearch\(/);
  assert.match(dashboard, /claimSubmitGate\(/);
  assert.doesNotMatch(dashboard, /searchListedFacilities\(search\)/);
});

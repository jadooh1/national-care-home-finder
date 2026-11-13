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

test("the missing market views are not restored by a guessed definition", () => {
  const assessment = readFileSync(new URL("../../../supabase/proposals/20261113223000_wa_market_summary_views.md", import.meta.url), "utf8");
  assert.match(assessment, /`county_name`, `city_name`, `total_afhs`, `homes_with_capacity`, and `known_licensed_beds`/);
  assert.match(assessment, /`county_name`, `total_afhs`, `cities_represented`, `homes_with_capacity`, and `known_licensed_beds`/);
  assert.match(assessment, /This proposal does not create the views/);
  assert.equal(/^\s*create\s+view\b/im.test(assessment), false);
  assert.match(assessment, /security_invoker = true/);
  assert.match(assessment, /presence = 'absent'/);
});

test("the market summary contract names the listed view and leaves the city key unresolved", () => {
  const source = readFileSync(new URL("../../../supabase/proposals/20261113230000_wa_market_summary_source.md", import.meta.url), "utf8");
  assert.match(source, /Do not execute this design/);
  assert.match(source, /public\.wa_dshs_listed_facilities/);
  assert.match(source, /no county-boundary relation/);
  assert.match(source, /City grouping key: not established/);
  assert.match(source, /cities_represented/);
  assert.match(source, /security_invoker = true/);
  assert.match(source, /presence IS DISTINCT FROM 'absent'/);
  assert.match(source, /count\(licensed_capacity\)/);
  assert.match(source, /coalesce\(sum\(licensed_capacity\), 0\)/);
  assert.equal(/^\s*create\s+view\b/im.test(source), false);
  assert.doesNotMatch(source, /grant\s+select/i);
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

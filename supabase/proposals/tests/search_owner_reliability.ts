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
const detailCopy = readFileSync(new URL("../../../lib/copy/washington-detail.ts", import.meta.url), "utf8");

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

test("the recorded market views match the approved grouping and capacity rules", () => {
  const source = readFileSync(new URL("../../../supabase/proposals/20261113230000_wa_market_summary_source.md", import.meta.url), "utf8");
  assert.match(source, /Do not execute this file again/);
  assert.match(source, /create view public\.wa_city_market_summary/);
  assert.match(source, /create view public\.wa_county_market_summary/);
  assert.match(source, /group by county, \(lower\(btrim\(city\)\)\)/);
  assert.match(source, /min\(btrim\(city\)\) as city_name/);
  assert.match(source, /count\(distinct lower\(btrim\(city\)\)\) filter/);
  assert.match(source, /count\(licensed_capacity\) as homes_with_capacity/);
  assert.match(source, /coalesce\(sum\(licensed_capacity\), 0::bigint\) as known_licensed_beds/);
  assert.match(source, /from public\.wa_dshs_listed_facilities/);
  assert.match(source, /security_invoker = true/);
  assert.match(source, /181 city groups, 35 counties, 6,278 homes, and 36,521 licensed beds/);
  assert.match(source, /anon` and `authenticated` have SELECT only/);
  assert.match(cities, /\.range\(0, 999\)/);
  assert.match(counties, /\.limit\(100\)/);
  assert.equal((source.match(/with \(security_invoker = true\)/g) ?? []).length, 3);
});

test("the county page attributes summaries to stored geographic text", () => {
  assert.match(counties, /\{text\.source\}/);
  assert.match(detailCopy, /County and city summaries are calculated from the stored geographic text in public\.wa_dshs_listed_facilities, not geographic boundary calculations\./);
  assert.match(detailCopy, /Los resúmenes por condado y por ciudad se calculan a partir del texto geográfico almacenado en public\.wa_dshs_listed_facilities, no mediante cálculos de límites geográficos\./);
  assert.doesNotMatch(detailCopy, /derived from geographic points/);
  assert.doesNotMatch(detailCopy, /puntos geográficos/);
  assert.match(counties, /\.from\("wa_county_market_summary"\)/);
  assert.match(counties, /\.limit\(100\)/);
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

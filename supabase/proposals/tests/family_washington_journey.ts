import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  DENSITY_BANDS,
  HOMEPAGE_DIRECTORY_NOTE,
  densityColor,
  facilityProfilePath,
  invalidZipMessage,
  mapResultSummary,
  stateFilterStatus,
  WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP,
  WASHINGTON_MAP_DEFAULT_ZIP,
  WASHINGTON_MARKET_MAX_PAGES,
  WASHINGTON_MARKET_PAGE_SIZE,
  collectWashingtonMarketPages,
  washingtonDemographicsZipQuery,
  washingtonMapPostalOrFilter,
  washingtonMapZipMatch,
  washingtonMarketPageBounds,
  washingtonZipFromSearch,
} from "../../../lib/family-journey.ts";

test("only a numeric license opens a facility profile", () => {
  assert.equal(facilityProfilePath("100001"), "/washington/100001");
  assert.equal(facilityProfilePath(" 100001 "), "/washington/100001");
  assert.equal(facilityProfilePath("ABC109"), null);
  assert.equal(facilityProfilePath("   "), null);
  assert.equal(facilityProfilePath(null), null);
});

test("the homepage empty state is announced and Washington listings are not described as absent", () => {
  assert.equal(stateFilterStatus(0), "No matching states found.");
  assert.equal(stateFilterStatus(1), "");
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("not yet displayed"), false);
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("Washington"), true);
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("labels only"), true);
});

test("an invalid ZIP does not describe the current map as unavailable", () => {
  const summary = mapResultSummary({ zip: "98056", loading: false, error: "", count: 4 });
  assert.equal(summary, "ZIP 98056 — 4 mapped AFHs");
  assert.equal(summary.includes("Data unavailable"), false);
  assert.equal(invalidZipMessage("98056"), "Enter a five-digit ZIP code. The map is still showing ZIP 98056.");
  assert.equal(mapResultSummary({ zip: "98056", loading: false, error: "Unable to retrieve facility map data.", count: 0 }).includes("Data unavailable"), true);
});

test("a five-digit map search matches a stored ZIP and its nine-digit ZIP+4", () => {
  assert.equal(washingtonMapZipMatch("98056", "98056"), true);
  assert.equal(washingtonMapZipMatch("980561234", "98056"), true);
  assert.equal(washingtonMapZipMatch(" 980561234 ", "98056"), true);
  assert.equal(washingtonMapZipMatch("98057", "98056"), false);
  assert.equal(washingtonMapZipMatch("980571234", "98056"), false);
  assert.equal(washingtonMapZipMatch("98056123", "98056"), false);
  assert.equal(washingtonMapZipMatch("98056-1234", "98056"), false);
  assert.equal(washingtonMapZipMatch("", "98056"), false);
  assert.equal(washingtonMapZipMatch(null, "98056"), false);
  assert.equal(washingtonMapZipMatch("98056", "9805"), false);
  assert.equal(washingtonMapZipMatch("98056", "980560"), false);
  assert.equal(
    washingtonMapPostalOrFilter("98056"),
    "postal_code.eq.98056,postal_code.like.98056____",
  );
  const map = readFileSync("app/washington/map/page.tsx", "utf8");
  assert.equal(map.includes("washingtonMapPostalOrFilter"), true);
  assert.equal(map.includes('.eq("postal_code", zip)'), false);
});

test("map and demographics navigation keeps a valid ZIP query", () => {
  assert.equal(washingtonZipFromSearch("98101", WASHINGTON_MAP_DEFAULT_ZIP), "98101");
  assert.equal(washingtonZipFromSearch(" 98101 ", WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98101");
  assert.equal(washingtonZipFromSearch(null, WASHINGTON_MAP_DEFAULT_ZIP), "98056");
  assert.equal(washingtonZipFromSearch(undefined, WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98038");
  assert.equal(washingtonZipFromSearch("", WASHINGTON_MAP_DEFAULT_ZIP), "98056");
  assert.equal(washingtonZipFromSearch("9805", WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98038");
  assert.equal(washingtonZipFromSearch("980560", WASHINGTON_MAP_DEFAULT_ZIP), "98056");
  assert.equal(washingtonZipFromSearch("98056-1234", WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98038");
  assert.equal(washingtonZipFromSearch("980561234", WASHINGTON_MAP_DEFAULT_ZIP), "98056");
  assert.equal(washingtonZipFromSearch("98a56", WASHINGTON_MAP_DEFAULT_ZIP), "98056");
  const map = readFileSync("app/washington/map/page.tsx", "utf8");
  const demographics = readFileSync("app/washington/demographics/page.tsx", "utf8");
  const opportunity = readFileSync("app/washington/opportunity/page.tsx", "utf8");
  assert.equal(map.includes("washingtonZipFromSearch"), true);
  assert.equal(map.includes('get("zip")'), true);
  assert.equal(map.includes("WASHINGTON_MAP_DEFAULT_ZIP"), true);
  assert.equal(map.includes("if (!zip) return;"), true);
  assert.equal(demographics.includes("washingtonZipFromSearch"), true);
  assert.equal(demographics.includes('get("zip")'), true);
  assert.equal(demographics.includes("WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP"), true);
  assert.equal(demographics.includes("/washington/map?zip="), true);
  assert.equal(opportunity.includes("/washington/demographics?zip="), true);
  assert.equal(demographics.includes("washingtonDemographicsZipQuery"), true);
  assert.equal(demographics.includes('.eq("zip_code", selectedZip)'), true);
  assert.equal(opportunity.includes("collectWashingtonMarketPages"), true);
  assert.equal(demographics.includes(".range(0, 499)"), false);
  assert.equal(opportunity.includes(".range(0, 499)"), false);
});

test("a demographics ZIP query accepts only five digits", () => {
  assert.equal(washingtonDemographicsZipQuery("98101"), "98101");
  assert.equal(washingtonDemographicsZipQuery(" 98101 "), "98101");
  assert.equal(washingtonDemographicsZipQuery("98038"), WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP);
  assert.equal(washingtonDemographicsZipQuery("9805"), null);
  assert.equal(washingtonDemographicsZipQuery("980561234"), null);
  assert.equal(washingtonDemographicsZipQuery("98056-1234"), null);
  assert.equal(washingtonDemographicsZipQuery(""), null);
  assert.equal(washingtonDemographicsZipQuery(null), null);
});

test("opportunity pages keep a complete set and hide partial totals", () => {
  const full = Array.from({ length: WASHINGTON_MARKET_PAGE_SIZE }, (_, index) => index);
  const beyond = collectWashingtonMarketPages([{ ok: true, rows: full }, { ok: true, rows: [500] }]);
  assert.equal(beyond.status, "complete");
  assert.equal(beyond.status === "complete" && beyond.rows.length, 501);
  const exactPage = collectWashingtonMarketPages([{ ok: true, rows: full }, { ok: true, rows: [] }]);
  assert.equal(exactPage.status, "complete");
  assert.equal(exactPage.status === "complete" && exactPage.rows.length, 500);
  assert.deepEqual(washingtonMarketPageBounds(0), [0, 499]);
  assert.deepEqual(washingtonMarketPageBounds(1), [500, 999]);
  assert.equal(collectWashingtonMarketPages([{ ok: false }]).status, "unavailable");
  assert.equal(collectWashingtonMarketPages([{ ok: true, rows: full }, { ok: false }]).status, "unavailable");
  const capped = Array.from({ length: WASHINGTON_MARKET_MAX_PAGES }, () => ({ ok: true as const, rows: full }));
  assert.equal(collectWashingtonMarketPages(capped).status, "incomplete");
  const opportunity = readFileSync("app/washington/opportunity/page.tsx", "utf8");
  const demographics = readFileSync("app/washington/demographics/page.tsx", "utf8");
  assert.equal(opportunity.includes('setRows([])'), true);
  assert.equal(opportunity.includes("collected.status"), true);
  assert.equal(demographics.includes("collected.status"), true);
  assert.equal(demographics.includes('setRows([])'), true);
});

test("the concentration legend uses the same colors as the markers", () => {
  assert.equal(densityColor(25), DENSITY_BANDS[0].color);
  assert.equal(densityColor(12), DENSITY_BANDS[1].color);
  assert.equal(densityColor(7), DENSITY_BANDS[2].color);
  assert.equal(densityColor(2), DENSITY_BANDS[3].color);
  assert.equal(DENSITY_BANDS[2].color, "#eab308");
});

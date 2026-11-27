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
  mappedCapacityNote,
  recordedCapacityText,
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
  washingtonCountySearchText,
  washingtonDirectoryPage,
  washingtonDirectoryReturnPath,
  washingtonDirectorySearchPath,
  washingtonFacilityLink,
  washingtonLocationMatches,
  washingtonSearchText,
  washingtonZipFromSearch,
  washingtonZipSearchPath,
} from "../../../lib/family-journey.ts";
import { copy as washingtonDetailCopy } from "../../../lib/copy/washington-detail.ts";

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
  assert.equal(washingtonZipFromSearch("980560", WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98038");
  assert.equal(washingtonZipFromSearch("98056-1234", WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98056");
  assert.equal(washingtonZipFromSearch("98101-9999", WASHINGTON_MAP_DEFAULT_ZIP), "98101");
  assert.equal(washingtonZipFromSearch("980561234", WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP), "98056");
  assert.equal(washingtonZipFromSearch("98a56", WASHINGTON_MAP_DEFAULT_ZIP), "98056");
  const map = readFileSync("app/washington/map/page.tsx", "utf8");
  const demographics = readFileSync("app/washington/demographics/page.tsx", "utf8");
  const opportunity = readFileSync("app/washington/opportunity/page.tsx", "utf8");
  assert.equal(map.includes("washingtonZipFromSearch"), true);
  assert.equal(map.includes("mappedCapacityNote"), true);
  assert.equal(map.includes("text.capacityComplete"), true);
  assert.equal(map.includes("text.notAvailableBeds"), false);
  assert.equal(map.includes("washingtonDisclosureUrl"), true);
  assert.equal(map.includes('get("zip")'), true);
  assert.equal(map.includes("WASHINGTON_MAP_DEFAULT_ZIP"), true);
  assert.equal(map.includes("if (!zip) return;"), true);
  assert.equal(demographics.includes("washingtonZipFromSearch"), true);
  assert.equal(demographics.includes('get("zip")'), true);
  assert.equal(demographics.includes("WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP"), true);
  assert.equal(demographics.includes("/washington/map?zip="), true);
  assert.equal(opportunity.includes("/washington/demographics?zip="), true);
  assert.equal(map.includes("washingtonZipSearchPath"), true);
  assert.equal(map.includes("history.replaceState"), true);
  assert.equal(demographics.includes("washingtonZipSearchPath"), true);
  assert.equal(demographics.includes("history.replaceState"), true);
  const directory = readFileSync("app/washington/washington-directory-client.tsx", "utf8");
  assert.equal(directory.includes("washingtonDirectorySearchPath"), true);
  assert.equal(directory.includes("washingtonDirectoryQueryFromLocation"), true);
  assert.equal(directory.includes("washingtonDirectoryHistoryMode"), true);
  assert.equal(directory.includes("washingtonFacilityLink"), true);
  assert.equal(directory.includes("washingtonCountySearchText"), true);
  assert.equal(directory.includes("history.replaceState"), true);
  assert.equal(directory.includes("history.pushState"), true);
  assert.equal(directory.includes("t.loadingListings"), true);
  assert.equal(directory.includes("t.noMatches"), true);
  assert.equal(directory.includes("t.loadError"), true);
  assert.equal(directory.includes('type="button"'), true);
  assert.equal(directory.includes("t.officialDisclosure"), true);
  assert.equal(demographics.includes("washingtonDemographicsZipQuery"), true);
  assert.equal(demographics.includes('.eq("zip_code", selectedZip)'), true);
  assert.equal(opportunity.includes("collectWashingtonMarketPages"), true);
  assert.equal(demographics.includes(".range(0, 499)"), false);
  assert.equal(opportunity.includes(".range(0, 499)"), false);
});

test("recorded capacity is not labeled as current residents or unavailable beds", () => {
  assert.equal(recordedCapacityText(6), "6");
  assert.equal(recordedCapacityText(6).includes("residents"), false);
  assert.equal(recordedCapacityText(null), "Not available");
  assert.equal(mappedCapacityNote({
    ready: false,
    missing: 0,
    missingLabel: (count) => `${count} home(s) missing capacity`,
    completeLabel: "Recorded for every mapped home",
  }), "");
  assert.equal(mappedCapacityNote({
    ready: true,
    missing: 0,
    missingLabel: (count) => `${count} home(s) missing capacity`,
    completeLabel: "Recorded for every mapped home",
  }), "Recorded for every mapped home");
  assert.equal(mappedCapacityNote({
    ready: true,
    missing: 2,
    missingLabel: (count) => `${count} home(s) missing capacity`,
    completeLabel: "Recorded for every mapped home",
  }), "2 home(s) missing capacity");
  assert.equal(washingtonDetailCopy.en.map.capacityComplete.includes("Not available beds"), false);
  assert.equal(washingtonDetailCopy.en.profile.capacityValue(6).includes("residents"), false);
  assert.equal(washingtonDetailCopy.es.profile.capacityValue(6).includes("residentes"), false);
  const profile = readFileSync("app/washington/[license]/washington-facility-profile-client.tsx", "utf8");
  assert.equal(profile.includes("recordedCapacityText"), true);
});

test("directory and ZIP searches keep the visible query in the address", () => {
  assert.equal(washingtonSearchText("  Yakima! "), "Yakima");
  assert.equal(washingtonDirectorySearchPath({}), "/washington");
  assert.equal(washingtonDirectorySearchPath({ q: "Seattle", city: "  ", county: null }), "/washington?q=Seattle");
  assert.equal(washingtonDirectorySearchPath({ q: "Oak Harbor", city: "Oak Harbor", county: "Island" }), "/washington?q=Oak+Harbor&city=Oak+Harbor&county=Island");
  assert.equal(washingtonCountySearchText("Pierce County"), "Pierce");
  assert.equal(washingtonCountySearchText("  king county "), "king");
  assert.equal(washingtonCountySearchText("Condado de Pierce"), "Pierce");
  assert.equal(washingtonCountySearchText("Island"), "Island");
  assert.equal(washingtonDirectorySearchPath({ county: "Pierce County" }), "/washington?county=Pierce");
  assert.equal(washingtonDirectorySearchPath({ county: "Condado de Pierce" }), "/washington?county=Pierce");
  assert.equal(washingtonDirectoryPage("2"), 1);
  assert.equal(washingtonDirectoryPage("1"), 0);
  assert.equal(washingtonDirectoryPage("0"), 0);
  assert.equal(washingtonDirectorySearchPath({ city: "Seattle", page: 0 }), "/washington?city=Seattle");
  assert.equal(washingtonDirectorySearchPath({ city: "Seattle", page: 1 }), "/washington?city=Seattle&page=2");
  assert.equal(washingtonDirectoryReturnPath("/washington?city=Seattle&page=2"), "/washington?city=Seattle&page=2");
  assert.equal(washingtonDirectoryReturnPath("/washington?city=Seattle&page=2&next=/owner"), "/washington?city=Seattle&page=2");
  assert.equal(washingtonDirectoryReturnPath("https://evil.example/washington?city=Seattle"), null);
  assert.equal(washingtonDirectoryReturnPath("//evil.example/washington"), null);
  assert.equal(washingtonDirectoryReturnPath("/washington/100001"), null);
  assert.equal(washingtonFacilityLink("/washington/100001", "/washington?city=Seattle&page=2"), "/washington/100001?from=%2Fwashington%3Fcity%3DSeattle%26page%3D2");
  assert.equal(washingtonDirectoryReturnPath(decodeURIComponent("%2Fwashington%3Fcity%3DSeattle%26page%3D2")), "/washington?city=Seattle&page=2");
  const profile = readFileSync("app/washington/[license]/washington-facility-profile-client.tsx", "utf8");
  assert.equal(profile.includes("washingtonDirectoryReturnPath"), true);
  assert.equal(profile.includes('href="/washington"'), false);
  assert.equal(washingtonLocationMatches("/washington?city=Yakima&county=Yakima", washingtonDirectorySearchPath({ city: "Yakima", county: "Yakima" })), true);
  assert.equal(washingtonLocationMatches("/washington?q=Oak%20Harbor", washingtonDirectorySearchPath({ q: "Oak Harbor" })), true);
  assert.equal(washingtonLocationMatches("/washington?q=Seattle", "/washington"), false);
  assert.equal(washingtonZipSearchPath("/washington/map", "99208"), "/washington/map?zip=99208");
  assert.equal(washingtonZipSearchPath("/washington/demographics", " 98038 "), "/washington/demographics?zip=98038");
  assert.equal(washingtonZipSearchPath("/washington/map", "9920"), null);
  assert.equal(washingtonZipSearchPath("/washington/map", "99208-1234"), null);
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

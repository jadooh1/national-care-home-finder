import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ODHS_PROVIDER_SEARCH_URL } from "../../../lib/oregon-odhs-roster.ts";
import {
  DEVELOPMENT_DIRECTORY_HOST,
  OREGON_EXCLUDED_ZERO_BED_HOMES,
  OREGON_LICENSED_BEDS,
  OREGON_LISTED_COUNT,
  OREGON_ODHS_PROVIDER_SEARCH,
  STATE_NAMES,
  WASHINGTON_DSHS_LOCATOR,
  WASHINGTON_LISTED_COUNT,
  WASHINGTON_SOURCE_LABEL,
  WASHINGTON_SOURCE_RETRIEVED_ON,
  directoryContract,
  directoryHref,
  mapHref,
  oregonDisclosureUrl,
  oregonRefreshReady,
  washingtonDisclosureUrl,
} from "../../../lib/state-directory.ts";

const developmentUrl = `https://${DEVELOPMENT_DIRECTORY_HOST}`;
const productionUrl = "https://yiehgstweswxjakbcdzc.supabase.co";

test("the state list stays fifty names and only Washington is public", () => {
  assert.equal(STATE_NAMES.length, 50);
  assert.equal(new Set(STATE_NAMES).size, 50);
  assert.equal(directoryContract("Guam"), null);
  const publications = STATE_NAMES.map(name => directoryContract(name)?.publication);
  assert.equal(publications.filter(status => status === "public").length, 1);
  assert.equal(publications.filter(status => status === "development").length, 1);
  assert.equal(publications.filter(status => status === "unpublished").length, 48);
});

test("production opens Washington only and development also opens Oregon", () => {
  for (const url of [productionUrl, developmentUrl, "not a url"]) {
    assert.equal(directoryHref("Washington", url), "/washington");
    assert.equal(directoryHref("California", url), null);
    assert.equal(directoryHref("Texas", url), null);
    assert.equal(directoryHref("Florida", url), null);
  }
  assert.equal(directoryHref("Oregon", productionUrl), null);
  assert.equal(directoryHref("Oregon", `${developmentUrl}.example`), null);
  assert.equal(directoryHref("Oregon", developmentUrl), "/oregon");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("California")?.locatorUrl, null);
});

test("maps stay on Washington and Oregon search does not ask for an address", () => {
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.equal(mapHref("Oregon"), null);
  assert.equal(mapHref("California"), null);
  assert.deepEqual(directoryContract("Washington")?.searchFields, ["name", "city", "zip", "license"]);
  assert.deepEqual(directoryContract("Oregon")?.searchFields, ["name", "city", "county"]);
  assert.equal(directoryContract("Oregon")?.searchFields.includes("license"), false);
  assert.equal(directoryContract("Oregon")?.searchFields.includes("street"), false);
  assert.deepEqual(directoryContract("Idaho")?.searchFields, []);
});

test("disclosure links stay on the official Washington and Oregon sources", () => {
  assert.equal(WASHINGTON_DSHS_LOCATOR, "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx");
  assert.equal(
    washingtonDisclosureUrl("758500"),
    "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=758500",
  );
  assert.equal(washingtonDisclosureUrl(" ABC109 "), null);
  assert.equal(washingtonDisclosureUrl(""), null);
  assert.equal(OREGON_ODHS_PROVIDER_SEARCH, ODHS_PROVIDER_SEARCH_URL);
  assert.equal(oregonDisclosureUrl("0000000183"), "https://ltclicensing.oregon.gov/Providers/Details/0000000183");
  assert.equal(oregonDisclosureUrl("../facilities"), null);
  assert.equal(oregonDisclosureUrl("x".repeat(33)), null);
});

test("freshness keeps the Washington download date and does not invent an Oregon date", () => {
  const washington = directoryContract("Washington");
  const oregon = directoryContract("Oregon");
  assert.equal(washington?.retrievedOn, WASHINGTON_SOURCE_RETRIEVED_ON);
  assert.equal(WASHINGTON_SOURCE_LABEL, "November 9, 2026");
  assert.equal(washington?.liveCheck, false);
  assert.equal(oregon?.retrievedOn, null);
  assert.equal(oregon?.liveCheck, false);
  assert.equal(oregonRefreshReady(), false);
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);
  assert.equal(OREGON_LISTED_COUNT, 1584);
  assert.equal(OREGON_LICENSED_BEDS, 7346);
  assert.equal(OREGON_EXCLUDED_ZERO_BED_HOMES, 20);
  const directory = readFileSync("lib/copy/washington-directory.ts", "utf8");
  const detail = readFileSync("lib/copy/washington-detail.ts", "utf8");
  assert.equal(directory.includes(`downloaded ${WASHINGTON_SOURCE_LABEL}`), true);
  assert.equal(detail.includes(`from ${WASHINGTON_SOURCE_LABEL}`), true);
  const oregonCopy = readFileSync("lib/copy/oregon.ts", "utf8");
  assert.equal(oregonCopy.includes("November"), false);
  assert.equal(oregonCopy.includes("2026"), false);
});

test("pages use the shared directory contract and do not publish another state", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  const washingtonDirectory = readFileSync("app/washington/page.tsx", "utf8");
  const washingtonProfile = readFileSync("app/washington/[license]/page.tsx", "utf8");
  const oregonDirectory = readFileSync("app/oregon/page.tsx", "utf8");
  const oregonProfile = readFileSync("app/oregon/[sourceId]/page.tsx", "utf8");
  assert.equal(home.includes("directoryHref"), true);
  assert.equal(home.includes("STATE_NAMES"), true);
  assert.equal(washingtonDirectory.includes("WASHINGTON_DSHS_LOCATOR"), true);
  assert.equal(washingtonProfile.includes("washingtonDisclosureUrl"), true);
  assert.equal(oregonDirectory.includes("OREGON_ODHS_PROVIDER_SEARCH"), true);
  assert.equal(oregonProfile.includes("OREGON_ODHS_PROVIDER_SEARCH"), true);
  for (const source of [oregonDirectory, oregonProfile]) {
    assert.equal(source.includes("/washington/map"), false);
    assert.equal(source.includes("google.com/maps"), false);
  }
  assert.equal(readFileSync("lib/state-directory.ts", "utf8").includes("stripe"), false);
});

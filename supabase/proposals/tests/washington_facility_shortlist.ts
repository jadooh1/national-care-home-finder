import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy } from "../../../lib/copy/washington-directory.ts";
import { washingtonDisclosureUrl } from "../../../lib/state-directory.ts";
import { washingtonFacilityLink } from "../../../lib/family-journey.ts";
import {
  WASHINGTON_SHORTLIST_LIMIT,
  WASHINGTON_SHORTLIST_STORAGE_KEY,
  addWashingtonShortlist,
  readWashingtonShortlist,
  removeWashingtonShortlist,
  washingtonShortlistItem,
  writeWashingtonShortlist,
} from "../../../lib/washington-shortlist.ts";

function memory() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}

function home(license: string, name: string, capacity: number | null = 6, status = "source_matched") {
  return washingtonShortlistItem({
    license,
    name,
    addressLine: "100 Example Street",
    city: "Example City",
    county: "Example",
    stateCode: "WA",
    postalCode: "98000",
    licensedCapacity: capacity,
    recordStatus: status,
  });
}

test("a shortlist keeps three public facility facts and drops anything else", () => {
  const first = home("100001", "Example Home A", 4, "verified");
  const second = home("100002", "Example Home B");
  const third = home("100003", "Example Home C", null);
  const fourth = home("100004", "Example Home D");
  assert.ok(first && second && third && fourth);
  assert.equal(WASHINGTON_SHORTLIST_LIMIT, 3);
  let items = addWashingtonShortlist([], first).items;
  items = addWashingtonShortlist(items, second).items;
  const full = addWashingtonShortlist(addWashingtonShortlist(items, third).items, fourth);
  assert.equal(full.status, "full");
  assert.deepEqual(full.items.map(item => item.license), ["100001", "100002", "100003"]);
  assert.equal(addWashingtonShortlist(full.items, first).status, "present");
  assert.equal(addWashingtonShortlist(full.items, washingtonShortlistItem({ license: "ABC", name: "Example" })).status, "invalid");
  assert.equal(full.items[0].licensedCapacity, 4);
  assert.equal(full.items[0].recordStatus, "verified");
  assert.equal(full.items[2].licensedCapacity, null);
  assert.equal(full.items[2].recordStatus, "unverified");
  assert.equal("vacancies" in full.items[0], false);
  assert.equal("price" in full.items[0], false);
  const removed = removeWashingtonShortlist(full.items, "100002");
  assert.deepEqual(removed.map(item => item.license), ["100001", "100003"]);
});

test("stored comparison data stays in this tab and ignores injected fields", () => {
  const storage = memory();
  const item = home("100001", "Example Home");
  assert.ok(item);
  writeWashingtonShortlist(storage, [item]);
  const raw = storage.getItem(WASHINGTON_SHORTLIST_STORAGE_KEY) ?? "";
  assert.equal(raw.includes("price"), false);
  assert.equal(raw.includes("vacancy"), false);
  storage.setItem(WASHINGTON_SHORTLIST_STORAGE_KEY, JSON.stringify([
    { license: "100001", name: "Example Home", price: 9000, vacancies: 2, recordStatus: "verified", licensedCapacity: 6 },
    { license: "nope", name: "Skipped" },
    { license: "100001", name: "Duplicate" },
    { license: "100002", name: "Second Example" },
    { license: "100003", name: "Third Example" },
    { license: "100004", name: "Fourth Example" },
  ]));
  const read = readWashingtonShortlist(storage);
  assert.deepEqual(read.map(entry => entry.license), ["100001", "100002", "100003"]);
  assert.equal("price" in read[0], false);
  assert.equal("vacancies" in read[0], false);
  assert.equal(read[0].recordStatus, "verified");
  writeWashingtonShortlist(storage, []);
  assert.equal(storage.getItem(WASHINGTON_SHORTLIST_STORAGE_KEY), null);
  storage.setItem(WASHINGTON_SHORTLIST_STORAGE_KEY, "{");
  assert.deepEqual(readWashingtonShortlist(storage), []);
});

test("the directory comparison keeps search context and official links only", () => {
  assert.equal(
    washingtonFacilityLink("/washington/100001", "/washington?city=Example&page=2"),
    "/washington/100001?from=%2Fwashington%3Fcity%3DExample%26page%3D2",
  );
  assert.equal(
    washingtonDisclosureUrl("100001"),
    "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=100001",
  );
  assert.equal(copy.en.compareCount(2), "2 of 3 selected");
  assert.equal(copy.es.compareCount(2), "2 de 3 seleccionados");
  assert.match(copy.en.compareLead, /Available vacancies are not shown/);
  assert.match(copy.es.compareLead, /Las vacantes disponibles no se muestran/);
  assert.equal(copy.en.vacanciesNotShown, "Not shown");
  assert.equal(copy.es.vacanciesNotShown, "No se muestran");
  assert.equal(copy.en.verified, "Independently verified listing");
  assert.equal(copy.es.unverified, "Coincidencia del número de licencia de DSHS — no verificado de forma independiente");
  const directory = readFileSync("app/washington/washington-directory-client.tsx", "utf8");
  const shortlist = readFileSync("lib/washington-shortlist.ts", "utf8");
  const home = readFileSync("lib/copy/home.ts", "utf8");
  const profile = readFileSync("app/washington/[license]/washington-facility-profile-client.tsx", "utf8");
  assert.match(directory, /addWashingtonShortlist/);
  assert.match(directory, /removeWashingtonShortlist/);
  assert.match(directory, /writeWashingtonShortlist\(window\.sessionStorage/);
  assert.match(directory, /washingtonFacilityLink\(profile, directoryPath\)/);
  assert.match(directory, /washingtonDisclosureUrl\(item\.license\)/);
  assert.match(directory, /t\.vacanciesNotShown/);
  assert.match(directory, /t\.licensedCapacity/);
  assert.match(directory, /washingtonDirectorySearchPath/);
  assert.doesNotMatch(directory, /wa_afh_premium_owner_content|wa_afh_published_owner_content|wa_afh_claimed_owner_content/);
  assert.doesNotMatch(shortlist, /supabase|wa_afh_|price|vacancy/);
  assert.match(profile, /publicOwnerContentView/);
  assert.match(profile, /ownerClaimHref\(facility\.license_number\)/);
  assert.match(home, /Find the right care home for your loved one/);
});

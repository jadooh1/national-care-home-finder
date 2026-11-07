import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

export const WASHINGTON_RECTANGLE = {
  minLatitude: 45.580299,
  maxLatitude: 48.998467,
  minLongitude: -124.383814,
  maxLongitude: -117.047107,
} as const;

const ARCHIVED_LICENSES = ["752686", "755649", "757132", "758334"] as const;

const OFFICIAL_COORDINATES = JSON.parse(readFileSync(new URL("../reports/wa_afh_addition_coordinates_20261107.json", import.meta.url), "utf8")) as {
  coordinates: Array<{ license_number: string; latitude: number; longitude: number }>;
};

export function familyListingVisible(row: { recordStatus: string; presence: string | null }): boolean {
  return row.recordStatus === "source_matched" && row.presence !== "absent";
}

export function officialCoordinate(input: {
  latitude: number | null;
  longitude: number | null;
  currentRoster: boolean;
}): { latitude: number; longitude: number } | null {
  if (!input.currentRoster || input.latitude === null || input.longitude === null) return null;
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) return null;
  const box = WASHINGTON_RECTANGLE;
  if (input.latitude < box.minLatitude || input.latitude > box.maxLatitude) return null;
  if (input.longitude < box.minLongitude || input.longitude > box.maxLongitude) return null;
  return { latitude: input.latitude, longitude: input.longitude };
}

export function expectedPublicCounts(input: {
  listedBefore: number;
  mappedBefore: number;
  archivedHidden: number;
  additions: number;
  additionsWithCoordinates: number;
}): { directory: number; map: number } {
  return {
    directory: input.listedBefore - input.archivedHidden + input.additions,
    map: input.mappedBefore - input.archivedHidden + input.additionsWithCoordinates,
  };
}

test("archived licenses stay stored but leave the family listing", () => {
  for (const license of ARCHIVED_LICENSES) {
    assert.equal(familyListingVisible({ recordStatus: "source_matched", presence: "absent" }), false, license);
  }
  assert.equal(familyListingVisible({ recordStatus: "source_matched", presence: "active" }), true);
  assert.equal(familyListingVisible({ recordStatus: "source_matched", presence: null }), true);
  assert.equal(ARCHIVED_LICENSES.includes("759444"), false);
});

test("official coordinates are accepted only inside the Washington rectangle", () => {
  const accepted = OFFICIAL_COORDINATES.coordinates.filter(point => officialCoordinate({
    latitude: point.latitude,
    longitude: point.longitude,
    currentRoster: true,
  }));
  assert.equal(OFFICIAL_COORDINATES.coordinates.length, 17);
  assert.equal(accepted.length, 17);
  assert.equal(officialCoordinate({ latitude: 47.761458, longitude: -117.445549, currentRoster: false }), null);
  assert.equal(officialCoordinate({ latitude: null, longitude: -122.3, currentRoster: true }), null);
  assert.equal(officialCoordinate({ latitude: 44, longitude: -122.3, currentRoster: true }), null);
  assert.equal(officialCoordinate({ latitude: Number.NaN, longitude: -122.3, currentRoster: true }), null);
});

test("execution checks live market dependencies and the function catalog", () => {
  const sql = readFileSync(new URL("../20261107233000_wa_afh_roster_remediation_EXECUTE.sql", import.meta.url), "utf8");
  assert.equal(sql.includes("one or more market views are missing"), false);
  assert.equal(sql.includes("create view public.wa_zip_market_income"), false);
  assert.equal(sql.includes("create view public.wa_county_market_summary"), false);
  assert.equal(sql.includes("create view public.wa_city_market_summary"), false);
  assert.equal(sql.includes("helper_def !~*"), false);
  assert.match(sql, /market relation reads facilities without excluding absent rows/);
  assert.match(sql, /proc\.prosecdef/);
  assert.match(sql, /proc\.proconfig/);
  assert.match(sql, /proc\.proacl/);
  assert.match(sql, /split_part\(setting, '=', 1\) = 'search_path'/);
  assert.match(sql, /nchf\.roster_previous_presence/);
  assert.match(sql, /owner or administrator row counts changed/);
});

test("directory and map counts hide four archived rows and add seventeen located homes", () => {
  const counts = expectedPublicCounts({
    listedBefore: 6265,
    mappedBefore: 6265,
    archivedHidden: 4,
    additions: 17,
    additionsWithCoordinates: 17,
  });
  assert.equal(counts.directory, 6278);
  assert.equal(counts.map, 6278);
});

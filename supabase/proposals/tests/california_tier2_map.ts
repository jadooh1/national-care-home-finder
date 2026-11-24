import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER2_MAP_SCOPE,
  californiaTier2MapCoverageSummary,
  californiaTier2MapPath,
  californiaTier2PublicMapEnabled,
  loadCaliforniaTier2MapCoverage,
  searchCaliforniaTier2MapPoints,
} from "../../../lib/california-tier2-map.ts";
import { loadCaliforniaTier1FullRosterCompact } from "../../../lib/california-tier1-full-roster.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { PRIVATE_INDEX_PREFIXES, sitemapPaths } from "../../../lib/public-indexing.ts";
import { WASHINGTON_PUBLIC_PAGES } from "../../../lib/public-indexing.ts";

const FIXTURE = "supabase/proposals/fixtures/california-tier2-map";

test("Tier 2 map stays development-only; public CA map and owner off", () => {
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.publicMapEnabled, false);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.publicMapPath, null);
  assert.equal(CALIFORNIA_TIER2_MAP_SCOPE.californiaPublished, false);
  assert.equal(californiaTier2PublicMapEnabled(), false);
  assert.equal(californiaTier2MapPath(), "/development/california/map");
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  assert.equal(existsSync("app/california"), false);
  assert.equal(existsSync("app/development/california/map/page.tsx"), true);
  const paths = sitemapPaths(true, ["100001"]);
  assert.equal(paths.includes("/development/california/map"), false);
  assert.equal(paths.includes("/california"), false);
  assert.ok(paths.includes("/washington/map"));
});

test("coverage fixture matches Phase 8 exact-ID accounting against 15435", () => {
  const coverage = loadCaliforniaTier2MapCoverage();
  const summary = californiaTier2MapCoverageSummary();
  const roster = loadCaliforniaTier1FullRosterCompact();
  assert.equal(roster.length, 15435);
  assert.equal(coverage.roster.listableCount, 15435);
  assert.equal(coverage.matching.eligibleCount, 15435);
  assert.equal(coverage.matching.exactMatchWithValidCoords, 14058);
  assert.equal(coverage.matching.leadingZeroCollapsedUniqueWithValidCoords, 1361);
  assert.equal(coverage.matching.usableOfficialCoords, 15419);
  assert.equal(coverage.matching.unmatched, 16);
  assert.equal(coverage.matching.ambiguousRejected, 0);
  assert.equal(coverage.matching.gisCoordsMissingOrInvalid, 0);
  assert.equal(coverage.source.fabricatedCoordinates, 0);
  assert.equal(coverage.source.geocoded, false);
  assert.equal(coverage.source.cdssAuthoritative, true);
  assert.equal(coverage.mapPoints.publicMapEnabled, false);
  assert.equal(coverage.mapPoints.publicMapPath, null);
  assert.equal(summary.exact, 14058);
  assert.equal(summary.usable, 15419);
  assert.equal(summary.unmatched, 16);
  assert.ok(Math.abs(summary.exactRate - 14058 / 15435) < 1e-12);
  assert.ok(Math.abs(summary.usableRate - 15419 / 15435) < 1e-12);

  const points = JSON.parse(readFileSync(`${FIXTURE}/points.json`, "utf8")) as Array<{
    n: string;
    lat: number;
    lon: number;
    kind: "e" | "z";
  }>;
  assert.equal(points.length, 15419);
  assert.equal(points.filter((p) => p.kind === "e").length, 14058);
  assert.equal(points.filter((p) => p.kind === "z").length, 1361);
  assert.ok(points.every((p) => /^\d{8,9}$/.test(p.n)));
  assert.ok(
    points.every(
      (p) =>
        Number.isFinite(p.lat)
        && Number.isFinite(p.lon)
        && !(p.lat === 0 && p.lon === 0),
    ),
  );

  const rosterIds = new Set(roster.map((r) => r.n));
  assert.ok(points.every((p) => rosterIds.has(p.n)));

  const unmatched = JSON.parse(
    readFileSync(`${FIXTURE}/unmatched-ids.json`, "utf8"),
  ) as string[];
  assert.equal(unmatched.length, 16);
  assert.ok(unmatched.every((id) => rosterIds.has(id)));
  assert.ok(unmatched.every((id) => !points.some((p) => p.n === id)));

  const ambiguous = JSON.parse(
    readFileSync(`${FIXTURE}/ambiguous-ids.json`, "utf8"),
  ) as string[];
  assert.equal(ambiguous.length, 0);
});

test("search requires a filter; zip and category return verified profiles + CDSS links", () => {
  const empty = searchCaliforniaTier2MapPoints({});
  assert.equal(empty.filterActive, false);
  assert.equal(empty.points.length, 0);
  assert.equal(empty.coverage.mapPoints.count, 15419);

  const byZip = searchCaliforniaTier2MapPoints({ zip: "92691" });
  assert.equal(byZip.filterActive, true);
  assert.ok(byZip.totalMatched >= 1);
  assert.ok(byZip.points.every((p) => p.postalCode === "92691"));
  assert.ok(byZip.points.every((p) => p.disclosureUrl?.includes("FacDetail/")));
  assert.ok(
    byZip.points.every((p) => p.profilePath?.startsWith("/development/california/")),
  );

  const rcfe = searchCaliforniaTier2MapPoints({ category: "RCFE", zip: "92691" });
  assert.ok(rcfe.points.every((p) => p.category === "RCFE"));

  const exactSample = searchCaliforniaTier2MapPoints({ q: "306006899" });
  assert.equal(exactSample.totalMatched, 1);
  assert.equal(exactSample.points[0]?.facilityNumber, "306006899");
  assert.equal(exactSample.points[0]?.matchKind, "exact");
});

test("Washington public map and sitemap remain intact", () => {
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.ok(WASHINGTON_PUBLIC_PAGES.some((p) => p.path === "/washington/map"));
  assert.ok(sitemapPaths(true, []).includes("/washington/map"));
});

test("Oregon production fail-closed layout reconciled onto development baseline", () => {
  const layout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(layout.includes("PUBLIC_PRODUCTION_HOSTS"));
  assert.ok(layout.includes("notFound()"));
  assert.ok(layout.includes('vercelEnv === "production"'));
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

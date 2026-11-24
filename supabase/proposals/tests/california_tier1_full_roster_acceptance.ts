import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS,
  buildCaliforniaTier1FullRosterPreview,
  californiaTier1FullRosterDisclosureUrl,
  californiaTier1FullRosterIsResidual,
  californiaTier1FullRosterListingGate,
  californiaTier1FullRosterLookup,
  californiaTier1FullRosterSearch,
  loadCaliforniaTier1FullRosterCompact,
  loadCaliforniaTier1FullRosterManifest,
} from "../../../lib/california-tier1-full-roster.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import {
  DIRECTORY_VIEW,
  PRIVATE_INDEX_PREFIXES,
  sitemapPaths,
} from "../../../lib/public-indexing.ts";

const DEVELOPMENT_URL = "https://ajjsyloyihcqdomywhik.supabase.co";
const PRODUCTION_URL = "https://yiehgstweswxjakbcdzc.supabase.co";

const ACCEPTANCE_BASELINE = "deafabb";
const BUDGETS = {
  searchP95Ms: 50,
  lookupP95Ms: 5,
  previewP95Ms: 50,
} as const;

function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? 0;
}

function timeMs(fn: () => void, n = 20): { p50: number; p95: number } {
  fn();
  const samples: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return { p50: percentile(samples, 50), p95: percentile(samples, 95) };
}

test("acceptance baseline deafabb/#215; protected RC; public STOP", () => {
  assert.equal(ACCEPTANCE_BASELINE, "deafabb");
  assert.equal(directoryContract("California")?.publication, "development");
  assert.equal(directoryHref("California", DEVELOPMENT_URL), "/california");
  assert.equal(directoryHref("California", PRODUCTION_URL), null);
  assert.equal(californiaTier1FullRosterListingGate({
    facilityNumber: "092700093",
    surface: "search",
  }).allowed, true);
});

test("search, city, category, and pagination accuracy at statewide scale", () => {
  const page1 = californiaTier1FullRosterSearch({ page: 1, pageSize: 25 });
  assert.equal(page1.results.length, 25);
  assert.equal(page1.pageCount, 618);
  assert.equal(page1.total, 15435);

  const page2 = californiaTier1FullRosterSearch({ page: 2, pageSize: 25 });
  assert.equal(page2.page, 2);
  assert.equal(page2.results.length, 25);
  assert.equal(
    page1.results.some((r) =>
      page2.results.some((x) => x.facilityNumber === r.facilityNumber)
    ),
    false,
  );

  const last = californiaTier1FullRosterSearch({ page: 99999, pageSize: 25 });
  assert.equal(last.page, 618);
  assert.equal(last.results.length, 10);

  const sunshine = californiaTier1FullRosterSearch({ q: "sunshine manor" });
  assert.ok(sunshine.total >= 1);
  assert.ok(
    sunshine.results.some((r) => r.facilityNumber === "092700093"),
  );

  const byLicense = californiaTier1FullRosterSearch({ q: "092700093" });
  assert.equal(byLicense.total, 1);

  const la = californiaTier1FullRosterSearch({
    city: "Los Angeles",
    pageSize: 50,
  });
  assert.ok(la.total >= 100);
  assert.ok(
    la.results.every((r) =>
      (r.city ?? "").toLowerCase().includes("los angeles")
    ),
  );

  const rcfe = californiaTier1FullRosterSearch({ category: "RCFE", pageSize: 25 });
  const arf = californiaTier1FullRosterSearch({ category: "ARF", pageSize: 25 });
  assert.ok(rcfe.results.every((r) => r.category === "RCFE"));
  assert.ok(arf.results.every((r) => r.category === "ARF"));
  assert.equal(rcfe.total + arf.total, 15435);
});

test("roster integrity: exact IDs, capacity, disclosure URLs", () => {
  const manifest = loadCaliforniaTier1FullRosterManifest();
  const compact = loadCaliforniaTier1FullRosterCompact();
  assert.equal(compact.length, 15435);
  assert.equal(manifest.listableCount, 15435);
  assert.equal(manifest.sourceAsOfIso, "2026-11-22");
  assert.equal(new Set(compact.map((r) => r.n)).size, 15435);
  assert.ok(compact.every((r) => /^\d{8,9}$/.test(r.n)));
  assert.ok(
    compact.every((r) => r.cap != null && String(r.cap).trim() !== ""),
  );

  const known = californiaTier1FullRosterLookup("092700093");
  assert.equal(known.ok, true);
  if (known.ok) {
    assert.equal(known.facility.approvedLicensedCapacity, "14");
    assert.ok(known.facility.disclosureUrl.includes("FacDetail/092700093"));
  }

  const leadingZero = californiaTier1FullRosterLookup("019200874");
  assert.equal(leadingZero.ok, true);
  if (leadingZero.ok) {
    assert.equal(leadingZero.facility.facilityNumber, "019200874");
    assert.equal(leadingZero.facility.leadingZero, true);
  }

  for (const id of ["", "95354", "abc", "00000000", "1234567890"]) {
    assert.equal(californiaTier1FullRosterLookup(id).ok, false, id);
  }

  for (const id of ["092700093", "019200874", "361800222"]) {
    assert.equal(
      californiaTier1FullRosterDisclosureUrl(id)?.includes(`FacDetail/${id}`),
      true,
      id,
    );
  }
});

test("all 22 residual exclusions and truncation aliases fail closed", () => {
  const compact = loadCaliforniaTier1FullRosterCompact();
  assert.equal(CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS.length, 22);

  for (const id of CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS) {
    assert.equal(compact.some((r) => r.n === id), false, id);
    assert.equal(californiaTier1FullRosterIsResidual(id), true, id);
    assert.equal(californiaTier1FullRosterLookup(id).ok, false, id);
    assert.equal(californiaTier1FullRosterSearch({ q: id }).total, 0, id);
    assert.equal(
      californiaTier1FullRosterListingGate({
        facilityNumber: id,
        surface: "detail-page",
      }).allowed,
      false,
      id,
    );
    assert.equal(
      californiaTier1FullRosterListingGate({
        facilityNumber: id,
        surface: "map",
      }).allowed,
      false,
      id,
    );

    if (id.startsWith("0")) {
      const trunc = id.slice(1);
      assert.equal(californiaTier1FullRosterIsResidual(trunc), true, trunc);
      assert.equal(californiaTier1FullRosterLookup(trunc).ok, false, trunc);
      assert.equal(
        californiaTier1FullRosterSearch({ q: trunc }).total,
        0,
        trunc,
      );
    }
  }
});

test("California protected preview surfaces; map/owner/api/sitemap stay blocked", () => {
  assert.equal(directoryContract("California")?.publication, "development");
  assert.equal(directoryHref("California", DEVELOPMENT_URL), "/california");
  assert.equal(directoryHref("California", PRODUCTION_URL), null);
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(DIRECTORY_VIEW, "wa_dshs_listed_facilities");
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/california"));
  assert.equal(sitemapPaths(true, ["123"]).includes("/california"), false);

  for (const surface of ["map", "owner-claim", "api", "sitemap"] as const) {
    assert.equal(
      californiaTier1FullRosterListingGate({
        facilityNumber: "092700093",
        surface,
      }).allowed,
      false,
      surface,
    );
  }

  assert.equal(existsSync("app/california/page.tsx"), true);
  assert.equal(existsSync("app/california/[facilityNumber]/page.tsx"), true);
  const page = readFileSync("app/california/page.tsx", "utf8");
  assert.ok(page.includes('role="search"'));
  assert.ok(page.includes('aria-label="California facility search"'));
  assert.ok(page.includes("Approved licensed capacity"));
  assert.equal(page.includes("supabase.from"), false);

  const home = readFileSync("app/page.tsx", "utf8");
  assert.equal(home.includes("/development/california"), false);
});

test("Washington and Oregon directory contracts remain intact", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
});

test("search/lookup performance stays within acceptance budgets", () => {
  loadCaliforniaTier1FullRosterManifest();
  loadCaliforniaTier1FullRosterCompact();

  const empty = timeMs(() => {
    californiaTier1FullRosterSearch({ page: 1, pageSize: 25 });
  });
  const query = timeMs(() => {
    californiaTier1FullRosterSearch({ q: "sunshine" });
  });
  const city = timeMs(() => {
    californiaTier1FullRosterSearch({ city: "los angeles" });
  });
  const category = timeMs(() => {
    californiaTier1FullRosterSearch({ category: "RCFE" });
  });
  const lookup = timeMs(() => {
    californiaTier1FullRosterLookup("092700093");
  }, 40);
  const preview = timeMs(() => {
    buildCaliforniaTier1FullRosterPreview({ page: 1 });
  }, 10);

  assert.ok(empty.p95 <= BUDGETS.searchP95Ms, `empty ${empty.p95}`);
  assert.ok(query.p95 <= BUDGETS.searchP95Ms, `query ${query.p95}`);
  assert.ok(city.p95 <= BUDGETS.searchP95Ms, `city ${city.p95}`);
  assert.ok(category.p95 <= BUDGETS.searchP95Ms, `category ${category.p95}`);
  assert.ok(lookup.p95 <= BUDGETS.lookupP95Ms, `lookup ${lookup.p95}`);
  assert.ok(preview.p95 <= BUDGETS.previewP95Ms, `preview ${preview.p95}`);
});

test("acceptance preview remains arithmetic-green for release candidate", () => {
  const preview = buildCaliforniaTier1FullRosterPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.reconciliation.currentListable, 15435);
  assert.equal(preview.reconciliation.delta, 6);
  assert.equal(preview.reconciliation.residualStillPresent, 22);
  assert.equal(preview.checklistPending, 1);
  assert.ok(
    preview.preservedRestrictions.includes("no-merge-or-prod-deploy-without-approval"),
  );
  assert.ok(
    preview.preservedRestrictions.includes("california-map-disabled"),
  );
  assert.ok(
    preview.preservedRestrictions.includes("california-public-publication-unauthorized"),
  );
});

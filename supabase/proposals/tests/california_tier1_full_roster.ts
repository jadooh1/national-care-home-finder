import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER1_FULL_ROSTER_BASELINE,
  CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS,
  buildCaliforniaTier1FullRosterPreview,
  californiaTier1FullRosterActivated,
  californiaTier1FullRosterAllowsPublication,
  californiaTier1FullRosterDetailPath,
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
import { DIRECTORY_VIEW, PRIVATE_INDEX_PREFIXES } from "../../../lib/public-indexing.ts";

const DEVELOPMENT_URL = "https://ajjsyloyihcqdomywhik.supabase.co";
const PRODUCTION_URL = "https://yiehgstweswxjakbcdzc.supabase.co";

test("baseline deafabb; protected RC roster; public publication STOP", () => {
  assert.equal(CALIFORNIA_TIER1_FULL_ROSTER_BASELINE, "deafabb");
  assert.equal(californiaTier1FullRosterActivated(), true);
  assert.equal(californiaTier1FullRosterAllowsPublication(), false);
  const manifest = loadCaliforniaTier1FullRosterManifest();
  assert.equal(manifest.californiaPublished, false);
  assert.equal(manifest.publicationEligible, 15435);
  assert.equal(manifest.exclusionsActivated, true);
  assert.equal(manifest.eligibilityMappingActivated, true);
  assert.equal(manifest.sourceAsOfIso, "2026-11-22");
  assert.equal(manifest.listableCount, 15435);
  assert.equal(manifest.residualPresentInDownload, 22);
  assert.equal(manifest.deltaVsPrior15429, 6);
});

test("roster preserves exact IDs and excludes residual-22", () => {
  const compact = loadCaliforniaTier1FullRosterCompact();
  assert.equal(compact.length, 15435);
  assert.equal(new Set(compact.map((r) => r.n)).size, 15435);
  assert.ok(compact.every((r) => /^\d{8,9}$/.test(r.n)));
  assert.ok(compact.every((r) => r.first.trim().length > 0));
  assert.ok(
    compact.every((r) => r.status === "LICENSED" || r.status === "ON PROBATION"),
  );
  for (const id of CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS) {
    assert.equal(compact.some((r) => r.n === id), false, id);
    assert.equal(californiaTier1FullRosterIsResidual(id), true);
  }
  assert.equal(californiaTier1FullRosterIsResidual("19201167"), true);
});

test("search + pagination scale; residual queries return empty", () => {
  const page1 = californiaTier1FullRosterSearch({ page: 1, pageSize: 25 });
  assert.equal(page1.results.length, 25);
  assert.equal(page1.page, 1);
  assert.ok(page1.pageCount > 500);

  const sunshine = californiaTier1FullRosterSearch({ q: "sunshine manor" });
  assert.ok(sunshine.total >= 1);
  assert.ok(sunshine.results.some((r) => r.facilityNumber === "092700093"));

  const byLicense = californiaTier1FullRosterSearch({ q: "092700093" });
  assert.equal(byLicense.total, 1);

  const residual = californiaTier1FullRosterSearch({ q: "019201167" });
  assert.equal(residual.total, 0);

  const rcfe = californiaTier1FullRosterSearch({ category: "RCFE", pageSize: 10 });
  assert.ok(rcfe.results.every((r) => r.category === "RCFE"));
});

test("detail lookup fail-closed for exclusions, aliases, invalid", () => {
  const ok = californiaTier1FullRosterLookup("092700093");
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.ok(ok.facility.disclosureUrl.includes("FacDetail/092700093"));
    assert.equal(ok.facility.sourceAsOfIso, "2026-11-22");
  }

  assert.equal(californiaTier1FullRosterLookup("019201167").ok, false);
  assert.equal(californiaTier1FullRosterLookup("19201167").ok, false);
  assert.equal(californiaTier1FullRosterLookup("95354").ok, false);
  assert.equal(californiaTier1FullRosterDisclosureUrl("95354"), null);
  assert.equal(californiaTier1FullRosterDetailPath("019201167"), null);
  assert.equal(
    californiaTier1FullRosterDetailPath("092700093"),
    "/california/092700093",
  );
});

test("protected preview search allowed; map/owner/api/sitemap blocked", () => {
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
  assert.equal(
    californiaTier1FullRosterListingGate({
      facilityNumber: "092700093",
      surface: "search",
    }).allowed,
    true,
  );
});

test("protected RC contracts: development preview only; WA/OR safeguards", () => {
  assert.equal(directoryContract("California")?.publication, "development");
  assert.equal(directoryContract("California")?.directoryPath, "/california");
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(directoryHref("California", DEVELOPMENT_URL), "/california");
  assert.equal(directoryHref("California", PRODUCTION_URL), null);
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(DIRECTORY_VIEW, "wa_dshs_listed_facilities");
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/california"));
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryHref("Oregon", PRODUCTION_URL), null);

  assert.equal(existsSync("app/california/page.tsx"), true);
  assert.equal(existsSync("app/california/[facilityNumber]/page.tsx"), true);
  const page = readFileSync("app/california/page.tsx", "utf8");
  assert.ok(page.includes('aria-label="California facility search"'));
  assert.ok(page.includes("Official CDSS disclosure"));
  assert.equal(page.includes("supabase.from"), false);
  assert.equal(page.includes("/washington/map"), false);

  const home = readFileSync("app/page.tsx", "utf8");
  assert.equal(home.includes("/development/california"), false);
  assert.ok(home.includes('state === "California" ? "CA"'));
});

test("preview arithmetic green with public STOP", () => {
  const preview = buildCaliforniaTier1FullRosterPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.reconciliation.currentListable, 15435);
  assert.equal(preview.reconciliation.delta, 6);
  assert.equal(preview.reconciliation.residualStillPresent, 22);
  assert.ok(preview.checklistComplete >= 9);
  assert.equal(preview.checklistPending, 1);
  assert.ok(
    preview.preservedRestrictions.includes("california-public-publication-unauthorized"),
  );
});

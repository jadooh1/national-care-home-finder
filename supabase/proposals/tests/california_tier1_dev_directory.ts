import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER1_DEV_DIRECTORY_BASELINE,
  CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES,
  CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE,
  CALIFORNIA_TIER1_DEV_FAIL_CLOSED_CASES,
  CALIFORNIA_TIER1_DEV_PREPUBLICATION_CHECKLIST,
  CALIFORNIA_TIER1_DEV_RESIDUAL_EXCLUSION_IDS,
  buildCaliforniaTier1DevDirectoryPreview,
  californiaTier1DevDetailPath,
  californiaTier1DevDirectoryActivated,
  californiaTier1DevDirectoryAllowsPublication,
  californiaTier1DevDisclosureUrl,
  californiaTier1DevIsResidualExclusion,
  californiaTier1DevListingGate,
  californiaTier1DevListingPath,
  californiaTier1DevLookupFacility,
  californiaTier1DevSearch,
} from "../../../lib/california-tier1-dev-directory.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { DIRECTORY_VIEW, PRIVATE_INDEX_PREFIXES } from "../../../lib/public-indexing.ts";

test("baseline #209; fixtures only; publication STOP", () => {
  assert.equal(CALIFORNIA_TIER1_DEV_DIRECTORY_BASELINE, "c5d6ca4");
  assert.equal(californiaTier1DevDirectoryActivated(), false);
  assert.equal(californiaTier1DevDirectoryAllowsPublication(), false);
  assert.equal(CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.statewideComplete, false);
  assert.equal(CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.californiaPublished, false);
  assert.equal(CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.fixtureCount, 7);
  assert.equal(CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.length, 7);
  assert.equal(CALIFORNIA_TIER1_DEV_RESIDUAL_EXCLUSION_IDS.length, 22);
});

test("fixtures use exact IDs, capacity vs pending increase, and CDSS links", () => {
  assert.ok(
    CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.every((f) =>
      /^\d{8,9}$/.test(f.facilityNumber),
    ),
  );
  assert.ok(
    CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.every((f) =>
      f.disclosureUrl.includes("Rewrite=FacDetail/" + f.facilityNumber),
    ),
  );
  assert.ok(
    CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some((f) => f.pendingIncrease),
  );
  assert.ok(
    CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some((f) => !f.pendingIncrease),
  );
  for (const facility of CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES) {
    assert.equal(
      californiaTier1DevIsResidualExclusion(facility.facilityNumber),
      false,
    );
    if (facility.pendingIncrease) {
      assert.ok(facility.fixtureNote.toLowerCase().includes("approved"));
      assert.ok(!facility.fixtureNote.toLowerCase().includes("proposed increase is capacity"));
    }
  }
});

test("search filters fixtures; residual and invalid IDs never appear", () => {
  const all = californiaTier1DevSearch();
  assert.equal(all.total, 7);

  const byName = californiaTier1DevSearch({ q: "sunshine" });
  assert.equal(byName.total, 1);
  assert.equal(byName.results[0]?.facilityNumber, "092700093");

  const byLicense = californiaTier1DevSearch({ q: "079201384" });
  assert.equal(byLicense.total, 1);

  const rcfe = californiaTier1DevSearch({ category: "RCFE" });
  assert.ok(rcfe.results.every((r) => r.category === "RCFE"));

  const residualQuery = californiaTier1DevSearch({ q: "019201167" });
  assert.equal(residualQuery.total, 0);

  const invalidQuery = californiaTier1DevSearch({ q: "95354" });
  assert.equal(invalidQuery.total, 0);
});

test("detail lookup fail-closed for exclusions, aliases, invalid, unknown", () => {
  const ok = californiaTier1DevLookupFacility("092700093");
  assert.equal(ok.ok, true);

  for (const testCase of CALIFORNIA_TIER1_DEV_FAIL_CLOSED_CASES) {
    const result = californiaTier1DevLookupFacility(testCase.facilityNumber);
    assert.equal(result.ok, false, testCase.id);
  }

  assert.equal(californiaTier1DevIsResidualExclusion("19201167"), true);
  assert.equal(californiaTier1DevDisclosureUrl("95354"), null);
  assert.equal(californiaTier1DevDetailPath("019201167"), null);
  assert.equal(
    californiaTier1DevDetailPath("092700093"),
    "/development/california/092700093",
  );
  assert.ok(
    californiaTier1DevListingPath({ q: "manor" }).includes("q=manor"),
  );
});

test("public surfaces blocked; development search allowed for fixtures", () => {
  assert.equal(
    californiaTier1DevListingGate({
      facilityNumber: "092700093",
      surface: "map",
    }).allowed,
    false,
  );
  assert.equal(
    californiaTier1DevListingGate({
      facilityNumber: "092700093",
      surface: "owner-claim",
    }).allowed,
    false,
  );
  assert.equal(
    californiaTier1DevListingGate({
      facilityNumber: "092700093",
      surface: "sitemap",
    }).allowed,
    false,
  );
  assert.equal(
    californiaTier1DevListingGate({
      facilityNumber: "092700093",
      surface: "api",
    }).allowed,
    false,
  );
  assert.equal(
    californiaTier1DevListingGate({
      facilityNumber: "092700093",
      surface: "search",
    }).allowed,
    true,
  );
  assert.equal(
    californiaTier1DevListingGate({
      facilityNumber: "019201167",
      surface: "detail-page",
    }).allowed,
    false,
  );
});

test("cross-state safeguards unchanged", () => {
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryHref("California", "https://example.supabase.co"), null);
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(DIRECTORY_VIEW, "wa_dshs_listed_facilities");
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/development"));
});

test("routes stay under /development; preview arithmetic and checklist", () => {
  const preview = buildCaliforniaTier1DevDirectoryPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.ok(preview.checklistComplete >= 6);
  assert.ok(preview.checklistPending >= 2);
  assert.ok(
    CALIFORNIA_TIER1_DEV_PREPUBLICATION_CHECKLIST.some(
      (c) => c.id === "activate-exclusion-ledger-before-public-listing"
        && !c.completeInThisPr,
    ),
  );

  const listing = readFileSync("app/development/california/page.tsx", "utf8");
  const detail = readFileSync(
    "app/development/california/[facilityNumber]/page.tsx",
    "utf8",
  );
  assert.ok(listing.includes("Tier 1 development directory (fixtures)"));
  assert.ok(listing.includes("CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES"));
  assert.ok(listing.includes("development-only"));
  assert.equal(listing.includes("href={`/california"), false);
  assert.equal(listing.includes("href=\"/california"), false);
  assert.equal(listing.includes("supabase"), false);
  assert.ok(detail.includes("/development/california"));
  assert.equal(detail.includes("href=\"/california"), false);
  assert.equal(detail.includes("supabase"), false);

  const home = readFileSync("app/page.tsx", "utf8");
  assert.equal(home.includes("/development/california"), false);
  assert.equal(home.includes("/california"), false);
});

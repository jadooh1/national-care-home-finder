import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_ACTIVATED_RESIDUAL_IDS,
  CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_BASELINE,
  CALIFORNIA_EXCLUSION_LEDGER_AFTER,
  CALIFORNIA_EXCLUSION_LEDGER_BEFORE,
  CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION,
  buildCaliforniaExclusionLedgerActivationPreview,
  californiaExclusionLedgerActivated,
  californiaExclusionLedgerActiveControls,
  californiaExclusionLedgerAllowsEligibilityMapping,
  californiaExclusionLedgerAllowsPublication,
  californiaExclusionLedgerDevelopmentGate,
  californiaExclusionLedgerIsResidual,
  californiaExclusionLedgerRollbackProcedure,
} from "../../../lib/california-exclusion-ledger-activation.ts";
import {
  CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS,
  californiaCutoverExclusionsActivated,
  californiaCutoverAllowsPublication,
  californiaPrepublicationSelectFacility,
} from "../../../lib/california-prepublication-cutover.ts";
import {
  californiaTier1FullRosterLookup,
  californiaTier1FullRosterSearch,
  loadCaliforniaTier1FullRosterCompact,
} from "../../../lib/california-tier1-full-roster.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { DIRECTORY_VIEW } from "../../../lib/public-indexing.ts";

test("baseline #213; development-only exclusion ledger activated", () => {
  assert.equal(CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_BASELINE, "22e522c");
  assert.equal(californiaExclusionLedgerActivated(), true);
  assert.equal(californiaCutoverExclusionsActivated(), true);
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated,
    true,
  );
  assert.equal(CALIFORNIA_EXCLUSION_LEDGER_BEFORE.exclusionsActivated, false);
  assert.equal(CALIFORNIA_EXCLUSION_LEDGER_AFTER.exclusionsActivated, true);
  assert.equal(
    californiaExclusionLedgerActiveControls().environment,
    "development-only",
  );
  assert.equal(
    californiaExclusionLedgerActiveControls().cacheGeneration,
    CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION,
  );
});

test("eligibility mapping inactive; California publication blocked", () => {
  assert.equal(californiaExclusionLedgerAllowsEligibilityMapping(), false);
  assert.equal(californiaExclusionLedgerAllowsPublication(), false);
  assert.equal(californiaCutoverAllowsPublication(), false);
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS
      .eligibilityMappingActivated,
    false,
  );
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.californiaPublished,
    false,
  );
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.publicationEligibleCount,
    0,
  );
  assert.equal(directoryContract("California")?.publication, "unpublished");
});

test("all 22 residuals and truncation aliases remain blocked", () => {
  assert.equal(CALIFORNIA_ACTIVATED_RESIDUAL_IDS.length, 22);
  const compact = loadCaliforniaTier1FullRosterCompact();

  for (const id of CALIFORNIA_ACTIVATED_RESIDUAL_IDS) {
    assert.equal(californiaExclusionLedgerIsResidual(id), true, id);
    assert.equal(compact.some((r) => r.n === id), false, id);
    assert.equal(californiaTier1FullRosterLookup(id).ok, false, id);
    assert.equal(californiaTier1FullRosterSearch({ q: id }).total, 0, id);
    assert.equal(
      californiaExclusionLedgerDevelopmentGate({
        facilityNumber: id,
        surface: "development-detail",
      }).allowed,
      false,
      id,
    );
    assert.equal(
      californiaPrepublicationSelectFacility({
        facilityNumber: id,
        downloadStatus: "LICENSED",
        licenseFirstDate: "1/1/2020",
        sourceAsOfIso: "2026-11-22",
        disclosureVerified: true,
      }).selected,
      false,
      id,
    );
  }

  for (const trunc of ["19201167", "19201133", "79201725"]) {
    assert.equal(californiaExclusionLedgerIsResidual(trunc), true, trunc);
    assert.equal(
      californiaExclusionLedgerDevelopmentGate({
        facilityNumber: trunc,
        surface: "development-detail",
      }).allowed,
      false,
      trunc,
    );
  }
});

test("valid facility records are not incorrectly excluded", () => {
  const validIds = ["092700093", "019200874", "361800222", "392701427"];
  const compact = loadCaliforniaTier1FullRosterCompact();

  for (const id of validIds) {
    assert.equal(californiaExclusionLedgerIsResidual(id), false, id);
    assert.equal(compact.some((r) => r.n === id), true, id);
    assert.equal(californiaTier1FullRosterLookup(id).ok, true, id);
    assert.equal(
      californiaExclusionLedgerDevelopmentGate({
        facilityNumber: id,
        surface: "development-detail",
      }).allowed,
      true,
      id,
    );
    assert.equal(
      californiaExclusionLedgerDevelopmentGate({
        facilityNumber: id,
        surface: "public-search",
      }).allowed,
      false,
      id,
    );
  }
});

test("fail-closed isolation, cache generation, and rollback procedure", () => {
  for (const surface of [
    "public-search",
    "public-detail",
    "api",
    "map",
    "owner-claim",
    "sitemap",
  ] as const) {
    assert.equal(
      californiaExclusionLedgerDevelopmentGate({
        facilityNumber: "092700093",
        surface,
      }).allowed,
      false,
      surface,
    );
  }

  const gate = californiaExclusionLedgerDevelopmentGate({
    facilityNumber: "092700093",
    surface: "development-search",
  });
  assert.equal(gate.allowed, true);
  assert.ok(
    gate.reasons.some((r) =>
      r.includes(CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION)
    ),
  );

  const rollback = californiaExclusionLedgerRollbackProcedure();
  assert.equal(rollback.reversible, true);
  assert.equal(rollback.databaseWrites, false);
  assert.equal(rollback.restoresControls.exclusionsActivated, false);
  assert.equal(rollback.restoresControls.eligibilityMappingActivated, false);
  assert.equal(rollback.restoresControls.californiaPublished, false);
  assert.ok(rollback.steps.length >= 5);
  assert.ok(
    rollback.postRollbackVerification.includes("washington-oregon-unaffected"),
  );
});

test("Washington and Oregon remain unaffected", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(
    directoryHref("California", "https://example.supabase.co"),
    null,
  );
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(DIRECTORY_VIEW, "wa_dshs_listed_facilities");
});

test("activation preview arithmetic and development page", () => {
  const preview = buildCaliforniaExclusionLedgerActivationPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.residualCount, 22);
  assert.equal(preview.buckets.missingFirstLicenseDate, 14);
  assert.equal(preview.buckets.provisionalLicense, 5);
  assert.equal(preview.buckets.statusConflict, 3);
  assert.equal(preview.before.exclusionsActivated, false);
  assert.equal(preview.after.exclusionsActivated, true);
  assert.equal(preview.validDevelopmentAllowed, true);
  assert.equal(preview.publicSurfacesBlocked, true);

  assert.equal(
    existsSync("app/development/california-exclusion-ledger/page.tsx"),
    true,
  );
  const page = readFileSync(
    "app/development/california-exclusion-ledger/page.tsx",
    "utf8",
  );
  assert.ok(page.includes("buildCaliforniaExclusionLedgerActivationPreview"));
  assert.ok(page.includes("stopGoPublic"));
  assert.ok(page.toLowerCase().includes("rollback"));
  assert.ok(page.includes("Before"));
  assert.equal(page.includes('href="/california'), false);
  assert.equal(page.includes("supabase.from"), false);
});

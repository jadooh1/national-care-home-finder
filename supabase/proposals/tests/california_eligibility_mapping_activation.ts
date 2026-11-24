import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_BASELINE,
  CALIFORNIA_ELIGIBILITY_MAPPING_AFTER,
  CALIFORNIA_ELIGIBILITY_MAPPING_BEFORE,
  CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION,
  CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS,
  CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS,
  CALIFORNIA_MAPPING_RESIDUAL_IDS,
  buildCaliforniaEligibilityMappingActivationPreview,
  californiaEligibilityMappingActivated,
  californiaEligibilityMappingActiveControls,
  californiaEligibilityMappingAllowsPublication,
  californiaEligibilityMappingDevelopmentGate,
  californiaEligibilityMappingIsListablePendingIncrease,
  californiaEligibilityMappingIsOutOfScopePendingIncrease,
  californiaEligibilityMappingIsResidual,
  californiaEligibilityMappingRollbackProcedure,
} from "../../../lib/california-eligibility-mapping-activation.ts";
import {
  CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS,
  californiaCutoverEligibilityMappingActivated,
  californiaCutoverExclusionsActivated,
  californiaCutoverAllowsPublication,
  californiaPrepublicationSelectFacility,
} from "../../../lib/california-prepublication-cutover.ts";
import {
  californiaTier1FullRosterLookup,
  loadCaliforniaTier1FullRosterCompact,
  loadCaliforniaTier1FullRosterManifest,
} from "../../../lib/california-tier1-full-roster.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { DIRECTORY_VIEW } from "../../../lib/public-indexing.ts";

test("baseline #214; development-only eligibility mapping activated", () => {
  assert.equal(CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_BASELINE, "b7fb8d8");
  assert.equal(californiaEligibilityMappingActivated(), true);
  assert.equal(californiaCutoverEligibilityMappingActivated(), true);
  assert.equal(californiaCutoverExclusionsActivated(), true);
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated,
    true,
  );
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS
      .eligibilityMappingActivated,
    true,
  );
  assert.equal(
    CALIFORNIA_ELIGIBILITY_MAPPING_BEFORE.eligibilityMappingActivated,
    false,
  );
  assert.equal(
    CALIFORNIA_ELIGIBILITY_MAPPING_AFTER.eligibilityMappingActivated,
    true,
  );
  assert.equal(
    californiaEligibilityMappingActiveControls().cacheGeneration,
    CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION,
  );
});

test("publication remains STOP with eligible count zero", () => {
  assert.equal(californiaEligibilityMappingAllowsPublication(), false);
  assert.equal(californiaCutoverAllowsPublication(), false);
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

test("reconcile 58 listable + 8 out-of-scope Pending Increase records", () => {
  assert.equal(CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS.length, 58);
  assert.equal(CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS.length, 8);
  assert.equal(
    CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS.length
      + CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS.length,
    66,
  );

  const compact = loadCaliforniaTier1FullRosterCompact();
  const byId = new Map(compact.map((r) => [r.n, r]));
  const manifest = loadCaliforniaTier1FullRosterManifest();
  assert.equal(manifest.pendingIncreaseFlaggedInRoster, 58);
  assert.equal(manifest.pendingIncreaseIdsHistorical, 66);
  assert.equal(manifest.sourceAsOfIso, "2026-11-22");

  for (const id of CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS) {
    assert.equal(californiaEligibilityMappingIsListablePendingIncrease(id), true, id);
    assert.equal(byId.has(id), true, id);
    assert.equal(byId.get(id)?.pi, true, id);
    assert.equal(byId.get(id)?.status, "LICENSED", id);
    assert.ok(String(byId.get(id)?.first ?? "").length > 0, id);
    assert.ok(String(byId.get(id)?.cap ?? "").length > 0, id);
  }

  for (const id of CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS) {
    assert.equal(
      californiaEligibilityMappingIsOutOfScopePendingIncrease(id),
      true,
      id,
    );
    assert.equal(byId.has(id), false, id);
    assert.equal(californiaTier1FullRosterLookup(id).ok, false, id);
  }
});

test("all 22 residuals and truncation aliases remain blocked with mapping ON", () => {
  assert.equal(CALIFORNIA_MAPPING_RESIDUAL_IDS.length, 22);
  for (const id of CALIFORNIA_MAPPING_RESIDUAL_IDS) {
    assert.equal(californiaEligibilityMappingIsResidual(id), true, id);
    const gate = californiaEligibilityMappingDevelopmentGate({
      facilityNumber: id,
      surface: "development-detail",
    });
    assert.equal(gate.allowed, false, id);
    assert.ok(gate.reasons.includes("residual-exclusion"), id);
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

  assert.equal(californiaEligibilityMappingIsResidual("19201167"), true);
  assert.equal(
    californiaEligibilityMappingDevelopmentGate({
      facilityNumber: "19201167",
      surface: "development-detail",
    }).allowed,
    false,
  );
});

test("mapping applies exact ID / first date / capacity gates; invalid fail closed", () => {
  const ok = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.mappingApplied, true);

  const mismatch = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "99",
  });
  assert.equal(mismatch.allowed, false);
  assert.ok(mismatch.reasons.includes("mapping:capacity-disagreement"));

  const missingFirst = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  });
  assert.equal(missingFirst.allowed, false);

  assert.equal(
    californiaEligibilityMappingDevelopmentGate({
      facilityNumber: "95354",
      surface: "development-detail",
    }).allowed,
    false,
  );

  assert.equal(
    californiaEligibilityMappingDevelopmentGate({
      facilityNumber: "197606348",
      surface: "development-detail",
      pendingIncrease: true,
    }).allowed,
    false,
  );

  const selected = californiaPrepublicationSelectFacility({
    facilityNumber: "392701427",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
    pendingIncrease: true,
    sourceAsOfIso: "2026-11-22",
    disclosureVerified: true,
  });
  assert.equal(selected.selected, false);
  assert.equal(selected.eligibilityMappingApplied, true);
  assert.ok(selected.reasons.includes("publication-eligible-zero"));
});

test("cache generation and mapping rollback keep exclusions ON", () => {
  const gate = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  });
  assert.ok(
    gate.reasons.some((r) =>
      r.includes(CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION)
    ),
  );

  const rollback = californiaEligibilityMappingRollbackProcedure();
  assert.equal(rollback.reversible, true);
  assert.equal(rollback.databaseWrites, false);
  assert.equal(rollback.restoresControls.exclusionsActivated, true);
  assert.equal(rollback.restoresControls.eligibilityMappingActivated, false);
  assert.equal(rollback.restoresControls.californiaPublished, false);
  assert.equal(rollback.restoresControls.publicationEligibleCount, 0);
  assert.ok(rollback.steps.length >= 6);
  assert.ok(
    rollback.postRollbackVerification.includes("exclusionsActivated=true"),
  );
  assert.ok(
    rollback.postRollbackVerification.includes(
      "eligibilityMappingActivated=false",
    ),
  );
});

test("Washington and Oregon remain unaffected", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(
    directoryHref("California", "https://example.supabase.co"),
    null,
  );
  assert.equal(mapHref("California"), null);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(DIRECTORY_VIEW, "wa_dshs_listed_facilities");
});

test("activation preview arithmetic and development page", () => {
  const preview = buildCaliforniaEligibilityMappingActivationPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.pendingIncrease.listableInformational, 58);
  assert.equal(preview.pendingIncrease.historicalOutOfScope, 8);
  assert.equal(preview.residualBlocked, true);
  assert.equal(preview.publicSurfacesBlocked, true);
  assert.equal(preview.publicationSelectionBlocked, true);
  assert.equal(preview.before.eligibilityMappingActivated, false);
  assert.equal(preview.after.eligibilityMappingActivated, true);

  assert.equal(
    existsSync("app/development/california-eligibility-mapping/page.tsx"),
    true,
  );
  const page = readFileSync(
    "app/development/california-eligibility-mapping/page.tsx",
    "utf8",
  );
  assert.ok(page.includes("buildCaliforniaEligibilityMappingActivationPreview"));
  assert.ok(page.includes("stopGoPublic"));
  assert.ok(page.toLowerCase().includes("rollback"));
  assert.equal(page.includes('href="/california'), false);
  assert.equal(page.includes("supabase.from"), false);
});

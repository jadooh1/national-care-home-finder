import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_CUTOVER_RESIDUAL_IDS,
  CALIFORNIA_PREPUBLICATION_CUTOVER_BASELINE,
  CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS,
  buildCaliforniaPrepublicationCutoverPreview,
  californiaCutoverActivated,
  californiaCutoverExclusionsActivated,
  californiaCutoverAllowsPublication,
  californiaCutoverActivationSequence,
  californiaCutoverEnforceAllResiduals,
  californiaCutoverIsResidualExclusion,
  californiaCutoverListingGate,
  californiaCutoverRollbackSequence,
  californiaPrepublicationSelectFacility,
} from "../../../lib/california-prepublication-cutover.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { DIRECTORY_VIEW } from "../../../lib/public-indexing.ts";

test("baseline #213; exclusion ledger ON in development; publication STOP", () => {
  assert.equal(CALIFORNIA_PREPUBLICATION_CUTOVER_BASELINE, "22e522c");
  assert.equal(californiaCutoverExclusionsActivated(), true);
  assert.equal(californiaCutoverActivated(), false);
  assert.equal(californiaCutoverAllowsPublication(), false);
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated,
    true,
  );
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
});

test("exclusion ledger wired into publication-selection; all 22 residuals blocked", () => {
  assert.equal(CALIFORNIA_CUTOVER_RESIDUAL_IDS.length, 22);
  const enforced = californiaCutoverEnforceAllResiduals();
  assert.equal(enforced.allBlocked, true);

  for (const id of CALIFORNIA_CUTOVER_RESIDUAL_IDS) {
    assert.equal(californiaCutoverIsResidualExclusion(id), true, id);
    const selected = californiaPrepublicationSelectFacility({
      facilityNumber: id,
      downloadStatus: "LICENSED",
      licenseFirstDate: "1/1/2020",
      sourceAsOfIso: "2026-11-22",
      disclosureVerified: true,
    });
    assert.equal(selected.selected, false, id);
    assert.ok(selected.reasons.includes("residual-exclusion"), id);
  }

  assert.equal(californiaCutoverIsResidualExclusion("19201167"), true);
  assert.equal(
    californiaPrepublicationSelectFacility({
      facilityNumber: "19201167",
      sourceAsOfIso: "2026-11-22",
      disclosureVerified: true,
    }).selected,
    false,
  );
});

test("eligibility mapping is independent and inactive by default", () => {
  const without = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "392701427",
      downloadStatus: "LICENSED",
      facilityDetailStatus: "Licensed/Pending Increase",
      licenseFirstDate: "8/20/2024",
      downloadCapacity: "6",
      facilityDetailCapacity: "6",
      pendingIncrease: true,
      sourceAsOfIso: "2026-11-22",
      disclosureVerified: true,
    },
    {
      exclusionsActivated: true,
      eligibilityMappingActivated: false,
      californiaPublished: true,
      publicationEligibleCount: 1,
    },
  );
  assert.equal(without.selected, false);
  assert.ok(without.reasons.includes("eligibility-mapping-inactive"));
  assert.equal(without.eligibilityMappingApplied, false);

  const withMapping = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "392701427",
      downloadStatus: "LICENSED",
      facilityDetailStatus: "Licensed/Pending Increase",
      licenseFirstDate: "8/20/2024",
      downloadCapacity: "6",
      facilityDetailCapacity: "6",
      pendingIncrease: true,
      sourceAsOfIso: "2026-11-22",
      disclosureVerified: true,
    },
    {
      exclusionsActivated: true,
      eligibilityMappingActivated: true,
      californiaPublished: false,
      publicationEligibleCount: 0,
    },
  );
  assert.equal(withMapping.selected, false);
  assert.equal(withMapping.eligibilityMappingApplied, true);
  assert.ok(withMapping.reasons.includes("california-unpublished"));
});

test("fail-closed for stale data, invalid IDs, conflicts, unverified disclosure", () => {
  const armed = {
    exclusionsActivated: true,
    eligibilityMappingActivated: true,
    californiaPublished: true,
    publicationEligibleCount: 1,
  } as const;

  assert.equal(
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: "092700093",
        downloadStatus: "LICENSED",
        licenseFirstDate: "12/14/2017",
        sourceAsOfIso: "2026-11-01",
        disclosureVerified: true,
      },
      armed,
    ).selected,
    false,
  );
  assert.equal(
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: "95354",
        sourceAsOfIso: "2026-11-22",
        disclosureVerified: true,
      },
      armed,
    ).selected,
    false,
  );
  assert.equal(
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: "092700093",
        downloadStatus: "LICENSED",
        licenseFirstDate: "12/14/2017",
        sourceAsOfIso: "2026-11-22",
        disclosureVerified: false,
      },
      armed,
    ).selected,
    false,
  );
  assert.equal(
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: "092700093",
        downloadStatus: "LICENSED",
        licenseFirstDate: "12/14/2017",
        sourceAsOfIso: "2026-11-22",
        disclosureVerified: true,
        statusConflict: true,
      },
      armed,
    ).selected,
    false,
  );

  // Even a clear candidate stays blocked while publicationEligible=0.
  assert.equal(
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: "092700093",
        downloadStatus: "LICENSED",
        facilityDetailStatus: "Licensed",
        licenseFirstDate: "12/14/2017",
        downloadCapacity: "14",
        facilityDetailCapacity: "14",
        sourceAsOfIso: "2026-11-22",
        disclosureVerified: true,
      },
      {
        exclusionsActivated: true,
        eligibilityMappingActivated: true,
        californiaPublished: true,
        publicationEligibleCount: 0,
      },
    ).selected,
    false,
  );
});

test("activation and rollback rehearsals do not mutate live defaults incorrectly", () => {
  const activation = californiaCutoverActivationSequence({
    approveExclusionActivation: true,
    approveEligibilityMappingActivation: true,
    approveCaliforniaPublication: true,
  });
  assert.equal(activation.rehearsed, true);
  assert.equal(activation.activatedRuntime, false);
  assert.equal(activation.controls.exclusionsActivated, true);
  assert.equal(activation.controls.eligibilityMappingActivated, true);
  assert.equal(activation.controls.californiaPublished, false);
  assert.equal(activation.controls.publicationEligibleCount, 0);
  assert.equal(activation.residualEnforced.allBlocked, true);
  assert.equal(activation.selectedUnderRehearsal, 0);
  assert.equal(activation.independencePreserved, true);

  // Live defaults keep exclusion ON and mapping/publication OFF after rehearsal.
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated,
    true,
  );
  assert.equal(
    CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS
      .eligibilityMappingActivated,
    false,
  );

  const rollback = californiaCutoverRollbackSequence({
    from: {
      exclusionsActivated: true,
      eligibilityMappingActivated: true,
      californiaPublished: false,
      publicationEligibleCount: 0,
    },
  });
  assert.equal(rollback.rehearsed, true);
  assert.equal(rollback.activatedRuntime, false);
  assert.equal(rollback.after.exclusionsActivated, false);
  assert.equal(rollback.surfacesFailClosed, true);
  assert.equal(rollback.defaultsUnchanged, true);

  for (const surface of [
    "search",
    "detail-page",
    "api",
    "map",
    "owner-claim",
    "sitemap",
  ] as const) {
    assert.equal(
      californiaCutoverListingGate({
        facilityNumber: "092700093",
        surface,
        disclosureVerified: true,
      }).allowed,
      false,
      surface,
    );
  }
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

test("preview arithmetic and development page present", () => {
  const preview = buildCaliforniaPrepublicationCutoverPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.residualCount, 22);
  assert.equal(preview.baseline, "22e522c");
  assert.equal(preview.defaults.exclusionsActivated, true);

  assert.equal(
    existsSync("app/development/california-prepublication-cutover/page.tsx"),
    true,
  );
  const page = readFileSync(
    "app/development/california-prepublication-cutover/page.tsx",
    "utf8",
  );
  assert.ok(page.includes("buildCaliforniaPrepublicationCutoverPreview"));
  assert.ok(page.includes("stopGoPublic"));
  assert.equal(page.includes("href=\"/california"), false);
  assert.equal(page.includes("supabase.from"), false);
});

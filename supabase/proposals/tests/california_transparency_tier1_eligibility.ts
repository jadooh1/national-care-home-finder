import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_TRANSPARENCY_TIER1_COUNTS,
  CALIFORNIA_TRANSPARENCY_TIER1_REMAINING_BLOCKERS,
  CALIFORNIA_TRANSPARENCY_TIER1_RESOLVED_BLOCKERS,
  CALIFORNIA_TRANSPARENCY_TIER1_RULES,
  CALIFORNIA_TRANSPARENCY_TIER1_SOURCE,
  buildCaliforniaTransparencyTier1EligibilityPreview,
  californiaTransparencyTier1AllowsPublication,
  californiaTransparencyTier1DirectoryReady,
} from "../../../lib/california-transparency-tier1-eligibility.ts";

test("Transparency pathway is used; ArcGIS roster remains rejected", () => {
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_SOURCE.pathway, "downloadstatedata-transparency-csv");
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_SOURCE.notArcGisRoster, true);
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_RULES.arcgisRejectedAsRoster, true);
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_RULES.californiaPublicationBlocked, true);
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_RULES.exclusionsRemainInactive, true);
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_RULES.preserveLeadingZeros, true);
  assert.equal(CALIFORNIA_TRANSPARENCY_TIER1_RULES.coordinatesRequired, false);
});

test("Phase 23 offline counts preserved; publication eligible stays zero", () => {
  const c = CALIFORNIA_TRANSPARENCY_TIER1_COUNTS;
  assert.equal(
    c.activeRestrictedCandidates,
    c.listingExclusionsOffline + c.otherwiseClearOffline,
  );
  assert.equal(c.tier1OfflineEligible, 15363);
  assert.equal(c.publicationEligible, 0);
  assert.equal(c.ownerClaimEligible, 0);
  assert.equal(c.asOfIso, "2026-11-15");
});

test("freshness blocker resolved for Transparency; public launch still STOP", () => {
  const preview = buildCaliforniaTransparencyTier1EligibilityPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.asOf.adoptedAsOfIso, "2026-11-15");
  assert.equal(preview.asOf.freshnessBlockerResolvedForTransparencyPathway, true);
  assert.deepEqual(
    [...CALIFORNIA_TRANSPARENCY_TIER1_RESOLVED_BLOCKERS].sort(),
    [
      "filename-header-mmddyyyy-rejected-without-cdss-confirmation",
      "transparency-csv-missing-authoritative-asof-date",
    ].sort(),
  );
  assert.ok(
    CALIFORNIA_TRANSPARENCY_TIER1_REMAINING_BLOCKERS.includes(
      "california-publication-blocked",
    ),
  );
  assert.ok(
    CALIFORNIA_TRANSPARENCY_TIER1_REMAINING_BLOCKERS.includes(
      "exclusion-policy-inactive",
    ),
  );
  assert.ok(
    CALIFORNIA_TRANSPARENCY_TIER1_REMAINING_BLOCKERS.includes(
      "arcgis-rejected-as-tier1-roster",
    ),
  );
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoDevelopmentPreview, "GO");
  assert.equal(preview.stopGoArcGisRoster, "STOP");
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.finalPublicVisibility, false);
  assert.equal(preview.exclusionsActivated, false);
  assert.equal(californiaTransparencyTier1AllowsPublication(), false);
  assert.equal(californiaTransparencyTier1DirectoryReady(), false);
});

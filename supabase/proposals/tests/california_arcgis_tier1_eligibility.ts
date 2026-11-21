import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_ARCGIS_TIER1_COUNTS,
  CALIFORNIA_ARCGIS_TIER1_EXCLUSIONS,
  CALIFORNIA_ARCGIS_TIER1_FRESHNESS,
  CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS,
  CALIFORNIA_ARCGIS_TIER1_PRIOR_PR133,
  CALIFORNIA_ARCGIS_TIER1_REMAINING_BLOCKERS,
  CALIFORNIA_ARCGIS_TIER1_RULES,
  CALIFORNIA_ARCGIS_TIER1_SOURCE,
  CALIFORNIA_ARCGIS_TIER1_TRANSPARENCY_SAMPLE,
  buildCaliforniaArcgisTier1EligibilityPreview,
  californiaArcgisMeetsTier1DirectoryReadiness,
  californiaArcgisTier1AllowsPublication,
  californiaArcgisTier1DirectoryReady,
  californiaArcgisTier1DriftFromPr133,
} from "../../../lib/california-arcgis-tier1-eligibility.ts";

test("ArcGIS Tier 1 sources stay official and refuse clock proxies as export dates", () => {
  assert.match(CALIFORNIA_ARCGIS_TIER1_SOURCE.arcgisFeatureServer, /CDSS_CCL_Facilities\/FeatureServer\/0$/);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_SOURCE.evaluationScope, "full-dataset");
  assert.equal(CALIFORNIA_ARCGIS_TIER1_SOURCE.notExtrapolatedFromSample, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_SOURCE.chhsDownloadFilenamesRotate, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.gisStatusIntegersAccepted, false);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.refuseLeadingZeroCollapseAsMatch, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.coordinatesRequired, false);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.californiaPublicationBlocked, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.exclusionsRemainInactive, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.treatLayerEditTimestampAsExport, false);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_RULES.treatChhsFileDateAsExport, false);
});

test("live reconciliation arithmetic holds and Tier 1 offline/public counts stay zero", () => {
  const c = CALIFORNIA_ARCGIS_TIER1_COUNTS;
  assert.equal(c.gisRcfeLike + c.gisArfLike, c.gisInScope);
  assert.equal(c.gisInScopeUsableAddress, c.gisInScope);
  assert.equal(
    c.leadingZeroRepresentationMismatches + c.trulyMissingEvenIfZerosCollapsed,
    c.missingFromGisExact,
  );
  assert.equal(c.chhsRcfeEligible + c.chhsArfEligible, c.chhsCombinedEligible);
  assert.equal(
    c.chhsArfTypeEligibleIncludingShifted - c.chhsShiftedRowExcluded,
    c.chhsArfEligible,
  );
  assert.equal(c.chhsCombinedEligible, CALIFORNIA_ARCGIS_TIER1_PRIOR_PR133.chhsCombinedEligible);
  assert.equal(c.tier1OfflineEligible, 0);
  assert.equal(c.publicationEligible, 0);
  assert.equal(c.ownerClaimEligible, 0);
  assert.equal(c.duplicateHistorical, 0);
  assert.equal(c.duplicateGis, 0);
  assert.equal(c.gisInScopeCoordInvalid, 0);
});

test("drift from PR #133 is recorded without inventing an ISO export date", () => {
  const drift = californiaArcgisTier1DriftFromPr133();
  assert.equal(drift.gisTotalRowsDelta, 37871 - 37887);
  assert.equal(drift.exactIdMatchesDelta, 12766 - 12771);
  assert.equal(drift.chhsCombinedEligibleUnchanged, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_FRESHNESS.recordedExportDate, null);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_FRESHNESS.blocksPublicTier1, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_FRESHNESS.chhsFileDateRejectedAsExport, true);
  assert.equal(CALIFORNIA_ARCGIS_TIER1_FRESHNESS.arcgisEditingInfoRejectedAsExport, true);
});

test("status and freshness gates fail; ArcGIS is not Tier 1 ready", () => {
  const status = CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS.find((g) => g.gate === "status");
  const freshness = CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS.find((g) => g.gate === "freshness");
  const identity = CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS.find((g) => g.gate === "identity");
  const coords = CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS.find((g) => g.gate === "coordinates");
  assert.equal(status?.passed, false);
  assert.equal(freshness?.passed, false);
  assert.equal(identity?.passed, false);
  assert.equal(coords?.passed, false);
  assert.ok(CALIFORNIA_ARCGIS_TIER1_REMAINING_BLOCKERS.includes("undocumented-gis-status-domain"));
  assert.ok(CALIFORNIA_ARCGIS_TIER1_REMAINING_BLOCKERS.includes("no-authoritative-iso-export-date"));
  assert.equal(californiaArcgisMeetsTier1DirectoryReadiness(), false);
  assert.equal(californiaArcgisTier1DirectoryReady(), false);
  assert.equal(californiaArcgisTier1AllowsPublication(), false);
});

test("exclusions document shifted ARF row and refuse GIS status acceptance", () => {
  const shifted = CALIFORNIA_ARCGIS_TIER1_EXCLUSIONS.find((e) => e.kind === "chhs-shifted-arf-row");
  const status = CALIFORNIA_ARCGIS_TIER1_EXCLUSIONS.find((e) => e.kind === "undocumented-gis-status-domain");
  assert.equal(shifted?.facilityNumber, "366401835");
  assert.equal(shifted?.count, 1);
  assert.equal(status?.count, CALIFORNIA_ARCGIS_TIER1_COUNTS.gisInScope);
  const leading = CALIFORNIA_ARCGIS_TIER1_TRANSPARENCY_SAMPLE.find((s) => s.requestedId === "15601302");
  assert.equal(leading?.facilityNumber, "015601302");
  assert.equal(leading?.officialStatus, "Licensed");
});

test("preview builder stays STOP for public and development Tier 1", () => {
  const preview = buildCaliforniaArcgisTier1EligibilityPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.statusGateFailed, true);
  assert.equal(preview.freshnessGateFailed, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoDevelopmentPreview, "STOP");
  assert.equal(preview.stopGoTier2Map, "STOP");
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.finalPublicVisibility, false);
  assert.equal(preview.ownerClaimEligible, false);
  assert.equal(preview.exclusionsActivated, false);
  assert.equal(preview.californiaDirectoryReady, false);
  assert.equal(preview.washingtonUnchanged, true);
  assert.equal(preview.oregonUnchanged, true);
  assert.equal(preview.floridaOhioNotRepeated, true);
  assert.match(preview.mostActionableNextStep, /Do not use ArcGIS/);
});

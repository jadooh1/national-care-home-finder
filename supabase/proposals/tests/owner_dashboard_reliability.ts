import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy } from "../../../lib/copy/account.ts";
import { duplicateClaimBlocks } from "../../../lib/owner-claim.ts";
import {
  claimSubmitGate,
  classifySubmission,
  rememberSubmittedClaim,
  shouldApplySearch,
  startSearch,
} from "../../../lib/owner-dashboard.ts";

test("an older facility search cannot replace a newer result or update an unmounted dashboard", () => {
  const first = startSearch(0);
  const second = startSearch(first);
  assert.equal(first, 1);
  assert.equal(second, 2);
  assert.equal(shouldApplySearch(first, second, true), false);
  assert.equal(shouldApplySearch(second, second, true), true);
  assert.equal(shouldApplySearch(second, second, false), false);
  const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /shouldApplySearch\(/);
  assert.match(dashboard, /dashboardMounted\.current = false/);
});

test("facility and activity failures keep claims that already loaded", () => {
  const previousClaims = [{ id: "claim-1", facility_id: "facility-1", verification_status: "approved", reviewed_at: null }];
  const failedClaimsRefresh = classifySubmission(true, { claimsError: true, facilitiesError: false, activityError: false });
  assert.equal(failedClaimsRefresh, "submitted-refresh-failed");
  assert.notEqual(failedClaimsRefresh, "failed");
  assert.equal(classifySubmission(false, { claimsError: false, facilitiesError: false, activityError: false }), "failed");
  assert.equal(classifySubmission(true, { claimsError: false, facilitiesError: true, activityError: false }), "submitted-refresh-failed");
  assert.equal(classifySubmission(true, { claimsError: false, facilitiesError: false, activityError: true }), "submitted-refresh-failed");
  assert.equal(classifySubmission(true, { claimsError: false, facilitiesError: false, activityError: false }), "submitted");
  const kept = rememberSubmittedClaim(previousClaims, "facility-2");
  assert.equal(kept[1], previousClaims[0]);
  assert.equal(duplicateClaimBlocks(kept, "facility-1"), true);
  const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /setFacilitiesLoadError\(true\)/);
  assert.doesNotMatch(dashboard, /if \(homes\.error\) setFacilities\(\{\}\)/);
  assert.match(dashboard, /setActivityLoadError\(true\)/);
  assert.doesNotMatch(dashboard, /if \(activity\.error\) setEvents\(\[\]\)/);
  assert.match(dashboard, /text\.retry/);
});

test("a failed submission stays distinct from a successful submission whose refresh failed", () => {
  assert.equal(claimSubmitGate(false), "start");
  assert.equal(claimSubmitGate(true), "ignore");
  const rejected = [{ id: "old", facility_id: "facility-1", verification_status: "rejected", reviewed_at: null }];
  const pending = rememberSubmittedClaim(rejected, "facility-1");
  assert.equal(pending.length, 2);
  assert.equal(duplicateClaimBlocks(pending, "facility-1"), true);
  assert.equal(duplicateClaimBlocks(rejected, "facility-1"), false);
  assert.match(copy.en.dashboard.notices.submittedRefresh, /could not refresh/);
  assert.match(copy.en.dashboard.notices.submittedRefresh, /submitted for review/);
  assert.match(copy.es.dashboard.notices.submittedRefresh, /no se pudo actualizar/);
  assert.match(copy.es.dashboard.notices.submittedRefresh, /se envió para revisión/);
  assert.match(copy.en.dashboard.errors.facilities, /Facility details/);
  assert.match(copy.es.dashboard.errors.facilities, /datos del centro/);
  assert.match(copy.en.dashboard.errors.activity, /Claim activity/);
  assert.match(copy.es.dashboard.errors.activity, /actividad del reclamo/);
  assert.notEqual(copy.en.dashboard.errors.submit, copy.en.dashboard.notices.submittedRefresh);
  assert.notEqual(copy.es.dashboard.errors.submit, copy.es.dashboard.notices.submittedRefresh);
  const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /claimSubmitGate\(submittingRef\.current\)/);
  assert.match(dashboard, /classifySubmission\(/);
  assert.match(dashboard, /rememberSubmittedClaim\(/);
  assert.match(dashboard, /duplicateClaimBlocks\(claims, selected\.id\)/);
});

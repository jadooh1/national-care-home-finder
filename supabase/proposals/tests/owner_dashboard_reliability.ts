import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy } from "../../../lib/copy/account.ts";
import { duplicateClaimBlocks } from "../../../lib/owner-claim.ts";
import {
  claimSubmitGate,
  classifySubmission,
  createFacilitySearch,
  reduceFacilitySearch,
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
  assert.match(dashboard, /reduceFacilitySearch\(/);
  assert.match(dashboard, /new FormData\(event\.currentTarget\)/);
  assert.doesNotMatch(dashboard, /searchListedFacilities\(search\)/);
  assert.match(dashboard, /dashboardMounted\.current = false/);
});

test("overlapping and delayed facility searches keep only the latest query", () => {
  let model = createFacilitySearch<string>();
  model = reduceFacilitySearch(model, { type: "submit", liveInput: "yakima" });
  const yakima = model.ticket;
  assert.equal(model.searching, true);
  model = reduceFacilitySearch(model, { type: "submit", liveInput: "tacoma" });
  const tacoma = model.ticket;
  assert.notEqual(yakima, tacoma);
  assert.equal(model.query, "tacoma");
  assert.deepEqual([...model.results], []);
  const lateResults = reduceFacilitySearch(model, { type: "response", ticket: yakima, ok: true, results: ["older-city"] });
  assert.equal(lateResults, model);
  assert.equal(lateResults.searching, true);
  assert.equal(lateResults.error, "");
  const lateFailure = reduceFacilitySearch(model, { type: "response", ticket: yakima, ok: false, results: [] });
  assert.equal(lateFailure, model);
  model = reduceFacilitySearch(model, { type: "response", ticket: tacoma, ok: true, results: ["newer-city"] });
  assert.deepEqual([...model.results], ["newer-city"]);
  assert.equal(model.searching, false);
  assert.equal(model.error, "");
  const delayedAfterSuccess = reduceFacilitySearch(model, { type: "response", ticket: yakima, ok: false, results: ["older-city"] });
  assert.equal(delayedAfterSuccess, model);
});

test("rapid typing clears the previous facility search immediately", () => {
  let model = createFacilitySearch<string>();
  model = reduceFacilitySearch(model, { type: "edit", query: "yakima" });
  model = reduceFacilitySearch(model, { type: "submit", liveInput: "yakima" });
  const started = model.ticket;
  model = reduceFacilitySearch(model, { type: "response", ticket: started, ok: true, results: ["older-city"] });
  model = reduceFacilitySearch(model, { type: "edit", query: "y" });
  assert.deepEqual([...model.results], []);
  assert.equal(model.searching, false);
  assert.equal(model.error, "");
  model = reduceFacilitySearch(model, { type: "edit", query: "tacoma" });
  const stale = reduceFacilitySearch(model, { type: "response", ticket: started, ok: true, results: ["older-city"] });
  assert.equal(stale, model);
  assert.equal(stale.query, "tacoma");
  const raced = reduceFacilitySearch(
    reduceFacilitySearch(createFacilitySearch<string>(), { type: "edit", query: "yakima" }),
    { type: "submit", liveInput: "tacoma" },
  );
  assert.equal(raced.query, "tacoma");
  assert.equal(raced.searching, true);
  assert.deepEqual([...raced.results], []);
});

test("a facility search response does nothing after the dashboard unmounts", () => {
  let model = reduceFacilitySearch(createFacilitySearch<string>(), { type: "submit", liveInput: "tacoma" });
  const ticket = model.ticket;
  model = reduceFacilitySearch(model, { type: "unmount" });
  const painted = reduceFacilitySearch(model, { type: "response", ticket, ok: true, results: ["newer-city"] });
  assert.equal(painted, model);
  assert.equal(painted.mounted, false);
  assert.equal(painted.searching, true);
  assert.equal(painted.error, "");
  assert.deepEqual([...painted.results], []);
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

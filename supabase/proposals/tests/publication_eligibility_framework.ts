import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  evaluateFacilityEligibility,
  blockedFixtureInput,
  PUBLICATION_ELIGIBILITY_SPEC_VERSION,
  type FacilityEligibilityInput,
} from "../../../lib/publication-eligibility.ts";
import {
  PUBLICATION_STATE_PROFILES,
  publicationStateProfile,
} from "../../../lib/publication-eligibility-profiles.ts";
import {
  PUBLICATION_EVIDENCE_FIXTURES,
  PUBLICATION_STATE_EVIDENCE_SCOPES,
} from "../../../lib/publication-eligibility-evidence.ts";
import {
  buildPublicationReadinessReport,
  publicationReadinessAllowsNewPublicState,
} from "../../../lib/publication-eligibility-readiness.ts";
import {
  FIRST_REALISTIC_LAUNCH_CANDIDATE,
  buildPublicationRolloutPlan,
} from "../../../lib/publication-eligibility-rollout.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  WASHINGTON_LISTED_COUNT,
  OREGON_LISTED_COUNT,
  oregonRefreshReady,
} from "../../../lib/state-directory.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { CALIFORNIA_PHASE18_EXCLUSION_POLICY } from "../../../lib/california-phase18-exclusion-policy.ts";
import {
  ENABLED_OWNER_FACILITY_STATES,
  OWNER_FACILITY_SOURCE,
} from "../../../lib/owner-facility-read.ts";
import { compatibilityClassCounts } from "../../../lib/nationwide-compatibility.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/publication-eligibility",
);

test("evaluator: Washington baseline reaches Tier 3 with public visibility", () => {
  const wa = PUBLICATION_EVIDENCE_FIXTURES.find((c) => c.id === "wa-baseline-clear");
  assert.ok(wa);
  const decision = evaluateFacilityEligibility(
    wa.input as unknown as FacilityEligibilityInput,
  );
  assert.equal(decision.tier, 3);
  assert.equal(decision.listingEligible, true);
  assert.equal(decision.mapEligible, true);
  assert.equal(decision.enhancedEligible, true);
  assert.equal(decision.finalPublicVisibility, true);
  assert.equal(decision.ownerClaimEligible, true);
  assert.equal(decision.freshness.verdict, "official-iso-export");
});

test("evaluator: all hard-case fixtures match expected tiers and owner-claim bounds", () => {
  assert.equal(PUBLICATION_EVIDENCE_FIXTURES.length, 12);
  for (const fixture of PUBLICATION_EVIDENCE_FIXTURES) {
    const decision = evaluateFacilityEligibility(
      fixture.input as unknown as FacilityEligibilityInput,
    );
    assert.equal(decision.tier <= fixture.expectedTierMax, true, fixture.id);
    assert.equal(decision.listingEligible, fixture.expectedListingEligible, fixture.id);
    assert.equal(decision.mapEligible, fixture.expectedMapEligible, fixture.id);
    assert.equal(
      decision.finalPublicVisibility,
      fixture.expectedFinalPublicVisibility,
      fixture.id,
    );
    assert.equal(
      decision.ownerClaimEligible,
      fixture.expectedOwnerClaimEligible,
      fixture.id,
    );
    if (fixture.state !== "Washington") {
      assert.equal(decision.ownerClaimEligible, false, fixture.id);
    }
  }
});

test("evaluator: unpublished listingEligible never becomes finalPublicVisibility", () => {
  const decision = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Florida",
      stateAuthorization: "unpublished",
      facilityIdentity: "L1",
      identityKind: "license",
      issuingAuthority: "AHCA",
      sourceProvenanceVerified: true,
      originalCategory: "Assisted Living Facility",
      categoryInScope: true,
      originalStatus: "ACTIVE",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "1 A St",
      city: "Tampa",
      postalCode: "33602",
      physicalAddressUsable: true,
      officialExportDateIso: "2026-11-01",
      disclosureVerified: true,
      disclosureUrl: "https://example.invalid/profile/1",
    }),
  );
  assert.equal(decision.listingEligible, true);
  assert.equal(decision.finalPublicVisibility, false);
  assert.ok(decision.reasons.includes("state-authorization-unpublished"));
});

test("evaluator: rejected clocks and missing ISO stop Tier 1 without policy", () => {
  const decision = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Kentucky",
      facilityIdentity: "101513",
      identityKind: "license",
      issuingAuthority: "CHFS OIG",
      sourceProvenanceVerified: true,
      originalCategory: "ALC",
      categoryInScope: true,
      originalStatus: "Licensed",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "9 Main",
      city: "Louisville",
      postalCode: "40202",
      physicalAddressUsable: true,
      officialExportDateIso: null,
      rejectedHttpLastModifiedAsExport: true,
      freshnessPolicyDocumented: false,
      freshnessIndependentEvidence: false,
    }),
  );
  assert.equal(decision.tier, 0);
  assert.equal(decision.freshness.verdict, "rejected-clock-proxy");
});

test("evaluator: georeferenced coords allow Tier 1 but not Tier 2", () => {
  const fl = PUBLICATION_EVIDENCE_FIXTURES.find((c) => c.id === "fl-geocode-mismatch");
  assert.ok(fl);
  const flDecision = evaluateFacilityEligibility(
    fl.input as unknown as FacilityEligibilityInput,
  );
  assert.equal(flDecision.tier, 1);
  assert.equal(flDecision.mapEligible, false);
  assert.ok(flDecision.reasons.includes("georeferenced-coordinates-not-licensing"));
});

test("evaluator: California blocked and Oregon development stay non-public", () => {
  const ca = PUBLICATION_EVIDENCE_FIXTURES.find((c) => c.id === "ca-publication-blocked");
  assert.ok(ca);
  const caDecision = evaluateFacilityEligibility(
    ca.input as unknown as FacilityEligibilityInput,
  );
  assert.equal(caDecision.tier, 0);
  assert.ok(caDecision.reasons.includes("california-publication-blocked"));

  const or = PUBLICATION_EVIDENCE_FIXTURES.find((c) => c.id === "or-development-no-street");
  assert.ok(or);
  const orDecision = evaluateFacilityEligibility(
    or.input as unknown as FacilityEligibilityInput,
  );
  assert.equal(orDecision.tier, 0);
  assert.equal(orDecision.finalPublicVisibility, false);
  assert.equal(orDecision.mapEligible, false);
});

test("profiles and readiness: researched states STOP except WA GO", () => {
  assert.equal(PUBLICATION_STATE_PROFILES.length, 9);
  assert.equal(publicationStateProfile("Washington")?.publicationStopGo, "GO");
  assert.equal(publicationStateProfile("Oregon")?.publicationStopGo, "STOP");
  assert.equal(publicationStateProfile("California")?.californiaPublicationBlocked, true);
  assert.equal(publicationStateProfile("Oregon")?.oregonMapDisabled, true);
  for (const state of [
    "Florida",
    "North Carolina",
    "South Carolina",
    "Kentucky",
    "Tennessee",
    "Massachusetts",
  ]) {
    assert.equal(publicationStateProfile(state)?.publicationStopGo, "STOP");
    assert.equal(publicationStateProfile(state)?.ownerClaimsEnabled, false);
  }

  const report = buildPublicationReadinessReport();
  assert.equal(report.developmentOnly, true);
  assert.equal(report.supabaseWrites, false);
  assert.equal(report.exclusionsActivated, false);
  assert.equal(report.statewideLaunchReadyClaimFromSamples, false);
  assert.deepEqual(report.goStates, ["Washington"]);
  assert.equal(report.stopStates.includes("California"), true);
  assert.equal(publicationReadinessAllowsNewPublicState(), false);
  assert.equal(
    PUBLICATION_STATE_EVIDENCE_SCOPES.every((s) => s.statewideLaunchReadyClaim === false),
    true,
  );
});

test("rollout: Oregon first realistic candidate; Florida follow-on; no auto publish", () => {
  assert.equal(FIRST_REALISTIC_LAUNCH_CANDIDATE.state, "Oregon");
  assert.equal(
    FIRST_REALISTIC_LAUNCH_CANDIDATE.strongestUnpublishedFollowOn.state,
    "Florida",
  );
  assert.equal(FIRST_REALISTIC_LAUNCH_CANDIDATE.notAPublicLaunchAuthorization, true);
  const plan = buildPublicationRolloutPlan();
  assert.equal(plan.allowsPublicationWithoutApproval, false);
  assert.equal(plan.mergesToMain, false);
  assert.equal(plan.supabaseWrites, false);
  assert.ok(plan.phases.length >= 4);
  assert.ok(plan.rollback.length >= 5);
});

test("invariants: WA/OR/CA directory, owner claims, exclusions, compatibility counts", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);

  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(mapHref("Oregon"), null);
  assert.equal(oregonRefreshReady(), false);
  assert.equal(OREGON_LISTED_COUNT, 1584);
  assert.equal(
    directoryHref("Oregon", "https://ajjsyloyihcqdomywhik.supabase.co"),
    "/oregon",
  );
  assert.equal(directoryHref("Oregon", "https://ci.invalid"), null);

  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryHref("California", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("California"), null);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_POLICY.activated, false);

  assert.deepEqual(ENABLED_OWNER_FACILITY_STATES, ["WA"]);
  assert.equal(OWNER_FACILITY_SOURCE, "wa_dshs_listed_facilities");

  // development after Alabama #188 (Class B, unpublished STOP)
  assert.deepEqual(compatibilityClassCounts(), { A: 2, B: 21, C: 13, D: 14 });

  assert.equal(existsSync(join(fixtureDir, "hard-cases.json")), true);
  const meta = JSON.parse(readFileSync(join(fixtureDir, "hard-cases.json"), "utf8")) as {
    caseCount: number;
    specVersion: string;
  };
  assert.equal(meta.caseCount, PUBLICATION_EVIDENCE_FIXTURES.length);
  assert.equal(meta.specVersion, PUBLICATION_ELIGIBILITY_SPEC_VERSION);
});

test("development preview page exists and stays under /development", () => {
  const page = readFileSync(
    join(root, "app/development/publication-eligibility/page.tsx"),
    "utf8",
  );
  assert.match(page, /UNPUBLISHED DEVELOPMENT REVIEW/);
  assert.match(page, /Tiered publication eligibility/);
  assert.equal(existsSync(join(root, "app/california")), false);
});

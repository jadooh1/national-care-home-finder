import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  NEXT_STATE_CANDIDATES,
  NEXT_STATE_EXCLUDED_FROM_RANKING,
  NEXT_STATE_SELECTION,
  buildNextStateLaunchReadinessReport,
  nextStateAllowsPublication,
} from "../../../lib/next-state-launch-readiness.ts";
import {
  OHIO_TIER1_COUNTS,
  OHIO_TIER1_FRESHNESS,
  OHIO_TIER1_RULES,
  buildOhioTier1EligibilityPreview,
  ohioTier1AllowsPublication,
  ohioTier1DirectoryReady,
} from "../../../lib/ohio-tier1-eligibility.ts";
import {
  OHIO_ODH_CLARIFICATION_EMAIL_DRAFT,
  buildOhioTier1LaunchPlan,
} from "../../../lib/ohio-tier1-launch.ts";
import {
  FLORIDA_TIER1_COUNTS,
  buildFloridaTier1EligibilityPreview,
} from "../../../lib/florida-tier1-eligibility.ts";
import {
  evaluateFacilityEligibility,
  blockedFixtureInput,
} from "../../../lib/publication-eligibility.ts";
import {
  directoryContract,
  mapHref,
  oregonRefreshReady,
} from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { CALIFORNIA_PHASE18_EXCLUSION_POLICY } from "../../../lib/california-phase18-exclusion-policy.ts";
import {
  PRIVATE_INDEX_PREFIXES,
  robotsPolicy,
  sitemapPaths,
} from "../../../lib/public-indexing.ts";
import { ohioDirectoryReady } from "../../../lib/ohio-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/next-state-launch-readiness",
);

test("next-state ranking selects Ohio as strongest alternate Tier 1 candidate", () => {
  const report = buildNextStateLaunchReadinessReport();
  assert.equal(NEXT_STATE_SELECTION.state, "Ohio");
  assert.equal(report.selected.state, "Ohio");
  assert.equal(report.ranking[0]?.state, "Ohio");
  assert.equal(report.ranking[0]?.tier1StructuralScore >= 8, true);
  assert.equal(NEXT_STATE_CANDIDATES.length, 8);
  assert.equal(NEXT_STATE_CANDIDATES[0]?.state, "Ohio");
  // Virginia may have higher link-inclusive score but not higher structural.
  const virginia = NEXT_STATE_CANDIDATES.find((c) => c.state === "Virginia");
  assert.ok(virginia);
  assert.equal(
    NEXT_STATE_CANDIDATES[0]!.tier1StructuralScore >= virginia!.tier1StructuralScore,
    true,
  );
  assert.equal(report.stopGoPublic, "STOP");
  assert.equal(report.stopGoDevelopmentPreview, "GO");
  assert.equal(nextStateAllowsPublication(), false);
  assert.equal(report.allowsPublication, false);
  assert.equal(report.finalPublicVisibility, false);
});

test("next-state ranking excludes WA/FL/OR/CA/NC/DE/MA from the top eight", () => {
  const names = NEXT_STATE_EXCLUDED_FROM_RANKING.map((e) => e.state);
  for (const required of [
    "Washington",
    "Florida",
    "Oregon",
    "California",
    "North Carolina",
    "Delaware",
    "Massachusetts",
  ]) {
    assert.equal(names.includes(required), true);
  }
  const ranked = NEXT_STATE_CANDIDATES.map((c) => c.state);
  assert.equal(ranked.includes("North Carolina"), false);
  assert.equal(ranked.includes("Delaware"), false);
  assert.equal(ranked.includes("Massachusetts"), false);
  assert.equal(ranked.includes("Florida"), false);
});

test("ohio tier1 preview: 801 ACTIVE offline eligible; publication still 0", () => {
  const preview = buildOhioTier1EligibilityPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.counts.denominatorRowsL12, 1152);
  assert.equal(preview.counts.active, 801);
  assert.equal(preview.counts.tier1OfflineEligible, 801);
  assert.equal(preview.counts.publicationEligible, 0);
  assert.equal(preview.counts.ownerClaimEligible, 0);
  assert.equal(OHIO_TIER1_RULES.allowedStatuses.includes("ACTIVE"), true);
  assert.equal(OHIO_TIER1_RULES.disclosureLinkRequired, false);
  assert.equal(OHIO_TIER1_RULES.coordinatesRequired, false);
  assert.equal(OHIO_TIER1_RULES.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(OHIO_TIER1_FRESHNESS.recordedExportDate, null);
  assert.equal(OHIO_TIER1_FRESHNESS.blocksPublicTier1, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoDevelopmentPreview, "GO");
  assert.equal(ohioTier1AllowsPublication(), false);
  assert.equal(ohioTier1DirectoryReady(), false);
  assert.equal(ohioDirectoryReady(), false);
});

test("ohio tier1 excludes pending renewal, pending, and closed statuses", () => {
  assert.deepEqual(OHIO_TIER1_RULES.allowedStatuses, ["ACTIVE"]);
  assert.equal(
    OHIO_TIER1_RULES.unsupportedStatusesExcluded.includes("ACTIVE - PENDING RENEWAL"),
    true,
  );
  assert.equal(OHIO_TIER1_RULES.unsupportedStatusesExcluded.includes("PENDING"), true);
  assert.equal(
    OHIO_TIER1_COUNTS.active
      + OHIO_TIER1_COUNTS.activePendingRenewal
      + OHIO_TIER1_COUNTS.pending
      + OHIO_TIER1_COUNTS.closedOwner
      + OHIO_TIER1_COUNTS.closedOther
      + OHIO_TIER1_COUNTS.closedState,
    1152,
  );
});

test("ohio freshness evaluator fails without ISO; eligibility never auto-publishes", () => {
  const decision = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Ohio",
      stateAuthorization: "unpublished",
      facilityIdentity: "OHL01187",
      identityKind: "facility-id",
      issuingAuthority: "Ohio Department of Health",
      sourceProvenanceVerified: true,
      originalCategory: "Residential Care Facility",
      categoryInScope: true,
      originalStatus: "ACTIVE",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "1 Main",
      city: "Columbus",
      postalCode: "43215",
      physicalAddressUsable: true,
      officialExportDateIso: null,
      rejectedPageTimestampAsExport: true,
      freshnessPolicyDocumented: false,
      freshnessIndependentEvidence: false,
      disclosureVerified: false,
    }),
  );
  assert.equal(decision.listingEligible, false);
  assert.equal(decision.finalPublicVisibility, false);
  assert.equal(decision.reasons.includes("missing-official-iso-export-date"), true);
  assert.equal(decision.reasons.includes("state-authorization-unpublished"), true);
});

test("florida parallel track and oregon restrictions preserved", () => {
  const fl = buildFloridaTier1EligibilityPreview();
  assert.equal(FLORIDA_TIER1_COUNTS.tier1OfflineEligible, 2251);
  assert.equal(fl.counts.publicationEligible, 0);
  assert.equal(directoryContract("Florida")?.publication, "unpublished");
  assert.equal(floridaDirectoryReady(), false);
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(mapHref("Oregon"), null);
  assert.equal(oregonRefreshReady(), false);
  assert.equal(directoryContract("Ohio")?.publication, "unpublished");
});

test("ohio launch email draft prepared; must not send; invariants hold", () => {
  const launch = buildOhioTier1LaunchPlan();
  assert.equal(OHIO_ODH_CLARIFICATION_EMAIL_DRAFT.doNotSend, true);
  assert.equal(launch.emailSent, false);
  assert.equal(launch.allowsPublicationWithoutApproval, false);
  assert.match(OHIO_ODH_CLARIFICATION_EMAIL_DRAFT.body, /ISO/);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_POLICY.activated, false);
  assert.equal(PRIVATE_INDEX_PREFIXES.includes("/development"), true);
  assert.equal((robotsPolicy(true).disallow as string[]).includes("/development"), true);
  assert.equal(sitemapPaths(true, []).includes("/development/ohio-tier1"), false);
  assert.equal(sitemapPaths(true, []).includes("/ohio"), false);
});

test("next-state fixtures and preview routes exist", () => {
  const summaryPath = join(fixtureDir, "ranking-summary.json");
  assert.equal(existsSync(summaryPath), true);
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  assert.equal(summary.selectedState, "Ohio");
  assert.equal(summary.ohioTier1OfflineEligible, 801);
  assert.equal(summary.publicationEligible, 0);
  assert.equal(summary.decision, "STOP");
  assert.equal(existsSync(join(root, "app/development/ohio-tier1/page.tsx")), true);
  assert.equal(
    existsSync(join(root, "app/development/next-state-readiness/page.tsx")),
    true,
  );
  assert.equal(existsSync(join(root, "docs/next-state-launch-readiness.md")), true);
  assert.equal(existsSync(join(root, "lib/next-state-launch-readiness.ts")), true);
  assert.equal(existsSync(join(root, "lib/ohio-tier1-eligibility.ts")), true);
});

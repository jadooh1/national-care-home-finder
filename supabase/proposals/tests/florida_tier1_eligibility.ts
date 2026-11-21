import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FLORIDA_TIER1_COUNTS,
  FLORIDA_TIER1_EXCLUSIONS,
  FLORIDA_TIER1_FRESHNESS,
  FLORIDA_TIER1_RULES,
  buildFloridaTier1EligibilityPreview,
  floridaTier1AllowsPublication,
  floridaTier1DirectoryReady,
} from "../../../lib/florida-tier1-eligibility.ts";
import {
  FLORIDA_AHCA_CLARIFICATION_EMAIL_DRAFT,
  buildFloridaTier1LaunchPlan,
} from "../../../lib/florida-tier1-launch.ts";
import {
  evaluateFacilityEligibility,
  blockedFixtureInput,
} from "../../../lib/publication-eligibility.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  oregonRefreshReady,
} from "../../../lib/state-directory.ts";
import {
  ENABLED_OWNER_FACILITY_STATES,
  OWNER_FACILITY_SOURCE,
} from "../../../lib/owner-facility-read.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { CALIFORNIA_PHASE18_EXCLUSION_POLICY } from "../../../lib/california-phase18-exclusion-policy.ts";
import {
  PRIVATE_INDEX_PREFIXES,
  robotsPolicy,
  sitemapPaths,
} from "../../../lib/public-indexing.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/florida-tier1-eligibility",
);

test("florida tier1 preview counts: 2251 offline eligible; publication still 0", () => {
  const preview = buildFloridaTier1EligibilityPreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.counts.denominatorRows, 3025);
  assert.equal(preview.counts.licensed, 2253);
  assert.equal(preview.counts.inReview, 645);
  assert.equal(preview.counts.tier1OfflineEligible, 2251);
  assert.equal(preview.counts.publicationEligible, 0);
  assert.equal(preview.counts.ownerClaimEligible, 0);
  assert.equal(
    FLORIDA_TIER1_COUNTS.licensed
      - FLORIDA_TIER1_COUNTS.duplicateLicenseNumberLicensedRowsExcluded
      - FLORIDA_TIER1_COUNTS.blankStateLicensedRowsExcluded,
    2251,
  );
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.stopGoDevelopmentPreview, "GO");
  assert.equal(preview.allowsPublication, false);
  assert.equal(preview.finalPublicVisibility, false);
  assert.equal(preview.floridaDirectoryReady, false);
  assert.equal(floridaTier1AllowsPublication(), false);
  assert.equal(floridaTier1DirectoryReady(), false);
  assert.equal(floridaDirectoryReady(), false);
});

test("florida tier1 rules exclude IN REVIEW, 7622 pair, and blank state", () => {
  assert.deepEqual(FLORIDA_TIER1_RULES.allowedStatuses, ["LICENSED"]);
  assert.equal(FLORIDA_TIER1_RULES.unsupportedStatusesExcluded.includes("IN REVIEW"), true);
  assert.equal(FLORIDA_TIER1_RULES.excludeDuplicateLicenseNumber, "7622");
  assert.equal(FLORIDA_TIER1_RULES.coordinatesRequired, false);
  assert.equal(FLORIDA_TIER1_RULES.inspectionLinkRequired, false);
  assert.equal(FLORIDA_TIER1_RULES.afchIncluded, false);
  assert.equal(FLORIDA_TIER1_RULES.categoryEquivalenceToWashingtonAfh, false);

  const dup = FLORIDA_TIER1_EXCLUSIONS.find((e) => e.reason === "duplicate-license-number");
  assert.ok(dup);
  assert.equal(dup.rows.length, 2);
  assert.equal(dup.rows[0]?.licenseId, "979");
  assert.equal(dup.rows[0]?.licenseStatus, "LICENSED");
  assert.equal(dup.rows[1]?.licenseId, "1005");
  assert.equal(dup.rows[1]?.licenseStatus, "PROVISIONAL");

  const blank = FLORIDA_TIER1_EXCLUSIONS.find((e) => e.reason === "blank-state");
  assert.ok(blank);
  assert.equal(blank.rows[0]?.licenseId, "524833");

  const status = FLORIDA_TIER1_EXCLUSIONS.find((e) => e.reason === "status-not-licensed");
  assert.ok(status);
  assert.equal(status.rowsExcluded, 772);
});

test("florida tier1 freshness still blocks public launch; email draft not sent", () => {
  assert.equal(FLORIDA_TIER1_FRESHNESS.recordedExportDate, null);
  assert.equal(FLORIDA_TIER1_FRESHNESS.blocksPublicTier1, true);
  assert.equal(FLORIDA_TIER1_FRESHNESS.freshnessPolicyDocumented, false);

  const launch = buildFloridaTier1LaunchPlan();
  assert.equal(launch.allowsPublicationWithoutApproval, false);
  assert.equal(launch.emailSent, false);
  assert.equal(launch.agencyEmailDraft.doNotSend, true);
  assert.equal(FLORIDA_AHCA_CLARIFICATION_EMAIL_DRAFT.doNotSend, true);
  assert.match(launch.agencyEmailDraft.body, /LicenseNumber 7622/);
  assert.match(launch.agencyEmailDraft.body, /IN REVIEW/);
  assert.match(launch.agencyEmailDraft.body, /ISO/);
  assert.ok(launch.phases.length >= 3);
  assert.ok(launch.rollback.length >= 4);
});

test("eligibility never auto-publishes Florida; unpublished Tier1 stays non-public", () => {
  const decision = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Florida",
      stateAuthorization: "unpublished",
      facilityIdentity: "313782",
      identityKind: "facility-id",
      issuingAuthority: "Florida AHCA",
      sourceProvenanceVerified: true,
      originalCategory: "Assisted Living Facility",
      categoryInScope: true,
      originalStatus: "LICENSED",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "911 SW 12TH AVE",
      city: "MIAMI",
      postalCode: "33130",
      physicalAddressUsable: true,
      officialExportDateIso: null,
      rejectedPageTimestampAsExport: true,
      freshnessPolicyDocumented: false,
      freshnessIndependentEvidence: false,
      disclosureVerified: true,
      disclosureUrl:
        "https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID=313782",
    }),
  );
  assert.equal(decision.tier, 0);
  assert.equal(decision.finalPublicVisibility, false);
  assert.ok(decision.reasons.includes("state-authorization-unpublished") || decision.tier === 0);

  const withIsoStillUnpublished = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Florida",
      stateAuthorization: "unpublished",
      facilityIdentity: "313782",
      identityKind: "facility-id",
      issuingAuthority: "Florida AHCA",
      sourceProvenanceVerified: true,
      originalCategory: "Assisted Living Facility",
      categoryInScope: true,
      originalStatus: "LICENSED",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "911 SW 12TH AVE",
      city: "MIAMI",
      postalCode: "33130",
      physicalAddressUsable: true,
      officialExportDateIso: "2026-11-21",
      disclosureVerified: true,
      disclosureUrl:
        "https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID=313782",
    }),
  );
  assert.equal(withIsoStillUnpublished.listingEligible, true);
  assert.equal(withIsoStillUnpublished.finalPublicVisibility, false);
});

test("oregon/wa/ca invariants preserved; florida stays unpublished", () => {
  assert.equal(directoryContract("Florida")?.publication, "unpublished");
  assert.equal(directoryHref("Florida", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Florida"), null);

  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(mapHref("Oregon"), null);
  assert.equal(oregonRefreshReady(), false);

  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.deepEqual(ENABLED_OWNER_FACILITY_STATES, ["WA"]);
  assert.equal(OWNER_FACILITY_SOURCE, "wa_dshs_listed_facilities");
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_POLICY.activated, false);

  assert.equal(PRIVATE_INDEX_PREFIXES.includes("/development"), true);
  assert.equal((robotsPolicy(true).disallow as string[]).includes("/development"), true);
  assert.equal(sitemapPaths(true, []).includes("/development/florida-tier1"), false);
});

test("fixtures and development preview page exist", () => {
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "exclusions.json")), true);
  assert.equal(existsSync(join(fixtureDir, "preview-sample.json")), true);
  const capture = JSON.parse(
    readFileSync(join(fixtureDir, "capture-summary.json"), "utf8"),
  ) as { tier1EligibleCount: number; rows: number };
  assert.equal(capture.tier1EligibleCount, 2251);
  assert.equal(capture.rows, 3025);

  const page = readFileSync(
    join(root, "app/development/florida-tier1/page.tsx"),
    "utf8",
  );
  assert.match(page, /Florida Tier 1 eligibility preview/);
  assert.match(page, /tier1OfflineEligible/);
  assert.match(page, /stopGoPublic/);
  assert.match(page, /IN REVIEW excluded/);
  assert.match(page, /7622/);
  assert.match(page, /does not publish Florida/);
  assert.equal(existsSync(join(root, "docs/florida-tier1-eligibility-verification.md")), true);
  assert.equal(existsSync("app/florida"), false);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT,
  FLORIDA_SOURCE_DATE_CANDIDATES,
  FLORIDA_SOURCE_DATE_DECISION,
  FLORIDA_SOURCE_DATE_POLICY_GATE,
  FLORIDA_SOURCE_DATE_PRESERVED_COUNTS,
  buildFloridaAhcaSourceDateReport,
  floridaSourceDateAllowsPublication,
  floridaSourceDateClearsFreshnessGate,
} from "../../../lib/florida-ahca-source-date.ts";
import {
  FLORIDA_TIER1_COUNTS,
  FLORIDA_TIER1_FRESHNESS,
  buildFloridaTier1EligibilityPreview,
} from "../../../lib/florida-tier1-eligibility.ts";
import {
  evaluateFacilityEligibility,
  blockedFixtureInput,
} from "../../../lib/publication-eligibility.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import {
  directoryContract,
  mapHref,
  oregonRefreshReady,
} from "../../../lib/state-directory.ts";
import {
  ENABLED_OWNER_FACILITY_STATES,
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
  "../fixtures/florida-ahca-source-date",
);

test("florida source-date STOP: no ISO; policy does not clear Tier 1 freshness", () => {
  const report = buildFloridaAhcaSourceDateReport();
  assert.equal(report.decision.verdict, "STOP");
  assert.equal(report.decision.authoritativeIsoExportDate, null);
  assert.equal(report.decision.freshnessPolicyExceptionApplies, false);
  assert.equal(report.decision.blocksPublicTier1, true);
  assert.equal(report.acceptedOfficialExportCandidates, 0);
  assert.equal(FLORIDA_SOURCE_DATE_POLICY_GATE.permitsTier1WithoutIsoExportDate, false);
  assert.equal(FLORIDA_SOURCE_DATE_POLICY_GATE.floridaFreshnessPolicyDocumented, false);
  assert.equal(FLORIDA_SOURCE_DATE_POLICY_GATE.floridaIndependentCurrentnessEvidence, false);
  assert.equal(FLORIDA_SOURCE_DATE_POLICY_GATE.nightlyScheduleAloneInsufficient, true);
  assert.equal(floridaSourceDateClearsFreshnessGate(), false);
  assert.equal(floridaSourceDateAllowsPublication(), false);
  assert.equal(report.stopGoPublic, "STOP");
  assert.equal(report.stopGoDevelopmentPreview, "GO");
  assert.equal(report.allowsPublication, false);
  assert.equal(report.finalPublicVisibility, false);
  assert.equal(report.emailSent, false);
});

test("florida source-date rejects clocks, nightly, county sample, GIS, wrong dataset", () => {
  const ids = FLORIDA_SOURCE_DATE_CANDIDATES.map((c) => c.id);
  assert.equal(ids.includes("http-date-header"), true);
  assert.equal(ids.includes("consumer-guide-nightly"), true);
  assert.equal(ids.includes("go-live-pdf-alf-nightly"), true);
  assert.equal(ids.includes("miami-dade-sample-xlsx"), true);
  assert.equal(ids.includes("doh-gis-2013"), true);
  assert.equal(ids.includes("order-data-patient-files"), true);
  for (const c of FLORIDA_SOURCE_DATE_CANDIDATES) {
    assert.equal(c.acceptedAsOfficialExport, false);
  }
});

test("florida source-date preserves 2251 offline Tier 1 and zero public", () => {
  assert.equal(FLORIDA_SOURCE_DATE_PRESERVED_COUNTS.tier1OfflineEligible, 2251);
  assert.equal(FLORIDA_SOURCE_DATE_PRESERVED_COUNTS.publicationEligible, 0);
  assert.equal(FLORIDA_SOURCE_DATE_PRESERVED_COUNTS.finalPublicVisibility, false);
  assert.equal(
    FLORIDA_SOURCE_DATE_PRESERVED_COUNTS.tier1OfflineEligible,
    FLORIDA_TIER1_COUNTS.tier1OfflineEligible,
  );
  assert.equal(
    FLORIDA_SOURCE_DATE_PRESERVED_COUNTS.publicationEligible,
    FLORIDA_TIER1_COUNTS.publicationEligible,
  );
  const preview = buildFloridaTier1EligibilityPreview();
  assert.equal(preview.counts.tier1OfflineEligible, 2251);
  assert.equal(preview.counts.publicationEligible, 0);
  assert.equal(preview.finalPublicVisibility, false);
  assert.equal(FLORIDA_TIER1_FRESHNESS.blocksPublicTier1, true);
  assert.equal(FLORIDA_TIER1_FRESHNESS.recordedExportDate, null);
});

test("nationwide freshness evaluator still fails Florida without ISO or policy exception", () => {
  const blocked = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Florida",
      stateAuthorization: "unpublished",
      officialExportDateIso: null,
      rejectedPageTimestampAsExport: true,
      freshnessPolicyDocumented: false,
      freshnessIndependentEvidence: false,
    }),
  );
  assert.equal(blocked.freshness.verdict === "official-iso-export", false);
  assert.equal(blocked.freshness.verdict === "documented-policy-exception", false);
  assert.equal(blocked.listingEligible, false);
  assert.equal(blocked.finalPublicVisibility, false);

  const nightlyOnly = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Florida",
      stateAuthorization: "unpublished",
      officialExportDateIso: null,
      rejectedPageTimestampAsExport: true,
      freshnessPolicyDocumented: false,
      freshnessIndependentEvidence: false,
      facilityIdentity: "979",
      identityKind: "facility-id",
      originalStatus: "LICENSED",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "1 Main",
      city: "Tampa",
      postalCode: "33602",
      physicalAddressUsable: true,
      disclosureUrl: "https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID=979",
      disclosureVerified: true,
      sourceProvenanceVerified: true,
      categoryInScope: true,
      originalCategory: "Assisted Living Facility",
      issuingAuthority: "AHCA",
    }),
  );
  assert.equal(nightlyOnly.listingEligible, false);
  assert.equal(nightlyOnly.finalPublicVisibility, false);
  assert.equal(nightlyOnly.reasons.includes("missing-official-iso-export-date"), true);
});

test("florida source-date email draft is prepared and must not send", () => {
  assert.equal(FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT.doNotSend, true);
  assert.match(FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT.subject, /export date|version stamp/i);
  assert.match(FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT.body, /ClientCode 11/);
  assert.match(FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT.body, /updated nightly/);
  assert.equal(FLORIDA_SOURCE_DATE_DECISION.verdict, "STOP");
});

test("florida source-date does not publish, touch Oregon, CA exclusion, or owner claims", () => {
  assert.equal(directoryContract("Florida")?.publication, "unpublished");
  assert.equal(floridaDirectoryReady(), false);
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(mapHref("Oregon"), null);
  assert.equal(oregonRefreshReady(), false);
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_POLICY.activated, false);
  assert.equal(PRIVATE_INDEX_PREFIXES.includes("/development"), true);
  assert.equal((robotsPolicy(true).disallow as string[]).includes("/development"), true);
  assert.equal(sitemapPaths(true, []).includes("/development/florida-source-date"), false);
  assert.equal(sitemapPaths(true, []).includes("/florida"), false);
});

test("florida source-date fixtures and preview route exist", () => {
  const summaryPath = join(fixtureDir, "probe-summary.json");
  assert.equal(existsSync(summaryPath), true);
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  assert.equal(summary.decision, "STOP");
  assert.equal(summary.authoritativeIsoExportDate, null);
  assert.equal(summary.preservedTier1OfflineEligible, 2251);
  assert.equal(summary.publicationEligible, 0);
  assert.equal(
    existsSync(join(root, "app/development/florida-source-date/page.tsx")),
    true,
  );
  assert.equal(
    existsSync(join(root, "docs/florida-ahca-source-date-verification.md")),
    true,
  );
  assert.equal(existsSync(join(root, "lib/florida-ahca-source-date.ts")), true);
});

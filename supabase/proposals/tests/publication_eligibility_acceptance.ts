import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  evaluateFacilityEligibility,
  blockedFixtureInput,
  type FacilityEligibilityInput,
} from "../../../lib/publication-eligibility.ts";
import { PUBLICATION_EVIDENCE_FIXTURES } from "../../../lib/publication-eligibility-evidence.ts";
import { publicationStateProfile } from "../../../lib/publication-eligibility-profiles.ts";
import { buildPublicationReadinessReport } from "../../../lib/publication-eligibility-readiness.ts";
import {
  PUBLICATION_ACCEPTANCE_MATRIX,
  PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION,
  buildPublicationAcceptanceReport,
  publicationAcceptanceAllowsPublicLaunch,
} from "../../../lib/publication-eligibility-acceptance.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  oregonRefreshReady,
} from "../../../lib/state-directory.ts";
import {
  OREGON_PUBLIC_FIELDS,
  oregonPublicDirectoryAvailable,
} from "../../../lib/oregon-public-directory.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { FLORIDA_CURRENT_CAPTURE } from "../../../lib/florida-source-verification.ts";
import { FLORIDA_INVESTIGATION_STOP_GO } from "../../../lib/florida-investigation-readiness.ts";
import { buildFloridaEligibilityMatrix } from "../../../lib/florida-eligibility-matrix.ts";
import { evaluateFloridaDisclosureInvestigation } from "../../../lib/florida-disclosure-investigation.ts";
import {
  PRIVATE_INDEX_PREFIXES,
  PUBLIC_CANONICAL_HOST,
  robotsPolicy,
  sitemapPaths,
  responseIndexingAllowed,
} from "../../../lib/public-indexing.ts";
import {
  ENABLED_OWNER_FACILITY_STATES,
  OWNER_FACILITY_SOURCE,
} from "../../../lib/owner-facility-read.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { CALIFORNIA_PHASE18_EXCLUSION_POLICY } from "../../../lib/california-phase18-exclusion-policy.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("access: /development is noindex and publication-eligibility stays out of sitemap", () => {
  assert.equal(PRIVATE_INDEX_PREFIXES.includes("/development"), true);
  assert.equal(PRIVATE_INDEX_PREFIXES.includes("/oregon"), true);
  const publicRobots = robotsPolicy(true);
  assert.equal(Array.isArray(publicRobots.disallow), true);
  assert.equal((publicRobots.disallow as string[]).includes("/development"), true);
  assert.equal((publicRobots.disallow as string[]).includes("/oregon"), true);

  const publicEnv = { vercelEnv: "production" as const, productionHost: PUBLIC_CANONICAL_HOST };
  assert.equal(responseIndexingAllowed(publicEnv, PUBLIC_CANONICAL_HOST), true);
  const paths = sitemapPaths(true, []);
  assert.equal(paths.every((p) => !p.startsWith("/development")), true);
  assert.equal(paths.every((p) => !p.startsWith("/oregon")), true);
  assert.equal(paths.includes("/development/publication-eligibility"), false);

  const page = readFileSync(
    join(root, "app/development/publication-eligibility/page.tsx"),
    "utf8",
  );
  const layout = readFileSync(join(root, "app/development/layout.tsx"), "utf8");
  assert.match(layout, /unindexedMetadata/);
  assert.match(page, /Robots disallow/);
  assert.match(page, /Oregon &amp; Florida acceptance|Oregon \& Florida acceptance|Oregon/);
  assert.match(page, /T0/);
  assert.match(page, /blockers/i);
  assert.match(page, /ISO export/);
  assert.match(page, /role=\"alert\"|Readiness data incomplete/);
  assert.match(page, /Eligibility never auto-publishes/);
});

test("oregon acceptance: development restrictions and framework Tier 0", () => {
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(mapHref("Oregon"), null);
  assert.equal(oregonRefreshReady(), false);
  assert.equal(
    directoryHref("Oregon", "https://ajjsyloyihcqdomywhik.supabase.co"),
    "/oregon",
  );
  assert.equal(directoryHref("Oregon", "https://www.nationalcarehomefinder.com"), null);
  assert.equal(oregonPublicDirectoryAvailable("https://ci.invalid"), false);
  assert.equal(OREGON_PUBLIC_FIELDS.includes("source_id"), true);
  assert.equal(OREGON_PUBLIC_FIELDS.includes("city"), true);
  assert.equal(
    (OREGON_PUBLIC_FIELDS as readonly string[]).includes("street"),
    false,
  );
  assert.equal(
    (OREGON_PUBLIC_FIELDS as readonly string[]).includes("latitude"),
    false,
  );

  const profile = publicationStateProfile("Oregon");
  assert.equal(profile?.publicationStopGo, "STOP");
  assert.equal(profile?.oregonMapDisabled, true);
  assert.equal(profile?.ownerClaimsEnabled, false);
  assert.equal(profile?.freshness.officialExportDateIso, null);

  const readiness = buildPublicationReadinessReport().summaries.find(
    (s) => s.state === "Oregon",
  );
  assert.ok(readiness);
  assert.equal(readiness.stopGo, "STOP");
  assert.equal(readiness.oregonMapDisabled, true);
  assert.ok(readiness.blockers.includes("map-disabled"));
  assert.ok(readiness.blockers.includes("no-authoritative-iso-export-date"));

  const orCase = PUBLICATION_EVIDENCE_FIXTURES.find(
    (c) => c.id === "or-development-no-street",
  );
  assert.ok(orCase);
  const decision = evaluateFacilityEligibility(
    orCase.input as unknown as FacilityEligibilityInput,
  );
  assert.equal(decision.tier, 0);
  assert.equal(decision.finalPublicVisibility, false);
  assert.equal(decision.mapEligible, false);
  assert.equal(decision.ownerClaimEligible, false);
});

test("florida acceptance: identifiers/disclosure pass; freshness/coords/status blocked", () => {
  assert.equal(directoryContract("Florida")?.publication, "unpublished");
  assert.equal(directoryHref("Florida", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Florida"), null);
  assert.equal(floridaDirectoryReady(), false);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.rows, 3025);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.recordedExportDate, null);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.coordinatesAreLicensingCoordinates, false);
  assert.equal(FLORIDA_CURRENT_CAPTURE.publicationEligibleRows, 0);
  assert.equal(FLORIDA_INVESTIGATION_STOP_GO.decision, "STOP");

  const matrix = buildFloridaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.stopGo, "STOP");
  assert.equal(matrix.ownerClaimEligible, false);

  const disclosure = evaluateFloridaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, true);
  assert.equal(disclosure.allowsPublication, false);

  const profile = publicationStateProfile("Florida");
  assert.equal(profile?.publicationStopGo, "STOP");
  assert.equal(profile?.disclosure.facilitySpecificVerified, true);
  assert.equal(profile?.freshness.officialExportDateIso, null);
  assert.equal(profile?.coordinates.licensingProvenanceVerified, false);

  const flGeo = PUBLICATION_EVIDENCE_FIXTURES.find((c) => c.id === "fl-geocode-mismatch");
  assert.ok(flGeo);
  const geoDecision = evaluateFacilityEligibility(
    flGeo.input as unknown as FacilityEligibilityInput,
  );
  assert.equal(geoDecision.listingEligible, true);
  assert.equal(geoDecision.mapEligible, false);
  assert.equal(geoDecision.finalPublicVisibility, false);
  assert.ok(geoDecision.reasons.includes("georeferenced-coordinates-not-licensing"));
  assert.ok(geoDecision.reasons.includes("state-authorization-unpublished"));
});

test("hard cases and never-auto-publish across OR/FL/framework", () => {
  const hardIds = [
    "or-development-no-street",
    "fl-geocode-mismatch",
    "fl-conflicting-capacity",
    "ky-duplicate-blank-id",
    "tn-ambiguous-status",
    "nc-missing-city",
    "ma-category-mismatch",
    "ky-expired-unknown-freshness",
  ];
  for (const id of hardIds) {
    const fixture = PUBLICATION_EVIDENCE_FIXTURES.find((c) => c.id === id);
    assert.ok(fixture, id);
    const decision = evaluateFacilityEligibility(
      fixture.input as unknown as FacilityEligibilityInput,
    );
    assert.equal(decision.finalPublicVisibility, false, id);
    if (fixture.state !== "Washington") {
      assert.equal(decision.ownerClaimEligible, false, id);
    }
  }

  const unpublishedClear = evaluateFacilityEligibility(
    blockedFixtureInput({
      state: "Florida",
      stateAuthorization: "unpublished",
      facilityIdentity: "LID-9",
      identityKind: "license",
      issuingAuthority: "AHCA",
      sourceProvenanceVerified: true,
      originalCategory: "Assisted Living Facility",
      categoryInScope: true,
      originalStatus: "ACTIVE",
      statusDomainKnown: true,
      statusAllowsListing: true,
      street: "1 Palm",
      city: "Miami",
      postalCode: "33101",
      physicalAddressUsable: true,
      officialExportDateIso: "2026-11-01",
      disclosureVerified: true,
      disclosureUrl: "https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID=9",
    }),
  );
  assert.equal(unpublishedClear.listingEligible, true);
  assert.equal(unpublishedClear.finalPublicVisibility, false);

  assert.deepEqual(ENABLED_OWNER_FACILITY_STATES, ["WA"]);
  assert.equal(OWNER_FACILITY_SOURCE, "wa_dshs_listed_facilities");
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_POLICY.activated, false);
});

test("acceptance matrix launch recommendation is STOP for OR and FL public", () => {
  const report = buildPublicationAcceptanceReport();
  assert.equal(report.failed, 0);
  assert.equal(report.allowsPublication, false);
  assert.equal(publicationAcceptanceAllowsPublicLaunch(), false);
  assert.equal(PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.oregon.decision, "STOP");
  assert.equal(PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.florida.decision, "STOP");
  assert.equal(PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION.overall.newPublicStatesAuthorized, false);
  assert.equal(
    PUBLICATION_ACCEPTANCE_MATRIX.every((row) => row.verdict !== "fail"),
    true,
  );
  assert.ok(report.approvalRequiredRows.includes("or-public-launch"));
  assert.ok(report.approvalRequiredRows.includes("fl-public-launch"));
  assert.ok(report.approvalRequiredRows.includes("fl-freshness"));
  assert.ok(report.previewRollback.rollback.length >= 4);
  assert.equal(existsSync(join(root, "docs/publication-eligibility-acceptance-or-fl.md")), true);
});

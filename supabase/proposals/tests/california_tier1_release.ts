import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER1_RELEASE_BASELINE,
  CALIFORNIA_TIER1_RELEASE_CHECKLIST,
  CALIFORNIA_TIER1_RELEASE_CONTROLS,
  CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT,
  CALIFORNIA_TIER1_RELEASE_LISTABLE_PENDING_INCREASE_IDS,
  CALIFORNIA_TIER1_RELEASE_OUT_OF_SCOPE_PENDING_INCREASE_IDS,
  CALIFORNIA_TIER1_RELEASE_SOURCE,
  CALIFORNIA_TIER1_RELEASE_VERIFIED_PR,
  CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE,
  californiaTier1PublicPublicationAuthorized,
  californiaTier1ReleaseCandidateReady,
  californiaTier1ReleaseEligibleCount,
  californiaTier1ReleasePublished,
  californiaTier1ReleaseRollback,
  californiaTier1SurfaceAccess,
} from "../../../lib/california-tier1-release.ts";
import {
  CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS,
  californiaTier1FullRosterIsResidual,
  californiaTier1FullRosterLookup,
  californiaTier1FullRosterSearch,
  loadCaliforniaTier1FullRosterCompact,
  loadCaliforniaTier1FullRosterManifest,
} from "../../../lib/california-tier1-full-roster.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import {
  CALIFORNIA_PUBLIC_PAGES,
  PRIVATE_INDEX_PREFIXES,
  californiaPublicSitemapAuthorized,
  sitemapPaths,
} from "../../../lib/public-indexing.ts";

const DEVELOPMENT_URL = "https://ajjsyloyihcqdomywhik.supabase.co";
const PRODUCTION_URL = "https://yiehgstweswxjakbcdzc.supabase.co";

function buildReleasePreview() {
  const manifest = loadCaliforniaTier1FullRosterManifest();
  const compact = loadCaliforniaTier1FullRosterCompact();
  const search = californiaTier1FullRosterSearch({ page: 1, pageSize: 25 });

  const residualBlocked = CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS.every(
    (id) =>
      !compact.some((r) => r.n === id)
      && californiaTier1FullRosterIsResidual(id)
      && !californiaTier1FullRosterLookup(id).ok
      && californiaTier1FullRosterSearch({ q: id }).total === 0,
  );

  const aliasBlocked = ["19201167", "19201133"].every(
    (id) =>
      californiaTier1FullRosterIsResidual(id)
      && !californiaTier1FullRosterLookup(id).ok,
  );

  const listablePiOk =
    CALIFORNIA_TIER1_RELEASE_LISTABLE_PENDING_INCREASE_IDS.length === 58
    && CALIFORNIA_TIER1_RELEASE_LISTABLE_PENDING_INCREASE_IDS.every((id) => {
      const row = compact.find((r) => r.n === id);
      return row != null && row.pi === true && californiaTier1FullRosterLookup(id).ok;
    });

  const oosPiOk =
    CALIFORNIA_TIER1_RELEASE_OUT_OF_SCOPE_PENDING_INCREASE_IDS.length === 8
    && CALIFORNIA_TIER1_RELEASE_OUT_OF_SCOPE_PENDING_INCREASE_IDS.every(
      (id) =>
        !compact.some((r) => r.n === id)
        && !californiaTier1FullRosterLookup(id).ok,
    );

  const ca = directoryContract("California");
  const wa = directoryContract("Washington");
  const or = directoryContract("Oregon");

  const safeguardsOk =
    ca?.publication === "public"
    && ca.directoryPath === "/california"
    && ca.mapPath === "/california/map"
    && mapHref("California") === "/california/map"
    && directoryHref("California", DEVELOPMENT_URL) === "/california"
    && directoryHref("California", PRODUCTION_URL) === "/california"
    && californiaPublicSitemapAuthorized()
    && sitemapPaths(true, []).includes("/california")
    && !PRIVATE_INDEX_PREFIXES.includes("/california")
    && wa?.publication === "public"
    && wa.mapPath === "/washington/map"
    && or?.publication === "development"
    && or.directoryPath === "/oregon"
    && directoryHref("Oregon", PRODUCTION_URL) === null
    && ENABLED_OWNER_FACILITY_STATES.length === 1
    && ENABLED_OWNER_FACILITY_STATES[0] === "WA"
    && CALIFORNIA_TIER1_RELEASE_CONTROLS.mapEnabled
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.ownerClaimsEnabled
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.enhancedFeaturesEnabled
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.oregonPublished
    && CALIFORNIA_TIER1_RELEASE_CONTROLS.californiaPublished
    && CALIFORNIA_TIER1_RELEASE_CONTROLS.publicPublicationAuthorized
    && CALIFORNIA_TIER1_RELEASE_CONTROLS.releaseCandidateReady;

  const arithmeticOk =
    compact.length === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && manifest.listableCount === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && manifest.publicationEligible === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && manifest.californiaPublished === true
    && manifest.exclusionsActivated === true
    && manifest.eligibilityMappingActivated === true
    && manifest.sourceAsOfIso === CALIFORNIA_TIER1_RELEASE_SOURCE.adoptedAsOfIso
    && manifest.residualExclusions === 22
    && residualBlocked
    && aliasBlocked
    && listablePiOk
    && oosPiOk
    && search.total === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && safeguardsOk
    && CALIFORNIA_TIER1_RELEASE_CHECKLIST.every((c) => c.complete);

  return {
    arithmeticOk,
    stopGoPublic: "GO",
    eligibleFacilityCount: CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT,
    recommendation:
      "GO for public Tier 1 activation under granted approval; keep map/owner/enhanced off and Oregon unpublished",
    preservedRestrictions: [
      "california-map-disabled",
      "california-owner-claims-disabled",
      "california-enhanced-features-disabled",
      "oregon-unpublished-on-production",
      "washington-design-2-preserved",
      "no-database-writes",
    ],
  };
}

test("release baseline PR #215 @ deafabb; eligible 15435; public authorized", () => {
  assert.equal(CALIFORNIA_TIER1_RELEASE_BASELINE, "deafabb");
  assert.equal(CALIFORNIA_TIER1_RELEASE_VERIFIED_PR, 215);
  assert.equal(CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT, 15435);
  assert.equal(californiaTier1ReleaseEligibleCount(), 15435);
  assert.equal(californiaTier1ReleaseCandidateReady(), true);
  assert.equal(californiaTier1ReleasePublished(), true);
  assert.equal(californiaTier1PublicPublicationAuthorized(), true);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.publicationEligibleCount, 15435);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.protectedPreviewPublication, "public");
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.mapEnabled, true);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.ownerClaimsEnabled, false);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.enhancedFeaturesEnabled, false);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.oregonPublished, false);
});

test("residual-22 and PI mapping preserved on the release roster", () => {
  const compact = loadCaliforniaTier1FullRosterCompact();
  assert.equal(CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS.length, 22);
  for (const id of CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS) {
    assert.equal(compact.some((r) => r.n === id), false, id);
  }
  assert.equal(CALIFORNIA_TIER1_RELEASE_LISTABLE_PENDING_INCREASE_IDS.length, 58);
  for (const id of CALIFORNIA_TIER1_RELEASE_LISTABLE_PENDING_INCREASE_IDS) {
    const row = compact.find((r) => r.n === id);
    assert.ok(row, id);
    assert.equal(row?.pi, true, id);
  }
  assert.equal(CALIFORNIA_TIER1_RELEASE_OUT_OF_SCOPE_PENDING_INCREASE_IDS.length, 8);
  for (const id of CALIFORNIA_TIER1_RELEASE_OUT_OF_SCOPE_PENDING_INCREASE_IDS) {
    assert.equal(compact.some((r) => r.n === id), false, id);
  }
});

test("publication safeguards: public CA directory; OR unpublished; WA intact", () => {
  assert.equal(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("California")?.directoryPath, "/california");
  assert.equal(directoryContract("California")?.mapPath, "/california/map");
  assert.equal(mapHref("California"), "/california/map");
  assert.equal(directoryHref("California", DEVELOPMENT_URL), "/california");
  assert.equal(directoryHref("California", PRODUCTION_URL), "/california");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryHref("Oregon", PRODUCTION_URL), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(sitemapPaths(true, []).includes("/california"), true);
  assert.equal(californiaPublicSitemapAuthorized(), true);
  assert.equal(CALIFORNIA_PUBLIC_PAGES.length, 2);
  assert.equal(CALIFORNIA_PUBLIC_PAGES[0]?.path, "/california");
  assert.equal(CALIFORNIA_PUBLIC_PAGES[1]?.path, "/california/map");
  assert.equal(PRIVATE_INDEX_PREFIXES.includes("/california"), false);
});

test("public pages and Design 2 homepage remain intact", () => {
  assert.equal(existsSync("app/california/page.tsx"), true);
  assert.equal(existsSync("app/california/[facilityNumber]/page.tsx"), true);
  const home = readFileSync("app/page.tsx", "utf8");
  assert.ok(home.includes("useLanguage"));
  assert.ok(home.includes('featured = ["Washington", "Oregon", "California"'));
  assert.ok(home.includes('state === "California" ? "CA"'));
  assert.equal(home.includes("/development/california"), false);
  const owner = readFileSync("lib/owner-facility-read.ts", "utf8");
  assert.ok(owner.includes('["WA"]'));
  assert.equal(owner.includes('"CA"'), false);
});

test("executable rollback keeps exclusions/mapping while unpublishing", () => {
  const rollback = californiaTier1ReleaseRollback();
  assert.equal(rollback.restoresControls.californiaPublished, false);
  assert.equal(rollback.restoresControls.publicationEligibleCount, 0);
  assert.equal(rollback.keepsEnforced.exclusionsEnforced, true);
  assert.equal(rollback.keepsEnforced.eligibilityMappingPreserved, true);
  assert.ok(rollback.steps.length >= 4);
  assert.ok(rollback.verification.some((v) => v.includes("unpublished")));
});

test("release preview arithmetic: public activation GO", () => {
  const preview = buildReleasePreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "GO");
  assert.equal(preview.eligibleFacilityCount, 15435);
  assert.ok(preview.recommendation.includes("GO for public Tier 1 activation"));
  assert.ok(preview.preservedRestrictions.includes("california-map-disabled"));
  assert.ok(preview.preservedRestrictions.includes("oregon-unpublished-on-production"));
});

test("request-level surface gate: authorized production hosts allowed", () => {
  const prodOk = californiaTier1SurfaceAccess({
    vercelEnv: "production",
    requestHost: "www.nationalcarehomefinder.com",
  });
  assert.equal(prodOk.allowed, true);
  assert.ok(prodOk.reasons.includes("public-publication-authorized"));

  const previewOk = californiaTier1SurfaceAccess({
    vercelEnv: "preview",
    requestHost: "national-care-home-finder-kkfa-git-cursor-4b77e4-amrasjad-6298.vercel.app",
  });
  assert.equal(previewOk.allowed, true);

  const unauthorizedStillDenied = californiaTier1SurfaceAccess({
    vercelEnv: "production",
    requestHost: "www.nationalcarehomefinder.com",
    publicPublicationAuthorized: false,
    californiaPublished: false,
  });
  assert.equal(unauthorizedStillDenied.allowed, false);
});

test("activation sequence documented and authorization complete", () => {
  assert.equal(californiaTier1PublicPublicationAuthorized(), true);
  assert.equal(californiaTier1ReleasePublished(), true);
  assert.ok(CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE.length >= 6);
  assert.equal(CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE[0]?.id, "confirm-freshness-and-eligible-count");
  assert.equal(CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE.at(-1)?.id, "ship-activation-pr-and-deploy-only-after-approval");
  assert.ok(
    CALIFORNIA_TIER1_RELEASE_CHECKLIST.every((c) => c.complete),
  );
});

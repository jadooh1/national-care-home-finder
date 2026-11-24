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
    ca?.publication === "development"
    && ca.directoryPath === "/california"
    && ca.mapPath === null
    && mapHref("California") === null
    && directoryHref("California", DEVELOPMENT_URL) === "/california"
    && directoryHref("California", PRODUCTION_URL) === null
    && !californiaPublicSitemapAuthorized()
    && !sitemapPaths(true, []).includes("/california")
    && PRIVATE_INDEX_PREFIXES.includes("/california")
    && wa?.publication === "public"
    && wa.mapPath === "/washington/map"
    && or?.publication === "development"
    && or.directoryPath === "/oregon"
    && directoryHref("Oregon", PRODUCTION_URL) === null
    && ENABLED_OWNER_FACILITY_STATES.length === 1
    && ENABLED_OWNER_FACILITY_STATES[0] === "WA"
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.mapEnabled
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.ownerClaimsEnabled
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.enhancedFeaturesEnabled
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.oregonPublished
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.californiaPublished
    && !CALIFORNIA_TIER1_RELEASE_CONTROLS.publicPublicationAuthorized
    && CALIFORNIA_TIER1_RELEASE_CONTROLS.releaseCandidateReady;

  const arithmeticOk =
    compact.length === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && manifest.listableCount === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && manifest.publicationEligible === CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT
    && manifest.californiaPublished === false
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
    && CALIFORNIA_TIER1_RELEASE_CHECKLIST.filter((c) => c.complete).length >= 10
    && CALIFORNIA_TIER1_RELEASE_CHECKLIST.some((c) => !c.complete && c.id === "authorize-public-publication");

  return {
    arithmeticOk,
    stopGoPublic: "STOP",
    eligibleFacilityCount: CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT,
    recommendation:
      "GO for protected RC review; STOP for public production publication without separate approval",
    preservedRestrictions: [
      "california-public-publication-unauthorized",
      "california-map-disabled",
      "california-owner-claims-disabled",
      "california-enhanced-features-disabled",
      "oregon-unpublished-on-production",
      "washington-design-2-preserved",
      "no-database-writes",
      "no-merge-or-prod-deploy-without-approval",
    ],
  };
}

test("release baseline PR #215 @ deafabb; eligible 15435; public unauthorized", () => {
  assert.equal(CALIFORNIA_TIER1_RELEASE_BASELINE, "deafabb");
  assert.equal(CALIFORNIA_TIER1_RELEASE_VERIFIED_PR, 215);
  assert.equal(CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT, 15435);
  assert.equal(californiaTier1ReleaseEligibleCount(), 15435);
  assert.equal(californiaTier1ReleaseCandidateReady(), true);
  assert.equal(californiaTier1ReleasePublished(), false);
  assert.equal(californiaTier1PublicPublicationAuthorized(), false);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.publicationEligibleCount, 15435);
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.protectedPreviewPublication, "development");
  assert.equal(CALIFORNIA_TIER1_RELEASE_CONTROLS.mapEnabled, false);
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

test("publication safeguards: protected RC preview; OR unpublished; WA intact", () => {
  assert.equal(directoryContract("California")?.publication, "development");
  assert.equal(directoryContract("California")?.directoryPath, "/california");
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(mapHref("California"), null);
  assert.equal(directoryHref("California", DEVELOPMENT_URL), "/california");
  assert.equal(directoryHref("California", PRODUCTION_URL), null);
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryHref("Oregon", PRODUCTION_URL), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(sitemapPaths(true, []).includes("/california"), false);
  assert.equal(californiaPublicSitemapAuthorized(), false);
  assert.deepEqual(CALIFORNIA_PUBLIC_PAGES, []);
  assert.ok(PRIVATE_INDEX_PREFIXES.includes("/california"));
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

test("release preview arithmetic: protected RC GO / public STOP", () => {
  const preview = buildReleasePreview();
  assert.equal(preview.arithmeticOk, true);
  assert.equal(preview.stopGoPublic, "STOP");
  assert.equal(preview.eligibleFacilityCount, 15435);
  assert.ok(preview.recommendation.includes("STOP for public production publication"));
  assert.ok(
    preview.preservedRestrictions.includes("california-public-publication-unauthorized"),
  );
});


test("request-level surface gate: production hosts fail closed until authorized", () => {
  const prodDenied = californiaTier1SurfaceAccess({
    vercelEnv: "production",
    requestHost: "www.nationalcarehomefinder.com",
  });
  assert.equal(prodDenied.allowed, false);
  assert.ok(prodDenied.reasons.includes("production-host-fail-closed") || prodDenied.reasons.includes("vercel-production-env-fail-closed"));

  const kkfaDenied = californiaTier1SurfaceAccess({
    requestHost: "national-care-home-finder-kkfa.vercel.app",
  });
  assert.equal(kkfaDenied.allowed, false);

  const previewOk = californiaTier1SurfaceAccess({
    vercelEnv: "preview",
    requestHost: "national-care-home-finder-kkfa-git-cursor-4b77e4-amrasjad-6298.vercel.app",
  });
  assert.equal(previewOk.allowed, true);

  const localOk = californiaTier1SurfaceAccess({
    requestHost: "127.0.0.1:3010",
  });
  assert.equal(localOk.allowed, true);

  const authorizedProd = californiaTier1SurfaceAccess({
    vercelEnv: "production",
    requestHost: "www.nationalcarehomefinder.com",
    publicPublicationAuthorized: true,
    californiaPublished: true,
  });
  assert.equal(authorizedProd.allowed, true);
});

test("activation sequence is explicit and remains unauthorized today", () => {
  assert.equal(californiaTier1PublicPublicationAuthorized(), false);
  assert.equal(californiaTier1ReleasePublished(), false);
  assert.ok(CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE.length >= 6);
  assert.equal(CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE[0]?.id, "confirm-freshness-and-eligible-count");
  assert.equal(CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE.at(-1)?.id, "ship-activation-pr-and-deploy-only-after-approval");
  assert.ok(
    CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE.some((s) =>
      ("diff" in s ? s.diff : []).some((line) => line.includes("publicPublicationAuthorized: false → true")),
    ),
  );
});

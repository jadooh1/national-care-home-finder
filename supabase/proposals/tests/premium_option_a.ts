import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEVELOPMENT_SUPABASE_HOST,
  ENTITLEMENTS,
  PREMIUM_CURRENCY,
  PREMIUM_INTERVAL,
  PREMIUM_PRICE_CENTS,
  PRODUCTION_SUPABASE_HOST,
  developmentBillingAllowed,
  developmentCheckoutIntent,
  premiumPeriodOpen,
  manageableOwnerContentView,
  ownerListingRefreshError,
  publishedContentOutcome,
  publicOwnerContentView,
} from "../../../lib/premium-option-a.ts";

const proposal = readFileSync(
  "supabase/proposals/20261109120000_premium_option_a_development.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261109120000_premium_option_a_development_ROLLBACK.sql",
  "utf8",
);
const home = readFileSync("lib/copy/home.ts", "utf8");
const profile = readFileSync("app/washington/[license]/page.tsx", "utf8");
const ownerEdits = readFileSync("app/owner/listing-edits/page.tsx", "utf8");
const ownerTextGrants = readFileSync(
  "supabase/proposals/20261109140000_development_owner_text_grants.sql",
  "utf8",
);
const ownerTextMigration = readFileSync(
  "supabase/migrations/20261109140000_development_owner_text_grants.sql",
  "utf8",
);
const ownerListingProposal = readFileSync(
  "supabase/proposals/20261113210000_owner_listing_read_REVIEW_ONLY.sql",
  "utf8",
);
const adminEdits = readFileSync("app/admin/listing-edits/page.tsx", "utf8");
const now = new Date("2026-11-09T12:00:00Z");
const later = new Date("2026-12-09T12:00:00Z");
const earlier = new Date("2026-11-08T12:00:00Z");

test("free access covers the public directory and owner onboarding", () => {
  const free = ENTITLEMENTS.filter((item) => item.tier === "free").map((item) => item.id);
  assert.deepEqual(free, [
    "washington-directory",
    "washington-map",
    "official-listing",
    "languages",
    "owner-account",
    "facility-claim",
    "administrator-review",
    "oregon-unpublished",
  ]);
  assert.equal(ENTITLEMENTS.filter((item) => item.tier === "premium").length, 1);
  for (const item of ENTITLEMENTS) {
    assert.notEqual(item.en, item.es);
    assert.ok(item.en.length > 10);
    assert.ok(item.es.length > 10);
  }
});

test("premium is ninety-nine dollars a month and only an open period counts", () => {
  assert.equal(PREMIUM_PRICE_CENTS, 9900);
  assert.equal(PREMIUM_CURRENCY, "usd");
  assert.equal(PREMIUM_INTERVAL, "month");
  assert.equal(premiumPeriodOpen("active", later, now), true);
  assert.equal(premiumPeriodOpen("trialing", later, now), true);
  assert.equal(premiumPeriodOpen("active", earlier, now), false);
  assert.equal(premiumPeriodOpen("active", now, now), false);
  for (const status of ["incomplete", "past_due", "canceled", "unpaid"]) {
    assert.equal(premiumPeriodOpen(status, later, now), false);
  }
});

test("the development checkout cannot charge and refuses every other project", () => {
  const checkout = developmentCheckoutIntent(`https://${DEVELOPMENT_SUPABASE_HOST}`);
  assert.equal(checkout.chargesCard, false);
  assert.equal(checkout.amountCents, 9900);
  assert.equal(checkout.provider, "development-ledger");
  assert.equal(developmentBillingAllowed(`https://${PRODUCTION_SUPABASE_HOST}`), false);
  assert.throws(
    () => developmentCheckoutIntent(`https://${PRODUCTION_SUPABASE_HOST}`),
    /Development billing is closed/,
  );
  assert.equal(developmentBillingAllowed("https://www.nationalcarehomefinder.com"), false);
  assert.equal(developmentBillingAllowed("not a url"), false);
});

test("public owner text uses the premium view only on development", () => {
  assert.equal(
    publicOwnerContentView(`https://${DEVELOPMENT_SUPABASE_HOST}`),
    "wa_afh_premium_owner_content",
  );
  assert.equal(
    publicOwnerContentView(`https://${PRODUCTION_SUPABASE_HOST}`),
    "wa_afh_published_owner_content",
  );
  assert.equal(publicOwnerContentView("https://www.nationalcarehomefinder.com"), "wa_afh_published_owner_content");
  assert.match(profile, /publicOwnerContentView\(process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.doesNotMatch(profile, /\.from\("wa_afh_published_owner_content"\)/);
  for (const supabaseUrl of [
    `https://${DEVELOPMENT_SUPABASE_HOST}`,
    `https://${PRODUCTION_SUPABASE_HOST}`,
    "https://www.nationalcarehomefinder.com",
    "not a url",
    "",
  ]) {
    assert.equal(manageableOwnerContentView(supabaseUrl), "wa_afh_claimed_owner_content");
  }
  assert.match(ownerEdits, /manageableOwnerContentView\(process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.doesNotMatch(ownerEdits, /wa_afh_published_owner_content/);
  assert.match(ownerEdits, /verification_status", "approved"/);
  assert.match(ownerEdits, /\.in\("facility_id", ids\)/);
  assert.match(ownerEdits, /auth\.error \|\| !auth\.data\.user/);
  assert.match(ownerEdits, /router\.replace\("\/owner"\)/);
  assert.match(ownerEdits, /catch \{[\s\S]*publishedFailed = true/);
  assert.doesNotMatch(profile, /wa_afh_claimed_owner_content/);
  assert.doesNotMatch(adminEdits, /wa_afh_published_owner_content/);
  assert.match(adminEdits, /Self-review is prohibited/);
  assert.match(adminEdits, /admin_review_listing_edit/);
  assert.match(ownerListingProposal, /^begin;\r?$/m);
  assert.match(ownerListingProposal, /\r?\ncommit;\s*$/);
  assert.equal(ownerListingProposal.match(/^begin;/gm)?.length, 1);
  assert.equal(ownerListingProposal.match(/^commit;/gm)?.length, 1);
  assert.match(ownerListingProposal, /claimant_user_id = auth\.uid\(\)/);
  assert.doesNotMatch(ownerListingProposal, /from public\.app_admins/);
  assert.doesNotMatch(ownerListingProposal, /revoke all on function public\.admin_/i);
  assert.match(ownerListingProposal, /REVIEW ONLY/);
  assert.match(ownerListingProposal, /wa_afh_claimed_owner_content/);
  assert.match(ownerListingProposal, /grant select on table public\.wa_afh_claimed_owner_content to authenticated/);
  assert.doesNotMatch(ownerListingProposal, /grant\s+select\s+on\s+table\s+public\.wa_afh_published_owner_content/i);
  assert.match(ownerListingProposal, /refuses the development listing function/);
  assert.doesNotMatch(ownerListingProposal, /where public\.nchf_phase5g_facility_is_listed/);
  assert.match(ownerListingProposal, /facility_type = 'AF'/);
  assert.equal(publishedContentOutcome(true, 0), "unavailable");
  assert.equal(publishedContentOutcome(true, 2), "unavailable");
  assert.equal(publishedContentOutcome(false, 0), "empty");
  assert.equal(publishedContentOutcome(false, 1), "listed");
  assert.match(ownerEdits, /publishedContentOutcome\(Boolean\(content\.error\)/);
  assert.equal(ownerListingRefreshError({ publishedFailed: true, facilitiesFailed: false }), "published");
  assert.equal(ownerListingRefreshError({ publishedFailed: false, facilitiesFailed: true }), "facilities");
  assert.equal(ownerListingRefreshError({ publishedFailed: true, facilitiesFailed: true }), "facilities");
  assert.equal(ownerListingRefreshError({ publishedFailed: false, facilitiesFailed: false }), "");
  const publishedCheck = ownerEdits.indexOf('outcome === "unavailable"');
  const facilityQuery = ownerEdits.indexOf('.from("wa_dshs_listed_facilities")');
  const refreshDecision = ownerEdits.indexOf("ownerListingRefreshError({");
  assert.equal(publishedCheck < facilityQuery && facilityQuery < refreshDecision, true);
  assert.doesNotMatch(ownerEdits, /content\.error \? \[\]/);
  assert.match(ownerEdits, /published\.length === 0 && !error/);
  assert.match(ownerEdits, /role="status"/);
  assert.match(ownerEdits, /type="submit"/);
  for (const sql of [ownerTextGrants, ownerTextMigration]) {
    assert.match(sql, /revoke all on table public\.wa_afh_published_owner_content from public, anon, authenticated/);
    assert.match(sql, /grant select on table public\.wa_afh_claimed_owner_content to authenticated/);
    assert.match(sql, /refusing the production project/);
    assert.doesNotMatch(sql, /drop\s+table/i);
    assert.doesNotMatch(sql, /delete\s+from\s+public\.published_owner_listing_events/i);
    assert.doesNotMatch(sql, /update\s+public\.facilities/i);
  }
});

test("the ledger refuses production, browser writes, and official-record edits", () => {
  assert.match(proposal, /refusing the production project/);
  assert.match(proposal, /yiehgstweswxjakbcdzc/);
  assert.match(proposal, /premium ledger grants access to a browser role/);
  assert.match(proposal, /price_cents = 9900/);
  assert.match(proposal, /development reference required/);
  assert.doesNotMatch(proposal, /sk_live|sk_test|whsec_|card_number|stripe/i);
  assert.doesNotMatch(proposal, /update\s+public\.facilities/i);
  assert.doesNotMatch(proposal, /update\s+public\.published_owner_listings/i);
  assert.doesNotMatch(proposal, /oregon/i);
  assert.doesNotMatch(rollback, /drop\s+table\s+if\s+exists\s+public\.facilities/i);
  assert.doesNotMatch(rollback, /drop\s+table\s+if\s+exists\s+public\.published_owner_listings/i);
  assert.ok(home.includes("Find the right care home for your loved one."));
});

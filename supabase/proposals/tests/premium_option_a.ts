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

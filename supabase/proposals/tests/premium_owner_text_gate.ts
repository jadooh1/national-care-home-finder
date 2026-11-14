import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PREMIUM_OWNER_CONTENT_VIEW } from "../../../lib/premium-owner-content.ts";

const proposal = readFileSync(
  "supabase/proposals/20261113200000_premium_owner_text_gate.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261113200000_premium_owner_text_gate_ROLLBACK.sql",
  "utf8",
);
const profile = readFileSync("app/washington/[license]/page.tsx", "utf8");

test("the facility page reads only the premium view and clears a failed read", () => {
  assert.equal(PREMIUM_OWNER_CONTENT_VIEW, "wa_afh_premium_owner_content");
  assert.match(profile, /PREMIUM_OWNER_CONTENT_VIEW/);
  assert.match(profile, /ownerText = \[\]/);
  assert.match(profile, /setPublished\(ownerText\)/);
  assert.doesNotMatch(profile, /wa_afh_published_owner_content/);
  assert.doesNotMatch(profile, /developmentBillingAllowed/);
});

test("the proposal closes the ungated view and does not write publication history", () => {
  assert.match(proposal, /premium owner-text gate target is not the reviewed production project/);
  assert.match(proposal, /premium owner-text gate refuses the development database/);
  assert.match(proposal, /development_record_premium_subscription\(uuid, uuid, text, timestamptz, boolean, text\)/);
  assert.match(proposal, /wa_afh_claimed_owner_content/);
  assert.match(proposal, /^begin;/m);
  assert.match(proposal, /^commit;/m);
  assert.match(proposal, /revoke all on table public\.wa_afh_published_owner_content from public, anon, authenticated/);
  assert.match(proposal, /revoke all on table public\.wa_afh_premium_owner_content from public, anon, authenticated/);
  assert.match(proposal, /grant select on table public\.wa_afh_premium_owner_content to anon, authenticated/);
  assert.match(proposal, /status in \('active', 'trialing'\)/);
  assert.match(proposal, /current_period_end > pg_catalog\.now\(\)/);
  assert.match(proposal, /premium subscription audit rows cannot be changed/);
  assert.match(proposal, /wa_dshs_listed_facilities/);
  assert.match(proposal, /facility_type = 'AF'/);
  assert.match(proposal, /presence is distinct from 'absent'/);
  assert.doesNotMatch(proposal, /nchf_phase5g/);
  assert.doesNotMatch(proposal, /grant\s+(insert|update|delete)/i);
  assert.doesNotMatch(proposal, /stripe|sk_live|sk_test|whsec_/i);
  assert.doesNotMatch(proposal, /insert\s+into\s+public\.published_owner_listings/i);
  assert.doesNotMatch(proposal, /update\s+public\.published_owner_listings/i);
  assert.doesNotMatch(proposal, /delete\s+from\s+public\.published_owner_listing/i);
  assert.doesNotMatch(proposal, /update\s+public\.facilities/i);
});

test("rollback keeps the ungated view closed when no entitlement rows exist", () => {
  assert.match(rollback, /premium owner-text gate rollback refuses existing entitlement rows/);
  assert.match(rollback, /premium owner-text gate rollback reopened public owner text/);
  assert.doesNotMatch(rollback, /grant select on table public\.wa_afh_published_owner_content/i);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.published_owner_listings/i);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.published_owner_listing_events/i);
  assert.doesNotMatch(rollback, /drop\s+table\s+public\.published_owner_listings/i);
});

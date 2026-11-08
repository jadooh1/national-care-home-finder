import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261108040000_owner_admin_surface.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261108040000_owner_admin_surface_ROLLBACK.sql",
  "utf8",
);
const dryRun = readFileSync(
  "supabase/proposals/20261108040000_claim_eligibility_dry_run.sql",
  "utf8",
);

const functions = [
  "public.submit_listing_edit",
  "public.admin_list_owner_claims",
  "public.admin_list_listing_edits",
  "public.admin_count_listing_edits",
  "public.admin_publish_listing_edit",
  "public.admin_withdraw_published_owner_listing",
  "public.admin_list_owner_publication_events",
  "public.owner_list_listing_edits",
  "public.owner_list_listing_edit_events",
  "public.owner_list_publication_history",
];

test("the proposal adds the ten missing functions and does not change facility rows", () => {
  for (const name of functions) assert.match(proposal, new RegExp(name.replace(".", "\\.")));
  assert.match(proposal, /create table public\.listing_edit_events/);
  assert.match(proposal, /create view public\.wa_afh_published_owner_content/);
  assert.doesNotMatch(proposal, /update\s+public\.facilities/i);
  assert.doesNotMatch(proposal, /delete\s+from\s+public\.facilities/i);
  assert.doesNotMatch(proposal, /set_config\(\s*'nchf\.owner_admin_surface_authorization'/);
  assert.match(proposal, /owner admin surface target is not the reviewed production project/);
  assert.match(proposal, /direct browser writes on owner claims or listing edits are present/);
  assert.match(proposal, /\('SELECT'\), \('INSERT'\), \('UPDATE'\), \('DELETE'\), \('TRUNCATE'\)/);
  assert.match(proposal, /public\.nchf_owner_admin_surface_audit/);
  assert.match(proposal, /has_function_privilege\('authenticated', app_function\.oid, 'EXECUTE'\) is not true/);
  assert.doesNotMatch(proposal, /grant execute on function public\.nchf_owner_admin_facility_is_listed\(uuid\) to anon, authenticated/);
  assert.match(proposal, /raise exception 'administrator required'/);
  assert.match(proposal, /raise exception 'authentication required'/);
});

test("rollback removes only empty proposal objects", () => {
  assert.match(rollback, /refusing rollback because owner admin rows exist/);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.facilities/i);
  assert.match(rollback, /drop view if exists public\.wa_afh_published_owner_content/);
});

test("the eligibility dry run is read only and does not verify facilities", () => {
  assert.match(dryRun, /begin read only/i);
  assert.match(dryRun, /rollback;/i);
  assert.doesNotMatch(dryRun, /\b(insert|update|delete|alter|drop|create)\b/i);
  assert.match(dryRun, /claim_eligible_now/);
  assert.match(dryRun, /ambiguous/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261108024500_browser_write_grant_remediation.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261108024500_browser_write_grant_remediation_ROLLBACK.sql",
  "utf8",
);
const execute = readFileSync(
  "supabase/proposals/20261108024500_browser_write_grant_remediation_EXECUTE.sql",
  "utf8",
);
const inventory = readFileSync(
  "supabase/proposals/20261108024500_browser_write_grant_remediation_INVENTORY.sql",
  "utf8",
);
const target = readFileSync(
  "supabase/proposals/tests/browser_write_grant_target.sql",
  "utf8",
);

test("browser write remediation revokes only the confirmed grants", () => {
  assert.match(proposal, /revoke insert, update, delete on table public\.facilities from anon, authenticated/);
  assert.match(proposal, /revoke insert on table public\.owner_claims from anon, authenticated/);
  assert.match(proposal, /revoke insert on table public\.listing_edits from authenticated/);
  assert.match(proposal, /yiehgstweswxjakbcdzc/);
  assert.match(proposal, /facility_count <> 8121/);
  assert.match(proposal, /unreviewed browser write grant/);
  assert.match(target, /ajjsyloyihcqdomywhik/);
  assert.doesNotMatch(proposal, /\b(insert|update|delete)\s+(into|from)\s+public\.facilities\b/i);
  assert.doesNotMatch(proposal, /drop policy/i);
  assert.doesNotMatch(proposal, /create policy/i);
  assert.doesNotMatch(execute, /set\s+nchf\.browser_write_remediation_authorization/i);
});

test("rollback and inventory do not remove facility rows", () => {
  assert.match(rollback, /refusing rollback because production rows changed after remediation/);
  assert.match(rollback, /grant insert, update, delete on table public\.facilities to anon, authenticated/);
  assert.doesNotMatch(rollback, /\bdelete\s+from\s+public\.facilities\b/i);
  assert.match(inventory, /begin read only;/i);
  assert.doesNotMatch(inventory, /\b(insert|update|delete|alter|drop|create)\b/i);
});

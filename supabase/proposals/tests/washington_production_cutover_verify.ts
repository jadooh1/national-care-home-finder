import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const verify = readFileSync(
  "supabase/proposals/20261118120000_washington_production_cutover_VERIFY.sql",
  "utf8",
);
const companion = readFileSync(
  "supabase/proposals/20261118120000_washington_production_cutover_VERIFY.md",
  "utf8",
);

test("cutover verify is read-only and requires the production project GUCs", () => {
  assert.match(verify, /REVIEW ONLY \/ VERIFY ONLY/);
  assert.match(verify, /set transaction read only/i);
  assert.match(verify, /nchf\.cutover_verify_authorization/);
  assert.match(verify, /authorize-washington-cutover-verify/);
  assert.match(verify, /nchf\.cutover_verify_target/);
  assert.match(verify, /yiehgstweswxjakbcdzc/);
  assert.match(verify, /^begin;/m);
  assert.match(verify, /^commit;/m);
  assert.doesNotMatch(verify, /\bcreate\s+(or\s+replace\s+)?(table|view|function|trigger|policy)\b/i);
  assert.doesNotMatch(verify, /\balter\s+(table|view|function|role)\b/i);
  assert.doesNotMatch(verify, /\bgrant\s+/i);
  assert.doesNotMatch(verify, /\brevoke\s+/i);
  assert.doesNotMatch(verify, /\binsert\s+into\b/i);
  assert.doesNotMatch(verify, /\bupdate\s+\w+\s+set\b/i);
  assert.doesNotMatch(verify, /\bdelete\s+from\b/i);
  assert.doesNotMatch(verify, /\bdrop\s+(table|view|function|trigger|policy)\b/i);
  assert.doesNotMatch(verify, /\btruncate\s+(table\s+)?\w+/i);
  assert.doesNotMatch(verify, /stripe|sk_live|sk_test|whsec_|service_role\s*=/i);
});

test("cutover verify uses explicit anon and authenticated privilege checks", () => {
  assert.match(verify, /foreach role_name in array array\['anon', 'authenticated'\]/);
  assert.match(verify, /has_table_privilege\(role_name, 'public\.wa_afh_published_owner_content', 'SELECT'\)/);
  assert.match(verify, /has_table_privilege\(role_name, 'public\.wa_afh_premium_owner_content', 'SELECT'\)/);
  assert.match(verify, /has_table_privilege\('anon', 'public\.wa_afh_claimed_owner_content', 'SELECT'\)/);
  assert.match(
    verify,
    /has_table_privilege\('authenticated', 'public\.wa_afh_claimed_owner_content', 'SELECT'\)/,
  );
  assert.match(verify, /has_table_privilege\(role_name, 'public\.premium_subscriptions', privilege\)/);
  assert.doesNotMatch(verify, /perform\s+1\s+from\s+public\.wa_afh_published_owner_content/i);
  assert.doesNotMatch(verify, /perform\s+1\s+from\s+public\.wa_afh_premium_owner_content/i);
  assert.doesNotMatch(verify, /published_selectable|premium_selectable/);
  assert.doesNotMatch(verify, /insufficient_privilege/);
});

test("cutover verify documents intended browser access and absent development ledger RPC", () => {
  assert.match(
    verify,
    /development_record_premium_subscription\(uuid, uuid, text, timestamptz, boolean, text\)/,
  );
  assert.match(verify, /refuses the development premium ledger RPC/);
  assert.match(verify, /requires SELECT on premium owner content/);
  assert.match(verify, /refuses SELECT on claimed owner content for anon/);
  assert.match(verify, /requires SELECT on claimed owner content for authenticated/);
  assert.match(verify, /refuses subscription privilege/);
  assert.match(companion, /Development \/ isolated validation behavior/);
  assert.match(companion, /forged production GUCs/);
  assert.match(companion, /Rollback implications/);
  assert.match(companion, /SET TRANSACTION READ ONLY/);
  assert.match(companion, /has_table_privilege/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20261108014500_production_schema_alignment.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261108014500_production_schema_alignment_ROLLBACK.sql",
  "utf8",
);
const inventory = readFileSync(
  "supabase/proposals/20261108014500_production_schema_alignment_INVENTORY.sql",
  "utf8",
);
const execute = readFileSync(
  "supabase/proposals/20261108014500_production_schema_alignment_EXECUTE.sql",
  "utf8",
);
const target = readFileSync(
  "supabase/proposals/tests/production_schema_alignment_target.sql",
  "utf8",
);

test("production alignment preserves the reviewed baseline", () => {
  assert.match(migration, /facility_count <> 8121/);
  assert.match(migration, /yiehgstweswxjakbcdzc/);
  assert.match(target, /ajjsyloyihcqdomywhik/);
  assert.match(migration, /Public read verified facilities/);
  assert.match(migration, /facilities_public_read_wa_afh_source_matched/);
  assert.match(migration, /presence is distinct from 'absent'/);
  assert.match(migration, /directory view membership changed/);
  assert.match(migration, /reviewed_at/);
  assert.doesNotMatch(migration, /production directory view already exists/);
  assert.doesNotMatch(migration, /\binsert\s+into\s+public\.facilities\b/i);
  assert.doesNotMatch(migration, /\bdelete\s+from\s+public\.facilities\b/i);
  assert.doesNotMatch(migration, /\bupdate\s+public\.facilities\b/i);
  assert.doesNotMatch(execute, /set\s+nchf\.production_schema_alignment_authorization/i);
});

test("rollback and inventory do not remove facility rows", () => {
  assert.match(rollback, /refusing rollback because production rows changed after alignment/);
  assert.doesNotMatch(rollback, /\bdelete\s+from\s+public\.facilities\b/i);
  assert.match(inventory, /begin read only;/i);
  assert.doesNotMatch(inventory, /\b(insert|update|delete|alter|drop|create)\b/i);
});

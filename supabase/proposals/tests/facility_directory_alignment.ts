import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261108060000_facility_directory_alignment.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261108060000_facility_directory_alignment_ROLLBACK.sql",
  "utf8",
);

test("the alignment keeps directory type AF and does not verify facilities", () => {
  assert.match(proposal, /facility alignment counts are not the reviewed baseline/);
  assert.match(proposal, /6231/);
  assert.match(proposal, /1890/);
  assert.match(proposal, /facility\.facility_type = 'AF'/);
  assert.doesNotMatch(proposal, /facility\.facility_type = 'AFH'/);
  assert.doesNotMatch(proposal, /set\s+facility_type/i);
  assert.match(proposal, /record_status = 'source_matched'/);
  assert.match(proposal, /record_status = 'verified'\) <> 0/);
  assert.doesNotMatch(proposal, /set_config\(\s*'nchf\.facility_alignment_authorization'/);
  assert.match(proposal, /wa_dshs_listed_facilities/);
});

test("rollback restores unverified rows and does not delete facilities", () => {
  assert.match(rollback, /record_status = 'unverified'/);
  assert.match(rollback, /facility\.facility_type = 'AFH'/);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.facilities/i);
  assert.match(rollback, /refusing rollback because owner alignment rows exist/);
});

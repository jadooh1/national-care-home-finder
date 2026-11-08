import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261108180000_owner_claim_review_guard.sql",
  "utf8",
);
const rollback = readFileSync(
  "supabase/proposals/20261108180000_owner_claim_review_guard_ROLLBACK.sql",
  "utf8",
);

test("the review guard blocks a second approval and writes an event", () => {
  assert.match(proposal, /claim review guard target is not the reviewed production project/);
  assert.match(proposal, /owner claim review functions are not the reviewed production baseline/);
  assert.match(proposal, /more than one approved claim exists for a facility/);
  assert.match(proposal, /another approved claim exists for this facility/);
  assert.match(proposal, /owner_claims_one_approved_claim_per_facility/);
  assert.match(proposal, /owner_claim_events/);
  assert.match(proposal, /self-review is not allowed/);
  assert.doesNotMatch(proposal, /update\s+public\.facilities/i);
  assert.doesNotMatch(proposal, /facility_type/);
  assert.doesNotMatch(proposal, /set_config\(\s*'nchf\.claim_review_guard_authorization'/);
});

test("rollback restores the observed production review functions", () => {
  assert.match(rollback, /Self-approval is not permitted/);
  assert.match(rollback, /Pending claim not found or self-review prohibited/);
  assert.match(rollback, /claim review guard is absent/);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.owner_claims/i);
  assert.doesNotMatch(rollback, /delete\s+from\s+public\.facilities/i);
});

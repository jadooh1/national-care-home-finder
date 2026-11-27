import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

test("execution prep pack exists with 100 prospects and unpaid constraints", () => {
  const proposal = readFileSync(
    "supabase/proposals/20261127220000_washington_organic_acquisition_execution_prep.md",
    "utf8",
  );
  assert.match(proposal, /100 owner prospects/);
  assert.match(proposal, /DRAFT_AWAITING_BATCH_APPROVAL|batch approval/i);
  assert.match(proposal, /disabled/);
  assert.match(proposal, /500/);
  assert.match(proposal, /10/);
  assert.doesNotMatch(proposal, /should enable production GA|approve paid ad launch/i);

  assert.equal(existsSync("supabase/proposals/acquisition/wa_afh_owner_prospects_batch1_100.csv"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/owner_outreach_batch1_personalized.csv"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/family_organic_social_batch1.md"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/weekly_acquisition_scorecard.md"), true);

  const csv = readFileSync("supabase/proposals/acquisition/wa_afh_owner_prospects_batch1_100.csv", "utf8").trim().split("\n");
  assert.equal(csv.length, 101); // header + 100
  assert.match(csv[0], /license_number/);
  assert.match(csv[1], /WA-OWN-001/);
});

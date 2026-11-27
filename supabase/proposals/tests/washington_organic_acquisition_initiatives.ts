import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261127210000_washington_organic_acquisition_initiatives.md",
  "utf8",
);

test("acquisition initiatives stay unpaid and do not launch campaigns from the agent", () => {
  assert.match(proposal, /no spend|No spend|unpaid/i);
  assert.match(proposal, /Do \*\*not\*\* launch campaigns/);
  assert.match(proposal, /disabled/);
  assert.match(proposal, /6,278|187d907/);
  assert.doesNotMatch(proposal, /should enable production GA|approve paid ad launch/i);
  assert.match(proposal, /Human approve|human-sent|human send/i);
});

test("acquisition initiatives cover priority markets, paths, outreach, and targets", () => {
  assert.match(proposal, /King/);
  assert.match(proposal, /Tacoma/);
  assert.match(proposal, /Vancouver/);
  assert.match(proposal, /Claim this facility/);
  assert.match(proposal, /\/owner\?mode=login/);
  assert.match(proposal, /\/washington\?county=King/);
  assert.match(proposal, /Approved claims/);
  assert.match(proposal, /GSC/);
  assert.match(proposal, /277/);
});

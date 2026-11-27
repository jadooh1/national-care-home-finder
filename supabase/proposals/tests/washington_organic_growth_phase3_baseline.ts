import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261127200000_washington_organic_growth_phase3_baseline.md",
  "utf8",
);

test("phase 3 baseline closes pagination ship and keeps unpaid constraints", () => {
  assert.match(proposal, /187d907/);
  assert.match(proposal, /CLOSED/);
  assert.match(proposal, /6,278/);
  assert.match(proposal, /Design 2/);
  assert.match(proposal, /Google indexing/i);
  assert.match(proposal, /priority city/i);
  assert.match(proposal, /owner/i);
  assert.match(proposal, /claim/i);
  assert.match(proposal, /disabled|off/i);
  assert.doesNotMatch(proposal, /enable production GA|launch paid ads/i);
  assert.match(proposal, /do not pursue/i);
  assert.match(proposal, /production unchanged|Docs \/ planning only/i);
});

test("phase 3 names measurable priority landings from verified roster hubs", () => {
  assert.match(proposal, /King/);
  assert.match(proposal, /Tacoma/);
  assert.match(proposal, /Vancouver/);
  assert.match(proposal, /\/washington\?county=King/);
  assert.match(proposal, /\/washington\?city=Tacoma&county=Pierce/);
  assert.match(proposal, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION|GSC/);
});

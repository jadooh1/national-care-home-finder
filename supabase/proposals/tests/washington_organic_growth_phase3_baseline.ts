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

test("phase 3 records verified GSC domain property and indexing progress baseline", () => {
  assert.match(proposal, /nationalcarehomefinder\.com/);
  assert.match(proposal, /Domain property verified/i);
  assert.match(proposal, /Submitted \*\*2026-11-08\*\*/);
  assert.match(proposal, /2026-11-12/);
  assert.match(proposal, /Not a blocker/);
  assert.match(proposal, /Do not.*re-verify|Do not\*\* re-verify|Do not\*\* re-request/i);
  assert.match(proposal, /\*\*277\*\*/);
  assert.match(proposal, /\*\*6,013\*\*/);
  assert.match(proposal, /4,786/);
  assert.match(proposal, /1,194/);
  assert.match(proposal, /Measure indexing progress/i);
  assert.doesNotMatch(proposal, /HTML-tag token → Vercel/);
  assert.doesNotMatch(proposal, /Not confirmed in-app/);
});

test("phase 3 names measurable priority landings from verified roster hubs", () => {
  assert.match(proposal, /King/);
  assert.match(proposal, /Tacoma/);
  assert.match(proposal, /Vancouver/);
  assert.match(proposal, /\/washington\?county=King/);
  assert.match(proposal, /\/washington\?city=Tacoma&county=Pierce/);
});

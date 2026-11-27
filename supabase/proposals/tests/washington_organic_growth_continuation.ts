import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("washington organic growth continuation keeps unpaid constraints", () => {
  const proposal = readFileSync(
    "supabase/proposals/20261127080000_washington_organic_growth_continuation.md",
    "utf8",
  );
  assert.match(proposal, /6,278/);
  assert.match(proposal, /Design 2/);
  assert.match(proposal, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(proposal, /disabled|off/i);
  assert.match(proposal, /S5-A \/ S5-B \/ S6/);
  assert.doesNotMatch(proposal, /enable production GA|launch paid ads/i);
});

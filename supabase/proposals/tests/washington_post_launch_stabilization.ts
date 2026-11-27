import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proposal = readFileSync(
  "supabase/proposals/20261127060000_washington_post_launch_stabilization.md",
  "utf8",
);

test("post-launch proposal closes acceptance GO and preserves security baseline", () => {
  assert.match(proposal, /launch-complete \*\*GO\*\*/);
  assert.match(proposal, /289a80a7fcea1ab2d251426abec964eb830a0eb1/);
  assert.match(proposal, /6,278/);
  assert.match(proposal, /Billing \/ premium: \*\*OFF\*\*/);
  assert.match(proposal, /Do not re-run S5-A, S5-B, S6/);
});

test("post-launch proposal covers monitoring SEO indexing analytics acquisition", () => {
  assert.match(proposal, /Production monitoring/);
  assert.match(proposal, /SEO/);
  assert.match(proposal, /Google indexing/);
  assert.match(proposal, /Analytics readiness/);
  assert.match(proposal, /Owner acquisition/);
  assert.match(proposal, /Family acquisition/);
  assert.match(proposal, /Marketing readiness/);
  assert.match(proposal, /Paid advertising/);
  assert.match(proposal, /measurementIdReady/);
});

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

test("commercial validation pack has funnel stages, claims baseline, and weekly report", () => {
  const proposal = readFileSync(
    "supabase/proposals/20261127223000_washington_commercial_validation.md",
    "utf8",
  );
  assert.match(proposal, /commercial validation/i);
  assert.match(proposal, /0.*2026-11-27|baseline.*0/i);
  assert.match(proposal, /phases 2 and 3|phases \*\*2–3\*\*/i);
  assert.doesNotMatch(proposal, /should enable production GA|approve paid ad launch/i);

  assert.equal(existsSync("supabase/proposals/acquisition/prospect_funnel_tracker_batch1.csv"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/prospect_funnel_definitions.md"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/weekly_commercial_report.md"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/no_cost_acquisition_opportunities.md"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/print/batch1_phase1_letters_20.pdf"), true);
  assert.equal(existsSync("supabase/proposals/acquisition/print/batch1_phase1_mailing_labels.pdf"), true);

  const defs = readFileSync("supabase/proposals/acquisition/prospect_funnel_definitions.md", "utf8");
  for (const stage of ["Prepared", "Sent", "Delivered", "Responded", "Converted"]) {
    assert.match(defs, new RegExp(stage, "i"));
  }

  const funnel = readFileSync(
    "supabase/proposals/acquisition/prospect_funnel_tracker_batch1.csv",
    "utf8",
  )
    .trim()
    .split("\n");
  assert.equal(funnel.length, 101);
  assert.match(funnel[0], /prepared/);
  assert.match(funnel[0], /sent/);
  assert.match(funnel[0], /delivered/);
  assert.match(funnel[0], /responded/);
  assert.match(funnel[0], /converted/);
  assert.match(funnel[1], /WA-OWN-001/);

  const report = readFileSync("supabase/proposals/acquisition/weekly_commercial_report.md", "utf8");
  assert.match(report, /Owner claims/);
  assert.match(report, /baseline 0 on 2026-11-27/);
  assert.match(report, /Organic search traffic/);
  assert.match(report, /Indexing/);
});

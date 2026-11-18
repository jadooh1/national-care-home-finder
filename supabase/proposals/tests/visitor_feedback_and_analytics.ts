import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { measurementIdReady } from "../../../lib/analytics.ts";
import { prepareVisitorFeedback } from "../../../lib/visitor-feedback.ts";

const proposal = readFileSync(
  "supabase/proposals/20261109143000_visitor_feedback_development.sql",
  "utf8",
);
const analytics = readFileSync("components/site-analytics.tsx", "utf8");

test("visitor feedback rejects spam, health details, and private pages", () => {
  const ready = prepareVisitorFeedback({
    honeypot: "",
    elapsedMs: 4000,
    found: "yes",
    language: "es",
    pagePath: "/washington/123?utm=1",
    comment: "  The map was clear.  ",
  });
  assert.equal(ready.ok, true);
  if (ready.ok) {
    assert.equal(ready.value.pagePath, "/washington/123");
    assert.equal(ready.value.comment, "The map was clear.");
    assert.equal(ready.value.language, "es");
  }
  assert.equal(prepareVisitorFeedback({
    honeypot: "filled",
    elapsedMs: 4000,
    found: "yes",
    language: "en",
    pagePath: "/washington",
    comment: "",
  }).ok, false);
  assert.equal(prepareVisitorFeedback({
    honeypot: "",
    elapsedMs: 500,
    found: "no",
    language: "en",
    pagePath: "/washington",
    comment: "",
  }).ok, false);
  const health = prepareVisitorFeedback({
    honeypot: "",
    elapsedMs: 4000,
    found: "no",
    language: "en",
    pagePath: "/washington",
    comment: "My mother has a dementia diagnosis",
  });
  assert.equal(health.ok, false);
  if (!health.ok) assert.equal(health.error, "health");
  assert.equal(prepareVisitorFeedback({
    honeypot: "",
    elapsedMs: 4000,
    found: "yes",
    language: "en",
    pagePath: "/owner",
    comment: "",
  }).ok, false);
});

test("analytics stays off without an ID and never runs on the public site", () => {
  assert.equal(measurementIdReady("national-care-home-finder-dev.vercel.app", undefined), null);
  assert.equal(measurementIdReady("www.nationalcarehomefinder.com", "G-DEVPREP01"), null);
  assert.equal(measurementIdReady("nationalcarehomefinder.com:443", "G-DEVPREP01"), null);
  assert.equal(measurementIdReady("localhost:3000", "not-an-id"), null);
  assert.equal(measurementIdReady("localhost:3000", "G-DEVPREP01"), "G-DEVPREP01");
  assert.match(proposal, /feedback cannot include resident health information/);
  assert.match(proposal, /revoke all on table public\.development_visitor_feedback from public, anon, authenticated/);
  assert.match(proposal, /administrator required/);
  assert.doesNotMatch(proposal, /email_address|diagnosis_code|medication_list/i);
  assert.doesNotMatch(analytics, /G-[A-Z0-9]{6,16}/);
});

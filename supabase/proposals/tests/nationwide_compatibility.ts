import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DIRECTORY_REQUIRES_COORDINATES,
  ONBOARDING_SEQUENCE,
  SCHEMA_UPGRADE,
  compatibilityAssessment,
  compatibilityAssessments,
  compatibilityClassCounts,
} from "../../../lib/nationwide-compatibility.ts";
import { STATE_NAMES, directoryContract, directoryHref } from "../../../lib/state-directory.ts";

test("every state is classified once and only Washington is publication-ready", () => {
  const assessments = compatibilityAssessments();
  assert.equal(assessments.length, 50);
  assert.deepEqual(assessments.map(item => item.state), [...STATE_NAMES]);
  assert.equal(new Set(assessments.map(item => item.state)).size, 50);
  assert.deepEqual(compatibilityClassCounts(), { A: 2, B: 8, C: 19, D: 21 });
  assert.deepEqual(
    assessments.filter(item => item.publicationReady).map(item => item.state),
    ["Washington"],
  );
  assert.equal(DIRECTORY_REQUIRES_COORDINATES, false);
  assert.equal(SCHEMA_UPGRADE.applied, false);
  assert.equal(SCHEMA_UPGRADE.migrationFile, null);
});

test("schema fit stays separate from publication and from missing coordinates", () => {
  const washington = compatibilityAssessment("Washington");
  const oregon = compatibilityAssessment("Oregon");
  const california = compatibilityAssessment("California");
  const michigan = compatibilityAssessment("Michigan");
  const pennsylvania = compatibilityAssessment("Pennsylvania");
  assert.equal(washington?.compatibility, "A");
  assert.equal(washington?.publication, "public");
  assert.equal(washington?.observedRows, 6278);
  assert.equal(oregon?.compatibility, "A");
  assert.equal(oregon?.publication, "development");
  assert.equal(oregon?.coordinateColumns, false);
  assert.equal(oregon?.observedRows, 1584);
  assert.equal(california?.compatibility, "B");
  assert.equal(california?.observedRows, 23020);
  assert.equal(michigan?.compatibility, "C");
  assert.equal(michigan?.observedRows, 4480);
  assert.equal(pennsylvania?.compatibility, "C");
  assert.equal(pennsylvania?.observedRows, 989);
  assert.equal(pennsylvania?.licenseIdentifier, false);
  assert.equal(compatibilityAssessment("North Carolina")?.compatibility, "B");
  assert.equal(compatibilityAssessment("North Carolina")?.observedRows, 1086);
  assert.equal(compatibilityAssessment("Iowa")?.licenseIdentifier, false);
  assert.equal(compatibilityAssessment("Iowa")?.observedRows, 335);
  assert.equal(compatibilityAssessment("Illinois")?.observedRows, 495);
  for (const state of ["Kentucky", "Oklahoma", "Indiana", "Delaware"]) {
    assert.equal(compatibilityAssessment(state)?.compatibility, "B");
    assert.equal(compatibilityAssessment(state)?.publicationReady, false);
  }
});

test("unverified states do not receive invented counts or directory routes", () => {
  for (const item of compatibilityAssessments()) {
    if (item.compatibility === "D") {
      assert.equal(item.observedRows, null);
      assert.equal(item.licenseIdentifier, null);
      assert.equal(item.publicationReady, false);
    }
    assert.equal(directoryContract(item.state)?.directoryPath ?? null, item.state === "Washington" ? "/washington" : item.state === "Oregon" ? "/oregon" : null);
    assert.equal(directoryHref(item.state, "https://ajjsyloyihcqdomywhik.supabase.co"), item.state === "Washington" ? "/washington" : item.state === "Oregon" ? "/oregon" : null);
  }
  assert.deepEqual([...ONBOARDING_SEQUENCE].slice(0, 2), ["Washington", "Oregon"]);
  assert.equal(ONBOARDING_SEQUENCE.length, 50);
  assert.equal(ONBOARDING_SEQUENCE.indexOf("Illinois") < ONBOARDING_SEQUENCE.indexOf("Michigan"), true);
  assert.equal(ONBOARDING_SEQUENCE.indexOf("Michigan") < ONBOARDING_SEQUENCE.indexOf("Alaska"), true);
  const source = readFileSync(new URL("../../../lib/nationwide-compatibility.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../../app/development/onboarding/page.tsx", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261110080000_nationwide_compatibility_audit.md", import.meta.url), "utf8");
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("insert"), false);
  assert.equal(page.includes("Nationwide compatibility"), true);
  assert.equal(page.includes("latitude"), false);
  for (const item of compatibilityAssessments()) {
    assert.equal(proposal.includes(`| ${item.state} | ${item.compatibility} |`), true);
  }
});

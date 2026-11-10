import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DIRECTORY_REQUIRES_COORDINATES,
  EVIDENCE_FIELDS,
  ONBOARDING_SEQUENCE,
  SCHEMA_UPGRADE,
  compatibilityAssessment,
  compatibilityAssessments,
  compatibilityClassCounts,
} from "../../../lib/nationwide-compatibility.ts";
import { publicPublicationAllowed, rosterViolations, type ProposedRosterRecord } from "../../../lib/nationwide-roster.ts";
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
  for (const phrase of [
    "Regulatory identifier",
    "identifier type",
    "issuing authority",
    "source record id",
    "Physical, mailing, supplemental, and unverified",
    "Official export date",
    "source publication date",
    "retrieval timestamp",
    "Facility-specific link, generic search page, or unverified URL pattern",
    "Original category, original status",
    "coordinate source",
    "coordinate accuracy",
    "Backward compatibility",
  ]) {
    assert.equal(proposal.includes(phrase), true, phrase);
  }
});

function evidence(state: string, field: string) {
  const found = compatibilityAssessment(state)?.evidence.find(item => item.field === field);
  if (!found) throw new Error(`${state} ${field}`);
  return found;
}

function syntheticRecord(overrides: Partial<ProposedRosterRecord> = {}): ProposedRosterRecord {
  return {
    regulatoryIdentifier: "example",
    identifierType: "license",
    issuingAuthority: "Example agency",
    sourceRecordId: "source-example",
    addresses: [{ role: "physical", value: "example street", provenance: "official column" }],
    officialExportDate: "2026-11-09",
    sourcePublicationDate: null,
    retrievalTimestamp: "2026-11-09T00:00:00Z",
    freshnessVerified: true,
    originalCategory: "example category",
    normalizedCategory: null,
    originalStatus: "example status",
    normalizedStatus: null,
    disclosureUrl: "https://example.gov/facility/example",
    disclosureKind: "facility-specific",
    latitude: 1,
    longitude: 2,
    coordinateSource: "licensing",
    coordinateAccuracy: "official column",
    publication: "public",
    ...overrides,
  };
}

test("field evidence keeps identifier, address, date, disclosure, and coordinate facts separate", () => {
  for (const item of compatibilityAssessments()) {
    assert.deepEqual(item.evidence.map(entry => entry.field), [...EVIDENCE_FIELDS]);
    for (const entry of item.evidence) {
      if (entry.observation === "not-verified") assert.equal(entry.confidence, "low");
    }
    if (item.licenseIdentifier === null) assert.equal(evidence(item.state, "regulatory-identifier").observation, "not-verified");
    if (item.licenseIdentifier === false) {
      assert.equal(["absent", "rejected"].includes(evidence(item.state, "regulatory-identifier").observation), true);
    }
  }
  assert.equal(evidence("Washington", "facility-disclosure").detail, "facility-specific");
  assert.equal(evidence("Washington", "coordinate-source").detail, "licensing");
  assert.equal(evidence("Oregon", "identifier-type").detail, "source-id");
  assert.equal(evidence("Oregon", "coordinates").observation, "absent");
  assert.equal(evidence("Illinois", "physical-address").observation, "not-verified");
  assert.equal(evidence("Illinois", "unverified-address").observation, "present");
  assert.equal(evidence("Illinois", "retrieval-timestamp").observation, "present");
  assert.equal(evidence("Illinois", "official-export-date").observation, "absent");
  assert.equal(evidence("Michigan", "supplemental-address").observation, "rejected");
  assert.equal(evidence("Pennsylvania", "regulatory-identifier").detail, "object-id");
  assert.equal(evidence("Pennsylvania", "source-record-id").observation, "present");
  assert.equal(evidence("Pennsylvania", "coordinates").observation, "rejected");
  assert.equal(evidence("Iowa", "identifier-type").detail, "certification");
  assert.equal(evidence("North Carolina", "generic-search").observation, "present");
  assert.equal(evidence("North Carolina", "facility-disclosure").observation, "absent");
  assert.equal(evidence("Alaska", "regulatory-identifier").observation, "not-verified");
});

test("roster rules protect data integrity, publication, and existing directories", () => {
  assert.deepEqual(rosterViolations(syntheticRecord()), []);
  assert.equal(publicPublicationAllowed(syntheticRecord()), true);
  assert.equal(publicPublicationAllowed(syntheticRecord({ publication: "unpublished" })), false);
  assert.equal(publicPublicationAllowed(syntheticRecord({ publication: "development" })), false);
  assert.equal(rosterViolations(syntheticRecord({
    identifierType: "object-id",
    regulatoryIdentifier: "same-example",
    sourceRecordId: "same-example",
  })).includes("object-id-is-not-a-regulatory-identifier"), true);
  assert.equal(rosterViolations(syntheticRecord({
    identifierType: "certification",
    regulatoryIdentifier: "example",
  })).includes("certification-is-not-stored-as-a-license"), true);
  assert.equal(rosterViolations(syntheticRecord({
    addresses: [
      { role: "physical", value: "same example", provenance: "official column" },
      { role: "supplemental", value: "same example", provenance: "supplemental column" },
    ],
  })).includes("supplemental-address-copied-into-physical"), true);
  assert.equal(rosterViolations(syntheticRecord({
    addresses: [{ role: "unverified", value: "example street", provenance: null }],
  })).includes("address-missing-provenance"), true);
  assert.equal(rosterViolations(syntheticRecord({
    officialExportDate: "2026-11-09T00:00:00Z",
    retrievalTimestamp: "2026-11-09T00:00:00Z",
  })).includes("retrieval-timestamp-used-as-export-date"), true);
  assert.equal(publicPublicationAllowed(syntheticRecord({ disclosureKind: "generic-search" })), false);
  assert.equal(publicPublicationAllowed(syntheticRecord({ disclosureKind: "unverified-pattern" })), false);
  assert.equal(rosterViolations(syntheticRecord({
    originalStatus: null,
    normalizedStatus: "open",
  })).includes("normalized-status-without-original"), true);
  assert.equal(rosterViolations(syntheticRecord({
    coordinateSource: "georeferenced",
  })).includes("georeferenced-coordinates-cannot-publish-a-map"), true);
  assert.equal(rosterViolations(syntheticRecord({
    coordinateAccuracy: null,
  })).includes("coordinates-missing-accuracy"), true);
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(SCHEMA_UPGRADE.applied, false);
});

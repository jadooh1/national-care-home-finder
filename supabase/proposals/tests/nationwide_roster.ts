import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";
import {
  ROSTER_MIGRATION_PROPOSAL,
  isCalendarDate,
  publicPublicationAllowed,
  rosterViolations,
  type ProposedRosterRecord,
} from "../../../lib/nationwide-roster.ts";

function record(overrides: Partial<ProposedRosterRecord> = {}): ProposedRosterRecord {
  return {
    licenseIdentifier: "example",
    certificationIdentifier: null,
    facilityIdentifier: null,
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
    disclosureVerified: true,
    disclosureVerificationEvidence: "recorded review",
    latitude: 1,
    longitude: 2,
    coordinateSource: "licensing",
    coordinateAccuracy: "official column",
    publication: "unpublished",
    ...overrides,
  };
}

test("a certification number is accepted only as a certification", () => {
  const certification = record({
    identifierType: "certification",
    licenseIdentifier: null,
    certificationIdentifier: "C-100",
  });
  assert.deepEqual(rosterViolations(certification), []);
  assert.equal(certification.licenseIdentifier, null);
  assert.equal(publicPublicationAllowed(certification), false);
  assert.equal(rosterViolations(record({
    identifierType: "certification",
    licenseIdentifier: "C-100",
    certificationIdentifier: null,
  })).includes("certification-is-not-stored-as-a-license"), true);
  assert.equal(rosterViolations(record({
    identifierType: "certification",
    licenseIdentifier: null,
    certificationIdentifier: "   ",
  })).includes("certification-identifier-missing"), true);
});

test("official dates must be real calendar dates", () => {
  assert.equal(isCalendarDate("2026-11-09"), true);
  assert.equal(isCalendarDate("2024-02-29"), true);
  assert.equal(isCalendarDate("2023-02-29"), false);
  assert.equal(isCalendarDate("2026-02-31"), false);
  assert.equal(isCalendarDate("2026-13-01"), false);
  assert.equal(rosterViolations(record({ officialExportDate: "2026-02-31" })).includes("official-export-date-is-impossible"), true);
  assert.equal(rosterViolations(record({ sourcePublicationDate: "2026-04-31" })).includes("source-publication-date-is-impossible"), true);
  assert.equal(rosterViolations(record({ officialExportDate: "November 2026" })).includes("official-export-date-is-not-iso"), true);
  assert.equal(publicPublicationAllowed(record({ publication: "public", officialExportDate: "2026-02-31" })), false);
  assert.equal(publicPublicationAllowed(record({ publication: "public", officialExportDate: "2024-02-29" })), true);
});

test("publication safeguards and backward compatibility stay in force", () => {
  assert.equal(publicPublicationAllowed(record({ publication: "public" })), true);
  assert.equal(publicPublicationAllowed(record({ publication: "public", disclosureKind: "generic-search" })), false);
  assert.equal(publicPublicationAllowed(record({
    publication: "public",
    disclosureVerified: false,
    disclosureVerificationEvidence: null,
  })), false);
  assert.equal(publicPublicationAllowed(record({ publication: "development" })), false);
  assert.equal(directoryContract("Washington")?.directoryPath, "/washington");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(directoryContract("Iowa")?.directoryPath, null);
  assert.equal(ROSTER_MIGRATION_PROPOSAL.applied, false);
  assert.equal(ROSTER_MIGRATION_PROPOSAL.executed, false);
  assert.equal(ROSTER_MIGRATION_PROPOSAL.migrationFile, null);
});

test("the proposal and rollback stay unexecuted and limited to the new table", () => {
  const proposal = readFileSync(new URL("../20261110090000_nationwide_roster_development.sql", import.meta.url), "utf8");
  const rollback = readFileSync(new URL("../20261110090000_nationwide_roster_development_ROLLBACK.sql", import.meta.url), "utf8");
  const plan = readFileSync(new URL("../20261110090000_nationwide_roster_development.md", import.meta.url), "utf8");
  assert.equal(proposal.includes("create table public.nationwide_roster"), true);
  for (const name of [
    "nationwide_roster_certification_is_not_a_license",
    "nationwide_roster_address_provenance",
    "nationwide_roster_freshness",
    "nationwide_roster_disclosure",
    "nationwide_roster_classification",
    "nationwide_roster_coordinates",
    "nationwide_roster_publication",
  ]) {
    assert.equal(proposal.includes(name), true, name);
  }
  assert.equal(proposal.includes("official_export_date date"), true);
  assert.equal(/insert\s+into/i.test(proposal), false);
  assert.equal(/alter\s+table\s+public\.(wa_|or_)/i.test(proposal), false);
  assert.equal(/drop\s+table\s+public\.(wa_|or_|facilities)/i.test(proposal), false);
  assert.equal(proposal.includes("authorize-development-nationwide-roster"), true);
  assert.equal(rollback.includes("drop table if exists public.nationwide_roster"), true);
  assert.equal(rollback.includes("authorize-development-nationwide-roster-rollback"), true);
  assert.equal(rollback.includes("authorize-development-nationwide-roster-populated-rollback"), true);
  assert.equal(proposal.includes("disclosure_verification_evidence"), true);
  assert.equal(proposal.includes("issuing_authority"), true);
  assert.equal(proposal.includes("revoke all on table public.nationwide_roster from service_role"), true);
  assert.equal(/revoke\s+all\s+on\s+table\s+public\.(wa_|or_)/i.test(proposal), false);
  assert.equal(plan.includes("nationwide_roster_ingest"), true);
  assert.equal(/drop\s+(table|view).*(wa_|or_odhs|facilities)/i.test(rollback), false);
  assert.equal(plan.includes("Validation procedure"), true);
  assert.equal(plan.includes("Rollback"), true);
  assert.equal(plan.includes("not applied"), true);
});

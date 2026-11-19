import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE10_CDSS_CLARIFICATION_REQUEST_DRAFT,
  CALIFORNIA_PHASE10_FRESHNESS_CHANNELS,
  CALIFORNIA_PHASE10_FRESHNESS_RECOMMENDATION,
  CALIFORNIA_PHASE10_FRESHNESS_REQUIREMENT,
  adoptCaliforniaPhase10AuthoritativeExportDate,
  evaluateCaliforniaPhase10Freshness,
} from "../../../lib/california-phase10-freshness.ts";
import {
  CALIFORNIA_PHASE10_OBSERVED_COUNTS,
  assertCaliforniaPhase10ExclusiveAccounting,
  evaluateCaliforniaPhase10Quality,
  evaluateCaliforniaPhase10Revalidation,
} from "../../../lib/california-phase10-quality.ts";
import {
  CALIFORNIA_PHASE10_READINESS_DECISION,
  CALIFORNIA_PHASE10_READINESS_ITEMS,
  californiaPhase10AllowsPublication,
  evaluateCaliforniaPhase10Readiness,
} from "../../../lib/california-phase10-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase10-freshness-readiness",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

test("observed live fixture preserves 24377 accounting and blocked freshness", () => {
  const observed = loadJson<{
    accounting: {
      rowCount: number;
      buckets: Record<string, number>;
      invariantHolds: boolean;
    };
    missingCapacity: {
      totalMissing: number;
      publicationCandidateMissing: number;
    };
    coordinates: {
      verifiedOfficialCoords: number;
      unresolved: number;
      fabricatedCoordinates: number;
    };
    download: {
      rcfeSha256: string;
      arfSha256: string;
      authoritativeIsoExportDate: null;
      bytesUnchangedVsPhase9: boolean;
    };
    freshness: {
      satisfied: boolean;
      authoritativeIsoExportDate: null;
      gate: string;
      officialWeeklyCadence: string;
      weeklyCadenceUnlocksPublication: boolean;
    };
    gate: { allowsPublication: boolean; publication: string };
  }>("observed-live-counts.json");

  assert.equal(observed.accounting.rowCount, 24377);
  assert.equal(observed.accounting.invariantHolds, true);
  assert.equal(observed.accounting.buckets["active-candidate"], 15413);
  assert.equal(observed.accounting.buckets["restricted-candidate"], 38);
  assert.equal(observed.accounting.buckets.excluded, 8921);
  assert.equal(observed.accounting.buckets["exception-documented-exclude"], 5);
  assert.equal(observed.missingCapacity.totalMissing, 21);
  assert.equal(observed.missingCapacity.publicationCandidateMissing, 0);
  assert.equal(observed.coordinates.verifiedOfficialCoords, 15423);
  assert.equal(observed.coordinates.unresolved, 28);
  assert.equal(observed.coordinates.fabricatedCoordinates, 0);
  assert.equal(
    observed.download.rcfeSha256,
    CALIFORNIA_PHASE10_OBSERVED_COUNTS.downloadSha256.rcfe,
  );
  assert.equal(
    observed.download.arfSha256,
    CALIFORNIA_PHASE10_OBSERVED_COUNTS.downloadSha256.arf,
  );
  assert.equal(observed.download.bytesUnchangedVsPhase9, true);
  assert.equal(observed.download.authoritativeIsoExportDate, null);
  assert.equal(observed.freshness.satisfied, false);
  assert.equal(observed.freshness.gate, "blocked");
  assert.equal(
    observed.freshness.officialWeeklyCadence,
    "The data is updated weekly.",
  );
  assert.equal(observed.freshness.weeklyCadenceUnlocksPublication, false);
  assert.equal(observed.gate.allowsPublication, false);
  assert.equal(observed.gate.publication, "unpublished");
});

test("Phase 10 gate stays unpublished and blocked; WA/OR contracts preserved", () => {
  const readiness = evaluateCaliforniaPhase10Readiness();
  assert.equal(readiness.publication, "unpublished");
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.freshnessRequirementSatisfied, false);
  assert.equal(readiness.gate, "blocked");
  assert.equal(californiaPhase10AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development",
  );
});

test("freshness documents weekly FAQ cadence but keeps ISO requirement blocked", () => {
  const freshness = evaluateCaliforniaPhase10Freshness();
  assert.equal(freshness.satisfied, false);
  assert.equal(freshness.gate, "blocked");
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.acceptedAuthoritativeIsoChannels, 0);
  assert.equal(freshness.acceptedPolicyOnlyChannels, 1);
  assert.ok(freshness.rejectedChannels >= 8);
  assert.ok(freshness.absentChannels >= 5);
  assert.equal(freshness.distinguishesFilenameFromExportDate, true);
  assert.equal(freshness.distinguishesRetrievalTimestampFromExportDate, true);
  assert.equal(freshness.distinguishesWeeklyCadenceFromExportDate, true);
  assert.equal(freshness.recommendation.keepGateBlocked, true);
  assert.equal(freshness.recommendation.weeklyCadenceUnlocksPublication, false);
  assert.equal(
    freshness.recommendation.policy,
    "require-official-iso-export-channel",
  );
  assert.equal(
    CALIFORNIA_PHASE10_FRESHNESS_REQUIREMENT.officialUpdateCadenceStatement,
    "The data is updated weekly.",
  );
  assert.equal(
    CALIFORNIA_PHASE10_FRESHNESS_REQUIREMENT
      .officialUpdateCadenceSatisfiesIsoExportRequirement,
    false,
  );

  const weekly = CALIFORNIA_PHASE10_FRESHNESS_CHANNELS.find(
    c => c.id === "transparency-faq-weekly-update",
  );
  assert.ok(weekly);
  assert.equal(weekly?.verdict, "accepted-policy-only-not-export-date");
  assert.match(String(weekly?.observedValue), /updated weekly/i);

  assert.equal(
    adoptCaliforniaPhase10AuthoritativeExportDate("2026-11-15", {
      source: "download-filename-mmddyyyy",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase10AuthoritativeExportDate("2026-11-15", {
      source: "transparency-faq-weekly-update",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase10AuthoritativeExportDate("2026-11-15", {
      source: "spa-client-version",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase10AuthoritativeExportDate("2026-11-15", {
      source: "official-iso-export-timestamp",
    }),
    "2026-11-15",
  );
});

test("readiness matrix separates launch-blocking failures from optional enhancements", () => {
  const readiness = CALIFORNIA_PHASE10_READINESS_DECISION;
  assert.ok(readiness.launchBlockingFailures.includes("authoritative-iso-export-date"));
  assert.ok(
    readiness.launchBlockingFailures.includes("licensing-status-eligibility-rules"),
  );
  assert.ok(!readiness.launchBlockingFailures.includes("resolve-remaining-28-coords"));
  assert.ok(readiness.optionalEnhancements.includes("resolve-remaining-28-coords"));
  assert.ok(
    CALIFORNIA_PHASE10_READINESS_ITEMS.some(
      item => item.id === "eligible-facility-types" && item.status === "pass",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE10_READINESS_ITEMS.some(
      item =>
        item.id === "exclusive-bucket-accounting" && item.status === "pass",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE10_READINESS_ITEMS.some(
      item =>
        item.id === "publication-and-owner-claim-safeguards"
        && item.status === "pass",
    ),
  );
  const fixture = loadJson<typeof CALIFORNIA_PHASE10_READINESS_DECISION>(
    "readiness-report.json",
  );
  assert.equal(fixture.publicationReady, false);
  assert.equal(fixture.gate, "blocked");
});

test("24,377 exclusive-bucket accounting invariant and revalidation helpers hold", () => {
  const invariant = assertCaliforniaPhase10ExclusiveAccounting(
    CALIFORNIA_PHASE10_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE10_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);
  assert.equal(invariant.rowCount, 24377);
  assert.equal(invariant.bucketSum, 24377);

  const revalidation = evaluateCaliforniaPhase10Revalidation({
    buckets: CALIFORNIA_PHASE10_OBSERVED_COUNTS.buckets,
    rowCount: CALIFORNIA_PHASE10_OBSERVED_COUNTS.rowCount,
    downloadSha256: CALIFORNIA_PHASE10_OBSERVED_COUNTS.downloadSha256,
    coordinates: {
      verifiedOfficialCoords:
        CALIFORNIA_PHASE10_OBSERVED_COUNTS.coordinates.verifiedOfficialCoords,
      unresolved: CALIFORNIA_PHASE10_OBSERVED_COUNTS.coordinates.unresolved,
      fabricatedCoordinates: 0,
    },
    missingCapacity: {
      totalMissing: CALIFORNIA_PHASE10_OBSERVED_COUNTS.missingCapacity.totalMissing,
      publicationCandidateMissing:
        CALIFORNIA_PHASE10_OBSERVED_COUNTS.missingCapacity
          .publicationCandidateMissing,
    },
  });
  assert.equal(revalidation.sourceDataChanged, false);
  assert.equal(revalidation.downloadSha256MatchesBaseline, true);

  const quality = evaluateCaliforniaPhase10Quality({
    buckets: CALIFORNIA_PHASE10_OBSERVED_COUNTS.buckets,
    rowCount: CALIFORNIA_PHASE10_OBSERVED_COUNTS.rowCount,
    publicationCandidatesIfGateOpened:
      CALIFORNIA_PHASE10_OBSERVED_COUNTS.publicationCandidatesIfGateOpened,
    downloadSha256: CALIFORNIA_PHASE10_OBSERVED_COUNTS.downloadSha256,
    capacity: {
      totalMissing: 21,
      rcfeMissing: 17,
      arfMissing: 4,
      publicationCandidateMissing: 0,
    },
    coordinates: {
      verifiedOfficialCoords: 15423,
      unresolved: 28,
    },
  });
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.freshness.officialWeeklyCadenceDocumented, true);
  assert.equal(quality.coordinates.fabricatedCoordinates, 0);
  assert.equal(quality.capacity.inventedCapacities, 0);
});

test("CDSS clarification request remains draft and must not be auto-sent", () => {
  const draft = CALIFORNIA_PHASE10_CDSS_CLARIFICATION_REQUEST_DRAFT;
  assert.equal(draft.status, "draft-do-not-send");
  assert.ok(draft.toSuggested.includes("cclwebmaster@dss.ca.gov"));
  assert.match(draft.body, /DownloadStateData/);
  assert.match(draft.body, /updated weekly/);
  assert.equal(
    CALIFORNIA_PHASE10_FRESHNESS_RECOMMENDATION.cdssRequestSendRequiresHumanApproval,
    true,
  );
  const markdown = loadText("cdss-clarification-request-draft.md");
  assert.match(markdown, /DO NOT SEND/);
  assert.match(markdown, /cclwebmaster@dss\.ca\.gov/);
});

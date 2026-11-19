import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { CALIFORNIA_PHASE6_EXCEPTIONS } from "../../../lib/california-phase6-exceptions.ts";
import {
  evaluateCaliforniaPhase6PublicationGate,
  evaluateCaliforniaPhase6Row,
} from "../../../lib/california-phase6-publication-gate.ts";
import {
  CALIFORNIA_PHASE7_EXCLUSIVE_BUCKETS,
  CALIFORNIA_PHASE7_OBSERVED_COUNTS,
  CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_EVIDENCE,
  CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS,
  CALIFORNIA_PHASE7_READINESS_MATRIX,
  assertCaliforniaPhase7ExclusiveAccounting,
  auditCaliforniaPhase7DownloadCsvFields,
  californiaPhase7AllowsPublication,
  classifyCaliforniaPhase7FromPhase6Row,
  evaluateCaliforniaPhase7Accounting,
  explainPhase6FiveRecordGap,
  phase6OutcomeToExclusiveBucket,
} from "../../../lib/california-phase7-accounting.ts";
import {
  CALIFORNIA_PHASE7_FRESHNESS_CHANNELS,
  CALIFORNIA_PHASE7_FRESHNESS_REQUIREMENT,
  adoptCaliforniaPhase7AuthoritativeExportDate,
  evaluateCaliforniaPhase7Freshness,
} from "../../../lib/california-phase7-freshness.ts";
import { parseCaliforniaTransparencyDownloadCsv } from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase7-accounting-freshness",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

function evaluateFileRows(
  file: "RCFE" | "ARF",
  rows: ReturnType<typeof parseCaliforniaTransparencyDownloadCsv>,
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const id = String(row.facilityNumber ?? "").trim();
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  }
  const exceptionsById = new Map(
    CALIFORNIA_PHASE6_EXCEPTIONS.map(row => [row.facilityNumber, row] as const),
  );
  return rows.map(row =>
    evaluateCaliforniaPhase6Row(file, row, {
      duplicateFacilityNumbers: duplicates,
      exceptionsById,
    })
  );
}

test("Phase 7 gate stays unpublished and blocked without authoritative ISO export date", () => {
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.publication, "unpublished");
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.allowsPublication, false);
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.freshnessRequirementSatisfied, false);
  assert.equal(CALIFORNIA_PHASE7_FRESHNESS_REQUIREMENT.currentAuthoritativeIsoExportDate, null);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development",
  );
});

test("Phase 6 five-record gap resolves to the five ARF exception-documented-exclude IDs", () => {
  const gap = explainPhase6FiveRecordGap({
    rowCount: CALIFORNIA_PHASE7_OBSERVED_COUNTS.rowCount,
    activeCandidates: CALIFORNIA_PHASE7_OBSERVED_COUNTS.buckets["active-candidate"],
    restrictedCandidates:
      CALIFORNIA_PHASE7_OBSERVED_COUNTS.buckets["restricted-candidate"],
    excluded: CALIFORNIA_PHASE7_OBSERVED_COUNTS.buckets.excluded,
    exceptions:
      CALIFORNIA_PHASE7_OBSERVED_COUNTS.buckets["exception-documented-exclude"],
  });
  assert.equal(gap.threeBucketSum, 24372);
  assert.equal(gap.fourBucketSum, 24377);
  assert.equal(gap.apparentDifference, 5);
  assert.equal(gap.resolved, true);
  assert.deepEqual(
    [...gap.exceptionOutcomeIds],
    ["374604731", "198601400", "306006749", "306006799", "95354"],
  );
  assert.deepEqual(
    [...CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS],
    ["374604731", "198601400", "306006749", "306006799", "95354"],
  );
  assert.equal(CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_EVIDENCE.length, 5);
  for (const evidence of CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_EVIDENCE) {
    assert.equal(evidence.phase6Outcome, "exception");
    assert.equal(evidence.withoutExceptionCatalogWouldBe, "excluded");
    assert.equal(evidence.file, "ARF");
  }
});

test("exclusive-bucket invariant holds for observed live counts and rejects drift", () => {
  const invariant = assertCaliforniaPhase7ExclusiveAccounting(
    CALIFORNIA_PHASE7_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE7_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);
  assert.equal(invariant.difference, 0);
  assert.deepEqual([...CALIFORNIA_PHASE7_EXCLUSIVE_BUCKETS], [
    "active-candidate",
    "restricted-candidate",
    "excluded",
    "exception-documented-exclude",
  ]);
  const broken = assertCaliforniaPhase7ExclusiveAccounting(
    {
      "active-candidate": 15413,
      "restricted-candidate": 38,
      excluded: 8921,
      "exception-documented-exclude": 0,
    },
    24377,
  );
  assert.equal(broken.holds, false);
  assert.equal(broken.difference, 5);
});

test("observed live fixture matches corrected Phase 7 accounting", () => {
  const observed = loadJson<{
    download: {
      rcfeRows: number;
      arfRows: number;
      rcfeSha256: string;
      arfSha256: string;
      authoritativeIsoExportDate: null;
      fieldAudit: {
        rcfe: { facilityCapacityColumnPresent: boolean; coordinatesStillAbsent: boolean };
        arf: { facilityCapacityColumnPresent: boolean; coordinatesStillAbsent: boolean };
      };
    };
    phase6FiveRecordGap: { resolved: boolean; apparentDifference: number };
    exceptionDocumentedExcludeIds: string[];
    totals: {
      rowCount: number;
      buckets: Record<string, number>;
      invariantHolds: boolean;
      publicationCandidatesIfGateOpened: number;
      invalidIdentifiers: number;
      unknownStatuses: number;
      unknownTypes: number;
    };
    gate: {
      publication: string;
      allowsPublication: boolean;
      freshnessSatisfied: boolean;
    };
  }>("observed-live-counts.json");

  assert.equal(observed.download.rcfeRows, CALIFORNIA_PHASE7_OBSERVED_COUNTS.rcfeRows);
  assert.equal(observed.download.arfRows, CALIFORNIA_PHASE7_OBSERVED_COUNTS.arfRows);
  assert.equal(
    observed.download.rcfeSha256,
    CALIFORNIA_PHASE7_OBSERVED_COUNTS.downloadSha256.rcfe,
  );
  assert.equal(
    observed.download.arfSha256,
    CALIFORNIA_PHASE7_OBSERVED_COUNTS.downloadSha256.arf,
  );
  assert.equal(observed.download.authoritativeIsoExportDate, null);
  assert.equal(observed.phase6FiveRecordGap.resolved, true);
  assert.equal(observed.phase6FiveRecordGap.apparentDifference, 5);
  assert.deepEqual(
    observed.exceptionDocumentedExcludeIds.sort(),
    [...CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS].sort(),
  );
  assert.equal(observed.totals.rowCount, 24377);
  assert.equal(observed.totals.buckets["active-candidate"], 15413);
  assert.equal(observed.totals.buckets["restricted-candidate"], 38);
  assert.equal(observed.totals.buckets.excluded, 8921);
  assert.equal(observed.totals.buckets["exception-documented-exclude"], 5);
  assert.equal(observed.totals.invariantHolds, true);
  assert.equal(observed.totals.publicationCandidatesIfGateOpened, 15451);
  assert.equal(observed.totals.invalidIdentifiers, 1);
  assert.equal(observed.totals.unknownStatuses, 0);
  assert.equal(observed.totals.unknownTypes, 0);
  assert.equal(observed.gate.publication, "unpublished");
  assert.equal(observed.gate.allowsPublication, false);
  assert.equal(observed.gate.freshnessSatisfied, false);
  assert.equal(observed.download.fieldAudit.rcfe.facilityCapacityColumnPresent, true);
  assert.equal(observed.download.fieldAudit.arf.facilityCapacityColumnPresent, true);
  assert.equal(observed.download.fieldAudit.rcfe.coordinatesStillAbsent, true);
  assert.equal(observed.download.fieldAudit.arf.coordinatesStillAbsent, true);
});

test("fixture roster evaluation enforces exclusive buckets and fail-closed gate", () => {
  const rcfeRows = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-gate-sample.csv"));
  const arfRows = parseCaliforniaTransparencyDownloadCsv(loadText("arf-gate-sample.csv"));
  const phase6 = evaluateCaliforniaPhase6PublicationGate({
    observedOn: "2026-11-19",
    rcfeRows,
    arfRows,
    exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
    authoritativeIsoExportDate: null,
  });
  const evaluation = evaluateCaliforniaPhase7Accounting({
    observedOn: "2026-11-19",
    phase6,
    rcfePhase6Rows: evaluateFileRows("RCFE", rcfeRows),
    arfPhase6Rows: evaluateFileRows("ARF", arfRows),
    exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
  });

  assert.equal(evaluation.publication, "unpublished");
  assert.equal(evaluation.ownerClaimEligible, false);
  assert.equal(evaluation.allowsPublication, false);
  assert.equal(evaluation.freshnessSatisfied, false);
  assert.equal(californiaPhase7AllowsPublication(evaluation), false);
  assert.equal(evaluation.totals.invariant.holds, true);
  assert.equal(
    evaluation.totals.rowCount,
    evaluation.totals.buckets["active-candidate"]
      + evaluation.totals.buckets["restricted-candidate"]
      + evaluation.totals.buckets.excluded
      + evaluation.totals.buckets["exception-documented-exclude"],
  );
  assert.ok(evaluation.totals.buckets["exception-documented-exclude"] >= 5);
  assert.ok(
    CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS.every(id =>
      evaluation.totals.exceptionDocumentedExcludeIds.includes(id)
    ),
  );
  assert.ok(evaluation.arf.invalidIdentifiers.includes("95354"));
  assert.equal(evaluation.totals.unknownStatuses, 0);

  const byId = new Map(CALIFORNIA_PHASE6_EXCEPTIONS.map(e => [e.facilityNumber, e]));
  for (const id of CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS) {
    const row = arfRows.find(r => r.facilityNumber === id);
    assert.ok(row, `missing fixture row ${id}`);
    const phase6Row = evaluateCaliforniaPhase6Row("ARF", row!, {
      exceptionsById: byId,
    });
    const classified = classifyCaliforniaPhase7FromPhase6Row(
      phase6Row,
      byId.get(id)?.gateImpact ?? null,
    );
    assert.equal(classified.exclusiveBucket, "exception-documented-exclude");
    assert.equal(classified.publicationCandidate, false);
    assert.equal(classified.bypassesFailClosedGate, false);
    assert.equal(phase6OutcomeToExclusiveBucket("exception"), "exception-documented-exclude");
  }

  const eligiblePhase6 = evaluateCaliforniaPhase6Row(
    "ARF",
    arfRows.find(row => row.facilityNumber === "366401835")!,
    { exceptionsById: byId },
  );
  const eligible = classifyCaliforniaPhase7FromPhase6Row(
    eligiblePhase6,
    byId.get("366401835")?.gateImpact ?? null,
  );
  assert.equal(eligible.exclusiveBucket, "active-candidate");
  assert.equal(eligible.publicationCandidate, false);
});

test("freshness channels reject filename/download timestamps; ISO channel absent", () => {
  assert.equal(
    adoptCaliforniaPhase7AuthoritativeExportDate("2026-11-15", {
      source: "download-filename-mmddyyyy",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase7AuthoritativeExportDate("2026-11-19", {
      source: "download-timestamp",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase7AuthoritativeExportDate("2026-11-15", {
      source: "http-date",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase7AuthoritativeExportDate("2025-05-25", {
      source: "chhs-file-date-text",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase7AuthoritativeExportDate("2026-11-12", {
      source: "gis-data-last-edit",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase7AuthoritativeExportDate("2026-11-15", {
      source: "official-iso-export-timestamp",
    }),
    "2026-11-15",
  );

  const freshness = evaluateCaliforniaPhase7Freshness({ observedOn: "2026-11-19" });
  assert.equal(freshness.satisfied, false);
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.gate, "blocked");
  assert.equal(freshness.acceptedChannels, 0);
  assert.ok(freshness.rejectedChannels >= 1);
  assert.ok(freshness.absentChannels >= 1);
  assert.ok(
    CALIFORNIA_PHASE7_FRESHNESS_CHANNELS.some(
      c => c.id === "official-iso-export-timestamp-channel" && c.verdict === "absent",
    ),
  );

  const fixture = loadJson<{
    satisfied: boolean;
    authoritativeIsoExportDate: null;
    gate: string;
    channels: { id: string; verdict: string }[];
  }>("freshness-channels.json");
  assert.equal(fixture.satisfied, false);
  assert.equal(fixture.authoritativeIsoExportDate, null);
  assert.equal(fixture.gate, "blocked");
  assert.ok(
    fixture.channels.some(
      c => c.id === "download-content-disposition-filename-mmddyyyy"
        && c.verdict === "rejected-non-authoritative",
    ),
  );
});

test("capacity column audit corrects Phase 6 absent claim; coordinates remain absent", () => {
  const withCapacity = [
    "Facility Type,Facility Number,Facility Name,Facility Address,Facility City,Facility State,Facility Zip,Facility Capacity,Facility Status,License First Date,Closed Date,Last Visit Date",
    "ADULT RESIDENTIAL,361800222,A,1 Main,X,CA,90001,4,LICENSED,1/1/2020,,",
    "ADULT RESIDENTIAL,361800223,B,2 Main,X,CA,90001,,CLOSED,,",
  ].join("\n");
  const audit = auditCaliforniaPhase7DownloadCsvFields(withCapacity);
  assert.equal(audit.facilityCapacityColumnPresent, true);
  assert.equal(audit.latitudeColumnPresent, false);
  assert.equal(audit.longitudeColumnPresent, false);
  assert.equal(audit.fileDateColumnPresent, false);
  assert.equal(audit.capacityNonEmptyCount, 1);
  assert.equal(audit.capacityEmptyCount, 1);
  assert.equal(audit.coordinatesStillAbsent, true);
  assert.equal(audit.phase6CapacityAbsentClaimCorrected, true);
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.capacityColumnPresentInDownload, true);
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.capacityMappedThroughCoreParser, false);
  assert.equal(CALIFORNIA_PHASE7_READINESS_MATRIX.coordinatesPresentInDownload, false);
});

test("readiness report fixture remains unpublished with ISO freshness blocker", () => {
  const readiness = loadJson<{
    publication: string;
    allowsPublication: boolean;
    freshnessRequirementSatisfied: boolean;
    phase6FiveRecordGapResolved: boolean;
    exclusiveBucketAccountingInvariant: boolean;
    blockers: { id: string }[];
    freshness: { satisfied: boolean; authoritativeIsoExportDate: null };
  }>("readiness-report.json");
  assert.equal(readiness.publication, "unpublished");
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.freshnessRequirementSatisfied, false);
  assert.equal(readiness.phase6FiveRecordGapResolved, true);
  assert.equal(readiness.exclusiveBucketAccountingInvariant, true);
  assert.equal(readiness.freshness.satisfied, false);
  assert.equal(readiness.freshness.authoritativeIsoExportDate, null);
  assert.ok(readiness.blockers.some(b => b.id === "no-authoritative-iso-export-date"));
  assert.ok(readiness.blockers.some(b => b.id === "coordinates-absent-from-download"));
  assert.ok(readiness.blockers.some(b => b.id === "invalid-and-exceptional-identifiers"));
});

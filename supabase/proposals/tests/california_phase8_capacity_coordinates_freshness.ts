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
  assertCaliforniaPhase7ExclusiveAccounting,
  evaluateCaliforniaPhase7Accounting,
} from "../../../lib/california-phase7-accounting.ts";
import {
  auditCaliforniaPhase8Capacity,
  classifyCaliforniaPhase8Capacity,
  mergeCaliforniaPhase8CapacityAudits,
} from "../../../lib/california-phase8-capacity.ts";
import {
  assessCaliforniaPhase8GisCoordinates,
  reconcileCaliforniaPhase8Coordinates,
  splitCaliforniaPhase8CoordinateCoverage,
} from "../../../lib/california-phase8-coordinates.ts";
import {
  CALIFORNIA_PHASE8_FRESHNESS_CHANNELS,
  CALIFORNIA_PHASE8_FRESHNESS_REQUIREMENT,
  adoptCaliforniaPhase8AuthoritativeExportDate,
  evaluateCaliforniaPhase8Freshness,
} from "../../../lib/california-phase8-freshness.ts";
import {
  CALIFORNIA_PHASE8_OBSERVED_COUNTS,
  CALIFORNIA_PHASE8_READINESS_MATRIX,
  assertCaliforniaPhase8ExclusiveAccounting,
  californiaPhase8AllowsPublication,
  evaluateCaliforniaPhase8Quality,
  transparencyRowToPhase6CapacityFields,
} from "../../../lib/california-phase8-quality.ts";
import {
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_CAPACITY_FIELD,
  parseCaliforniaTransparencyDownloadCsv,
  parseCsvLine,
} from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase8-capacity-coordinates-freshness",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

function loadHistorical() {
  const lines = loadText("historical-capacity-sample.csv")
    .split(/\r?\n/)
    .filter(line => line.length > 0);
  const headers = parseCsvLine(lines[0] ?? "");
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const get = (name: string) => String(cells[index[name] ?? -1] ?? "").trim();
    return {
      facilityNumber: get("facility_number"),
      facilityCapacity: get("facility_capacity"),
    };
  });
}

test("observed live fixture preserves 24377 accounting and blocked freshness", () => {
  const observed = loadJson<{
    accounting: {
      rowCount: number;
      buckets: Record<string, number>;
      invariantHolds: boolean;
      phase6FiveRecordGapResolved: boolean;
    };
    capacity: {
      totals: Record<string, number>;
      crossSource: { officialValuesOverwritten: number };
    };
    coordinates: {
      allCandidates: {
        candidateCount: number;
        exactMatchWithValidCoords: number;
        fabricatedCoordinates: number;
      };
    };
    freshness: { satisfied: boolean; authoritativeIsoExportDate: null; gate: string };
    gate: { allowsPublication: boolean; publication: string };
    download: { capacityPreservedByParser: boolean; coordinatesPresentInDownload: boolean };
  }>("observed-live-counts.json");

  assert.equal(observed.accounting.rowCount, 24377);
  assert.equal(observed.accounting.invariantHolds, true);
  assert.equal(observed.accounting.phase6FiveRecordGapResolved, true);
  assert.equal(
    observed.accounting.buckets["active-candidate"]
      + observed.accounting.buckets["restricted-candidate"]
      + observed.accounting.buckets.excluded
      + observed.accounting.buckets["exception-documented-exclude"],
    24377,
  );
  assert.equal(observed.download.capacityPreservedByParser, true);
  assert.equal(observed.download.coordinatesPresentInDownload, false);
  assert.equal(observed.capacity.crossSource.officialValuesOverwritten, 0);
  assert.equal(observed.coordinates.allCandidates.candidateCount, 15451);
  assert.equal(observed.coordinates.allCandidates.fabricatedCoordinates, 0);
  assert.ok(observed.coordinates.allCandidates.exactMatchWithValidCoords > 0);
  assert.equal(observed.freshness.satisfied, false);
  assert.equal(observed.freshness.authoritativeIsoExportDate, null);
  assert.equal(observed.freshness.gate, "blocked");
  assert.equal(observed.gate.allowsPublication, false);
  assert.equal(observed.gate.publication, "unpublished");
});

test("Phase 8 gate stays unpublished and blocked without authoritative ISO export date", () => {
  assert.equal(CALIFORNIA_PHASE8_READINESS_MATRIX.publication, "unpublished");
  assert.equal(CALIFORNIA_PHASE8_READINESS_MATRIX.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_PHASE8_READINESS_MATRIX.allowsPublication, false);
  assert.equal(CALIFORNIA_PHASE8_READINESS_MATRIX.freshnessRequirementSatisfied, false);
  assert.equal(CALIFORNIA_PHASE8_READINESS_MATRIX.capacityMappedThroughCoreParser, true);
  assert.equal(CALIFORNIA_PHASE8_FRESHNESS_REQUIREMENT.currentAuthoritativeIsoExportDate, null);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development",
  );
});

test("Transparency parser preserves Facility Capacity without inventing values", () => {
  assert.equal(
    CALIFORNIA_TRANSPARENCY_DOWNLOAD_CAPACITY_FIELD,
    "Facility Capacity",
  );
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-capacity-sample.csv"));
  assert.equal(rcfe.length, 7);
  const licensed = rcfe.find(row => row.facilityNumber === "306006899");
  assert.equal(licensed?.facilityCapacity, "6");
  const leading = rcfe.find(row => row.facilityNumber === "015601302");
  assert.equal(leading?.facilityNumber, "015601302");
  assert.equal(leading?.facilityCapacity, "376");
  const missing = rcfe.find(row => row.facilityNumber === "365530505");
  assert.equal(missing?.facilityCapacity, "");
  const zero = rcfe.find(row => row.facilityNumber === "198603652");
  assert.equal(zero?.facilityCapacity, "0");
  const negative = rcfe.find(row => row.facilityNumber === "199999002");
  assert.equal(negative?.facilityCapacity, "-3");
  const invalid = rcfe.find(row => row.facilityNumber === "199999003");
  assert.equal(invalid?.facilityCapacity, "abc");

  const withoutColumn = parseCaliforniaTransparencyDownloadCsv(
    "Facility Type,Facility Number,Facility Name,Facility Address,Facility City,Facility State,Facility Zip,Facility Status,License First Date,Closed Date,Last Visit Date\n"
      + "RESIDENTIAL CARE ELDERLY,306006899,NAME,ADDR,CITY,CA,92691,LICENSED,1/1/2020,,\n",
  );
  assert.equal(withoutColumn[0]?.facilityCapacity, "");
});

test("capacity quality buckets quantify missing/invalid/zero/negative/valid separately", () => {
  assert.equal(classifyCaliforniaPhase8Capacity("1", "").bucket, "missing");
  assert.equal(classifyCaliforniaPhase8Capacity("1", "abc").bucket, "invalid");
  assert.equal(classifyCaliforniaPhase8Capacity("1", "0").bucket, "zero");
  assert.equal(classifyCaliforniaPhase8Capacity("1", "-2").bucket, "negative");
  assert.equal(classifyCaliforniaPhase8Capacity("1", "6").bucket, "valid");
  assert.equal(classifyCaliforniaPhase8Capacity("1", "6.5").bucket, "invalid");

  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-capacity-sample.csv"));
  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-capacity-sample.csv"));
  const historical = loadHistorical();
  const gis = loadJson<Array<{
    FAC_NBR: number;
    CAPACITY?: number;
    FAC_LATITUDE?: string;
    FAC_LONGITUDE?: string;
  }>>("gis-sample.json");

  const rcfeAudit = auditCaliforniaPhase8Capacity({
    file: "RCFE",
    download: rcfe,
    historical,
    gis,
  });
  const arfAudit = auditCaliforniaPhase8Capacity({
    file: "ARF",
    download: arf,
    historical,
    gis,
  });
  assert.equal(rcfeAudit.quality.valid, 3);
  assert.equal(rcfeAudit.quality.missing, 1);
  assert.equal(rcfeAudit.quality.zero, 1);
  assert.equal(rcfeAudit.quality.negative, 1);
  assert.equal(rcfeAudit.quality.invalid, 1);
  assert.equal(rcfeAudit.qualitySumEqualsRowCount, true);
  assert.equal(rcfeAudit.crossSource.officialValuesOverwritten, 0);
  assert.ok(rcfeAudit.crossSource.inconsistentWithHistorical >= 1);

  const merged = mergeCaliforniaPhase8CapacityAudits(rcfeAudit, arfAudit);
  assert.equal(merged.rowCount, rcfe.length + arf.length);
  assert.equal(merged.qualitySumEqualsRowCount, true);
  assert.equal(merged.crossSource.officialValuesOverwritten, 0);
  assert.ok(merged.crossSource.inconsistentWithGis >= 1);
});

test("ArcGIS coordinate matching uses exact IDs, preserves leading zeros, rejects ambiguous", () => {
  assert.equal(assessCaliforniaPhase8GisCoordinates("37.5", "-122.2"), "valid");
  assert.equal(assessCaliforniaPhase8GisCoordinates("0", "0"), "invalid");
  assert.equal(assessCaliforniaPhase8GisCoordinates("", "-122.2"), "missing");

  const gis = loadJson<Array<{
    FAC_NBR: number;
    FAC_LATITUDE?: string;
    FAC_LONGITUDE?: string;
  }>>("gis-sample.json");

  const reconciled = reconcileCaliforniaPhase8Coordinates({
    candidates: [
      { facilityNumber: "306006899", outcome: "active-candidate", file: "RCFE" },
      { facilityNumber: "015601302", outcome: "active-candidate", file: "RCFE" },
      { facilityNumber: "198603445", outcome: "restricted-candidate", file: "RCFE" },
      { facilityNumber: "011400493", outcome: "active-candidate", file: "ARF" },
      { facilityNumber: "100403816", outcome: "active-candidate", file: "ARF" },
      { facilityNumber: "95354", outcome: "active-candidate", file: "ARF" },
      { facilityNumber: "199999999", outcome: "active-candidate", file: "RCFE" },
    ],
    gis,
  });

  const byId = new Map(reconciled.matches.map(m => [m.facilityNumber, m]));
  assert.equal(byId.get("306006899")?.matchKind, "exact");
  assert.equal(byId.get("306006899")?.coordinatesValid, true);
  assert.equal(byId.get("306006899")?.leadingZerosPreserved, true);
  assert.equal(byId.get("306006899")?.fabricated, false);

  // Leading-zero download id collapses uniquely to GIS integer FAC_NBR.
  assert.equal(byId.get("015601302")?.matchKind, "leading-zero-collapsed-unique");
  assert.equal(byId.get("015601302")?.facilityNumber, "015601302");
  assert.equal(byId.get("015601302")?.coordinatesValid, true);

  // Duplicate GIS FAC_NBR → ambiguous rejection.
  assert.equal(byId.get("198603445")?.matchKind, "ambiguous-duplicate-gis");
  assert.equal(byId.get("198603445")?.coordinatesValid, false);

  assert.equal(byId.get("011400493")?.matchKind, "leading-zero-collapsed-unique");
  assert.equal(byId.get("100403816")?.matchKind, "exact");
  assert.equal(byId.get("95354")?.matchKind, "invalid-download-id");
  assert.equal(byId.get("199999999")?.matchKind, "unmatched");

  assert.equal(reconciled.coverage.fabricatedCoordinates, 0);
  assert.equal(reconciled.coverage.unverifiedGeocodingUsed, 0);
  assert.ok(reconciled.coverage.exactMatchWithValidCoords >= 2);
  assert.ok(reconciled.coverage.ambiguousRejected >= 1);

  const split = splitCaliforniaPhase8CoordinateCoverage(reconciled.matches);
  assert.equal(
    split.active.candidateCount + split.restricted.candidateCount,
    reconciled.coverage.candidateCount,
  );
});

test("freshness stays blocked; filename and retrieval timestamps never unlock the gate", () => {
  const freshness = evaluateCaliforniaPhase8Freshness();
  assert.equal(freshness.satisfied, false);
  assert.equal(freshness.gate, "blocked");
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.acceptedChannels, 0);
  assert.ok(freshness.rejectedChannels >= 5);
  assert.ok(freshness.absentChannels >= 5);
  assert.equal(freshness.distinguishesFilenameFromExportDate, true);
  assert.equal(freshness.distinguishesRetrievalTimestampFromExportDate, true);
  assert.equal(
    adoptCaliforniaPhase8AuthoritativeExportDate("2026-11-15", {
      source: "download-filename-mmddyyyy",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase8AuthoritativeExportDate("2026-11-19", {
      source: "download-retrieval-timestamp",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase8AuthoritativeExportDate("2026-11-15", {
      source: "official-iso-export-timestamp",
    }),
    "2026-11-15",
  );
  assert.ok(
    CALIFORNIA_PHASE8_FRESHNESS_CHANNELS.some(
      c => c.id === "official-iso-export-timestamp-channel" && c.verdict === "absent",
    ),
  );
});

test("24,377 exclusive-bucket accounting invariant is preserved", () => {
  const invariant = assertCaliforniaPhase8ExclusiveAccounting(
    CALIFORNIA_PHASE8_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE8_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);
  assert.equal(invariant.rowCount, 24377);
  assert.equal(invariant.bucketSum, 24377);
  assert.equal(invariant.difference, 0);

  const drifted = assertCaliforniaPhase8ExclusiveAccounting(
    {
      "active-candidate": 15413,
      "restricted-candidate": 38,
      excluded: 8921,
      "exception-documented-exclude": 0,
    },
    24377,
  );
  assert.equal(drifted.holds, false);
  assert.equal(drifted.difference, 5);

  // Phase 7 helper still agrees on the same buckets.
  const phase7 = assertCaliforniaPhase7ExclusiveAccounting(
    CALIFORNIA_PHASE8_OBSERVED_COUNTS.buckets,
    24377,
  );
  assert.equal(phase7.holds, true);
});

test("fixture evaluation produces blocked quality report with source provenance checks", () => {
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-capacity-sample.csv"));
  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-capacity-sample.csv"));
  const historical = loadHistorical();
  const gis = loadJson<Array<{
    FAC_NBR: number;
    CAPACITY?: number;
    FAC_LATITUDE?: string;
    FAC_LONGITUDE?: string;
    FAC_TYPE_DESC?: string;
  }>>("gis-sample.json");

  const exceptionsById = new Map(
    CALIFORNIA_PHASE6_EXCEPTIONS.map(row => [row.facilityNumber, row] as const),
  );
  function evaluateFile(
    file: "RCFE" | "ARF",
    rows: ReturnType<typeof parseCaliforniaTransparencyDownloadCsv>,
  ) {
    const phase6Rows = rows.map(row => ({
      ...row,
      ...transparencyRowToPhase6CapacityFields(row),
    }));
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const row of phase6Rows) {
      const id = row.facilityNumber;
      if (!id) continue;
      if (seen.has(id)) duplicates.add(id);
      else seen.add(id);
    }
    return phase6Rows.map(row =>
      evaluateCaliforniaPhase6Row(file, row, {
        duplicateFacilityNumbers: duplicates,
        exceptionsById,
      })
    );
  }

  const rcfePhase6 = evaluateFile("RCFE", rcfe);
  const arfPhase6 = evaluateFile("ARF", arf);
  const phase6 = evaluateCaliforniaPhase6PublicationGate({
    observedOn: "2026-11-19",
    rcfeRows: rcfe.map(row => ({ ...row, ...transparencyRowToPhase6CapacityFields(row) })),
    arfRows: arf.map(row => ({ ...row, ...transparencyRowToPhase6CapacityFields(row) })),
    exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
    authoritativeIsoExportDate: null,
  });
  const accounting = evaluateCaliforniaPhase7Accounting({
    observedOn: "2026-11-19",
    phase6,
    rcfePhase6Rows: rcfePhase6,
    arfPhase6Rows: arfPhase6,
    exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
  });
  assert.equal(accounting.totals.invariant.holds, true);
  assert.equal(accounting.allowsPublication, false);

  const candidates = [...rcfePhase6, ...arfPhase6]
    .filter(row =>
      row.outcome === "active-candidate" || row.outcome === "restricted-candidate"
    )
    .map(row => ({
      facilityNumber: row.facilityNumber,
      outcome: row.outcome as "active-candidate" | "restricted-candidate",
      file: row.file,
    }));

  const rcfeCapacity = auditCaliforniaPhase8Capacity({
    file: "RCFE",
    download: rcfe,
    historical,
    gis,
  });
  const arfCapacity = auditCaliforniaPhase8Capacity({
    file: "ARF",
    download: arf,
    historical,
    gis,
  });
  const capacity = mergeCaliforniaPhase8CapacityAudits(rcfeCapacity, arfCapacity);
  const coordinated = reconcileCaliforniaPhase8Coordinates({ candidates, gis });
  const split = splitCaliforniaPhase8CoordinateCoverage(coordinated.matches);
  const freshness = evaluateCaliforniaPhase8Freshness({ observedOn: "2026-11-19" });

  const quality = evaluateCaliforniaPhase8Quality({
    observedOn: "2026-11-19",
    buckets: accounting.totals.buckets,
    rowCount: accounting.totals.rowCount,
    publicationCandidatesIfGateOpened:
      accounting.totals.publicationCandidatesIfGateOpened,
    capacity,
    coordinates: {
      allCandidates: coordinated.coverage,
      active: split.active,
      restricted: split.restricted,
    },
    freshness,
  });

  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.freshnessSatisfied, false);
  assert.equal(quality.authoritativeIsoExportDate, null);
  assert.equal(quality.publication, "unpublished");
  assert.equal(quality.ownerClaimEligible, false);
  assert.equal(californiaPhase8AllowsPublication(quality), false);
  assert.equal(quality.capacity.crossSource.officialValuesOverwritten, 0);
  assert.equal(quality.coordinates.allCandidates.fabricatedCoordinates, 0);
  assert.equal(quality.readiness.capacityMappedThroughCoreParser, true);
  assert.ok(
    quality.readiness.blockers.some(b => b.id === "no-authoritative-iso-export-date"),
  );
});

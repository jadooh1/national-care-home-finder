import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  auditCaliforniaPhase9MissingCapacity,
  CALIFORNIA_PHASE9_MISSING_CAPACITY_BASELINE,
} from "../../../lib/california-phase9-capacity.ts";
import {
  reconcileCaliforniaPhase8Coordinates,
  splitCaliforniaPhase8CoordinateCoverage,
} from "../../../lib/california-phase8-coordinates.ts";
import {
  assessCaliforniaPhase9IdentityCorroboration,
  californiaPhase9FacilityTypeFamily,
  reconcileCaliforniaPhase9Coordinates,
  splitCaliforniaPhase9CoordinateCoverage,
} from "../../../lib/california-phase9-coordinates.ts";
import {
  CALIFORNIA_PHASE9_FRESHNESS_CHANNELS,
  CALIFORNIA_PHASE9_FRESHNESS_RECOMMENDATION,
  CALIFORNIA_PHASE9_FRESHNESS_REQUIREMENT,
  adoptCaliforniaPhase9AuthoritativeExportDate,
  evaluateCaliforniaPhase9Freshness,
} from "../../../lib/california-phase9-freshness.ts";
import {
  CALIFORNIA_PHASE9_OBSERVED_COUNTS,
  CALIFORNIA_PHASE9_READINESS_MATRIX,
  assertCaliforniaPhase9ExclusiveAccounting,
  californiaPhase9AllowsPublication,
  evaluateCaliforniaPhase9Quality,
} from "../../../lib/california-phase9-quality.ts";
import { parseCaliforniaTransparencyDownloadCsv } from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase9-coordinates-freshness",
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
      phase6FiveRecordGapResolved: boolean;
    };
    missingCapacity: {
      totalMissing: number;
      publicationCandidateMissing: number;
      officialValuesOverwritten: number;
      inventedCapacities: number;
    };
    coordinates: {
      allCandidates: {
        candidateCount: number;
        exactMatchWithValidCoords: number;
        newlyVerifiedIdentityCorroborated: number;
        leadingZeroIdentityRejected: number;
        unmatched: number;
        fabricatedCoordinates: number;
      };
    };
    freshness: {
      satisfied: boolean;
      authoritativeIsoExportDate: null;
      gate: string;
      keepGateBlocked: boolean;
    };
    gate: { allowsPublication: boolean; publication: string };
    download: { coordinatesPresentInDownload: boolean };
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
  assert.equal(observed.download.coordinatesPresentInDownload, false);
  assert.equal(observed.missingCapacity.totalMissing, 21);
  assert.equal(observed.missingCapacity.publicationCandidateMissing, 0);
  assert.equal(observed.missingCapacity.officialValuesOverwritten, 0);
  assert.equal(observed.missingCapacity.inventedCapacities, 0);
  assert.equal(observed.coordinates.allCandidates.candidateCount, 15451);
  assert.equal(observed.coordinates.allCandidates.exactMatchWithValidCoords, 14059);
  assert.equal(observed.coordinates.allCandidates.newlyVerifiedIdentityCorroborated, 1364);
  assert.equal(observed.coordinates.allCandidates.leadingZeroIdentityRejected, 1);
  assert.equal(observed.coordinates.allCandidates.unmatched, 27);
  assert.equal(observed.coordinates.allCandidates.fabricatedCoordinates, 0);
  assert.equal(observed.freshness.satisfied, false);
  assert.equal(observed.freshness.authoritativeIsoExportDate, null);
  assert.equal(observed.freshness.gate, "blocked");
  assert.equal(observed.freshness.keepGateBlocked, true);
  assert.equal(observed.gate.allowsPublication, false);
  assert.equal(observed.gate.publication, "unpublished");
});

test("Phase 9 gate stays unpublished and blocked without authoritative ISO export date", () => {
  assert.equal(CALIFORNIA_PHASE9_READINESS_MATRIX.publication, "unpublished");
  assert.equal(CALIFORNIA_PHASE9_READINESS_MATRIX.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_PHASE9_READINESS_MATRIX.allowsPublication, false);
  assert.equal(CALIFORNIA_PHASE9_READINESS_MATRIX.freshnessRequirementSatisfied, false);
  assert.equal(CALIFORNIA_PHASE9_READINESS_MATRIX.leadingZeroIdentityCorroborationApplied, true);
  assert.equal(CALIFORNIA_PHASE9_READINESS_MATRIX.missingCapacityAudited, true);
  assert.equal(CALIFORNIA_PHASE9_FRESHNESS_REQUIREMENT.currentAuthoritativeIsoExportDate, null);
  assert.equal(CALIFORNIA_PHASE9_FRESHNESS_RECOMMENDATION.keepGateBlocked, true);
  assert.equal(
    CALIFORNIA_PHASE9_FRESHNESS_RECOMMENDATION.policy,
    "require-official-iso-export-channel",
  );
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development",
  );
});

test("facility type families map RCFE/CCRC and ARF/ARFPSHN/crisis variants", () => {
  assert.equal(
    californiaPhase9FacilityTypeFamily("RCFE-CONTINUING CARE RETIREMENT COMMUNITY"),
    "rcfe",
  );
  assert.equal(californiaPhase9FacilityTypeFamily("RESIDENTIAL ELDERLY-"), "rcfe");
  assert.equal(californiaPhase9FacilityTypeFamily("RESIDENTIAL-ELDERLY"), "rcfe");
  assert.equal(californiaPhase9FacilityTypeFamily("ADULT RESIDENTIAL"), "arf");
  assert.equal(californiaPhase9FacilityTypeFamily("ARFPSHN"), "arf");
  assert.equal(
    californiaPhase9FacilityTypeFamily(
      "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
    ),
    "arf",
  );
  assert.equal(californiaPhase9FacilityTypeFamily("COMMUNITY CRISIS HOME - ARF"), "arf");
  assert.equal(californiaPhase9FacilityTypeFamily("COMMUNITY CRISIS HOM"), "arf");
});

test("leading-zero matches require independent identity corroboration", () => {
  const download = parseCaliforniaTransparencyDownloadCsv(
    loadText("identity-download-sample.csv"),
  );
  const gis = loadJson<Array<{
    FAC_NBR: number;
    FAC_TYPE_DESC?: string;
    NAME?: string;
    FAC_LATITUDE?: string;
    FAC_LONGITUDE?: string;
    RES_STREET_ADDR?: string;
    RES_CITY?: string;
    RES_ZIP_CODE?: number;
  }>>("identity-gis-sample.json");
  const downloadById = new Map(download.map(row => [row.facilityNumber, row]));

  const candidates = [
    { facilityNumber: "306006899", outcome: "active-candidate" as const, file: "RCFE" as const },
    { facilityNumber: "015601302", outcome: "active-candidate" as const, file: "RCFE" as const },
    { facilityNumber: "011400493", outcome: "active-candidate" as const, file: "ARF" as const },
    { facilityNumber: "019200718", outcome: "active-candidate" as const, file: "ARF" as const },
    { facilityNumber: "095920251", outcome: "active-candidate" as const, file: "ARF" as const },
    { facilityNumber: "011405838", outcome: "active-candidate" as const, file: "ARF" as const },
    { facilityNumber: "198602394", outcome: "active-candidate" as const, file: "ARF" as const },
    { facilityNumber: "199999999", outcome: "active-candidate" as const, file: "RCFE" as const },
  ];

  const phase8 = reconcileCaliforniaPhase8Coordinates({ candidates, gis });
  const phase8Split = splitCaliforniaPhase8CoordinateCoverage(phase8.matches);
  const reconciled = reconcileCaliforniaPhase9Coordinates({
    phase8Matches: phase8.matches,
    phase8Coverage: phase8.coverage,
    gis,
    downloadById,
  });
  const byId = new Map(reconciled.matches.map(m => [m.facilityNumber, m]));

  assert.equal(byId.get("306006899")?.matchKind, "exact");
  assert.equal(byId.get("306006899")?.coordinatesValid, true);
  assert.equal(byId.get("306006899")?.fabricated, false);

  assert.equal(byId.get("015601302")?.matchKind, "leading-zero-identity-verified");
  assert.equal(byId.get("015601302")?.facilityNumber, "015601302");
  assert.equal(byId.get("015601302")?.coordinatesValid, true);
  assert.equal(byId.get("015601302")?.geocoded, false);

  assert.equal(byId.get("011400493")?.matchKind, "leading-zero-identity-verified");
  assert.equal(byId.get("019200718")?.matchKind, "leading-zero-identity-verified");
  assert.equal(byId.get("095920251")?.matchKind, "leading-zero-identity-verified");

  // Name divergence + ZIP mismatch → reject.
  assert.equal(byId.get("011405838")?.matchKind, "leading-zero-identity-rejected");
  assert.equal(byId.get("011405838")?.coordinatesValid, false);
  assert.equal(byId.get("011405838")?.latitude, null);

  // Address hit exists but licensing ID diverges → still unmatched, labeled.
  assert.equal(
    byId.get("198602394")?.matchKind,
    "unmatched-address-or-name-divergent-id-rejected",
  );
  assert.equal(byId.get("198602394")?.coordinatesValid, false);

  assert.equal(byId.get("199999999")?.matchKind, "unmatched");
  assert.equal(reconciled.coverage.fabricatedCoordinates, 0);
  assert.equal(reconciled.coverage.unverifiedGeocodingUsed, 0);
  assert.ok(reconciled.coverage.exactMatchWithValidCoords >= 1);
  assert.ok(reconciled.coverage.newlyVerifiedIdentityCorroborated >= 3);
  assert.ok(reconciled.coverage.leadingZeroIdentityRejected >= 1);

  const split = splitCaliforniaPhase9CoordinateCoverage(
    reconciled.matches,
    phase8Split.active,
    phase8Split.restricted,
  );
  assert.equal(
    split.active.candidateCount + split.restricted.candidateCount,
    reconciled.coverage.candidateCount,
  );
});

test("identity corroboration rejects weak name/address signals", () => {
  const ok = assessCaliforniaPhase9IdentityCorroboration(
    {
      facilityNumber: "015601302",
      facilityType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
      facilityName: "ACACIA CREEK - UNION CITY",
      facilityAddress: "34400 MISSION BLVD.",
      facilityCity: "UNION CITY",
      facilityZip: "94587",
    },
    {
      FAC_NBR: 15601302,
      FAC_TYPE_DESC: "RESIDENTIAL ELDERLY-",
      NAME: "ACACIA CREEK - UNION CITY",
      RES_STREET_ADDR: "34400 MISSION BLVD.",
      RES_CITY: "UNION CITY",
      RES_ZIP_CODE: 94587,
    },
  );
  assert.equal(ok.corroborated, true);
  assert.equal(ok.typeFamilyMatch, true);

  const weak = assessCaliforniaPhase9IdentityCorroboration(
    {
      facilityNumber: "011405838",
      facilityType: "ADULT RESIDENTIAL",
      facilityName: "ABLELIGHT INC - MOWRY",
      facilityAddress: "1335 Mowry Ave",
      facilityCity: "Fremont",
      facilityZip: "94538",
    },
    {
      FAC_NBR: 11405838,
      FAC_TYPE_DESC: "ADULT RESIDENTIAL",
      NAME: "BETHESDA LUTHERAN COMMUNITIES-MOWRY",
      RES_STREET_ADDR: "1335 MOWRY AVE",
      RES_CITY: "FREMONT",
      RES_ZIP_CODE: 94536,
    },
  );
  assert.equal(weak.corroborated, false);
  assert.equal(weak.nameCompatible, false);
  assert.equal(weak.zipMatch, false);
});

test("missing capacity audit documents official blanks without inventing values", () => {
  const download = parseCaliforniaTransparencyDownloadCsv(
    loadText("identity-download-sample.csv"),
  );
  const audit = auditCaliforniaPhase9MissingCapacity({
    rows: download.map(row => {
      const isArf =
        row.facilityType.includes("ADULT")
        || row.facilityType.includes("CRISIS")
        || row.facilityType.includes("ARF");
      return {
        facilityNumber: row.facilityNumber,
        file: (isArf ? "ARF" : "RCFE") as "RCFE" | "ARF",
        facilityType: row.facilityType,
        facilityName: row.facilityName,
        facilityStatus: row.facilityStatus,
        facilityCapacity: row.facilityCapacity,
        outcome: row.facilityStatus === "PENDING" ? "excluded" : "active-candidate",
      };
    }),
  });
  assert.equal(audit.totalMissing, 1);
  assert.equal(audit.rows[0]?.facilityNumber, "365530505");
  assert.equal(audit.rows[0]?.facilityCapacityRaw, "");
  assert.equal(audit.rows[0]?.officialValuePreserved, true);
  assert.equal(audit.inventedCapacities, 0);
  assert.equal(audit.officialValuesOverwritten, 0);

  const liveMissing = loadJson<Array<{ facilityNumber: string; facilityStatus: string; isPublicationCandidate: boolean }>>(
    "missing-capacity-rows.json",
  );
  assert.equal(liveMissing.length, CALIFORNIA_PHASE9_MISSING_CAPACITY_BASELINE.totalMissing);
  assert.equal(liveMissing.every(r => r.facilityStatus === "PENDING"), true);
  assert.equal(liveMissing.every(r => r.isPublicationCandidate === false), true);
  assert.equal(
    new Set(liveMissing.map(r => r.facilityNumber)).size,
    CALIFORNIA_PHASE9_MISSING_CAPACITY_BASELINE.facilityNumbers.length,
  );
});

test("freshness stays blocked; filename and retrieval timestamps never unlock the gate", () => {
  const freshness = evaluateCaliforniaPhase9Freshness();
  assert.equal(freshness.satisfied, false);
  assert.equal(freshness.gate, "blocked");
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.acceptedChannels, 0);
  assert.ok(freshness.rejectedChannels >= 6);
  assert.ok(freshness.absentChannels >= 6);
  assert.equal(freshness.distinguishesFilenameFromExportDate, true);
  assert.equal(freshness.distinguishesRetrievalTimestampFromExportDate, true);
  assert.equal(freshness.recommendation.keepGateBlocked, true);
  assert.equal(
    adoptCaliforniaPhase9AuthoritativeExportDate("2026-11-15", {
      source: "download-filename-mmddyyyy",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase9AuthoritativeExportDate("2026-11-19", {
      source: "download-retrieval-timestamp",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase9AuthoritativeExportDate("2026-11-15", {
      source: "annual-ccld-pdf-report",
    }),
    null,
  );
  assert.equal(
    adoptCaliforniaPhase9AuthoritativeExportDate("2026-11-15", {
      source: "official-iso-export-timestamp",
    }),
    "2026-11-15",
  );
  assert.ok(
    CALIFORNIA_PHASE9_FRESHNESS_CHANNELS.some(
      c => c.id === "official-iso-export-timestamp-channel" && c.verdict === "absent",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE9_FRESHNESS_CHANNELS.some(
      c => c.id === "cdss-ccld-data-page" && c.verdict === "rejected-non-authoritative",
    ),
  );
});

test("24,377 exclusive-bucket accounting invariant is preserved", () => {
  const invariant = assertCaliforniaPhase9ExclusiveAccounting(
    CALIFORNIA_PHASE9_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE9_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);
  assert.equal(invariant.rowCount, 24377);
  assert.equal(invariant.bucketSum, 24377);
  assert.equal(invariant.difference, 0);

  const drifted = assertCaliforniaPhase9ExclusiveAccounting(
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
});

test("fixture quality evaluation remains blocked and unpublished", () => {
  const observed = loadJson<{
    accounting: {
      buckets: {
        "active-candidate": number;
        "restricted-candidate": number;
        excluded: number;
        "exception-documented-exclude": number;
      };
      rowCount: number;
      publicationCandidatesIfGateOpened: number;
    };
    missingCapacity: {
      totalMissing: number;
      rcfeMissing: number;
      arfMissing: number;
      publicationCandidateMissing: number;
      excludedMissing: number;
      allMissingAreNonCandidates: boolean;
    };
    coordinates: {
      allCandidates: ReturnType<typeof reconcileCaliforniaPhase9Coordinates>["coverage"];
      active: ReturnType<typeof reconcileCaliforniaPhase9Coordinates>["coverage"];
      restricted: ReturnType<typeof reconcileCaliforniaPhase9Coordinates>["coverage"];
    };
  }>("observed-live-counts.json");

  const freshness = evaluateCaliforniaPhase9Freshness({ observedOn: "2026-11-19" });
  const quality = evaluateCaliforniaPhase9Quality({
    observedOn: "2026-11-19",
    buckets: observed.accounting.buckets,
    rowCount: observed.accounting.rowCount,
    publicationCandidatesIfGateOpened:
      observed.accounting.publicationCandidatesIfGateOpened,
    capacity: {
      totalMissing: observed.missingCapacity.totalMissing,
      rcfeMissing: observed.missingCapacity.rcfeMissing,
      arfMissing: observed.missingCapacity.arfMissing,
      publicationCandidateMissing: observed.missingCapacity.publicationCandidateMissing,
      excludedMissing: observed.missingCapacity.excludedMissing,
      allMissingAreNonCandidates: observed.missingCapacity.allMissingAreNonCandidates,
      officialValuesOverwritten: 0,
      inventedCapacities: 0,
    },
    coordinates: observed.coordinates,
    freshness,
  });

  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.freshnessSatisfied, false);
  assert.equal(quality.authoritativeIsoExportDate, null);
  assert.equal(quality.publication, "unpublished");
  assert.equal(quality.ownerClaimEligible, false);
  assert.equal(californiaPhase9AllowsPublication(quality), false);
  assert.equal(quality.capacity.inventedCapacities, 0);
  assert.equal(quality.coordinates.allCandidates.fabricatedCoordinates, 0);
  assert.ok(
    quality.readiness.blockers.some(b => b.id === "no-authoritative-iso-export-date"),
  );
});

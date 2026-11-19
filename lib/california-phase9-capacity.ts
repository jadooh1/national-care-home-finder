/**
 * California Phase 9 — missing Facility Capacity audit (read-only).
 * Documents every official DownloadStateData row without a valid capacity
 * cell. Preserves blank official values; never guesses or overwrites.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE9_CAPACITY_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase9File = "RCFE" | "ARF";

export type CaliforniaPhase9CapacityAuditRow = {
  facilityNumber: string;
  file: CaliforniaPhase9File;
  facilityType: string;
  facilityName: string;
  facilityStatus: string;
  facilityCapacityRaw: string;
  capacityBucket: "missing";
  outcome: string;
  isPublicationCandidate: boolean;
  /** Optional FacilityDetail CAPACITY when probed; never used to overwrite. */
  facilityDetailCapacity?: string | null;
  facilityDetailStatus?: string | null;
  officialValuePreserved: true;
};

export type CaliforniaPhase9MissingCapacityAudit = {
  observedOn: string;
  totalMissing: number;
  rcfeMissing: number;
  arfMissing: number;
  publicationCandidateMissing: number;
  excludedMissing: number;
  /** All missing rows observed live are PENDING + excluded (not candidates). */
  allMissingAreNonCandidates: boolean;
  rows: CaliforniaPhase9CapacityAuditRow[];
  officialValuesOverwritten: 0;
  inventedCapacities: 0;
};

function text(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function isMissingCapacity(value: string | number | null | undefined): boolean {
  return text(value) === "";
}

/**
 * Audit missing (blank) Facility Capacity cells from official download rows.
 * Does not invent values. Optional FacilityDetail fields are documentation only.
 */
export function auditCaliforniaPhase9MissingCapacity(input: {
  observedOn?: string;
  rows: readonly {
    facilityNumber: string;
    file: CaliforniaPhase9File;
    facilityType?: string | null;
    facilityName?: string | null;
    facilityStatus?: string | null;
    facilityCapacity?: string | number | null;
    outcome: string;
    facilityDetailCapacity?: string | null;
    facilityDetailStatus?: string | null;
  }[];
}): CaliforniaPhase9MissingCapacityAudit {
  const missing: CaliforniaPhase9CapacityAuditRow[] = [];
  for (const row of input.rows) {
    if (!isMissingCapacity(row.facilityCapacity)) continue;
    const isPublicationCandidate =
      row.outcome === "active-candidate" || row.outcome === "restricted-candidate";
    missing.push({
      facilityNumber: text(row.facilityNumber),
      file: row.file,
      facilityType: text(row.facilityType),
      facilityName: text(row.facilityName),
      facilityStatus: text(row.facilityStatus),
      facilityCapacityRaw: "",
      capacityBucket: "missing",
      outcome: row.outcome,
      isPublicationCandidate,
      facilityDetailCapacity: row.facilityDetailCapacity ?? null,
      facilityDetailStatus: row.facilityDetailStatus ?? null,
      officialValuePreserved: true,
    });
  }

  missing.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.facilityNumber.localeCompare(b.facilityNumber);
  });

  const rcfeMissing = missing.filter(r => r.file === "RCFE").length;
  const arfMissing = missing.filter(r => r.file === "ARF").length;
  const publicationCandidateMissing = missing.filter(r => r.isPublicationCandidate).length;
  const excludedMissing = missing.length - publicationCandidateMissing;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE9_CAPACITY_OBSERVED_ON,
    totalMissing: missing.length,
    rcfeMissing,
    arfMissing,
    publicationCandidateMissing,
    excludedMissing,
    allMissingAreNonCandidates: publicationCandidateMissing === 0,
    rows: missing,
    officialValuesOverwritten: 0,
    inventedCapacities: 0,
  };
}

/** Live Phase 9 baseline: 17 RCFE + 4 ARF missing, all PENDING excluded. */
export const CALIFORNIA_PHASE9_MISSING_CAPACITY_BASELINE = {
  rcfeMissing: 17,
  arfMissing: 4,
  totalMissing: 21,
  publicationCandidateMissing: 0,
  facilityNumbers: [
    // RCFE (17)
    "079201796",
    "107209811",
    "195850849",
    "195850871",
    "197611180",
    "197611186",
    "197611189",
    "197611193",
    "197611200",
    "198604101",
    "198604103",
    "198604115",
    "198604117",
    "207209803",
    "306007077",
    "342701978",
    "342701993",
    // ARF (4)
    "197611169",
    "374605768",
    "435203090",
    "502702016",
  ] as const,
  statusesObserved: ["PENDING"] as const,
  outcomesObserved: ["excluded"] as const,
} as const;

/**
 * California Phase 21 — offline classification of Download ↔ FacilityDetail
 * licensing discrepancies. Fail-closed: uncertain facilities stay ineligible.
 * Does not activate exclusions in app/DB. Does not alter government records.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE21_CLASSIFICATION_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase21DiscrepancyClass =
  | "explainable-coarsening-or-timing"
  | "genuine-unresolved-licensing-conflict"
  | "invalid-or-mismatched-identity"
  | "closed-pending-or-withdrawn"
  | "requires-cdss-clarification"
  | "inconclusive-transport-or-server-error"
  | "match-no-longer-discrepant";

export type CaliforniaPhase21ConflictClassification = {
  facilityNumber: string;
  downloadStatus: string | null;
  liveStatus: string | null;
  classId: CaliforniaPhase21DiscrepancyClass;
  eligibility:
    | "unknown-ineligible"
    | "withdrawn-ineligible"
    | "closed-ineligible"
    | "pending-ineligible"
    | "invalid-id-ineligible"
    | "active-candidate"
    | "active-restricted";
  publicationEligible: false;
  ownerClaimEligible: false;
  rationale: string;
  evidence: Record<string, unknown>;
  altersAuthoritativeGovernmentRecords: false;
  activatedInApplicationOrDatabase: false;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

const FACILITY_NUMBER = /^\d{8,9}$/;

function isPendingIncrease(live: string): boolean {
  return /^licensed\s*\/\s*pending\s+increase$/i.test(live);
}

function isProvisional(live: string): boolean {
  return /^provisional\s+license$/i.test(live);
}

function isApplicationWithdrawn(live: string): boolean {
  return /application\s+withdrawn/i.test(live);
}

function isPendingIncomplete(live: string): boolean {
  return /pending\s+incomplete/i.test(live);
}

function isClosedStar(live: string): boolean {
  return /^closed/i.test(live);
}

function isExactLicensed(live: string): boolean {
  return /^licensed$/i.test(live);
}

/**
 * Classify one Download vs FacilityDetail pair for the exception ledger.
 * Never marks uncertain records publication-eligible.
 */
export function classifyCaliforniaPhase21LicensingDiscrepancy(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  liveFacilityNumber?: string | null;
  httpStatus?: number | null;
  timedOut?: boolean;
  found?: boolean | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  source?: "phase20-conflict" | "phase20-inconclusive-retry" | "prior-known";
}): CaliforniaPhase21ConflictClassification {
  const facilityNumber = text(input.facilityNumber);
  const downloadStatus = text(input.downloadStatus) || null;
  const liveStatus = text(input.liveStatus) || null;
  const base = {
    facilityNumber,
    downloadStatus,
    liveStatus,
    publicationEligible: false as const,
    ownerClaimEligible: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
    activatedInApplicationOrDatabase: false as const,
  };

  if (!FACILITY_NUMBER.test(facilityNumber)) {
    return {
      ...base,
      classId: "invalid-or-mismatched-identity",
      eligibility: "invalid-id-ineligible",
      rationale:
        "Facility number is not an official 8–9 digit identifier. Fail-closed.",
      evidence: {
        source: input.source ?? null,
        httpStatus: input.httpStatus ?? null,
      },
    };
  }

  if (
    input.liveFacilityNumber
    && text(input.liveFacilityNumber) !== facilityNumber
  ) {
    return {
      ...base,
      classId: "invalid-or-mismatched-identity",
      eligibility: "invalid-id-ineligible",
      rationale:
        "FacilityDetail FACILITYNUMBER does not exactly match the requested official ID.",
      evidence: {
        requestedId: facilityNumber,
        liveFacilityNumber: input.liveFacilityNumber,
        source: input.source ?? null,
      },
    };
  }

  if (
    input.timedOut === true
    || input.httpStatus === 0
    || (input.httpStatus != null && input.httpStatus !== 200)
    || input.found === false
  ) {
    return {
      ...base,
      classId: "inconclusive-transport-or-server-error",
      eligibility: "unknown-ineligible",
      rationale:
        "FacilityDetail response was non-200, timed out, or not found. Keep unknown-ineligible; do not invent status.",
      evidence: {
        httpStatus: input.httpStatus ?? null,
        timedOut: input.timedOut === true,
        found: input.found ?? null,
        source: input.source ?? null,
        priorHttp500Evidence:
          input.source === "phase20-inconclusive-retry" ? true : undefined,
      },
    };
  }

  const download = upper(downloadStatus);
  const live = text(liveStatus);

  if (!downloadStatus || !liveStatus) {
    return {
      ...base,
      classId: "requires-cdss-clarification",
      eligibility: "unknown-ineligible",
      rationale:
        "Missing download or FacilityDetail status text; cannot classify without authoritative evidence.",
      evidence: { source: input.source ?? null },
    };
  }

  // Exact matches (may appear on re-probe if source changed).
  if (download === "LICENSED" && isExactLicensed(live)) {
    return {
      ...base,
      classId: "match-no-longer-discrepant",
      eligibility: "active-candidate",
      rationale:
        "Re-probe shows exact Licensed match. Recorded for ledger only; publication still gated by statewide blockers.",
      evidence: { source: input.source ?? null, note: "publicationEligible remains false" },
      publicationEligible: false,
      ownerClaimEligible: false,
    };
  }

  // Licensed/Pending Increase — licensed base with pending capacity-increase overlay.
  // Explainable timing/process difference relative to bulk LICENSED, but NOT an
  // approved publication mapping. Stay unknown-ineligible / fail-closed.
  if (download === "LICENSED" && isPendingIncrease(live)) {
    return {
      ...base,
      classId: "explainable-coarsening-or-timing",
      eligibility: "unknown-ineligible",
      rationale:
        "Download LICENSED vs FacilityDetail \"Licensed/Pending Increase\" is consistent with a licensed facility that has a pending capacity-increase process overlay. Treat as explainable timing/process difference for ledger purposes, but keep unknown-ineligible until a human-approved mapping exists. Do not invent Licensed≡Licensed/Pending Increase equivalence for publication.",
      evidence: {
        downloadStatus,
        liveStatus,
        source: input.source ?? null,
        mappingApprovedForPublication: false,
      },
    };
  }

  // Provisional License under Download LICENSED — genuine unresolved until CDSS mapping.
  if (download === "LICENSED" && isProvisional(live)) {
    return {
      ...base,
      classId: "genuine-unresolved-licensing-conflict",
      eligibility: "unknown-ineligible",
      rationale:
        "Download LICENSED vs FacilityDetail Provisional License is not an approved coarsening. Keep unknown-ineligible; may require CDSS clarification for a durable mapping.",
      evidence: {
        downloadStatus,
        liveStatus,
        source: input.source ?? null,
      },
    };
  }

  // Known prior pattern: LICENSED vs Pending Incomplete Application.
  if (download === "LICENSED" && isPendingIncomplete(live)) {
    return {
      ...base,
      classId: "genuine-unresolved-licensing-conflict",
      eligibility: "unknown-ineligible",
      rationale:
        "Download LICENSED vs FacilityDetail Pending Incomplete Application remains an unresolved conflict (same class as 502701867). Never treat as licensed for publication.",
      evidence: {
        downloadStatus,
        liveStatus,
        source: input.source ?? null,
        relatedControlId: "502701867",
      },
    };
  }

  if (download === "CLOSED" && isApplicationWithdrawn(live)) {
    return {
      ...base,
      classId: "closed-pending-or-withdrawn",
      eligibility: "withdrawn-ineligible",
      rationale:
        "CLOSED → Application Withdrawn is documented coarsening / withdrawn-ineligible.",
      evidence: { downloadStatus, liveStatus, source: input.source ?? null },
    };
  }

  if (download === "CLOSED" && isClosedStar(live)) {
    return {
      ...base,
      classId: "closed-pending-or-withdrawn",
      eligibility: "closed-ineligible",
      rationale: "CLOSED aligns with FacilityDetail Closed* status; closed-ineligible.",
      evidence: { downloadStatus, liveStatus, source: input.source ?? null },
    };
  }

  if (download === "PENDING" || /pending/i.test(live) || isApplicationWithdrawn(live)) {
    return {
      ...base,
      classId: "closed-pending-or-withdrawn",
      eligibility: "pending-ineligible",
      rationale:
        "Pending or withdrawn FacilityDetail/Download status is not a publication candidate.",
      evidence: { downloadStatus, liveStatus, source: input.source ?? null },
    };
  }

  // Fallback: unresolved conflict needing possible CDSS clarification.
  return {
    ...base,
    classId: "genuine-unresolved-licensing-conflict",
    eligibility: "unknown-ineligible",
    rationale:
      "Download vs FacilityDetail statuses disagree without an approved coarsening rule. Keep unknown-ineligible; escalate to CDSS clarification only if a durable official mapping is required.",
    evidence: {
      downloadStatus,
      liveStatus,
      source: input.source ?? null,
      requiresCdssClarificationCandidate: true,
    },
  };
}

export function summarizeCaliforniaPhase21Classifications(
  rows: readonly CaliforniaPhase21ConflictClassification[],
) {
  const byClass: Record<CaliforniaPhase21DiscrepancyClass, number> = {
    "explainable-coarsening-or-timing": 0,
    "genuine-unresolved-licensing-conflict": 0,
    "invalid-or-mismatched-identity": 0,
    "closed-pending-or-withdrawn": 0,
    "requires-cdss-clarification": 0,
    "inconclusive-transport-or-server-error": 0,
    "match-no-longer-discrepant": 0,
  };
  for (const row of rows) {
    byClass[row.classId] += 1;
  }
  return {
    total: rows.length,
    byClass,
    publicationEligibleCount: 0,
    activatedInApplicationOrDatabase: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
  };
}

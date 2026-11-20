/**
 * California Phase 22 — provisional-license conflict reassessment.
 * Preserves raw Download LICENSED vs FacilityDetail Provisional License.
 * Unknown-ineligible absent authoritative resolution. No statewide crawl.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE22_PROVISIONAL_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase22ProvisionalClass =
  | "genuine-unresolved-licensing-conflict"
  | "explainable-coarsening-or-timing"
  | "match-no-longer-discrepant"
  | "inconclusive-transport-or-server-error"
  | "invalid-or-mismatched-identity"
  | "requires-cdss-clarification";

export type CaliforniaPhase22ProvisionalAssessment = {
  facilityNumber: string;
  role: "provisional-conflict" | "prior-control";
  downloadStatus: string | null;
  liveStatus: string | null;
  classId: CaliforniaPhase22ProvisionalClass;
  eligibility: "unknown-ineligible";
  publicationEligible: false;
  ownerClaimEligible: false;
  altersAuthoritativeGovernmentRecords: false;
  activatedInApplicationOrDatabase: false;
  preservedRawPair: {
    downloadLicensed: boolean;
    facilityDetailStatus: string | null;
  };
  rationale: string;
  evidence: Record<string, unknown>;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isProvisional(live: string): boolean {
  return /^provisional\s+license$/i.test(live);
}

function isPendingIncrease(live: string): boolean {
  return /^licensed\s*\/\s*pending\s+increase$/i.test(live);
}

function isPendingIncomplete(live: string): boolean {
  return /pending\s+incomplete/i.test(live);
}

function isExactLicensed(live: string): boolean {
  return /^licensed$/i.test(live);
}

/**
 * Classify one provisional/control re-probe for the Phase 22 ledger.
 * Never marks uncertain records publication-eligible.
 */
export function assessCaliforniaPhase22ProvisionalConflict(input: {
  facilityNumber: string;
  role: "provisional-conflict" | "prior-control";
  downloadStatus?: string | null;
  liveStatus?: string | null;
  liveFacilityNumber?: string | null;
  httpStatus?: number | null;
  timedOut?: boolean;
  found?: boolean | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveFacilityType?: string | null;
  downloadFacilityType?: string | null;
  downloadCapacity?: string | null;
  phase21LiveStatus?: string | null;
}): CaliforniaPhase22ProvisionalAssessment {
  const facilityNumber = text(input.facilityNumber);
  const downloadStatus = text(input.downloadStatus) || null;
  const liveStatus = text(input.liveStatus) || null;
  const base = {
    facilityNumber,
    role: input.role,
    downloadStatus,
    liveStatus,
    eligibility: "unknown-ineligible" as const,
    publicationEligible: false as const,
    ownerClaimEligible: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
    activatedInApplicationOrDatabase: false as const,
    preservedRawPair: {
      downloadLicensed: (downloadStatus ?? "").toUpperCase() === "LICENSED",
      facilityDetailStatus: liveStatus,
    },
  };

  if (!/^\d{8,9}$/.test(facilityNumber)) {
    return {
      ...base,
      classId: "invalid-or-mismatched-identity",
      rationale:
        "Facility number is not an official 8–9 digit identifier. Fail-closed.",
      evidence: { httpStatus: input.httpStatus ?? null },
    };
  }

  if (
    input.liveFacilityNumber
    && text(input.liveFacilityNumber) !== facilityNumber
  ) {
    return {
      ...base,
      classId: "invalid-or-mismatched-identity",
      rationale:
        "FacilityDetail FACILITYNUMBER does not exactly match the requested official ID.",
      evidence: {
        requestedId: facilityNumber,
        liveFacilityNumber: input.liveFacilityNumber,
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
      rationale:
        "FacilityDetail response was non-200, timed out, or not found. Keep unknown-ineligible; do not invent status.",
      evidence: {
        httpStatus: input.httpStatus ?? null,
        timedOut: input.timedOut === true,
        found: input.found ?? null,
      },
    };
  }

  if (!downloadStatus || !liveStatus) {
    return {
      ...base,
      classId: "requires-cdss-clarification",
      rationale:
        "Missing download or FacilityDetail status text; cannot classify without authoritative evidence.",
      evidence: {},
    };
  }

  const download = downloadStatus.toUpperCase();

  if (download === "LICENSED" && isExactLicensed(liveStatus)) {
    return {
      ...base,
      classId: "match-no-longer-discrepant",
      rationale:
        "Re-probe shows exact Licensed match. Recorded for ledger only; publication still gated by statewide blockers; prior conflict history retained.",
      evidence: {
        phase21LiveStatus: input.phase21LiveStatus ?? null,
        note: "publicationEligible remains false",
      },
    };
  }

  if (download === "LICENSED" && isProvisional(liveStatus)) {
    return {
      ...base,
      classId: "genuine-unresolved-licensing-conflict",
      rationale:
        "Download LICENSED vs FacilityDetail Provisional License remains unresolved. Preserve raw pair; keep unknown-ineligible until human-approved mapping or CDSS clarification resolves the conflict. Do not invent Licensed≡Provisional License equivalence.",
      evidence: {
        downloadStatus,
        liveStatus,
        downloadLicenseFirstDate: input.downloadLicenseFirstDate ?? null,
        liveLicenseFirstDate: input.liveLicenseFirstDate ?? null,
        downloadFacilityType: input.downloadFacilityType ?? null,
        liveFacilityType: input.liveFacilityType ?? null,
        downloadCapacity: input.downloadCapacity ?? null,
        phase21LiveStatus: input.phase21LiveStatus ?? "Provisional License",
        phase22ConfirmsPhase21: true,
        mappingApprovedForPublication: false,
      },
    };
  }

  if (download === "LICENSED" && isPendingIncomplete(liveStatus)) {
    return {
      ...base,
      classId: "genuine-unresolved-licensing-conflict",
      rationale:
        "Download LICENSED vs FacilityDetail Pending Incomplete Application remains an unresolved conflict (control 502701867). Never treat as licensed for publication.",
      evidence: {
        downloadStatus,
        liveStatus,
        relatedControlId: "502701867",
        phase22ConfirmsPrior: true,
      },
    };
  }

  if (download === "LICENSED" && isPendingIncrease(liveStatus)) {
    return {
      ...base,
      classId: "explainable-coarsening-or-timing",
      rationale:
        "Download LICENSED vs FacilityDetail Licensed/Pending Increase is explainable timing/process overlay for ledger taxonomy only. Keep unknown-ineligible until a human-approved mapping exists.",
      evidence: {
        downloadStatus,
        liveStatus,
        mappingApprovedForPublication: false,
        phase22ConfirmsPrior: true,
      },
    };
  }

  return {
    ...base,
    classId: "genuine-unresolved-licensing-conflict",
    rationale:
      "Download vs FacilityDetail statuses disagree without an approved coarsening rule. Keep unknown-ineligible.",
    evidence: {
      downloadStatus,
      liveStatus,
      requiresCdssClarificationCandidate: true,
    },
  };
}

export function summarizeCaliforniaPhase22ProvisionalAssessments(
  rows: readonly CaliforniaPhase22ProvisionalAssessment[],
) {
  const byClass: Record<CaliforniaPhase22ProvisionalClass, number> = {
    "genuine-unresolved-licensing-conflict": 0,
    "explainable-coarsening-or-timing": 0,
    "match-no-longer-discrepant": 0,
    "inconclusive-transport-or-server-error": 0,
    "invalid-or-mismatched-identity": 0,
    "requires-cdss-clarification": 0,
  };
  let provisionalUnresolved = 0;
  let controlsUnresolved = 0;
  for (const row of rows) {
    byClass[row.classId] += 1;
    if (
      row.role === "provisional-conflict"
      && row.classId === "genuine-unresolved-licensing-conflict"
    ) {
      provisionalUnresolved += 1;
    }
    if (row.role === "prior-control") {
      controlsUnresolved += 1;
    }
  }
  return {
    total: rows.length,
    byClass,
    provisionalUnresolved,
    controlsAssessed: controlsUnresolved,
    publicationEligibleCount: 0 as const,
    activatedInApplicationOrDatabase: false as const,
    statewideCrawlRepeated: false as const,
  };
}

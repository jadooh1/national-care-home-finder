/**
 * California Phase 21 — machine-readable exception ledger.
 * Combines newly classified Phase 20 discrepancies with preserved prior
 * exceptions. Offline reporting only; exclusions not activated in app/DB.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE21_LEDGER_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase21LedgerEntry = {
  facilityNumber: string;
  category:
    | "licensing-discrepancy"
    | "inconclusive-facility-detail"
    | "missing-license-evidence"
    | "unverified-coordinates"
    | "invalid-identifier"
    | "withdrawn-regression-control"
    | "prior-known-status-conflict";
  classId: string;
  eligibility: string;
  publicationEligible: false;
  ownerClaimEligible: false;
  activatedInApplicationOrDatabase: false;
  altersAuthoritativeGovernmentRecords: false;
  evidence: Record<string, unknown>;
  preservedFromPriorPhase?: string;
};

export type CaliforniaPhase21DiscrepancyLike = {
  facilityNumber: string;
  classId: string;
  eligibility: string;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  rationale?: string;
  evidence?: Record<string, unknown>;
};

export type CaliforniaPhase21ExceptionLedger = {
  observedOn: string;
  title: string;
  adoption: {
    exclusionPolicyAdoptedForOfflineClassification: true;
    activatedInApplicationOrDatabase: false;
    altersAuthoritativeGovernmentRecords: false;
  };
  rosterDenominator: 15451;
  cumulativeVerifiedCount: 15451;
  statewideRosterVerificationComplete: true;
  statewideCoverageClaimed: true;
  entries: CaliforniaPhase21LedgerEntry[];
  summary: {
    totalEntries: number;
    byCategory: Record<string, number>;
    licensingDiscrepancyByClass: Record<string, number>;
    unresolvedCoordinateCount: number;
    missingLicenseEvidenceCount: number;
    inconclusiveCount: number;
    publicationEligibleCount: 0;
  };
  allowsPublication: false;
  gate: "blocked";
};

const PRIOR_STATUS_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

const MISSING_LICENSE_EVIDENCE_IDS = [
  "079201725", "502701889", "374605020", "342701856", "197610992", "342701894",
  "502701880", "198604006", "195850781", "107209715", "195850785", "197611051",
  "360951409", "198320716",
] as const;

const WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export function buildCaliforniaPhase21ExceptionLedger(input: {
  observedOn?: string;
  discrepancyClassifications: readonly CaliforniaPhase21DiscrepancyLike[];
  inconclusiveClassifications?: readonly CaliforniaPhase21DiscrepancyLike[];
}): CaliforniaPhase21ExceptionLedger {
  const entries: CaliforniaPhase21LedgerEntry[] = [];

  for (const row of input.discrepancyClassifications) {
    entries.push({
      facilityNumber: row.facilityNumber,
      category: "licensing-discrepancy",
      classId: row.classId,
      eligibility: row.eligibility,
      publicationEligible: false,
      ownerClaimEligible: false,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
      evidence: {
        downloadStatus: row.downloadStatus ?? null,
        liveStatus: row.liveStatus ?? null,
        rationale: row.rationale ?? null,
        ...(row.evidence ?? {}),
      },
    });
  }

  for (const row of input.inconclusiveClassifications ?? []) {
    entries.push({
      facilityNumber: row.facilityNumber,
      category: "inconclusive-facility-detail",
      classId: row.classId,
      eligibility: row.eligibility,
      publicationEligible: false,
      ownerClaimEligible: false,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
      evidence: {
        downloadStatus: row.downloadStatus ?? null,
        liveStatus: row.liveStatus ?? null,
        rationale: row.rationale ?? null,
        ...(row.evidence ?? {}),
      },
    });
  }

  for (const id of PRIOR_STATUS_CONFLICT_IDS) {
    entries.push({
      facilityNumber: id,
      category: "prior-known-status-conflict",
      classId: id === "502701867"
        ? "genuine-unresolved-licensing-conflict"
        : "explainable-coarsening-or-timing",
      eligibility: "unknown-ineligible",
      publicationEligible: false,
      ownerClaimEligible: false,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
      preservedFromPriorPhase: id === "502701867" ? "phase14-16" : "phase19",
      evidence: {
        note: id === "502701867"
          ? "Download LICENSED vs FacilityDetail Pending Incomplete Application"
          : "Download LICENSED vs FacilityDetail Licensed/Pending Increase (Phase 19)",
      },
    });
  }

  for (const id of MISSING_LICENSE_EVIDENCE_IDS) {
    entries.push({
      facilityNumber: id,
      category: "missing-license-evidence",
      classId: "missing-license-evidence",
      eligibility: "unknown-ineligible",
      publicationEligible: false,
      ownerClaimEligible: false,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
      preservedFromPriorPhase: "phase16-18",
      evidence: {
        downloadStatus: "LICENSED",
        licenseFirstDate: "",
        statewideCount: 14,
      },
    });
  }

  for (const id of WITHDRAWN_REGRESSION_IDS) {
    entries.push({
      facilityNumber: id,
      category: "withdrawn-regression-control",
      classId: "closed-pending-or-withdrawn",
      eligibility: "withdrawn-ineligible",
      publicationEligible: false,
      ownerClaimEligible: false,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
      preservedFromPriorPhase: "phase11-16",
      evidence: {
        note: "CLOSED→Application Withdrawn regression control",
      },
    });
  }

  entries.push({
    facilityNumber: "95354",
    category: "invalid-identifier",
    classId: "invalid-or-mismatched-identity",
    eligibility: "invalid-id-ineligible",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    preservedFromPriorPhase: "phase13",
    evidence: {
      note: "Non 8–9 digit control ID; generator refuse-closed",
    },
  });

  entries.push({
    facilityNumber: "(statewide-unresolved-coordinates)",
    category: "unverified-coordinates",
    classId: "unverified-coordinates",
    eligibility: "unknown-ineligible",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    preservedFromPriorPhase: "phase9-20",
    evidence: {
      unresolvedCoordinateCount: 28,
      scope: "feature-suppression-map",
      fabricatedCoordinates: 0,
      reprobeAllowed: false,
    },
  });

  const byCategory: Record<string, number> = {};
  const licensingDiscrepancyByClass: Record<string, number> = {};
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    if (e.category === "licensing-discrepancy") {
      licensingDiscrepancyByClass[e.classId] =
        (licensingDiscrepancyByClass[e.classId] ?? 0) + 1;
    }
  }

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE21_LEDGER_OBSERVED_ON,
    title: "California Phase 21 exception ledger (offline classification)",
    adoption: {
      exclusionPolicyAdoptedForOfflineClassification: true,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
    },
    rosterDenominator: 15451,
    cumulativeVerifiedCount: 15451,
    statewideRosterVerificationComplete: true,
    statewideCoverageClaimed: true,
    entries,
    summary: {
      totalEntries: entries.length,
      byCategory,
      licensingDiscrepancyByClass,
      unresolvedCoordinateCount: 28,
      missingLicenseEvidenceCount: MISSING_LICENSE_EVIDENCE_IDS.length,
      inconclusiveCount: (input.inconclusiveClassifications ?? []).length,
      publicationEligibleCount: 0,
    },
    allowsPublication: false,
    gate: "blocked",
  };
}

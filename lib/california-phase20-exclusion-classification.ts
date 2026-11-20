/**
 * California Phase 20 — offline exclusion classification using the Phase 18
 * adopted policy (same rules as Phase 19). Classification only — does NOT
 * activate exclusions in the application or database. Authoritative government
 * records stay unaltered. Fail-closed safeguards preserved. Gate stays BLOCKED.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE20_EXCLUSION_CLASSIFICATION_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase20ExclusionClassId =
  | "unverified-or-conflicting-status"
  | "invalid-or-mismatched-ids"
  | "missing-license-evidence"
  | "unverified-coordinates"
  | "bad-disclosure-links"
  | "closed-pending-withdrawn"
  | "none-clear-for-listing-if-otherwise-eligible";

export type CaliforniaPhase20ExclusionScope =
  | "complete-listing-exclusion"
  | "feature-suppression-map"
  | "feature-suppression-disclosure"
  | "feature-suppression-owner-claim";

export type CaliforniaPhase20OfflineExclusionFinding = {
  facilityNumber: string;
  classId: CaliforniaPhase20ExclusionClassId;
  scopes: readonly CaliforniaPhase20ExclusionScope[];
  rationale: string;
  evidence: Record<string, unknown>;
  publicationEligible: false;
  ownerClaimEligible: false;
  altersAuthoritativeGovernmentRecords: false;
  activatedInApplicationOrDatabase: false;
};

export type CaliforniaPhase20DisclosureLike = {
  facilityNumber: string;
  classification?: string | null;
  identifierRelation?: string | null;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  publicationCandidate?: boolean;
  liveFacilityNumber?: string | null;
  downloadLicenseFirstDate?: string | null;
};

export type CaliforniaPhase20StatusLike = {
  facilityNumber: string;
  relation?: string | null;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  eligibility?: string | null;
  regressionControl?: boolean;
};

export const CALIFORNIA_PHASE20_EXCLUSION_ADOPTION = {
  adoptedForOfflineClassification: true as const,
  activatedInApplicationOrDatabase: false as const,
  altersAuthoritativeGovernmentRecords: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  policySource: "lib/california-phase18-exclusion-policy.ts" as const,
  note:
    "Phase 20 applies the Phase 18 exclusion policy for offline classification only. Do not activate product-layer exclusions in app/DB without a separate activation decision. Preserve known licensing conflicts, invalid IDs, withdrawn apps, and 28 unresolved coords.",
} as const;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

const FACILITY_NUMBER = /^\d{8,9}$/;

export function classifyCaliforniaPhase20DisclosureExclusion(
  row: CaliforniaPhase20DisclosureLike,
): CaliforniaPhase20OfflineExclusionFinding[] {
  const facilityNumber = text(row.facilityNumber);
  const findings: CaliforniaPhase20OfflineExclusionFinding[] = [];
  const base = {
    facilityNumber,
    publicationEligible: false as const,
    ownerClaimEligible: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
    activatedInApplicationOrDatabase: false as const,
  };

  if (!FACILITY_NUMBER.test(facilityNumber) || row.classification === "invalid"
    || row.identifierRelation === "leading-zero-canonicalization"
    || row.identifierRelation === "mismatch") {
    findings.push({
      ...base,
      classId: "invalid-or-mismatched-ids",
      scopes: ["complete-listing-exclusion", "feature-suppression-disclosure"],
      rationale:
        "Invalid or mismatched facility identifier (non 8–9 digit, truncated, or non-exact match). Fail-closed.",
      evidence: {
        classification: row.classification ?? null,
        identifierRelation: row.identifierRelation ?? null,
        liveFacilityNumber: row.liveFacilityNumber ?? null,
      },
    });
  }

  if (
    row.classification === "missing"
    || row.classification === "ambiguous"
    || row.classification === "inconclusive"
    || row.classification === "invalid"
  ) {
    findings.push({
      ...base,
      classId: "bad-disclosure-links",
      scopes: ["feature-suppression-disclosure", "complete-listing-exclusion"],
      rationale:
        "Disclosure link not verified working for the exact official ID. Exclude disclosure (and listing until verified).",
      evidence: {
        classification: row.classification ?? null,
        identifierRelation: row.identifierRelation ?? null,
      },
    });
  }

  const downloadStatus = upper(row.downloadStatus);
  const liveStatus = upper(row.liveStatus);
  if (downloadStatus === "CLOSED" || downloadStatus === "PENDING"
    || liveStatus.includes("WITHDRAWN") || liveStatus.includes("DENIED")
    || liveStatus.includes("PENDING")) {
    findings.push({
      ...base,
      classId: "closed-pending-withdrawn",
      scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
      rationale:
        "Closed, pending, or withdrawn application status is not a publication candidate.",
      evidence: {
        downloadStatus: row.downloadStatus ?? null,
        liveStatus: row.liveStatus ?? null,
      },
    });
  }

  if (
    downloadStatus === "LICENSED"
    && text(row.downloadLicenseFirstDate) === ""
  ) {
    findings.push({
      ...base,
      classId: "missing-license-evidence",
      scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
      rationale:
        "Download LICENSED with empty License First Date — missing license evidence; keep unknown-ineligible.",
      evidence: {
        downloadStatus: row.downloadStatus ?? null,
        downloadLicenseFirstDate: row.downloadLicenseFirstDate ?? null,
      },
    });
  }

  if (downloadStatus && liveStatus) {
    const closedCoarseningOk =
      downloadStatus === "CLOSED"
      && (liveStatus === "CLOSED"
        || liveStatus.startsWith("CLOSED")
        || liveStatus.includes("WITHDRAWN"));
    const probationCoarseningOk =
      downloadStatus === "ON PROBATION"
      && (liveStatus.includes("PROBATION") || liveStatus.includes("PROBAT"));
    const licensedExactOk =
      downloadStatus === "LICENSED"
      && (liveStatus === "LICENSED" || liveStatus === "LICENSE");
    const licensedConflict =
      downloadStatus === "LICENSED"
      && liveStatus.startsWith("LICENSED")
      && liveStatus !== "LICENSED";
    const pendingOk =
      downloadStatus === "PENDING" && liveStatus.includes("PENDING");

    if (
      !closedCoarseningOk
      && !probationCoarseningOk
      && !licensedExactOk
      && !pendingOk
      && (licensedConflict || downloadStatus !== liveStatus)
    ) {
      findings.push({
        ...base,
        classId: "unverified-or-conflicting-status",
        scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
        rationale:
          "Download vs FacilityDetail status inconsistency; keep unknown-ineligible until resolved.",
        evidence: {
          downloadStatus: row.downloadStatus ?? null,
          liveStatus: row.liveStatus ?? null,
        },
      });
    }
  }

  return findings;
}

export function classifyCaliforniaPhase20StatusExclusion(
  row: CaliforniaPhase20StatusLike,
): CaliforniaPhase20OfflineExclusionFinding[] {
  const facilityNumber = text(row.facilityNumber);
  const findings: CaliforniaPhase20OfflineExclusionFinding[] = [];
  const base = {
    facilityNumber,
    publicationEligible: false as const,
    ownerClaimEligible: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
    activatedInApplicationOrDatabase: false as const,
  };

  if (row.relation === "conflict" || row.eligibility === "unknown-ineligible") {
    findings.push({
      ...base,
      classId: "unverified-or-conflicting-status",
      scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
      rationale:
        "Status conflict or unknown-ineligible eligibility from FacilityDetail mapping.",
      evidence: {
        relation: row.relation ?? null,
        eligibility: row.eligibility ?? null,
        downloadStatus: row.downloadStatus ?? null,
        liveStatus: row.liveStatus ?? null,
      },
    });
  }

  if (row.relation === "documented-coarsening"
    || upper(row.liveStatus).includes("WITHDRAWN")
    || upper(row.downloadStatus) === "CLOSED"
    || upper(row.downloadStatus) === "PENDING") {
    findings.push({
      ...base,
      classId: "closed-pending-withdrawn",
      scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
      rationale:
        "Closed/pending/withdrawn (including documented CLOSED→Application Withdrawn coarsening).",
      evidence: {
        relation: row.relation ?? null,
        downloadStatus: row.downloadStatus ?? null,
        liveStatus: row.liveStatus ?? null,
        regressionControl: row.regressionControl === true,
      },
    });
  }

  if (row.relation === "invalid-id") {
    findings.push({
      ...base,
      classId: "invalid-or-mismatched-ids",
      scopes: ["complete-listing-exclusion", "feature-suppression-disclosure"],
      rationale: "Invalid facility identifier in status sample.",
      evidence: { relation: row.relation ?? null },
    });
  }

  return findings;
}

export function classifyCaliforniaPhase20CoordinateExclusions(
  unresolvedCoordinateCount: number = 28,
): CaliforniaPhase20OfflineExclusionFinding {
  return {
    facilityNumber: "(statewide-unresolved-coordinates)",
    classId: "unverified-coordinates",
    scopes: ["feature-suppression-map"],
    rationale:
      `${unresolvedCoordinateCount} publication candidates lack verified official coordinates; suppress map pins only. Do not fabricate or re-probe without new authoritative evidence.`,
    evidence: {
      unresolvedCoordinateCount,
      fabricatedCoordinates: 0,
      reprobeAllowed: false,
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activatedInApplicationOrDatabase: false,
  };
}

export type CaliforniaPhase20ExclusionClassificationSummary = {
  observedOn: string;
  adoption: typeof CALIFORNIA_PHASE20_EXCLUSION_ADOPTION;
  totalFindings: number;
  byClass: Record<CaliforniaPhase20ExclusionClassId, number>;
  uniqueFacilitiesWithFindings: number;
  workingDisclosureWithoutExclusionSignal: number;
  activatedInApplicationOrDatabase: false;
  altersAuthoritativeGovernmentRecords: false;
  allowsPublication: false;
  gate: "blocked";
  findings: CaliforniaPhase20OfflineExclusionFinding[];
};

export function summarizeCaliforniaPhase20ExclusionClassification(input: {
  observedOn?: string;
  disclosureRows?: readonly CaliforniaPhase20DisclosureLike[];
  statusRows?: readonly CaliforniaPhase20StatusLike[];
  unresolvedCoordinateCount?: number;
  includeCoordinateClass?: boolean;
}): CaliforniaPhase20ExclusionClassificationSummary {
  const findings: CaliforniaPhase20OfflineExclusionFinding[] = [];
  for (const row of input.disclosureRows ?? []) {
    findings.push(...classifyCaliforniaPhase20DisclosureExclusion(row));
  }
  for (const row of input.statusRows ?? []) {
    findings.push(...classifyCaliforniaPhase20StatusExclusion(row));
  }
  if (input.includeCoordinateClass !== false) {
    findings.push(
      classifyCaliforniaPhase20CoordinateExclusions(input.unresolvedCoordinateCount ?? 28),
    );
  }

  const byClass: Record<CaliforniaPhase20ExclusionClassId, number> = {
    "unverified-or-conflicting-status": 0,
    "invalid-or-mismatched-ids": 0,
    "missing-license-evidence": 0,
    "unverified-coordinates": 0,
    "bad-disclosure-links": 0,
    "closed-pending-withdrawn": 0,
    "none-clear-for-listing-if-otherwise-eligible": 0,
  };
  for (const finding of findings) {
    byClass[finding.classId] += 1;
  }

  const facilitiesWithFindings = new Set(
    findings
      .filter(f => f.classId !== "none-clear-for-listing-if-otherwise-eligible")
      .map(f => f.facilityNumber),
  );

  let workingDisclosureWithoutExclusionSignal = 0;
  for (const row of input.disclosureRows ?? []) {
    const id = text(row.facilityNumber);
    if (row.classification !== "working") continue;
    const rowFindings = classifyCaliforniaPhase20DisclosureExclusion(row);
    const statusHits = (input.statusRows ?? [])
      .filter(s => text(s.facilityNumber) === id)
      .flatMap(s => classifyCaliforniaPhase20StatusExclusion(s));
    const substantive = [...rowFindings, ...statusHits].filter(
      f => f.classId !== "none-clear-for-listing-if-otherwise-eligible",
    );
    if (substantive.length === 0) {
      workingDisclosureWithoutExclusionSignal += 1;
      findings.push({
        facilityNumber: id,
        classId: "none-clear-for-listing-if-otherwise-eligible",
        scopes: ["feature-suppression-owner-claim"],
        rationale:
          "Working disclosure with no offline exclusion signal in this pass — still not a publication unlock (gate BLOCKED).",
        evidence: {
          classification: row.classification,
          downloadStatus: row.downloadStatus ?? null,
          liveStatus: row.liveStatus ?? null,
        },
        publicationEligible: false,
        ownerClaimEligible: false,
        altersAuthoritativeGovernmentRecords: false,
        activatedInApplicationOrDatabase: false,
      });
      byClass["none-clear-for-listing-if-otherwise-eligible"] += 1;
    }
  }

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE20_EXCLUSION_CLASSIFICATION_OBSERVED_ON,
    adoption: CALIFORNIA_PHASE20_EXCLUSION_ADOPTION,
    totalFindings: findings.length,
    byClass,
    uniqueFacilitiesWithFindings: facilitiesWithFindings.size,
    workingDisclosureWithoutExclusionSignal,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    allowsPublication: false,
    gate: "blocked",
    findings,
  };
}

export function californiaPhase20ExclusionActivatedInAppOrDb(): false {
  return false;
}

export function californiaPhase20ExclusionAltersGovernmentRecords(): false {
  return false;
}

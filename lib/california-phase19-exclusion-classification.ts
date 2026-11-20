/**
 * California Phase 19 — offline exclusion classification using the Phase 18
 * adopted policy. Classification only — does NOT activate exclusions in the
 * application or database. Authoritative government records stay unaltered.
 * Fail-closed safeguards preserved. Gate stays BLOCKED.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE19_EXCLUSION_CLASSIFICATION_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase19ExclusionClassId =
  | "unverified-or-conflicting-status"
  | "invalid-or-mismatched-ids"
  | "missing-license-evidence"
  | "unverified-coordinates"
  | "bad-disclosure-links"
  | "closed-pending-withdrawn"
  | "none-clear-for-listing-if-otherwise-eligible";

export type CaliforniaPhase19ExclusionScope =
  | "complete-listing-exclusion"
  | "feature-suppression-map"
  | "feature-suppression-disclosure"
  | "feature-suppression-owner-claim";

export type CaliforniaPhase19OfflineExclusionFinding = {
  facilityNumber: string;
  classId: CaliforniaPhase19ExclusionClassId;
  scopes: readonly CaliforniaPhase19ExclusionScope[];
  rationale: string;
  evidence: Record<string, unknown>;
  publicationEligible: false;
  ownerClaimEligible: false;
  altersAuthoritativeGovernmentRecords: false;
  activatedInApplicationOrDatabase: false;
};

export type CaliforniaPhase19DisclosureLike = {
  facilityNumber: string;
  classification?: string | null;
  identifierRelation?: string | null;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  publicationCandidate?: boolean;
  liveFacilityNumber?: string | null;
  downloadLicenseFirstDate?: string | null;
};

export type CaliforniaPhase19StatusLike = {
  facilityNumber: string;
  relation?: string | null;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  eligibility?: string | null;
  regressionControl?: boolean;
};

export const CALIFORNIA_PHASE19_EXCLUSION_ADOPTION = {
  adoptedForOfflineClassification: true as const,
  activatedInApplicationOrDatabase: false as const,
  altersAuthoritativeGovernmentRecords: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  policySource: "lib/california-phase18-exclusion-policy.ts" as const,
  note:
    "Phase 19 applies the Phase 18 exclusion policy for offline classification only. Do not activate product-layer exclusions in app/DB without a separate activation decision.",
} as const;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

const FACILITY_NUMBER = /^\d{8,9}$/;

/**
 * Classify one disclosure-audit row under the adopted Phase 18 policy.
 * Multiple findings may apply; caller may also call status classifiers.
 */
export function classifyCaliforniaPhase19DisclosureExclusion(
  row: CaliforniaPhase19DisclosureLike,
): CaliforniaPhase19OfflineExclusionFinding[] {
  const facilityNumber = text(row.facilityNumber);
  const findings: CaliforniaPhase19OfflineExclusionFinding[] = [];
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
    // Licensed/Pending Increase and other Licensed/* variants are conflicts
    // under Phase 13 mapping (unknown-ineligible) — not exact licensed match.
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
          "Download vs FacilityDetail status inconsistency observed in pilot; keep unknown-ineligible until resolved.",
        evidence: {
          downloadStatus: row.downloadStatus ?? null,
          liveStatus: row.liveStatus ?? null,
        },
      });
    }
  }

  return findings;
}

export function classifyCaliforniaPhase19StatusExclusion(
  row: CaliforniaPhase19StatusLike,
): CaliforniaPhase19OfflineExclusionFinding[] {
  const facilityNumber = text(row.facilityNumber);
  const findings: CaliforniaPhase19OfflineExclusionFinding[] = [];
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

/** Known statewide unresolved-coordinate facility map suppression (count=28). */
export function classifyCaliforniaPhase19CoordinateExclusions(
  unresolvedCoordinateCount: number = 28,
): CaliforniaPhase19OfflineExclusionFinding {
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

export type CaliforniaPhase19ExclusionClassificationSummary = {
  observedOn: string;
  adoption: typeof CALIFORNIA_PHASE19_EXCLUSION_ADOPTION;
  totalFindings: number;
  byClass: Record<CaliforniaPhase19ExclusionClassId, number>;
  uniqueFacilitiesWithFindings: number;
  workingDisclosureWithoutExclusionSignal: number;
  findings: CaliforniaPhase19OfflineExclusionFinding[];
  activatedInApplicationOrDatabase: false;
  altersAuthoritativeGovernmentRecords: false;
  allowsPublication: false;
  gate: "blocked";
};

export function summarizeCaliforniaPhase19ExclusionClassification(input: {
  observedOn?: string;
  disclosureRows?: readonly CaliforniaPhase19DisclosureLike[];
  statusRows?: readonly CaliforniaPhase19StatusLike[];
  unresolvedCoordinateCount?: number;
  includeCoordinateClass?: boolean;
}): CaliforniaPhase19ExclusionClassificationSummary {
  const findings: CaliforniaPhase19OfflineExclusionFinding[] = [];
  for (const row of input.disclosureRows ?? []) {
    findings.push(...classifyCaliforniaPhase19DisclosureExclusion(row));
  }
  for (const row of input.statusRows ?? []) {
    findings.push(...classifyCaliforniaPhase19StatusExclusion(row));
  }
  if (input.includeCoordinateClass !== false) {
    findings.push(
      classifyCaliforniaPhase19CoordinateExclusions(
        input.unresolvedCoordinateCount ?? 28,
      ),
    );
  }

  const byClass: Record<CaliforniaPhase19ExclusionClassId, number> = {
    "unverified-or-conflicting-status": 0,
    "invalid-or-mismatched-ids": 0,
    "missing-license-evidence": 0,
    "unverified-coordinates": 0,
    "bad-disclosure-links": 0,
    "closed-pending-withdrawn": 0,
    "none-clear-for-listing-if-otherwise-eligible": 0,
  };
  for (const f of findings) {
    byClass[f.classId] += 1;
  }

  const facilityIds = new Set(
    findings
      .map(f => f.facilityNumber)
      .filter(id => id && !id.startsWith("(")),
  );

  const workingClear = (input.disclosureRows ?? []).filter(row => {
    if (row.classification !== "working") return false;
    const hits = classifyCaliforniaPhase19DisclosureExclusion(row);
    return hits.length === 0;
  }).length;

  byClass["none-clear-for-listing-if-otherwise-eligible"] = workingClear;

  return {
    observedOn: input.observedOn
      ?? CALIFORNIA_PHASE19_EXCLUSION_CLASSIFICATION_OBSERVED_ON,
    adoption: CALIFORNIA_PHASE19_EXCLUSION_ADOPTION,
    totalFindings: findings.length,
    byClass,
    uniqueFacilitiesWithFindings: facilityIds.size,
    workingDisclosureWithoutExclusionSignal: workingClear,
    findings,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    allowsPublication: false,
    gate: "blocked",
  };
}

export function californiaPhase19ExclusionActivatedInAppOrDb(): false {
  return false;
}

export function californiaPhase19ExclusionAltersGovernmentRecords(): false {
  return false;
}

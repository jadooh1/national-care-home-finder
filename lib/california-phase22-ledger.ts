/**
 * California Phase 22 — machine-readable launch-blocker evidence ledger.
 * Offline reporting only; exclusions not activated in app/DB.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE22_LEDGER_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase22LedgerEntry = {
  id: string;
  category:
    | "freshness-blocker"
    | "cdss-correspondence"
    | "exclusion-policy"
    | "unique-id-capacity-case"
    | "provisional-license-conflict"
    | "prior-control"
    | "facility-exception-preserved"
    | "statewide-prerequisite";
  classId: string;
  eligibility: string;
  publicationEligible: false;
  ownerClaimEligible: false;
  activatedInApplicationOrDatabase: false;
  altersAuthoritativeGovernmentRecords: false;
  evidence: Record<string, unknown>;
  actionLane:
    | "development-only"
    | "requires-later-human-approval"
    | "blocked-awaiting-external"
    | "none-preserved";
};

export type CaliforniaPhase22ProvisionalLike = {
  facilityNumber: string;
  role: "provisional-conflict" | "prior-control";
  classId: string;
  eligibility: string;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  rationale?: string;
  preservedRawPair?: {
    downloadLicensed: boolean;
    facilityDetailStatus: string | null;
  };
  evidence?: Record<string, unknown>;
};

export type CaliforniaPhase22PolicyCaseLike = {
  id: string;
  area: string;
  title: string;
  evidence: string;
  recommendation: string;
  decision: string;
  unresolvedForLaunch: boolean;
  exampleIds?: readonly string[];
  count?: number | null;
};

export type CaliforniaPhase22LaunchBlockerLedger = {
  observedOn: string;
  title: string;
  adoption: {
    exclusionPolicyAdoptedForOfflineClassification: true;
    activatedInApplicationOrDatabase: false;
    altersAuthoritativeGovernmentRecords: false;
  };
  baselinePreserved: {
    officialRecords: 24377;
    publicationCandidates: 15451;
    verifiedOfficialCoords: 15423;
    unresolvedCoords: 28;
    cumulativeDisclosureVerified: 15451;
    statewideLicensedMissingDate: 14;
    missingCapacitiesOnExcluded: 21;
    fabricatedCoords: 0;
    inventedCapacities: 0;
  };
  entries: CaliforniaPhase22LedgerEntry[];
  summary: {
    totalEntries: number;
    byCategory: Record<string, number>;
    provisionalUnresolved: number;
    policyCasesUnresolvedForLaunch: number;
    publicationEligibleCount: 0;
  };
  allowsPublication: false;
  gate: "blocked";
  stopGo: "STOP";
};

export function buildCaliforniaPhase22LaunchBlockerLedger(input: {
  observedOn?: string;
  provisionalAssessments: readonly CaliforniaPhase22ProvisionalLike[];
  policyCases: readonly CaliforniaPhase22PolicyCaseLike[];
}): CaliforniaPhase22LaunchBlockerLedger {
  const entries: CaliforniaPhase22LedgerEntry[] = [];

  entries.push({
    id: "authoritative-iso-export-date",
    category: "freshness-blocker",
    classId: "absent-authoritative-iso",
    eligibility: "statewide-blocked",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "blocked-awaiting-external",
    evidence: {
      authoritativeIsoExportDate: null,
      filenameIsoCandidateRejected: "2026-11-15",
      weeklyFaqPolicyOnly: true,
      downloadSha256MatchesBaseline: true,
      globalBlockerUnchanged: true,
    },
  });

  entries.push({
    id: "cdss-clarification-reply",
    category: "cdss-correspondence",
    classId: "sent-awaiting-response",
    eligibility: "statewide-blocked",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "blocked-awaiting-external",
    evidence: {
      mailboxCheckAvailable: false,
      duplicateInquirySent: false,
      duplicateInquiryAllowed: false,
    },
  });

  entries.push({
    id: "exclusion-policy-not-activated",
    category: "exclusion-policy",
    classId: "adopted-offline-not-activated",
    eligibility: "statewide-blocked",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "requires-later-human-approval",
    evidence: {
      adoptedForOfflineClassification: true,
      activatedInApplicationOrDatabase: false,
    },
  });

  entries.push({
    id: "source-licensing-terms",
    category: "statewide-prerequisite",
    classId: "source-licensing-unconfirmed",
    eligibility: "statewide-blocked",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "requires-later-human-approval",
    evidence: {
      note: "Human must confirm source licensing/terms before publication.",
    },
  });

  entries.push({
    id: "qa-signoff",
    category: "statewide-prerequisite",
    classId: "human-qa-pending",
    eligibility: "statewide-blocked",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "requires-later-human-approval",
    evidence: {
      note: "Automated suites do not substitute for human launch QA sign-off.",
    },
  });

  for (const c of input.policyCases) {
    entries.push({
      id: c.id,
      category: "unique-id-capacity-case",
      classId: c.decision,
      eligibility: c.unresolvedForLaunch
        ? "policy-bound-unresolved"
        : "documented-pass-or-excluded",
      publicationEligible: false,
      ownerClaimEligible: false,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
      actionLane: c.unresolvedForLaunch
        ? "requires-later-human-approval"
        : "development-only",
      evidence: {
        area: c.area,
        title: c.title,
        evidence: c.evidence,
        recommendation: c.recommendation,
        exampleIds: c.exampleIds ?? [],
        count: c.count ?? null,
      },
    });
  }

  let provisionalUnresolved = 0;
  for (const row of input.provisionalAssessments) {
    if (row.role === "provisional-conflict") {
      if (row.classId === "genuine-unresolved-licensing-conflict") {
        provisionalUnresolved += 1;
      }
      entries.push({
        id: `provisional-${row.facilityNumber}`,
        category: "provisional-license-conflict",
        classId: row.classId,
        eligibility: row.eligibility,
        publicationEligible: false,
        ownerClaimEligible: false,
        activatedInApplicationOrDatabase: false,
        altersAuthoritativeGovernmentRecords: false,
        actionLane: "requires-later-human-approval",
        evidence: {
          downloadStatus: row.downloadStatus ?? null,
          liveStatus: row.liveStatus ?? null,
          preservedRawPair: row.preservedRawPair ?? null,
          rationale: row.rationale ?? null,
          ...(row.evidence ?? {}),
        },
      });
    } else {
      entries.push({
        id: `control-${row.facilityNumber}`,
        category: "prior-control",
        classId: row.classId,
        eligibility: row.eligibility,
        publicationEligible: false,
        ownerClaimEligible: false,
        activatedInApplicationOrDatabase: false,
        altersAuthoritativeGovernmentRecords: false,
        actionLane: "none-preserved",
        evidence: {
          downloadStatus: row.downloadStatus ?? null,
          liveStatus: row.liveStatus ?? null,
          preservedRawPair: row.preservedRawPair ?? null,
          rationale: row.rationale ?? null,
          ...(row.evidence ?? {}),
        },
      });
    }
  }

  entries.push({
    id: "fourteen-licensed-missing-date",
    category: "facility-exception-preserved",
    classId: "missing-license-evidence",
    eligibility: "unknown-ineligible",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "requires-later-human-approval",
    evidence: { statewideCount: 14, preservedFrom: "phase16-21" },
  });

  entries.push({
    id: "twenty-eight-unresolved-coordinates",
    category: "facility-exception-preserved",
    classId: "unverified-coordinates",
    eligibility: "unknown-ineligible",
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    actionLane: "requires-later-human-approval",
    evidence: {
      unresolvedCoordinateCount: 28,
      fabricatedCoordinates: 0,
      reprobeAllowed: false,
    },
  });

  const byCategory: Record<string, number> = {};
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
  }

  const policyCasesUnresolvedForLaunch = input.policyCases.filter(
    c => c.unresolvedForLaunch,
  ).length;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE22_LEDGER_OBSERVED_ON,
    title: "California Phase 22 launch-blocker evidence ledger",
    adoption: {
      exclusionPolicyAdoptedForOfflineClassification: true,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
    },
    baselinePreserved: {
      officialRecords: 24377,
      publicationCandidates: 15451,
      verifiedOfficialCoords: 15423,
      unresolvedCoords: 28,
      cumulativeDisclosureVerified: 15451,
      statewideLicensedMissingDate: 14,
      missingCapacitiesOnExcluded: 21,
      fabricatedCoords: 0,
      inventedCapacities: 0,
    },
    entries,
    summary: {
      totalEntries: entries.length,
      byCategory,
      provisionalUnresolved,
      policyCasesUnresolvedForLaunch,
      publicationEligibleCount: 0,
    },
    allowsPublication: false,
    gate: "blocked",
    stopGo: "STOP",
  };
}

/**
 * California Phase 17 — evaluate Phase 16 exception-detection results for
 * genuine eligibility risk. Preserves fail-closed safeguards. Does not reopen
 * unsuccessful coordinate investigations without new evidence.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE17_EXCEPTIONS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE17_STATEWIDE_LICENSED_MISSING_DATE_IDS = [
  "502701889",
  "198320716",
  "195850785",
  "079201725",
  "197610992",
  "374605020",
  "107209715",
  "195850781",
  "197611051",
  "502701880",
  "360951409",
  "342701894",
  "342701856",
  "198604006",
] as const;

export const CALIFORNIA_PHASE17_SAMPLED_STATUS_CONFLICT_IDS = [
  "342700333",
  "496803751",
  "335530163",
  "496802077",
  "342701152",
  "515002949",
  "486804268",
] as const;

export const CALIFORNIA_PHASE17_SAMPLED_LICENSED_MISSING_DATE_IDS = [
  "107209715",
  "195850781",
  "198320716",
  "195850785",
] as const;

export const CALIFORNIA_PHASE17_REGRESSION = {
  statusConflictUnknownIneligible: "502701867",
  invalidIdRefuseClosed: "95354",
  canonicalLeadingZero: "015601219",
  truncatedLeadingZeroRequest: "15601219",
  withdrawnIds: [
    "306006749",
    "306006799",
    "405802282",
    "374604911",
    "019201529",
  ] as const,
  unresolvedCoordsBaseline: 28,
} as const;

export type CaliforniaPhase17ExceptionRiskClass =
  | "genuine-eligibility-risk-exclude"
  | "safeguard-control-preserve"
  | "documented-coarsening-ineligible"
  | "not-statewide-sample-only";

export type CaliforniaPhase17ExceptionRiskRow = {
  id: string;
  sourcePhase: "phase16";
  scope: "statewide-check" | "sampled" | "regression-control";
  exceptionClass: string;
  facilityNumbers: readonly string[];
  count: number;
  riskClass: CaliforniaPhase17ExceptionRiskClass;
  genuineEligibilityRisk: boolean;
  publicationEligible: false;
  ownerClaimEligible: false;
  preventsStatewidePublicationAlone: boolean;
  canExcludeFacilities: boolean;
  preserveFailClosed: boolean;
  rationale: string;
};

export const CALIFORNIA_PHASE17_EXCEPTION_RISK_ROWS: readonly CaliforniaPhase17ExceptionRiskRow[] = [
  {
    id: "statewide-licensed-missing-initial-date",
    sourcePhase: "phase16",
    scope: "statewide-check",
    exceptionClass: "licensed-missing-initial-date",
    facilityNumbers: CALIFORNIA_PHASE17_STATEWIDE_LICENSED_MISSING_DATE_IDS,
    count: 14,
    riskClass: "genuine-eligibility-risk-exclude",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "Download LICENSED with empty License First Date is a genuine eligibility risk (possible never-licensed / mislabeled). Keep unknown-ineligible; exclude from publication candidates. FAQ \"No date on file\" confirms dates may be unavailable — does not authorize publication.",
  },
  {
    id: "sampled-status-conflicts",
    sourcePhase: "phase16",
    scope: "sampled",
    exceptionClass: "status-conflict",
    facilityNumbers: CALIFORNIA_PHASE17_SAMPLED_STATUS_CONFLICT_IDS,
    count: 7,
    riskClass: "genuine-eligibility-risk-exclude",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "ON PROBATION vs Probationary License (and similar) label disagreements are genuine conflicts until CDSS-authoritative mapping exists. Do not invent equivalence. Exclude affected facilities. Sample only — not a statewide conflict rate.",
  },
  {
    id: "sampled-licensed-missing-initial-date",
    sourcePhase: "phase16",
    scope: "sampled",
    exceptionClass: "licensed-missing-initial-date",
    facilityNumbers: CALIFORNIA_PHASE17_SAMPLED_LICENSED_MISSING_DATE_IDS,
    count: 4,
    riskClass: "genuine-eligibility-risk-exclude",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "Overlaps statewide LICENSED-missing-date set; reinforces exclude-until-dated policy. Not a new statewide count beyond the 14.",
  },
  {
    id: "sampled-withdrawn-controls",
    sourcePhase: "phase16",
    scope: "sampled",
    exceptionClass: "withdrawn-ineligible-control",
    facilityNumbers: [
      "374604709",
      "345920131",
      "198320662",
      "374604898",
      "095002858",
      "107209426",
    ],
    count: 6,
    riskClass: "documented-coarsening-ineligible",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "Documented CLOSED→Application Withdrawn coarsening remains withdrawn-ineligible. Safeguard, not a new mapping invention.",
  },
  {
    id: "sampled-invalid-id-95354",
    sourcePhase: "phase16",
    scope: "sampled",
    exceptionClass: "facility-id-malformed",
    facilityNumbers: ["95354"],
    count: 1,
    riskClass: "safeguard-control-preserve",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale: "Invalid non 8–9 digit ID; refuse-closed; already in exception-documented-exclude bucket.",
  },
  {
    id: "regression-502701867",
    sourcePhase: "phase16",
    scope: "regression-control",
    exceptionClass: "status-conflict + licensed-missing-initial-date",
    facilityNumbers: [CALIFORNIA_PHASE17_REGRESSION.statusConflictUnknownIneligible],
    count: 1,
    riskClass: "safeguard-control-preserve",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "Individual facility exception; unknown-ineligible / unpublishable / unclaimable. Not a separate statewide blocker beyond roster status verification.",
  },
  {
    id: "regression-leading-zeros",
    sourcePhase: "phase16",
    scope: "regression-control",
    exceptionClass: "facility-id-lost-leading-zeros",
    facilityNumbers: [
      CALIFORNIA_PHASE17_REGRESSION.truncatedLeadingZeroRequest,
      CALIFORNIA_PHASE17_REGRESSION.canonicalLeadingZero,
    ],
    count: 2,
    riskClass: "safeguard-control-preserve",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "Publish only exact official ID 015601219; truncated 15601219 remains non-canonical.",
  },
  {
    id: "regression-withdrawn-five",
    sourcePhase: "phase16",
    scope: "regression-control",
    exceptionClass: "withdrawn-ineligible-control",
    facilityNumbers: CALIFORNIA_PHASE17_REGRESSION.withdrawnIds,
    count: 5,
    riskClass: "safeguard-control-preserve",
    genuineEligibilityRisk: true,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale: "Five CLOSED→Application Withdrawn controls remain withdrawn-ineligible.",
  },
  {
    id: "unresolved-coordinates-28",
    sourcePhase: "phase16",
    scope: "regression-control",
    exceptionClass: "unresolved-coordinates",
    facilityNumbers: [],
    count: 28,
    riskClass: "genuine-eligibility-risk-exclude",
    genuineEligibilityRisk: false,
    publicationEligible: false,
    ownerClaimEligible: false,
    preventsStatewidePublicationAlone: false,
    canExcludeFacilities: true,
    preserveFailClosed: true,
    rationale:
      "Map completeness gap, not a licensing-status risk. Exclude from map publication; do not fabricate; do not re-probe without new authoritative evidence.",
  },
] as const;

export function californiaPhase17AllowsCoordinateFabrication(): false {
  return false;
}

export function californiaPhase17ShouldReprobeUnresolvedCoordinates(
  hasNewAuthoritativeEvidence: boolean,
): boolean {
  return hasNewAuthoritativeEvidence === true;
}

export function californiaPhase17ConflictFacilityAllowsPublication(): false {
  return false;
}

export function californiaPhase17ConflictFacilityAllowsOwnerClaim(): false {
  return false;
}

export function summarizeCaliforniaPhase17ExceptionRisks() {
  const genuine = CALIFORNIA_PHASE17_EXCEPTION_RISK_ROWS.filter(
    row => row.genuineEligibilityRisk,
  );
  return {
    observedOn: CALIFORNIA_PHASE17_EXCEPTIONS_OBSERVED_ON,
    phase16SampledFindings: 21,
    phase16StatewideLicensedMissingDate: 14,
    genuineEligibilityRiskRows: genuine.map(r => r.id),
    facilityExcludable: CALIFORNIA_PHASE17_EXCEPTION_RISK_ROWS.filter(
      r => r.canExcludeFacilities,
    ).map(r => r.id),
    statewidePublicationBlockersFromExceptionsAlone: CALIFORNIA_PHASE17_EXCEPTION_RISK_ROWS.filter(
      r => r.preventsStatewidePublicationAlone,
    ).map(r => r.id),
    preservesFailClosed: true as const,
    avoidsRepeatingUnsuccessfulCoordChecks: true as const,
    allowsFabrication: false as const,
    publicationEligibleAnyExceptionRow: false as const,
    ownerClaimEligibleAnyExceptionRow: false as const,
    rows: CALIFORNIA_PHASE17_EXCEPTION_RISK_ROWS,
    notes: [
      "None of the Phase 16 exception classes alone is a statewide publication blocker if affected facilities are excluded under a human-approved exclusion policy.",
      "Roster-wide status/disclosure verification gaps remain separate statewide blockers.",
      "Uncertain records stay ineligible until authoritative evidence supports another class.",
    ],
  };
}

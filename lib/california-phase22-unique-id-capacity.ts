/**
 * California Phase 22 — policy-bound unique-ID / capacity / facility-type review.
 * Uses official roster + Phase 20/21 evidence. Fail-closed recommendations.
 * Does not alter government fields, product, or database.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE22_UNIQUE_ID_CAPACITY_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase22CaseDecision =
  | "fail-closed-exclude"
  | "fail-closed-preserve-leading-zero"
  | "fail-closed-refuse-invalid-id"
  | "pass-preserved-no-action"
  | "policy-bound-awaiting-activation";

export type CaliforniaPhase22PolicyCase = {
  id: string;
  area:
    | "unique-ids"
    | "duplicates"
    | "leading-zeros"
    | "capacity"
    | "facility-type"
    | "coordinates";
  title: string;
  evidence: string;
  exampleIds?: readonly string[];
  count?: number | null;
  decision: CaliforniaPhase22CaseDecision;
  publicationEligible: false;
  altersAuthoritativeGovernmentRecords: false;
  activatedInApplicationOrDatabase: false;
  recommendation: string;
  unresolvedForLaunch: boolean;
};

/**
 * Cases identified from live Phase 22 DownloadStateData scan (24,377 rows)
 * plus preserved Phase 20/21 evidence. No invented government fields.
 */
export const CALIFORNIA_PHASE22_POLICY_CASES: readonly CaliforniaPhase22PolicyCase[] =
  [
    {
      id: "invalid-facility-number-95354",
      area: "unique-ids",
      title: "Invalid non 8–9 digit facility number 95354",
      evidence:
        "Live roster scan: exactly one invalid Facility Number `95354` (ZIP-shifted corrupt row). Generator refuse-closed since Phase 13.",
      exampleIds: ["95354"],
      count: 1,
      decision: "fail-closed-refuse-invalid-id",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Keep refuse-closed / invalid-id-ineligible. Never fabricate a disclosure URL. Exclusion activation (separate decision) would suppress it from any future candidate set.",
      unresolvedForLaunch: true,
    },
    {
      id: "truncated-vs-canonical-leading-zero",
      area: "leading-zeros",
      title: "Truncated non-canonical ID vs exact leading-zero canonical",
      evidence:
        "Control pair: truncated `15601219` absent from roster; canonical `015601219` present. Live scan preserves 2,102 leading-zero Facility Numbers. GIS integer FAC_NBR truncates zeros; download strings keep them.",
      exampleIds: ["15601219", "015601219"],
      count: 2102,
      decision: "fail-closed-preserve-leading-zero",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Publish/probe only exact official 8–9 digit strings with leading zeros preserved. Treat truncated forms as non-canonical / refuse-closed.",
      unresolvedForLaunch: true,
    },
    {
      id: "duplicate-facility-numbers",
      area: "duplicates",
      title: "Duplicate Facility Number scan",
      evidence:
        "Live DownloadStateData: officialRows=24,377; distinctFacilityNumbers=24,377; duplicates=[]. No unresolved duplicate-identity cases in the official roster.",
      exampleIds: [],
      count: 0,
      decision: "pass-preserved-no-action",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "No duplicate remediation required on current roster. Re-validate on any source-data delta. Publication still gated by statewide blockers.",
      unresolvedForLaunch: false,
    },
    {
      id: "capacity-blanks-on-excluded-pending",
      area: "capacity",
      title: "Official blank Facility Capacity on PENDING excluded rows",
      evidence:
        "Live scan: 21 blank capacities, all Facility Status=PENDING; candidateBlank (LICENSED/ON PROBATION + eligible type)=0; inventedCapacities=0.",
      exampleIds: [],
      count: 21,
      decision: "pass-preserved-no-action",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Preserve official blanks; never invent. Candidate capacity integrity currently passes. Keep blanks documented for excluded PENDING rows.",
      unresolvedForLaunch: false,
    },
    {
      id: "capacity-integrity-policy-bound",
      area: "capacity",
      title: "Capacity integrity remains policy-bound for launch claims",
      evidence:
        "Phase 8–21: 0 publication-candidate blanks; 21 excluded PENDING blanks; 0 invented. Policy requires fail-closed handling before any launch claim that cites capacity completeness.",
      count: null,
      decision: "policy-bound-awaiting-activation",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Development-only: keep documenting blanks and never invent. Launch claims that assert capacity completeness still require human-approved readiness language; do not treat current pass as gate-open.",
      unresolvedForLaunch: true,
    },
    {
      id: "facility-type-eligibility-out-of-scope",
      area: "facility-type",
      title: "Out-of-scope facility types remain excluded",
      evidence:
        "Live type counts include non-eligible rows (e.g. ADULT DAY PROGRAM 1,381; SOCIAL REHABILITATION FACILITY 559; blank type 17; MEDICAL FOSTER HOMES FOR VETERANS 1; RESIDENTIAL FACILITY CHRONICALLY ILL 16). Eligible RCFE/ARF types unchanged from Phase 6 gates.",
      exampleIds: [],
      count: null,
      decision: "fail-closed-exclude",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Keep exclusive-bucket accounting; out-of-scope types stay excluded. Do not widen eligible facility types without human approval.",
      unresolvedForLaunch: false,
    },
    {
      id: "unresolved-coordinates-map-suppression",
      area: "coordinates",
      title: "28 unresolved official coordinates (map suppression)",
      evidence:
        "Baseline preserved: 15,423 verified official coords / 28 unresolved / 0 fabricated. Phase 22 does not re-probe without verified source delta.",
      count: 28,
      decision: "fail-closed-exclude",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Keep map-suppressed until authoritative coords exist. Do not geocode/fabricate. Facility-excludable; does not alone clear global blockers.",
      unresolvedForLaunch: false,
    },
    {
      id: "unique-id-policy-bound-for-launch",
      area: "unique-ids",
      title: "Unique-ID fail-closed policy still required for launch",
      evidence:
        "Safeguards pass on current roster (leading zeros preserved; 95354 refuse-closed; 0 duplicates), but statewide launch still requires an adopted fail-closed ID policy before publication claims.",
      count: null,
      decision: "policy-bound-awaiting-activation",
      publicationEligible: false,
      altersAuthoritativeGovernmentRecords: false,
      activatedInApplicationOrDatabase: false,
      recommendation:
        "Development-only documentation is complete. Activating exclusion policy / asserting launch-ready unique-ID integrity requires explicit later human approval.",
      unresolvedForLaunch: true,
    },
  ] as const;

export function summarizeCaliforniaPhase22PolicyCases(
  cases: readonly CaliforniaPhase22PolicyCase[] = CALIFORNIA_PHASE22_POLICY_CASES,
) {
  const byArea: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  let unresolvedForLaunch = 0;
  for (const c of cases) {
    byArea[c.area] = (byArea[c.area] ?? 0) + 1;
    byDecision[c.decision] = (byDecision[c.decision] ?? 0) + 1;
    if (c.unresolvedForLaunch) unresolvedForLaunch += 1;
  }
  return {
    total: cases.length,
    byArea,
    byDecision,
    unresolvedForLaunch,
    publicationEligibleCount: 0 as const,
    activatedInApplicationOrDatabase: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
  };
}

export const CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY = {
  officialRows: 24377,
  distinctFacilityNumbers: 24377,
  duplicateCount: 0,
  invalidFacilityNumberCount: 1,
  leadingZeroCount: 2102,
  blankCapacityTotal: 21,
  blankCapacityPendingOnly: 21,
  candidateBlankCapacity: 0,
  inventedCapacities: 0,
  verifiedOfficialCoords: 15423,
  unresolvedCoords: 28,
  fabricatedCoords: 0,
} as const;

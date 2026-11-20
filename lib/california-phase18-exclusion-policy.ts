/**
 * California Phase 18 — facility-exclusion policy (draft for approval only).
 * Distinguishes complete listing exclusion vs feature suppression (map/disclosure).
 * Does NOT activate the policy. Preserves authoritative government records unaltered.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE18_EXCLUSION_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase18ExclusionScope =
  | "complete-listing-exclusion"
  | "feature-suppression-map"
  | "feature-suppression-disclosure"
  | "feature-suppression-owner-claim";

export type CaliforniaPhase18ExclusionClassId =
  | "unverified-or-conflicting-status"
  | "invalid-or-mismatched-ids"
  | "missing-license-evidence"
  | "unverified-coordinates"
  | "bad-disclosure-links"
  | "closed-pending-withdrawn";

export type CaliforniaPhase18ExclusionRule = {
  id: CaliforniaPhase18ExclusionClassId;
  title: string;
  scopes: readonly CaliforniaPhase18ExclusionScope[];
  evidenceStandard: string;
    knownCounts: {
      statewide?: number | null;
      sampled?: number | null;
      regressionControls?: number | null;
      exampleIds?: readonly string[];
    };
  publicationEligible: false;
  ownerClaimEligible: false;
  altersAuthoritativeGovernmentRecords: false;
  activated: false;
  correctionReinstatement: string;
  auditTrailRequired: readonly string[];
};

/**
 * Draft exclusion rules. activated=false until human adoption.
 * Authoritative DownloadStateData / FacilityDetail fields are never rewritten.
 */
export const CALIFORNIA_PHASE18_EXCLUSION_RULES: readonly CaliforniaPhase18ExclusionRule[] = [
  {
    id: "unverified-or-conflicting-status",
    title: "Unverified or conflicting licensing status",
    scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
    evidenceStandard:
      "FacilityDetail status must match Download status under documented coarsening rules, or the facility remains unknown-ineligible. Conflicts (e.g. Download LICENSED vs FacilityDetail Pending Incomplete Application; ON PROBATION vs Probationary License without approved mapping) never invent equivalence.",
    knownCounts: {
      statewide: null,
      sampled: 7,
      regressionControls: 1,
      exampleIds: [
        "502701867",
        "342700333",
        "496803751",
        "335530163",
        "496802077",
        "342701152",
        "515002949",
        "486804268",
      ],
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activated: false,
    correctionReinstatement:
      "Reinstate only after authoritative matching status evidence is recorded (FacilityDetail + Download consistent, or human-approved CDSS mapping). Audit must cite both source statuses and observation timestamps.",
    auditTrailRequired: [
      "downloadStatus",
      "facilityDetailStatus",
      "relation",
      "eligibility",
      "observedOn",
      "evidenceUrls",
    ],
  },
  {
    id: "invalid-or-mismatched-ids",
    title: "Invalid or mismatched facility identifiers",
    scopes: ["complete-listing-exclusion", "feature-suppression-disclosure"],
    evidenceStandard:
      "Publish only exact official 8–9 digit IDs with leading zeros preserved. Truncated or malformed IDs (e.g. 95354; truncated 15601219 vs canonical 015601219) are refuse-closed / non-canonical. Never fabricate a disclosure URL for an invalid ID.",
    knownCounts: {
      regressionControls: 2,
      exampleIds: ["95354", "15601219", "015601219"],
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activated: false,
    correctionReinstatement:
      "Reinstate only the exact official ID once validated. Truncated forms remain permanently non-canonical.",
    auditTrailRequired: [
      "requestedId",
      "canonicalOfficialId",
      "validationResult",
      "refuseClosed",
    ],
  },
  {
    id: "missing-license-evidence",
    title: "Missing license evidence (LICENSED + empty License First Date)",
    scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
    evidenceStandard:
      "Download LICENSED with empty License First Date is genuine eligibility risk. FAQ \"No date on file\" explains missing dates may exist — it does not authorize undated LICENSED publication. Keep unknown-ineligible until an authoritative initial license date exists.",
    knownCounts: {
      statewide: 14,
      sampled: 4,
      exampleIds: [
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
      ],
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activated: false,
    correctionReinstatement:
      "Reinstate only when authoritative License First Date (or equivalent CDSS license evidence) is present and recorded. Do not invent dates.",
    auditTrailRequired: [
      "facilityNumber",
      "downloadStatus",
      "licenseFirstDate",
      "facilityDetailLicenseDates",
      "eligibility",
    ],
  },
  {
    id: "unverified-coordinates",
    title: "Unverified / unresolved official coordinates",
    scopes: ["feature-suppression-map"],
    evidenceStandard:
      "Map pins require verified official coordinates. 28 unresolved candidates stay off-map. Do not geocode, fabricate, or re-probe without new authoritative evidence. Coordinate gaps do not alone change licensing status eligibility, but map feature must suppress them.",
    knownCounts: {
      statewide: 28,
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activated: false,
    correctionReinstatement:
      "Add map pin only after authoritative official coordinates are obtained. Listing-level publication still subject to other exclusion rules.",
    auditTrailRequired: [
      "facilityNumber",
      "coordinateStatus",
      "source",
      "fabricated",
      "reprobeAllowed",
    ],
  },
  {
    id: "bad-disclosure-links",
    title: "Bad, missing, ambiguous, or unverified disclosure links",
    scopes: [
      "feature-suppression-disclosure",
      "complete-listing-exclusion",
    ],
    evidenceStandard:
      "A publishable facility needs a verified working official disclosure URL for the exact facility number. Missing / invalid / ambiguous / inconclusive classifications stay unpublished for disclosure features. Unverified remaining roster (15,451 − 462) is exclude-until-verified unless humans adopt a different policy.",
    knownCounts: {
      statewide: 15451 - 462,
      sampled: 462,
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activated: false,
    correctionReinstatement:
      "Reinstate disclosure link (and listing if otherwise eligible) only after a verified working classification for the exact ID is recorded in audit evidence.",
    auditTrailRequired: [
      "facilityNumber",
      "disclosureClass",
      "url",
      "httpStatus",
      "observedOn",
    ],
  },
  {
    id: "closed-pending-withdrawn",
    title: "Closed, pending, or withdrawn applications",
    scopes: ["complete-listing-exclusion", "feature-suppression-owner-claim"],
    evidenceStandard:
      "CLOSED, pending-incomplete, Application Withdrawn, Application Denied, and similar non-active statuses are not publication candidates. Documented coarsening (CLOSED→Application Withdrawn) remains withdrawn-ineligible. Never treat withdrawn as licensed.",
    knownCounts: {
      regressionControls: 5,
      exampleIds: [
        "306006749",
        "306006799",
        "405802282",
        "374604911",
        "019201529",
      ],
    },
    publicationEligible: false,
    ownerClaimEligible: false,
    altersAuthoritativeGovernmentRecords: false,
    activated: false,
    correctionReinstatement:
      "Reinstate only if authoritative status becomes an approved active/restricted publication status with matching license evidence. Withdrawn history remains in audit.",
    auditTrailRequired: [
      "facilityNumber",
      "downloadStatus",
      "facilityDetailStatus",
      "eligibility",
      "withdrawnIneligible",
    ],
  },
] as const;

export const CALIFORNIA_PHASE18_EXCLUSION_POLICY = {
  observedOn: CALIFORNIA_PHASE18_EXCLUSION_OBSERVED_ON,
  title: "California facility-exclusion policy (draft for approval)",
  status: "draft-for-approval" as const,
  activated: false as const,
  adopted: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  principles: [
    "Fail-closed: uncertain records stay ineligible.",
    "Distinguish complete listing exclusion from feature suppression (map pin / disclosure link / owner claim).",
    "Never alter authoritative government source records; exclusions are product-layer decisions with audit trails.",
    "Sample findings are not statewide rates; statewide checks are labeled separately.",
    "Correction/reinstatement requires new authoritative evidence and an audit entry — never silent un-exclusion.",
    "Activation requires explicit human adoption; Phase 18 does not activate.",
  ] as const,
  rules: CALIFORNIA_PHASE18_EXCLUSION_RULES,
  scopeDefinitions: {
    "complete-listing-exclusion":
      "Facility must not appear as a published California directory listing.",
    "feature-suppression-map":
      "Facility may be list-eligible under other rules but must not receive a map pin until coords verify.",
    "feature-suppression-disclosure":
      "Facility must not expose a disclosure URL until the exact-ID link verifies as working.",
    "feature-suppression-owner-claim":
      "Facility must not accept owner claims while exclusion applies.",
  } as const,
  preservesFailClosedSafeguards: true as const,
  preservesAuthoritativeRecordsUnaltered: true as const,
} as const;

export function evaluateCaliforniaPhase18ExclusionPolicy() {
  return CALIFORNIA_PHASE18_EXCLUSION_POLICY;
}

export function californiaPhase18ExclusionPolicyActivated(): false {
  return false;
}

export function californiaPhase18ExclusionPolicyAdopted(): false {
  return false;
}

export function californiaPhase18ExclusionAltersGovernmentRecords(): false {
  return false;
}

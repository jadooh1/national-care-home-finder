/**
 * Michigan Tier 1 — directory publication readiness (development-only).
 *
 * Reuses PR #62 (4,480-row licensing validation), PR #63 (address interpretation),
 * and the Nov 20 onboarding investigation. Adds a 2026-11-26 LARA afc_sw.txt
 * re-capture focused on outstanding blockers (street resolution attempt,
 * disclosure verification, freshness, exact-ID inventory continuity).
 *
 * Does NOT publish Michigan, invent ISO export dates or physical streets from
 * supplemental fields, enable maps/owner/enhanced, write Supabase, or change
 * Washington / California / Design 2 / Oregon / authentication / billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-26" as const;
export const MICHIGAN_TIER1_DIRECTORY_READINESS_BASELINE = "3209181" as const;

/** Authoritative LARA statewide text file covers Adult Foster Care and Homes for the Aged. */
export const MICHIGAN_TIER1_DIRECTORY_SOURCE = {
  agency: "Michigan Department of Licensing and Regulatory Affairs (LARA), Bureau of Community and Health Systems" as const,
  statewideTextUrl: "https://documents.apps.lara.state.mi.us/bchs/afc_sw.txt" as const,
  statewideLandingUrl:
    "https://www.michigan.gov/lara/bureau-list/bchs/adult/online-lookups/statewide-text-file-of-adult-foster-care-homes-for-the-aged-facilities" as const,
  recordDescriptionUrl:
    "https://www.michigan.gov/lara/bureau-list/bchs/adult/online-lookups/adult-foster-care-record-description" as const,
  facilityProfilePrefix: "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/" as const,
  coversAdultFosterCare: true as const,
  coversHomesForTheAged: true as const,
  homesForTheAgedTypeCode: "AH" as const,
  dailyUpdateNotice: true as const,
  dailyUpdateNoticeIsExportDate: false as const,
  recordedExportDateIso: null,
  disclosurePrefixVerified: true as const,
  identityField: "License Number" as const,
} as const;

/**
 * 2026-11-26 capture. Prior PR #62 baseline remains 4,480; investigation capture
 * (2026-11-20) and this re-fetch both observe 4,476 unique license rows.
 */
export const MICHIGAN_TIER1_CAPTURE = {
  observedOn: "2026-11-26" as const,
  priorAuditRowsPr62: 4480 as const,
  investigationRowsNov20: 4476 as const,
  rows: 4476 as const,
  bytes: 1029479 as const,
  sha256: "cc46f26f856d3d880342fbfc4c639944be9a4bd7acd106ce2fcc5c864feea352" as const,
  lastModified: "Thu, 26 Nov 2026 03:38:42 GMT" as const,
  lastModifiedIsExportDate: false as const,
  describedRows: 4242 as const,
  undescribedXhRows: 234 as const,
  types: { AF: 418, AS: 2487, AM: 425, AL: 555, AG: 4, AI: 2, AH: 351, XH: 234 } as const,
  statuses: {
    REGULAR: 4013,
    TEMPORARY: 172,
    "1ST PROVISIONAL": 55,
    EXEMPT: 234,
    NONE: 2,
  } as const,
  blankLicenses: 0 as const,
  duplicateLicenses: 0 as const,
  profileShapeMatches: 4476 as const,
  capacityDigits: 4476 as const,
  capacityOutsideDescribedRange: 0 as const,
  homesForTheAgedRows: 351 as const,
  homesForTheAgedCapacityMin: 21 as const,
  homesForTheAgedCapacityMax: 266 as const,
  streetBlank: 4419 as const,
  streetLetterAndDigit: 57 as const,
  describedUsableStreet: 55 as const,
  undescribedUsableStreet: 2 as const,
  publicationEligible: 0 as const,
} as const;

/**
 * Street-resolution attempt using official supplemental / profile sources.
 * Supplemental has letter+digit text on every blank-Street row, but the LARA
 * record key still does not define E as physical vs mailing. Candidates are
 * counted; values are NOT copied into Street.
 */
export const MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT = {
  attempted: true as const,
  officialStreetField: "Street Address (column F)" as const,
  officialSupplementalField: "Facility Supplemental Address (column E)" as const,
  profileAddressLabel: "Address:" as const,
  profileDefinesPhysicalVsMailing: false as const,
  blankStreetRows: 4419 as const,
  blankStreetWithSupplementalLetterDigit: 4419 as const,
  blankStreetSupplementalEqualsLicenseeAddress: 912 as const,
  blankStreetSupplementalPoBox: 0 as const,
  /** Supplemental letter+digit, ≠ licensee address, not PO Box — still not adopted. */
  blankStreetSupplementalCandidatesNotAdopted: 3507 as const,
  supplementalAdoptedAsPhysical: false as const,
  mailingAdoptedAsPhysical: false as const,
  usableOfficialStreetRows: 57 as const,
  unresolvedBlankStreetRows: 4419 as const,
  streetResolutionComplete: false as const,
} as const;

export const MICHIGAN_TIER1_EXACT_ID_RECONCILIATION = {
  priorAuditRows: 4480 as const,
  currentRows: 4476 as const,
  netVsPriorAudit: -4 as const,
  uniqueLicenseNumbersCurrent: 4476 as const,
  duplicateLicenseNumbersCurrent: 0 as const,
  blankLicenseNumbersCurrent: 0 as const,
  profileUrlShapeMatchesTypePrefix: 4476 as const,
  /**
   * Full exact-ID residual of the original 4,480 PR #62 dump vs today was not
   * re-materialized in this package; current file has unique licenses and
   * inventory continuity 4,476 since the Nov 20 investigation capture.
   */
  prior4480LicenseDumpReplayed: false as const,
  currentInventoryIdentityOk: true as const,
} as const;

export const MICHIGAN_TIER1_DIRECTORY_INVENTORY = {
  rosterRows: 4476 as const,
  adultFosterCareDescribedRows: 3891 as const, // 4242 − 351 AH
  homesForTheAgedRows: 351 as const,
  xhExemptRows: 234 as const,
  usableOfficialStreetRows: 57 as const,
  publicationEligible: 0 as const,
} as const;

export const MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS = {
  xhUndescribedExemptRows: 234 as const,
  blankStreetUnresolvedRows: 4419 as const,
  supplementalNotSubstitutedForStreet: true as const,
  statusNoneRows: 2 as const,
  washingtonAfhEquivalence: false as const,
  inventedCoordinates: false as const,
  inventedPhysicalStreets: false as const,
} as const;

export const MICHIGAN_TIER1_SURFACE_SEPARATION = {
  directorySurface: "unpublished-evidence-only" as const,
  directoryPath: null,
  mapPath: null,
  mapEnabled: false as const,
  mapBlocker: "no-licensing-coordinate-columns-in-afc-sw" as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  washingtonPreserved: true as const,
  californiaPreserved: true as const,
  oregonPreserved: true as const,
  design2Preserved: true as const,
} as const;

export const MICHIGAN_TIER1_DIRECTORY_CONTROLS = {
  investigationComplete: true as const,
  pr62Pr63ResearchReused: true as const,
  streetResolutionAttempted: true as const,
  streetResolutionComplete: false as const,
  tier1DirectoryRequirementsMet: false as const,
  publicPublicationAuthorized: false as const,
  releaseCandidatePrepared: true as const,
  michiganPublished: false as const,
  michiganDirectoryReady: false as const,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  supabaseWrites: false as const,
  stopGo: "STOP" as const,
  protectedPreviewPublication: "unpublished" as const,
} as const;

export const MICHIGAN_TIER1_DIRECTORY_CHECKLIST = [
  {
    id: "authoritative-lara-afc-hfa-text-file",
    complete: true,
    surface: "directory" as const,
    detail:
      "LARA statewide afc_sw.txt is the authoritative open roster for Adult Foster Care (AF/AS/AM/AL/AG/AI) and Homes for the Aged (AH). Landing page states files update daily.",
  },
  {
    id: "facility-identity-license-number",
    complete: true,
    surface: "directory" as const,
    detail:
      "4,476 unique License Numbers (AA#########); 0 blank / 0 duplicate; FacilityProfile URL shape matches type prefix on all rows.",
  },
  {
    id: "licensing-status-and-capacity",
    complete: true,
    surface: "directory" as const,
    detail:
      "Facility License Status domain observed (REGULAR/TEMPORARY/1ST PROVISIONAL/EXEMPT/NONE). Capacity present on all rows; AF/AS/AM/AL/AG/AI within described ranges; AH capacity 21–266. Capacity ≠ vacancy.",
  },
  {
    id: "category-eligibility-afc-and-hfa",
    complete: false,
    surface: "directory" as const,
    detail:
      "Described types AF–AI and AH are category-eligible in principle. 234 XH/EXEMPT rows remain undescribed and ineligible. Product taxonomy must not equate MI categories to Washington AFH.",
  },
  {
    id: "street-address-resolution",
    complete: false,
    surface: "directory" as const,
    detail:
      "Official Street usable on 57 rows only. Supplemental letter+digit on all 4,419 blank-Street rows (3,507 ≠ licensee / non-PO Box candidates) but record key does not define E as physical. Not adopted. Profiles use unlabeled Address:.",
  },
  {
    id: "freshness-iso-export-date",
    complete: false,
    surface: "directory" as const,
    detail:
      "HTTP Last-Modified and 'updated daily' notice rejected. recordedExportDateIso=null.",
  },
  {
    id: "facility-specific-disclosure",
    complete: true,
    surface: "directory" as const,
    detail:
      "FacilityProfile/{LICENSE} prefix verified (HTTP 200 samples including AFC and AH). Disclosure alone does not authorize publication.",
  },
  {
    id: "exact-id-inventory-continuity",
    complete: true,
    surface: "directory" as const,
    detail:
      "Current capture has unique licenses. Net vs PR #62 4,480 audit is −4 (4,476 since Nov 20 investigation). Full 4,480 dump residual not replayed offline.",
  },
  {
    id: "map-coordinates-separate",
    complete: false,
    surface: "map" as const,
    detail: "afc_sw.txt has no coordinate columns. Do not invent geocodes. Map stays off.",
  },
  {
    id: "wa-ca-or-design2-owner-auth-billing-preserved",
    complete: true,
    surface: "safeguard" as const,
    detail:
      "This package does not change Washington, California, Oregon, Design 2, owner claims, authentication, or billing. Michigan stays unpublished.",
  },
] as const;

export const MICHIGAN_TIER1_DIRECTORY_BLOCKERS = [
  "blank-street-physical-address-unresolved",
  "supplemental-address-is-not-defined-as-a-physical-or-mailing-address",
  "no-authoritative-iso-export-date",
  "file-server-last-modified-and-daily-update-notice-are-not-export-dates",
  "xh-type-undescribed-and-exempt-ineligible",
  "state-authorization-unpublished",
] as const;

export type MichiganTier1DirectoryVerdict = {
  stopGo: "STOP";
  tier1DirectoryRequirementsMet: false;
  publicPublicationAuthorized: false;
  michiganPublished: false;
  inventoryRows: typeof MICHIGAN_TIER1_CAPTURE.rows;
  publicationEligible: 0;
  mapEnabled: false;
  streetResolutionComplete: false;
  blockers: typeof MICHIGAN_TIER1_DIRECTORY_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function michiganTier1DirectoryVerdict(): MichiganTier1DirectoryVerdict {
  return {
    stopGo: "STOP",
    tier1DirectoryRequirementsMet: false,
    publicPublicationAuthorized: false,
    michiganPublished: false,
    inventoryRows: MICHIGAN_TIER1_CAPTURE.rows,
    publicationEligible: 0,
    mapEnabled: false,
    streetResolutionComplete: false,
    blockers: MICHIGAN_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Obtain LARA authoritative definition of Facility Supplemental Address (physical vs mailing) before any blank-Street substitution.",
      "Obtain an authoritative ISO export/version stamp for afc_sw.txt (do not adopt Last-Modified or daily-update notices).",
      "Obtain an authoritative XH / EXEMPT definition before any inclusion decision.",
      "Keep FacilityProfile disclosure as verified but insufficient alone for publication.",
      "Keep map work separate — afc_sw has no coordinates.",
      "Separate human authorization before any Michigan public or development directory flip.",
    ],
  };
}

export function michiganTier1DirectoryChecklistComplete(): boolean {
  return MICHIGAN_TIER1_DIRECTORY_CHECKLIST.every((item) => item.complete);
}

export function michiganTier1DirectoryReadyForPublic(): false {
  return false;
}

export function michiganTier1MapReady(): false {
  return false;
}

/** Street resolution helper — always refuses supplemental promotion. */
export function michiganAdoptSupplementalAsPhysicalStreet(_supplemental: string): null {
  void _supplemental;
  return null;
}

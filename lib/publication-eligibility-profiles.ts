/**
 * State-specific regulatory profiles for the tiered publication framework.
 * Development-only constants. Intentionally free of sibling runtime imports.
 *
 * These profiles encode category mappings, status semantics, freshness
 * expectations, and attribution. They do not publish any state.
 */

export const PUBLICATION_PROFILE_OBSERVED_ON = "2026-11-21";

export type PublicationStateProfile = {
  state: string;
  stateCode: string;
  stateAuthorization: "public" | "development" | "unpublished";
  issuingAuthority: string;
  categoryRules: {
    inScopeLabels: readonly string[];
    outOfScopeNote: string;
    washingtonAfhEquivalence: false;
  };
  statusRules: {
    domainKnown: boolean;
    listingAllowedStatuses: readonly string[];
    ambiguousOrBlockedStatuses: readonly string[];
    note: string;
  };
  identityRules: {
    kind: "license" | "facility-id" | "source-id" | "composite" | "unknown";
    fieldLabel: string;
    note: string;
  };
  freshness: {
    officialExportDateIso: string | null;
    rejectedProxies: readonly string[];
    policyDocumented: boolean;
    independentEvidence: boolean;
    note: string;
  };
  disclosure: {
    facilitySpecificVerified: boolean;
    note: string;
  };
  coordinates: {
    licensingProvenanceVerified: boolean;
    mapEnabled: boolean;
    note: string;
  };
  californiaPublicationBlocked: boolean;
  oregonMapDisabled: boolean;
  ownerClaimsEnabled: boolean;
  publicationStopGo: "GO" | "STOP";
  evaluationNotes: string;
};

export const PUBLICATION_STATE_PROFILES: readonly PublicationStateProfile[] = [
  {
    state: "Washington",
    stateCode: "WA",
    stateAuthorization: "public",
    issuingAuthority: "Washington DSHS / Aging and Long-Term Support Administration",
    categoryRules: {
      inScopeLabels: ["Adult Family Home"],
      outOfScopeNote: "Washington AFH only on the public directory.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: ["Licensed"],
      ambiguousOrBlockedStatuses: [],
      note: "Listed facilities come from wa_dshs_listed_facilities.",
    },
    identityRules: {
      kind: "license",
      fieldLabel: "license_number",
      note: "Stable DSHS license number.",
    },
    freshness: {
      officialExportDateIso: "2026-11-09",
      rejectedProxies: [],
      policyDocumented: true,
      independentEvidence: true,
      note: "Source-issued export date 2026-11-09.",
    },
    disclosure: {
      facilitySpecificVerified: true,
      note: "AFHServices.aspx?ref=adv&Lic= prefix verified.",
    },
    coordinates: {
      licensingProvenanceVerified: true,
      mapEnabled: true,
      note: "wa_afh_map_facilities licensing coordinates.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: true,
    publicationStopGo: "GO",
    evaluationNotes: "Existing public baseline. Framework must preserve behavior.",
  },
  {
    state: "Oregon",
    stateCode: "OR",
    stateAuthorization: "development",
    issuingAuthority: "Oregon Department of Human Services / LTC Licensing",
    categoryRules: {
      inScopeLabels: ["Oregon adult foster home"],
      outOfScopeNote: "Not Washington AFH; beds 1–5; 20 zero-bed homes excluded.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: ["Open"],
      ambiguousOrBlockedStatuses: [],
      note: "Public columns accept Open status only.",
    },
    identityRules: {
      kind: "source-id",
      fieldLabel: "source_id",
      note: "License number withheld from public columns; source_id used.",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: [
        "gis-service-edit-time",
        "download-filename",
        "twenty-four-hour-update-notice",
      ],
      policyDocumented: false,
      independentEvidence: false,
      note: "No accepted ISO export date; development listing continues under existing host gate.",
    },
    disclosure: {
      facilitySpecificVerified: true,
      note: "ltclicensing.oregon.gov/Providers/Details/ prefix.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "Map permanently disabled; street withheld from public columns.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: true,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes:
      "Nearest staged candidate for continued development preview only. Not public-launch ready (no ISO export; street withheld; map off).",
  },
  {
    state: "California",
    stateCode: "CA",
    stateAuthorization: "unpublished",
    issuingAuthority: "California CDSS / CCLD",
    categoryRules: {
      inScopeLabels: [
        "RESIDENTIAL CARE ELDERLY",
        "ADULT RESIDENTIAL",
      ],
      outOfScopeNote: "ARF day programs and specialty types stay out of scope.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: ["LICENSED"],
      ambiguousOrBlockedStatuses: ["CLOSED", "PENDING", "ON PROBATION"],
      note: "Phase 6/23 classifiers; provisional and overlay conflicts remain.",
    },
    identityRules: {
      kind: "facility-id",
      fieldLabel: "Facility Number",
      note: "Numeric facility number; invalid IDs excluded offline.",
    },
    freshness: {
      officialExportDateIso: "2026-11-15",
      rejectedProxies: [
        "catalog-timestamps",
        "chhs-file-date-values",
        "temporal-coverage-text",
        "gis-service-edit-time",
        "faq-weekly-cadence",
      ],
      policyDocumented: true,
      independentEvidence: true,
      note:
        "CDSS confirmed Transparency CSV filename/header MMDDYYYY is as-of; live RCFE/ARF concordant 2026-11-15. ArcGIS/CHHS clocks still rejected. Publication gate BLOCKED; exclusions inactive.",
    },
    disclosure: {
      facilitySpecificVerified: true,
      note: "FacDetail / FacilityDetail API prefix verified in Phase 6.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "Open data lacks licensing coordinates; unresolved coords suppress map offline.",
    },
    californiaPublicationBlocked: true,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes:
      "Statewide publication BLOCKED. ArcGIS CCL layer is not a Tier 1 roster (undocumented STATUS, incomplete exact IDs). Do not activate exclusions.",
  },
  {
    state: "Florida",
    stateCode: "FL",
    stateAuthorization: "unpublished",
    issuingAuthority: "Florida AHCA / FloridaHealthFinder",
    categoryRules: {
      inScopeLabels: ["Assisted Living Facility"],
      outOfScopeNote: "AFCH and specialty licenses must not equal Washington AFH.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: [],
      ambiguousOrBlockedStatuses: ["INACTIVE", "SUSPENDED"],
      note: "LicenseStatus mapping open; IsClosed=false is not sufficient.",
    },
    identityRules: {
      kind: "license",
      fieldLabel: "LID / License Number",
      note: "3,025 ALF embed rows with Profile/?LID= disclosure.",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: [
        "nightly-update-claim",
        "miami-dade-sample-stamp",
        "page-date",
      ],
      policyDocumented: false,
      independentEvidence: false,
      note: "Strong roster fields; ISO export absent.",
    },
    disclosure: {
      facilitySpecificVerified: true,
      note: "Profile/?LID= prefix verified.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "List-embed coordinates present but provenance undescribed.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes:
      "Strongest unpublished Class B evidence for future Tier 1 after ISO + status mapping. Not launch-ready.",
  },
  {
    state: "North Carolina",
    stateCode: "NC",
    stateAuthorization: "unpublished",
    issuingAuthority: "North Carolina DHHS / DHSR",
    categoryRules: {
      inScopeLabels: ["Adult Care Home"],
      outOfScopeNote: "Not Washington AFH.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: false,
      listingAllowedStatuses: [],
      ambiguousOrBlockedStatuses: [],
      note: "Per-row operating status not verified for publication.",
    },
    identityRules: {
      kind: "license",
      fieldLabel: "license number",
      note: "Identifiers present on researched roster.",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: ["http-last-modified", "page-timestamps"],
      policyDocumented: false,
      independentEvidence: false,
      note: "No ISO export.",
    },
    disclosure: {
      facilitySpecificVerified: false,
      note: "Facility-specific disclosure not verified.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "No licensing coordinates accepted.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes: "Status and disclosure gaps block Tier 1.",
  },
  {
    state: "South Carolina",
    stateCode: "SC",
    stateAuthorization: "unpublished",
    issuingAuthority: "South Carolina DHEC / LLR",
    categoryRules: {
      inScopeLabels: ["Community Residential Care Facility"],
      outOfScopeNote: "CRCF is not Washington AFH.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: [],
      ambiguousOrBlockedStatuses: [],
      note: "Status present; publication mapping still requires human rules.",
    },
    identityRules: {
      kind: "license",
      fieldLabel: "LICENSE_NBR",
      note: "427 CRCF rows researched.",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: [
        "dataLastEditDate",
        "http-last-modified",
        "program-updated-label",
      ],
      policyDocumented: false,
      independentEvidence: false,
      note: "No ISO export.",
    },
    disclosure: {
      facilitySpecificVerified: false,
      note: "Find a Facility map only; LICENSE_NBR prefix unverified.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "ArcGIS coordinates rejected as licensing provenance.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes: "Preserve SC evidence; STOP for publication.",
  },
  {
    state: "Kentucky",
    stateCode: "KY",
    stateAuthorization: "unpublished",
    issuingAuthority: "Kentucky CHFS OIG",
    categoryRules: {
      inScopeLabels: ["ALC", "ALC-BH", "ALC-DC"],
      outOfScopeNote: "Not PCH / FCH / nursing / Washington AFH.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: false,
      listingAllowedStatuses: [],
      ambiguousOrBlockedStatuses: ["Pending Renewal"],
      note: "Expiration / Pending Renewal is not Active/Closed.",
    },
    identityRules: {
      kind: "license",
      fieldLabel: "LICENSE #",
      note: "244 unique of 247; 1 blank; 2 duplicate groups.",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: [
        "november-2026-sheet-label",
        "http-last-modified",
        "beginning-of-month-claim",
      ],
      policyDocumented: false,
      independentEvidence: false,
      note: "No ISO export.",
    },
    disclosure: {
      facilitySpecificVerified: false,
      note: "Directories only; LICENSE # URL unverified.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "No coordinate columns.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes: "Preserve KY evidence; blank/dup LICENSE # need rules.",
  },
  {
    state: "Tennessee",
    stateCode: "TN",
    stateAuthorization: "unpublished",
    issuingAuthority: "Tennessee Health Facilities Commission",
    categoryRules: {
      inScopeLabels: ["Assisted Care Living Facility"],
      outOfScopeNote: "ACLF is not Washington AFH.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: ["Licensed"],
      ambiguousOrBlockedStatuses: ["On Probation", "LLC Licensed"],
      note: "Licensed vs On Probation vs LLC Licensed needs publication rules.",
    },
    identityRules: {
      kind: "license",
      fieldLabel: "lic_no",
      note: "333 unique ACLF rows.",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: [
        "october-2026-index-label",
        "http-last-modified-unavailable",
      ],
      policyDocumented: false,
      independentEvidence: false,
      note: "No ISO export.",
    },
    disclosure: {
      facilitySpecificVerified: false,
      note: "FacilityListings search only; lic_no prefix unverified.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "No coordinate columns.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes: "Strong ID/address/status; freshness and disclosure remain open.",
  },
  {
    state: "Massachusetts",
    stateCode: "MA",
    stateAuthorization: "unpublished",
    issuingAuthority: "Massachusetts EOEA / MassGIS LTC",
    categoryRules: {
      inScopeLabels: ["Assisted Living Residence"],
      outOfScopeNote: "Not Washington AFH.",
      washingtonAfhEquivalence: false,
    },
    statusRules: {
      domainKnown: true,
      listingAllowedStatuses: [],
      ambiguousOrBlockedStatuses: [],
      note: "Status present; publication mapping open.",
    },
    identityRules: {
      kind: "unknown",
      fieldLabel: "object / mixed identifiers",
      note: "Stable regulatory license identifier not verified (compatibility licenseIdentifier=false).",
    },
    freshness: {
      officialExportDateIso: null,
      rejectedProxies: [
        "title-as-of",
        "http-last-modified",
        "date-of-last-update",
      ],
      policyDocumented: false,
      independentEvidence: false,
      note: "No ISO export.",
    },
    disclosure: {
      facilitySpecificVerified: true,
      note: "Facility page linkage observed in discovery package.",
    },
    coordinates: {
      licensingProvenanceVerified: false,
      mapEnabled: false,
      note: "MassGIS mixed/stale geocode rejected as licensing coords.",
    },
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
    publicationStopGo: "STOP",
    evaluationNotes: "Identifier gap blocks Tier 1.",
  },
] as const;

export function publicationStateProfile(
  state: string,
): PublicationStateProfile | null {
  return PUBLICATION_STATE_PROFILES.find((p) => p.state === state) ?? null;
}

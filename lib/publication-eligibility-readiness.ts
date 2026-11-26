/**
 * Development-only readiness report for the tiered publication framework.
 * Intentionally free of sibling runtime imports.
 *
 * Aggregates precomputed per-state summaries. Does not publish states,
 * write Supabase, or activate exclusions.
 */

export const PUBLICATION_READINESS_OBSERVED_ON = "2026-11-21";

export type TierCounts = {
  tier0: number;
  tier1: number;
  tier2: number;
  tier3: number;
};

export type StateReadinessSummary = {
  state: string;
  stateAuthorization: "public" | "development" | "unpublished";
  evaluationScope: "fixture" | "sample" | "full-dataset";
  /** Fixture/case counts only unless explicitly labeled full-dataset roster evidence. */
  countsAreFixtureOrSample: boolean;
  statewideLaunchReadyClaim: false;
  tierCounts: TierCounts;
  listingCoverageNote: string;
  mapCoverageNote: string;
  enhancedCoverageNote: string;
  blockers: readonly string[];
  manualReviewQueue: readonly string[];
  stopGo: "GO" | "STOP";
  californiaPublicationBlocked: boolean;
  oregonMapDisabled: boolean;
  ownerClaimsEnabled: boolean;
};

export const PUBLICATION_READINESS_SUMMARIES: readonly StateReadinessSummary[] = [
  {
    state: "Washington",
    stateAuthorization: "public",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 0, tier1: 0, tier2: 0, tier3: 6278 },
    listingCoverageNote: "Existing public directory (wa_dshs_listed_facilities).",
    mapCoverageNote: "Existing public map (wa_afh_map_facilities).",
    enhancedCoverageNote: "Owner text under existing WA admin RPCs only.",
    blockers: [],
    manualReviewQueue: [],
    stopGo: "GO",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: true,
  },
  {
    state: "Oregon",
    stateAuthorization: "development",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 1584, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote:
      "Dev host-gated directory (1,584). 2026-11-26 CSV/Excel capture: 1,579 qualifying AFH with 100% street on Address; street still withheld from public columns. ODHS daily-update confirmation recorded; no ISO stamp.",
    mapCoverageNote: "Map disabled (mapPath null).",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "daily-refresh-confirmation-is-not-an-iso-stamp",
      "street-withheld-from-public-columns",
      "map-disabled",
      "state-authorization-development-only",
    ],
    manualReviewQueue: [
      "approve-daily-refresh-freshness-policy-or-require-iso",
      "authorize-street-on-listing-surface",
    ],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: true,
    ownerClaimsEnabled: false,
  },
  {
    state: "California",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 23020, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote:
      "Transparency CSV as-of 2026-11-15 adopted under CDSS filename/header confirmation; offline Tier 1 preview may enumerate Phase 23 otherwise-clear rows. ArcGIS roster remains STOP. Final publication BLOCKED.",
    mapCoverageNote:
      "No public CA map; ArcGIS coords are georeferenced county-intersect, not licensing Tier 2 provenance.",
    enhancedCoverageNote: "Owner claims disabled; exclusions inactive.",
    blockers: [
      "california-publication-blocked",
      "exclusion-policy-inactive",
      "arcgis-rejected-as-tier1-roster",
      "publication-approval-required",
    ],
    manualReviewQueue: [
      "provisional-license-conflicts",
      "licensed-pending-increase-overlays",
    ],
    stopGo: "STOP",
    californiaPublicationBlocked: true,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "Florida",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 3025, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote:
      "3025 ALF roster rows are evidence only; Tier 1 offline requires ISO + status mapping before any public count.",
    mapCoverageNote: "Embed coords present; licensing provenance undescribed → no Tier 2.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "license-status-publication-mapping-open",
      "coordinate-source-undescribed",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: ["alf-afch-specialty-category-rules"],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "North Carolina",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 1086, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote: "Status domain and disclosure gaps keep Tier 0.",
    mapCoverageNote: "No accepted licensing coordinates.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "ambiguous-license-status",
      "disclosure-unverified",
      "no-authoritative-iso-export-date",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: ["per-row-status-domain"],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "South Carolina",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 427, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote: "CRCF roster evidence preserved; publication STOP.",
    mapCoverageNote: "ArcGIS coords rejected as licensing provenance.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "disclosure-prefix-unverified",
      "georeferenced-coordinates-not-licensing",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: ["license-nbr-disclosure-url"],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "Kentucky",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 247, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote: "TYPE-row roster evidence preserved; blank/dup LICENSE #.",
    mapCoverageNote: "No coordinates.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "blank-and-duplicate-license-numbers",
      "pending-renewal-is-not-status",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: ["license-number-uniqueness-rules", "type-row-vs-campus"],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "Tennessee",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 333, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote: "ACLF roster evidence; freshness/disclosure open.",
    mapCoverageNote: "No coordinates.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "disclosure-prefix-unverified",
      "probation-status-unmapped",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: ["licensed-vs-on-probation-vs-llc-licensed"],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "Massachusetts",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 271, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote: "Stable regulatory identifier not verified.",
    mapCoverageNote: "MassGIS geocode rejected.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "invalid-or-blank-identifier",
      "no-authoritative-iso-export-date",
      "georeferenced-coordinates-not-licensing",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: ["regulatory-identifier-field"],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "Texas",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 2019, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote:
      "HHSC al.xlsx ALF_Directory inventory (2,019 rows; Type A/B/C). Strong Facility ID/License/address/capacity; publicationEligible=0 until ISO + status + TULIP disclosure + taxonomy clear.",
    mapCoverageNote:
      "Geo Location pairs undescribed; 82 comma-only cells are not coordinates. Map stays off.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "facility-licensed-yes-not-operating-status",
      "no-verified-tulip-disclosure-url-prefix",
      "type-a-b-c-taxonomy-unapproved",
      "map-geo-source-undescribed",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: [
      "hhsc-iso-export-stamp",
      "tulip-disclosure-prefix-or-search-only-policy",
      "type-a-b-c-product-taxonomy",
    ],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
  {
    state: "Pennsylvania",
    stateAuthorization: "unpublished",
    evaluationScope: "full-dataset",
    countsAreFixtureOrSample: false,
    statewideLaunchReadyClaim: false,
    tierCounts: { tier0: 989, tier1: 0, tier2: 0, tier3: 0 },
    listingCoverageNote:
      "989 PCH open-data rows re-verified (sha unchanged). 976 usable streets; 13 letter-only deterministically excluded. publicationEligible=0 (no license/status/ISO/disclosure).",
    mapCoverageNote: "Georeferenced portal points rejected as licensing coordinates. Map off.",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "open-data-object-id-is-not-a-license-number",
      "no-per-row-licensing-status",
      "no-authoritative-iso-export-date",
      "catalog-timestamp-is-not-an-export-date",
      "no-per-facility-disclosure-link-is-recorded",
      "thirteen-letter-only-streets-deterministically-excluded",
      "georeferenced-coordinates-are-not-licensing-coordinates",
      "state-authorization-unpublished",
    ],
    manualReviewQueue: [
      "license-number-status-channel",
      "iso-export-stamp",
      "facility-disclosure-permalink",
    ],
    stopGo: "STOP",
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ownerClaimsEnabled: false,
  },
] as const;

export function buildPublicationReadinessReport(
  summaries: readonly StateReadinessSummary[] = PUBLICATION_READINESS_SUMMARIES,
) {
  const stopStates = summaries.filter((s) => s.stopGo === "STOP").map((s) => s.state);
  const goStates = summaries.filter((s) => s.stopGo === "GO").map((s) => s.state);
  return {
    observedOn: PUBLICATION_READINESS_OBSERVED_ON,
    developmentOnly: true as const,
    publicRoutesAdded: false as const,
    supabaseWrites: false as const,
    exclusionsActivated: false as const,
    inventedCoordinates: false as const,
    statewideLaunchReadyClaimFromSamples: false as const,
    goStates,
    stopStates,
    summaries: [...summaries],
    invariants: {
      washingtonPublic: true,
      oregonMapDisabled: true,
      californiaPublicationBlocked: true,
      ownerClaimsWashingtonOnly: true,
    },
  };
}

export function publicationReadinessAllowsNewPublicState(): false {
  return false;
}

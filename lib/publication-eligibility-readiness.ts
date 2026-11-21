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
      "Development host-gated reduced-field directory exists separately; framework Tier 1 requires street (withheld) + ISO freshness.",
    mapCoverageNote: "Map disabled (mapPath null).",
    enhancedCoverageNote: "Not enabled.",
    blockers: [
      "no-authoritative-iso-export-date",
      "street-withheld-from-public-columns",
      "map-disabled",
      "state-authorization-development-only",
    ],
    manualReviewQueue: ["freshness-policy-for-odhs-export"],
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
      "Offline Phase 23 may mark some rows listingEligibleOffline; ArcGIS FeatureServer/0 alone is Tier 1 STOP (undocumented STATUS + incomplete exact IDs). Final publication BLOCKED.",
    mapCoverageNote:
      "No public CA map; ArcGIS coords are georeferenced county-intersect, not licensing Tier 2 provenance.",
    enhancedCoverageNote: "Owner claims disabled; exclusions inactive.",
    blockers: [
      "california-publication-blocked",
      "no-authoritative-iso-export-date",
      "exclusion-policy-inactive",
      "arcgis-rejected-as-tier1-roster",
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

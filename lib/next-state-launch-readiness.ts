/**
 * Next-state launch readiness ranking (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Ranks unpublished researched states for Tier 1 listing potential while
 * Florida awaits AHCA freshness confirmation. Does not publish any state.
 */

export const NEXT_STATE_READINESS_OBSERVED_ON = "2026-11-21";
export const NEXT_STATE_READINESS_BASE_COMMIT =
  "4869fbf3e66e76c1a15a776ca4b048073d8ce8f1";

export type NextStateScore = {
  stableUniqueId: 0 | 1 | 2;
  licensingStatusClarity: 0 | 1 | 2;
  physicalAddress: 0 | 1 | 2;
  sourceFreshness: 0 | 1 | 2;
  officialFacilityLink: 0 | 1 | 2;
  authoritativeDataQuality: 0 | 1 | 2;
};

export type NextStateCandidate = {
  rank: number;
  state: string;
  facilityType: string;
  rosterRows: number;
  score: NextStateScore;
  totalScore: number;
  tier1StructuralScore: number;
  strengths: readonly string[];
  remainingTier1Blockers: readonly string[];
  excludedFromSelectionBecause?: string;
};

function total(score: NextStateScore): number {
  return (
    score.stableUniqueId
    + score.licensingStatusClarity
    + score.physicalAddress
    + score.sourceFreshness
    + score.officialFacilityLink
    + score.authoritativeDataQuality
  );
}

/** Tier 1 hard-gate oriented score (disclosure optional for framework Tier 1). */
function tier1Structural(score: NextStateScore): number {
  return (
    score.stableUniqueId
    + score.licensingStatusClarity
    + score.physicalAddress
    + score.sourceFreshness
    + score.authoritativeDataQuality
  );
}

/**
 * Scoring rubric (0–2 each dimension; evidence-based, not assumptions):
 * 2 = verified clear for Tier 1 precursor use
 * 1 = partial / needs mapping rule
 * 0 = missing or rejected for Tier 1
 *
 * Freshness is 0 for all unpublished candidates without source-issued ISO.
 * Official facility link is optional for framework Tier 1 but scored for
 * launch-path quality.
 */
const NEXT_STATE_CANDIDATE_SEED = [
  {
    rank: 1,
    state: "Ohio",
    facilityType: "Residential Care / Assisted Living (ODH EID L12)",
    rosterRows: 1152,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 2,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 0,
      authoritativeDataQuality: 2,
    },
    strengths: [
      "1,152 unique FACID (OHL#####); blank address 0",
      "OPERSTDESC domain ACTIVE 801 / ACTIVE-PENDING RENEWAL 16 / PENDING 26 / CLOSED-* 309",
      "ACTIVE licensed beds 5–508 with 0 nullish/zero",
      "Official ODH Facility Listing CSV extract (not a scrape of marketing pages)",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "status-publication-rule-needs-freeze",
      "disclosure-prefix-unverified-session-bound",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 2,
    state: "Virginia",
    facilityType: "Assisted Living Facility (VDSS search)",
    rosterRows: 575,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 1,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 2,
      authoritativeDataQuality: 2,
    },
    strengths: [
      "575 unique licenseId; verified ?licenseId=&endpoint=alf disclosure",
      "Street/city/ZIP on list rows",
      "licensed=true on list rows",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "licenseType-status-mapping-open",
      "list-capacity-absent",
      "duplicate-licenseId-53896",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 3,
    state: "Alabama",
    facilityType: "ALF + SCALF (ADPH FacilitiesDirectory Excel)",
    rosterRows: 294,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 2,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 0,
      authoritativeDataQuality: 1,
    },
    strengths: [
      "Unique Fac ID D#### / P####; addresses complete",
      "License Status Regular (ALF 188; SCALF 105 Regular / 1 Probational)",
      "Licensed Beds present",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "disclosure-prefix-unverified",
      "closed-facility-coverage-unverified",
      "alf-scalf-campus-rules",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 4,
    state: "Tennessee",
    facilityType: "Assisted Care Living Facility (HFC Full Bed Report)",
    rosterRows: 333,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 2,
      physicalAddress: 1,
      sourceFreshness: 0,
      officialFacilityLink: 0,
      authoritativeDataQuality: 2,
    },
    strengths: [
      "333 unique lic_no; lic_status Licensed 331 / On Probation 1 / LLC Licensed 1",
      "total_beds 6–184",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "blank-city-rows",
      "disclosure-prefix-unverified",
      "status-rules-for-probation-llc",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 5,
    state: "New Jersey",
    facilityType: "ALR / CPCH / ALP (NJDOH All_LTC.xlsx)",
    rosterRows: 305,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 0,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 2,
      authoritativeDataQuality: 2,
    },
    strengths: [
      "305 unique FacID/LIC#; verified fsFacilityDetails.aspx?item={FacID}",
      "Addresses complete; ALR/CPCH capacities present",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "no-active-closed-status-domain",
      "alp-capacity-zeros",
      "coordinate-provenance-undescribed",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 6,
    state: "Georgia",
    facilityType: "PCH + ALC (DCH/HFRD GetFacilitiesData)",
    rosterRows: 1899,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 1,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 0,
      authoritativeDataQuality: 1,
    },
    strengths: [
      "1,899 unique FACIDs; addresses present; OPERSTDESC Active/ACTIVE",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "disclosure-prefix-unverified",
      "closed-facility-presence-unverified",
      "geocode-coords-not-licensing",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 7,
    state: "South Carolina",
    facilityType: "CRCF (DPH Health Facilities FeatureServer)",
    rosterRows: 427,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 1,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 0,
      authoritativeDataQuality: 1,
    },
    strengths: [
      "427 unique LICENSE_NBR; street address complete; PERMIT_OPERATING_CODE ACT",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "disclosure-prefix-unverified",
      "coordinate-provenance-undescribed",
      "bed-field-conflicts",
      "state-authorization-unpublished",
    ],
  },
  {
    rank: 8,
    state: "Maryland",
    facilityType: "Assisted Living (OHCQ Excel)",
    rosterRows: 1675,
    score: {
      stableUniqueId: 2,
      licensingStatusClarity: 0,
      physicalAddress: 2,
      sourceFreshness: 0,
      officialFacilityLink: 0,
      authoritativeDataQuality: 1,
    },
    strengths: [
      "1,675 unique License Numbers; street address and capacity present",
    ],
    remainingTier1Blockers: [
      "no-authoritative-iso-export-date",
      "no-per-row-status-domain",
      "disclosure-prefix-unverified",
      "state-authorization-unpublished",
    ],
  },
] as const;

export const NEXT_STATE_CANDIDATES: readonly NextStateCandidate[] =
  NEXT_STATE_CANDIDATE_SEED
    .map((c) => {
      const score: NextStateScore = {
        stableUniqueId: c.score.stableUniqueId,
        licensingStatusClarity: c.score.licensingStatusClarity,
        physicalAddress: c.score.physicalAddress,
        sourceFreshness: c.score.sourceFreshness,
        officialFacilityLink: c.score.officialFacilityLink,
        authoritativeDataQuality: c.score.authoritativeDataQuality,
      };
      return {
        rank: c.rank,
        state: c.state,
        facilityType: c.facilityType,
        rosterRows: c.rosterRows,
        score,
        totalScore: total(score),
        tier1StructuralScore: tier1Structural(score),
        strengths: [...c.strengths],
        remainingTier1Blockers: [...c.remainingTier1Blockers],
      } satisfies NextStateCandidate;
    })
    .sort((a, b) => {
      if (b.tier1StructuralScore !== a.tier1StructuralScore) {
        return b.tier1StructuralScore - a.tier1StructuralScore;
      }
      if (b.score.licensingStatusClarity !== a.score.licensingStatusClarity) {
        return b.score.licensingStatusClarity - a.score.licensingStatusClarity;
      }
      return b.totalScore - a.totalScore;
    })
    .map((c, index) => ({
      ...c,
      rank: index + 1,
    }));

export const NEXT_STATE_EXCLUDED_FROM_RANKING = [
  {
    state: "Washington",
    reason: "Already public baseline — not a next-state launch.",
  },
  {
    state: "Florida",
    reason:
      "Strongest unpublished Tier 1 precursor overall, but parked awaiting AHCA ISO freshness response; this ranking selects an alternate parallel track.",
  },
  {
    state: "Oregon",
    reason:
      "Development directory already exists; street withheld and map/refresh disabled — not an unpublished alternate.",
  },
  {
    state: "California",
    reason: "Publication gate BLOCKED; exclusions inactive.",
  },
  {
    state: "North Carolina",
    reason: "Avoid duplicating active North Carolina workstreams.",
  },
  {
    state: "Delaware",
    reason: "Avoid duplicating active Delaware workstreams.",
  },
  {
    state: "Massachusetts",
    reason:
      "Identifier gap (no stable license/facility id on certified ALR list) blocks Tier 1; ranked below the top eight.",
  },
] as const;

export const NEXT_STATE_SELECTION = {
  state: "Ohio",
  role: "strongest-alternate-unpublished-tier1-candidate",
  notAPublicLaunchAuthorization: true as const,
  why:
    "Among unpublished researched states excluding Florida (AHCA wait), North Carolina/Delaware (active-work exclusion), and Massachusetts (identifier gap), Ohio has the strongest Tier 1 structural package: unique FACID, complete physical addresses, and a clear ACTIVE/CLOSED operating-status domain on an official ODH Facility Listing extract. Disclosure remains session-bound (optional for framework Tier 1). Freshness ISO remains open for all candidates.",
  parallelTrack: {
    florida: "Continue AHCA freshness confirmation; do not abandon FL Tier 1 offline 2,251 candidates.",
  },
} as const;

export function buildNextStateLaunchReadinessReport() {
  const selected = NEXT_STATE_CANDIDATES.find((c) => c.state === NEXT_STATE_SELECTION.state)!;
  return {
    observedOn: NEXT_STATE_READINESS_OBSERVED_ON,
    baseCommit: NEXT_STATE_READINESS_BASE_COMMIT,
    ranking: NEXT_STATE_CANDIDATES.map((c) => ({
      rank: c.rank,
      state: c.state,
      totalScore: c.totalScore,
      tier1StructuralScore: c.tier1StructuralScore,
      rosterRows: c.rosterRows,
      remainingBlockers: c.remainingTier1Blockers.length,
    })),
    candidates: NEXT_STATE_CANDIDATES,
    excluded: [...NEXT_STATE_EXCLUDED_FROM_RANKING],
    selection: NEXT_STATE_SELECTION,
    selected: selected,
    developmentPreviewOnly: true as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
  };
}

export function nextStateAllowsPublication(): false {
  return false;
}

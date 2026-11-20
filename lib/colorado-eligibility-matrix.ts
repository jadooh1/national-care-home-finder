/**
 * Colorado offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const COLORADO_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const COLORADO_ELIGIBILITY_COUNTS = {
  layerRows: 5091,
  assistedLivingResidenceRows: 685,
  sampleRows: 34,
  activeLicensedBedsGt0: 646,
  zeroBeds: 27,
  pendingStatus: 15,
  hcpfCertified: 26,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const COLORADO_PUBLICATION_REQUIREMENTS = [
  {
    id: "alr-category-filter",
    requirement: "Adopt Assisted Living Residence rows without mixing other HFEMS types.",
    status: "observed-ok" as const,
    detail:
      "FeatureServer Facility_Type='Assisted Living Residence' returns 685 unique Facility_ID rows (prior note had no ALR-only count).",
  },
  {
    id: "licensing-identifier",
    requirement: "Stable unique Facility_ID per ALR row.",
    status: "observed-ok" as const,
    detail: "685/685 unique non-blank Facility_ID values (6-character HFEMS ids).",
  },
  {
    id: "physical-address",
    requirement: "Usable facility street/city/state/ZIP; do not invent addresses.",
    status: "observed-ok" as const,
    detail:
      "Address_Full present on 685/685 with CO+ZIP pattern. Field is not separately labeled physical vs mailing.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "partial" as const,
    detail:
      "Operating_Status Active(670)/Pending(15); CDPHE_HFEMS_Licensed Licensed(659)/HCPF Certified(26). Pending and HCPF Certified need explicit product rules before any eligibility.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity present; capacity ≠ availability.",
    status: "partial" as const,
    detail:
      "Licensed_Beds_Total present on all ALR rows; 27 rows have 0 beds (mostly ALR/BISL HCPF Certified). Zero-bed rows remain ineligible.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Latitude/Longitude present on all ALR rows but documented as address geocode matches, not licensing-surveyed coordinates. Not accepted as licensing coords.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from Facility_ID.",
    status: "blocked" as const,
    detail:
      "Find and Compare is a Tableau search tool. Guessed Facility_ID query params do not yield a stable detail payload. No FeatureServer disclosure URL field.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp for the roster.",
    status: "blocked" as const,
    detail:
      "Uniform Date_Data_Updated 2026-09-29, layer editingInfo 2026-10-16, and HTTP Last-Modified rejected. recordedExportDate=null.",
  },
  {
    id: "category-mapping",
    requirement: "Map CO ALR/ACF/BISL without equating them to Washington AFH.",
    status: "blocked" as const,
    detail:
      "ALR (Ch. 7) with ALR ONLY / ALR/ACF / ALR/BISL details are distinct from WA AFH. Nursing Facilities and other Factypes stay separate.",
  },
] as const;

export const COLORADO_CATEGORY_MAPPING_RISKS = [
  "Assisted Living Residence under 6 CCR 1011-1 Chapter 7 is not Washington adult family home.",
  "ALR/ACF marks Medicaid Alternative Care Facility certification on an ALR license — not a separate CDPHE license class for directory merging without a crosswalk.",
  "ALR/BISL marks Brain Injury Supported Living pairing — not WA AFH and not automatically publication-eligible.",
  "HCPF Certified rows are not interchangeable with CDPHE Licensed Active rows without an explicit product rule.",
  "Nursing Facilities, RCF-DD, ICF/IID, convalescent, PRTF, and ATU rows in the same FeatureServer are out of ALR scope for this investigation.",
  "Zero Licensed_Beds_Total rows must not be treated as available capacity.",
] as const;

export function buildColoradoEligibilityMatrix() {
  const c = COLORADO_ELIGIBILITY_COUNTS;
  return {
    observedOn: COLORADO_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "alr-filter-rows": c.assistedLivingResidenceRows,
      "sample-rows": c.sampleRows,
      "active-licensed-beds-gt0-not-eligible": c.activeLicensedBedsGt0,
      "zero-beds": c.zeroBeds,
      "publication-eligible": c.publicationEligible,
    },
    requirements: COLORADO_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...COLORADO_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}

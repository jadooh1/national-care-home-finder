/**
 * Michigan offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const MICHIGAN_ELIGIBILITY_COUNTS = {
  rosterRows: 4476,
  describedTypeRows: 4242,
  xhExemptRows: 234,
  usablePhysicalStreetRows: 57,
  blankStreetUnresolved: 4419,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const MICHIGAN_PUBLICATION_REQUIREMENTS = [
  {
    id: "physical-address",
    requirement: "Authoritative physical street address (Street column or verified definition).",
    status: "blocked" as const,
    detail: "4419 blank Street rows; supplemental/profile Address: not adopted as physical.",
  },
  {
    id: "licensing-classification",
    requirement: "Described type codes only; XH needs authoritative definition before inclusion.",
    status: "blocked" as const,
    detail: "234 XH/EXEMPT rows remain undescribed and ineligible.",
  },
  {
    id: "capacity",
    requirement: "Capacity within described numeric ranges where the record key defines ranges.",
    status: "observed-ok" as const,
    detail: "Prior/current checks: no AF/AS/AM/AL/AG/AI outside printed ranges. Capacity ≠ availability.",
  },
  {
    id: "zip-code",
    requirement: "Usable 5-digit ZIP (9-digit truncated for display only).",
    status: "observed-ok" as const,
    detail: "4369 five-digit + 107 nine-digit in current capture; originals preserved.",
  },
  {
    id: "disclosure-link",
    requirement: "FacilityProfile URL shape is known; publication still requires other blockers cleared.",
    status: "partial" as const,
    detail: "Prefix /Home/FacilityProfile/{LICENSE} verified; not sufficient alone for publication.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp for afc_sw.txt.",
    status: "blocked" as const,
    detail: "Last-Modified and daily-update notices rejected; recordedExportDate=null.",
  },
] as const;

export function buildMichiganEligibilityMatrix() {
  const c = MICHIGAN_ELIGIBILITY_COUNTS;
  return {
    observedOn: MICHIGAN_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "xh-exempt-ineligible": c.xhExemptRows,
      "blank-street-unresolved": c.blankStreetUnresolved,
      // usable streets are a subset of non-XH / mixed; tracked separately for address readiness
      "usable-street-but-blocked": c.usablePhysicalStreetRows,
      "publication-eligible": c.publicationEligible,
    },
    // blank + usable = roster; XH overlaps those address buckets
    addressResidualOk: c.blankStreetUnresolved + c.usablePhysicalStreetRows === c.rosterRows,
    typeResidualOk: c.describedTypeRows + c.xhExemptRows === c.rosterRows,
    requirements: MICHIGAN_PUBLICATION_REQUIREMENTS,
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}

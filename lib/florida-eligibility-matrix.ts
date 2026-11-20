/**
 * Florida offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const FLORIDA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const FLORIDA_ELIGIBILITY_COUNTS = {
  alfRows: 3025,
  licensed: 2253,
  inReview: 645,
  provisional: 86,
  inLitigation: 33,
  provLitigation: 4,
  inactive: 2,
  pendingDeniedRenewal: 1,
  suspended: 1,
  afchRows: 230,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const FLORIDA_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique File Number and License ID; preserve as strings.",
    status: "observed-ok" as const,
    detail:
      "3,025 unique FileNumber and LicenseID values. LicenseNumber has 3,024 unique values (one duplicate 7622 across two facilities).",
  },
  {
    id: "physical-address",
    requirement: "Street address present; do not substitute mailing.",
    status: "observed-ok" as const,
    detail:
      "Address/City/Zip present on all ALF rows; AddressType=ST on the list embed. Profile also exposes mailing AddressType=MA. County is on profile only, not the list embed.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row licensing status domain with publication rule.",
    status: "blocked" as const,
    detail:
      "LicenseStatus domain is present (LICENSED 2,253 / IN REVIEW 645 / others). IsClosed=False on all 3,025 rows including INACTIVE and SUSPENDED, so IsClosed cannot be used alone. Publication status mapping is not closed.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity present; capacity ≠ availability.",
    status: "observed-ok" as const,
    detail: "BedCount present on all rows; range 4–510; zero-capacity rows = 0.",
  },
  {
    id: "category-mapping",
    requirement: "Keep ALF, specialty licenses, and AFCH separate from WA AFH.",
    status: "blocked" as const,
    detail:
      "ALF (Ch. 429) and AFCH (≤5 residents; provider lives in home) are separate AHCA types. Specialty ECC/LMH/LNS appear on profiles only. None are equated to Washington AFH.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Latitude/Longitude present on all 3,025 list rows, but source/accuracy is undescribed. Profile mailing rows show Lat/Lon 0. Not accepted as licensing coordinates. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from a stable identifier.",
    status: "observed-ok" as const,
    detail:
      "Verified LicenseID → /Facility-Provider/Profile/?LID={LicenseID}. FileNumber → AHCA inspection details verified for ClientCode 11. LinkId/FileNumber as LID did not show the facility name.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "No ISO export date on the ALF embed. HTTP Last-Modified absent; page Date header and consumer 'updated nightly' claim rejected. Miami-Dade sample title 2026/8/24 is a county mixed-type file stamp, not a statewide ALF export date. DOH GIS layer is a May 2013 snapshot and is rejected.",
  },
] as const;

export const FLORIDA_CATEGORY_MAPPING_RISKS = [
  "Assisted Living Facility (AHCA ClientCode 11) is not Washington adult family home.",
  "Adult Family Care Home (AHCA ClientCode 52; ≤5 residents; provider lives in home) is a separate license type and is not automatically WA AFH.",
  "Specialty licenses ECC / LMH / LNS are modifiers on an ALF standard license, not separate statewide roster categories in the list embed.",
  "LicenseStatus values beyond LICENSED (IN REVIEW, PROVISIONAL, litigation, INACTIVE, SUSPENDED) need an explicit publication rule.",
  "IsClosed=False on INACTIVE/SUSPENDED rows means IsClosed is not a reliable closed-facility flag.",
  "LicenseNumber 7622 appears on two different FileNumber/LicenseID facilities and must not be treated as a unique primary key.",
] as const;

export function buildFloridaEligibilityMatrix() {
  const c = FLORIDA_ELIGIBILITY_COUNTS;
  const statusResidual =
    c.licensed
    + c.inReview
    + c.provisional
    + c.inLitigation
    + c.provLitigation
    + c.inactive
    + c.pendingDeniedRenewal
    + c.suspended;
  return {
    observedOn: FLORIDA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      licensed: c.licensed,
      "in-review": c.inReview,
      provisional: c.provisional,
      "in-litigation": c.inLitigation,
      "prov-litigation": c.provLitigation,
      inactive: c.inactive,
      "pending-denied-renewal": c.pendingDeniedRenewal,
      suspended: c.suspended,
      "afch-rows": c.afchRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    statusResidualOk: statusResidual === c.alfRows,
    requirements: FLORIDA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...FLORIDA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask AHCA for an authoritative ISO export/version stamp for the statewide Assisted Living Facility roster (or a dated bulk file that matches the FloridaHealthFinder ALF embed), without inventing a date from the nightly-update claim or the Miami-Dade sample stamp.",
  };
}

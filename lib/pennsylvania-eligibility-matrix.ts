/**
 * Pennsylvania offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const PENNSYLVANIA_ELIGIBILITY_COUNTS = {
  rosterRows: 989,
  structurallyTypedPersonalCareHomes: 989,
  usableStreetRows: 976,
  addressExceptions: 13,
  otherwiseClearOfflineEstimate: 0,
  publicationEligible: 0,
  ownerClaimEligible: 0,
  licensingCoordinates: 0,
  georeferencedRows: 989,
} as const;

export type PennsylvaniaEligibilityBucket =
  | "address-exception-offline"
  | "usable-street-but-blocked"
  | "publication-eligible";

export function classifyPennsylvaniaStreetEligibility(input: {
  street: string;
  hasLicenseNumber: boolean;
  hasStatus: boolean;
  hasExportDate: boolean;
  hasFacilityDisclosure: boolean;
}): {
  bucket: PennsylvaniaEligibilityBucket;
  publicationEligible: false;
  usableStreet: boolean;
  blockers: readonly string[];
} {
  const street = input.street.trim();
  const usableStreet = /[A-Za-z]/.test(street) && /\d/.test(street);
  const blockers: string[] = [];
  if (!input.hasLicenseNumber) blockers.push("open-data-object-id-is-not-a-license-number");
  if (!input.hasStatus) blockers.push("no-per-row-licensing-status");
  if (!input.hasExportDate) blockers.push("no-authoritative-iso-export-date");
  if (!input.hasFacilityDisclosure) blockers.push("no-per-facility-disclosure-link-is-recorded");
  if (!usableStreet) blockers.push("letter-only-street-values-are-not-corrected");
  blockers.push("georeferenced-coordinates-are-not-licensing-coordinates");

  return {
    bucket: usableStreet ? "usable-street-but-blocked" : "address-exception-offline",
    publicationEligible: false,
    usableStreet,
    blockers,
  };
}

export function buildPennsylvaniaEligibilityMatrix() {
  const counts = PENNSYLVANIA_ELIGIBILITY_COUNTS;
  return {
    observedOn: PENNSYLVANIA_ELIGIBILITY_OBSERVED_ON,
    counts,
    exclusiveBuckets: {
      "address-exception-offline": counts.addressExceptions,
      "usable-street-but-blocked": counts.usableStreetRows,
      "publication-eligible": counts.publicationEligible,
    },
    residualOk:
      counts.addressExceptions + counts.usableStreetRows + counts.publicationEligible
      === counts.rosterRows,
    offlineDoesNotGrantPublicVisibility: true as const,
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}

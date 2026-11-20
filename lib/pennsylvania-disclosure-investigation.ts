/**
 * Pennsylvania disclosure-link investigation (development-only).
 * Distinguishes generic state sites from verified facility-specific pages.
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export type PennsylvaniaDisclosureFinding = {
  id: string;
  kind: "generic-search" | "generic-directory" | "spatial-search" | "dataset-catalog" | "facility-specific";
  url: string;
  verifiedFacilitySpecific: false;
  evidence: string;
};

export const PENNSYLVANIA_DISCLOSURE_FINDINGS: readonly PennsylvaniaDisclosureFinding[] = [
  {
    id: "open-data-catalog",
    kind: "dataset-catalog",
    url: "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn",
    verifiedFacilitySpecific: false,
    evidence:
      "Open-data catalog for the statewide personal-care-home CSV. No per-facility profile URL pattern.",
  },
  {
    id: "provider-directory-home",
    kind: "generic-directory",
    url: "https://www.humanservices.dhs.pa.gov/human_service_provider_directory/",
    verifiedFacilitySpecific: false,
    evidence:
      "DHS Human Services Provider Directory entry point. Search UI only; not a facility permalink.",
  },
  {
    id: "provider-directory-search-result",
    kind: "generic-search",
    url: "https://www.humanservices.dhs.pa.gov/HUMAN_SERVICE_PROVIDER_DIRECTORY/Home/HumanServicesProviderDirectorySearchResult",
    verifiedFacilitySpecific: false,
    evidence:
      "Search-result endpoint. Inspection history is keyed by facility license number, which is absent from the open-data file.",
  },
  {
    id: "licensed-facilities-spatial-search",
    kind: "spatial-search",
    url: "https://www.humanservices.dhs.pa.gov/LicensedFacilitiesSpatialSearch/licensedfacilitiesspatialsearch.html",
    verifiedFacilitySpecific: false,
    evidence: "Spatial search map UI. Not a stable per-facility disclosure permalink.",
  },
] as const;

export function pennsylvaniaFacilityDisclosureUrl(sourceRecordId: string): null {
  void sourceRecordId;
  return null;
}

export function evaluatePennsylvaniaDisclosureInvestigation() {
  const facilitySpecific = PENNSYLVANIA_DISCLOSURE_FINDINGS.filter(f => f.kind === "facility-specific");
  return {
    observedOn: PENNSYLVANIA_DISCLOSURE_OBSERVED_ON,
    findings: PENNSYLVANIA_DISCLOSURE_FINDINGS,
    verifiedFacilitySpecificCount: facilitySpecific.length,
    disclosurePrefix: null as null,
    disclosureVerified: false as const,
    reason:
      "Open-data Object ID is not a license number. No authoritative facility-specific disclosure URL pattern is recorded.",
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

const DATASET_URL = "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn";

export const PENNSYLVANIA_GEOREFERENCE_ACCURACY = {
  "5": "interpolated-house",
  "4": "street-centroid",
  "3": "zip4-centroid",
  "1": "zip-centroid",
  X: "intersection",
} as const;

export const PENNSYLVANIA_PUBLICATION_BLOCKERS = [
  "open-data-object-id-is-not-a-license-number",
  "no-facilities-id",
  "no-per-row-licensing-status",
  "catalog-timestamp-is-not-an-export-date",
  "directory-daily-refresh-notice-is-not-an-export-date",
  "no-per-facility-disclosure-link-is-recorded",
  "letter-only-street-values-are-not-corrected",
  "street-additional-information-is-not-copied-into-the-street",
  "georeferenced-coordinates-are-not-licensing-coordinates",
] as const;

export const PENNSYLVANIA_OPTIONAL_GAPS = [
  "phone-and-capacity-fields-are-not-accepted",
] as const;

export type PennsylvaniaOnboardingRow = {
  objectId: string;
  name: string;
  street: string;
  streetAdditional: string;
  city: string;
  zip: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: string | null;
};

export type PennsylvaniaOnboardingRecord = {
  facilityId: null;
  sourceRecordId: string;
  stateCode: string;
  name: string | null;
  originalStreet: string;
  originalStreetAdditional: string;
  addressLine1: string | null;
  city: string | null;
  postalCode: string | null;
  licenseNumber: null;
  status: null;
  sourceUrl: typeof DATASET_URL;
  exportDate: null;
  disclosureUrl: null;
  georeferenced: { latitude: number; longitude: number; accuracy: string | null } | null;
  licensingCoordinates: null;
  mapSuitable: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  publicationEligible: false;
};

export function pennsylvaniaOnboardingRecord(row: PennsylvaniaOnboardingRow): PennsylvaniaOnboardingRecord {
  const street = row.street ?? "";
  return {
    facilityId: null,
    sourceRecordId: row.objectId ?? "",
    stateCode: (row.state ?? "").trim(),
    name: blankToNull(row.name),
    originalStreet: street,
    originalStreetAdditional: row.streetAdditional ?? "",
    addressLine1: usableStreet(street),
    city: blankToNull(row.city),
    postalCode: blankToNull(row.zip),
    licenseNumber: null,
    status: null,
    sourceUrl: DATASET_URL,
    exportDate: null,
    disclosureUrl: null,
    georeferenced: georeferencedPoint(row),
    licensingCoordinates: null,
    mapSuitable: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    publicationEligible: false,
  };
}

export function pennsylvaniaCoordinateSuitableForMap(accuracy: string | null): false {
  void accuracy;
  return false;
}

function usableStreet(street: string): string | null {
  const value = street.trim();
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) return value;
  return null;
}

function georeferencedPoint(row: PennsylvaniaOnboardingRow): PennsylvaniaOnboardingRecord["georeferenced"] {
  if (!finite(row.latitude) || !finite(row.longitude)) return null;
  return { latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy };
}

function finite(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function blankToNull(value: string | null): string | null {
  if (value == null) return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

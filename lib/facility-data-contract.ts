export const FACILITY_CONTRACT_FIELDS = [
  "facilityId",
  "stateCode",
  "name",
  "address",
  "license",
  "status",
  "sourceAttribution",
  "disclosureLink",
  "coordinates",
] as const;

export const US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export type UsStateCode = (typeof US_STATE_CODES)[number];
export type FieldAvailability = "present" | "absent" | "unreliable" | "not-accepted";
export type FacilityPublication = "public" | "unpublished";

export type FacilityContractViolation =
  | "missing-address"
  | "duplicate-license"
  | "invalid-state-code"
  | "unavailable-coordinates"
  | "owner-claim-outside-washington"
  | "publication-outside-washington";

export type FacilityAddress = {
  line1: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
};

export type FacilityCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

export type FacilitySourceAttribution = {
  sourceName: string | null;
  sourceUrl: string | null;
  exportDate: string | null;
};

export type FacilityDataRecord = {
  facilityId: string | null;
  stateCode: string;
  name: string | null;
  address: FacilityAddress;
  licenseNumber: string | null;
  status: string | null;
  source: FacilitySourceAttribution;
  disclosureUrl: string | null;
  coordinates: FacilityCoordinates;
  publication: FacilityPublication;
  ownerClaimEligible: boolean;
};

export type StateFieldAssessment = {
  stateCode: "WA" | "OR" | "CA";
  facilityId: FieldAvailability;
  name: FieldAvailability;
  address: FieldAvailability;
  license: FieldAvailability;
  status: FieldAvailability;
  sourceAttribution: FieldAvailability;
  disclosureLink: FieldAvailability;
  coordinates: FieldAvailability;
  publication: FacilityPublication;
  ownerClaimEligible: boolean;
  recordedGaps: readonly string[];
};

export type WashingtonListedFacility = {
  id: string;
  canonical_name: string | null;
  address_line1: string | null;
  city: string | null;
  county: string | null;
  state_code: string | null;
  postal_code: string | null;
  license_number: string | null;
  record_status: string | null;
};

export type WashingtonMapFacility = WashingtonListedFacility & {
  latitude: number | null;
  longitude: number | null;
};

const WASHINGTON_SOURCE_NAME = "wa_dshs_afh";
const WASHINGTON_SOURCE_URL = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx";
const WASHINGTON_EXPORT_DATE = "2026-11-09";
const WASHINGTON_DISCLOSURE_PREFIX = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=";
const WASHINGTON_LICENSE = /^\d{1,20}$/;
const OREGON_SOURCE_URL = "https://ltclicensing.oregon.gov/Providers";
const CALIFORNIA_SOURCE_URL = "https://data.chhs.ca.gov/dataset/ccl-facilities";

export const WASHINGTON_FIELD_ASSESSMENT: StateFieldAssessment = {
  stateCode: "WA",
  facilityId: "present",
  name: "present",
  address: "present",
  license: "present",
  status: "present",
  sourceAttribution: "present",
  disclosureLink: "present",
  coordinates: "present",
  publication: "public",
  ownerClaimEligible: true,
  recordedGaps: [],
};

export const OREGON_FIELD_ASSESSMENT: StateFieldAssessment = {
  stateCode: "OR",
  facilityId: "absent",
  name: "present",
  address: "absent",
  license: "absent",
  status: "present",
  sourceAttribution: "unreliable",
  disclosureLink: "present",
  coordinates: "absent",
  publication: "unpublished",
  ownerClaimEligible: false,
  recordedGaps: [
    "stable-id-is-source-id-not-facilities-id",
    "street-address-is-not-an-accepted-public-field",
    "postal-code-is-absent",
    "public-license-number-is-absent",
    "provider-export-has-no-date-column",
    "accepted-provider-export-has-no-coordinate-columns",
  ],
};

export const CALIFORNIA_FIELD_ASSESSMENT: StateFieldAssessment = {
  stateCode: "CA",
  facilityId: "absent",
  name: "not-accepted",
  address: "not-accepted",
  license: "not-accepted",
  status: "unreliable",
  sourceAttribution: "unreliable",
  disclosureLink: "unreliable",
  coordinates: "absent",
  publication: "unpublished",
  ownerClaimEligible: false,
  recordedGaps: [
    "no-facilities-id",
    "address-and-contact-fields-are-not-accepted",
    "no-facility-type-is-accepted",
    "open-data-status-is-historical-file-text",
    "confirmed-live-status-conflicts-remain",
    "no-authoritative-iso-export-date",
    "profile-url-is-not-adopted",
    "detail-route-was-observed-for-two-examples-without-status-confirmation",
    "open-data-has-no-coordinate-columns",
  ],
};

export function stateFieldAssessment(stateCode: string): StateFieldAssessment | null {
  if (stateCode === "WA") return WASHINGTON_FIELD_ASSESSMENT;
  if (stateCode === "OR") return OREGON_FIELD_ASSESSMENT;
  if (stateCode === "CA") return CALIFORNIA_FIELD_ASSESSMENT;
  return null;
}

export function washingtonFacilityRecord(row: WashingtonListedFacility | WashingtonMapFacility): FacilityDataRecord {
  const license = blankToNull(row.license_number);
  return {
    facilityId: blankToNull(row.id),
    stateCode: (row.state_code ?? "").trim(),
    name: blankToNull(row.canonical_name),
    address: {
      line1: blankToNull(row.address_line1),
      city: blankToNull(row.city),
      county: blankToNull(row.county),
      postalCode: blankToNull(row.postal_code),
    },
    licenseNumber: license,
    status: blankToNull(row.record_status),
    source: {
      sourceName: WASHINGTON_SOURCE_NAME,
      sourceUrl: WASHINGTON_SOURCE_URL,
      exportDate: WASHINGTON_EXPORT_DATE,
    },
    disclosureUrl: license ? washingtonContractDisclosureUrl(license) : null,
    coordinates: coordinatesFrom(row),
    publication: "public",
    ownerClaimEligible: true,
  };
}

function coordinatesFrom(row: WashingtonListedFacility | WashingtonMapFacility): FacilityCoordinates {
  if (!("latitude" in row) || !("longitude" in row)) return { latitude: null, longitude: null };
  return { latitude: row.latitude, longitude: row.longitude };
}

function washingtonContractDisclosureUrl(license: string): string | null {
  const value = license.trim();
  if (!WASHINGTON_LICENSE.test(value)) return null;
  return `${WASHINGTON_DISCLOSURE_PREFIX}${encodeURIComponent(value)}`;
}

export function facilityContractViolations(records: readonly FacilityDataRecord[]): FacilityContractViolation[] {
  const found = new Set<FacilityContractViolation>();
  const licenses = new Map<string, number>();
  for (const record of records) {
    for (const violation of recordViolations(record)) found.add(violation);
    const license = record.licenseNumber?.trim() ?? "";
    if (!license || !isUsStateCode(record.stateCode)) continue;
    const key = `${record.stateCode}:${license}`;
    licenses.set(key, (licenses.get(key) ?? 0) + 1);
  }
  for (const count of licenses.values()) {
    if (count > 1) found.add("duplicate-license");
  }
  return FACILITY_VIOLATION_ORDER.filter(violation => found.has(violation));
}

const FACILITY_VIOLATION_ORDER = [
  "missing-address",
  "duplicate-license",
  "invalid-state-code",
  "unavailable-coordinates",
  "owner-claim-outside-washington",
  "publication-outside-washington",
] as const satisfies readonly FacilityContractViolation[];

function recordViolations(record: FacilityDataRecord): FacilityContractViolation[] {
  const violations: FacilityContractViolation[] = [];
  if (!record.address.line1) violations.push("missing-address");
  if (!isUsStateCode(record.stateCode)) violations.push("invalid-state-code");
  if (!availableCoordinates(record.coordinates)) violations.push("unavailable-coordinates");
  if (record.ownerClaimEligible && record.stateCode !== "WA") violations.push("owner-claim-outside-washington");
  if (record.publication === "public" && record.stateCode !== "WA") violations.push("publication-outside-washington");
  return violations;
}

export function isUsStateCode(value: string): value is UsStateCode {
  return (US_STATE_CODES as readonly string[]).includes(value);
}

export function availableCoordinates(coordinates: FacilityCoordinates): boolean {
  return finiteCoordinate(coordinates.latitude) && finiteCoordinate(coordinates.longitude);
}

function finiteCoordinate(value: number | null): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function blankToNull(value: string | null): string | null {
  if (value == null) return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

export const OREGON_CONTRACT_SOURCE: FacilitySourceAttribution = {
  sourceName: null,
  sourceUrl: OREGON_SOURCE_URL,
  exportDate: null,
};

export const CALIFORNIA_CONTRACT_SOURCE: FacilitySourceAttribution = {
  sourceName: null,
  sourceUrl: CALIFORNIA_SOURCE_URL,
  exportDate: null,
};

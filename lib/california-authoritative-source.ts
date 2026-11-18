const FACILITY_NUMBER = /^(?:[1-9][0-9]{7}|[1-9][0-9]{8})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ADDRESS_PLACEHOLDERS = ["See FAQs", "Unavailable"] as const;

export const CALIFORNIA_AUTHORITATIVE_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";
export const CALIFORNIA_AUTHORITATIVE_PAGE =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_LIVE_ADDRESS_FIELDS = ["STREETADDRESS", "CITY", "ZIPCODE"] as const;
export const CALIFORNIA_LIVE_IDENTIFIER_FIELD = "FACILITYNUMBER";
export const CALIFORNIA_LIVE_STATUS_FIELD = "STATUS";

export const CALIFORNIA_LIVE_RECHECK = {
  observedOn: "2026-11-13",
  rcfe: "datastore-http-500",
  arf: "completed",
  repeatedAfterFailure: false,
  arfCategoryMatched: true,
  arfKnownConflictText: true,
  arfLicensedLabel: false,
  arfIsoDate: false,
  arfAddressKeyPresent: true,
  addressAccepted: false,
  exportDateAdopted: false,
} as const;

export type CaliforniaLiveDetail = {
  facilityNumber: string;
  facilityType: string;
  status: string;
  streetAddress: string | null;
  dateValues: readonly string[];
};

export type CaliforniaLiveClassification = {
  officialIdentifier: string | null;
  originalStatus: string;
  officialPageUrl: string | null;
  acceptedAddress: null;
  exportDate: null;
  addressUsable: boolean;
  isoDatePresent: boolean;
  currentlyActive: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};

export function californiaStreetUsable(streetAddress: string | null): boolean {
  const street = (streetAddress ?? "").trim();
  if (!street) return false;
  return !(ADDRESS_PLACEHOLDERS as readonly string[]).includes(street);
}

export function californiaIsoDate(values: readonly string[]): string | null {
  for (const value of values) {
    const text = value.trim();
    if (ISO_DATE.test(text)) return text;
  }
  return null;
}

export function classifyCaliforniaLiveDetail(detail: CaliforniaLiveDetail): CaliforniaLiveClassification {
  const identifier = detail.facilityNumber.trim();
  const officialIdentifier = FACILITY_NUMBER.test(identifier) ? identifier : null;
  return {
    officialIdentifier,
    originalStatus: detail.status,
    officialPageUrl: officialIdentifier ? `${CALIFORNIA_AUTHORITATIVE_PAGE}${officialIdentifier}` : null,
    acceptedAddress: null,
    exportDate: null,
    addressUsable: californiaStreetUsable(detail.streetAddress),
    isoDatePresent: californiaIsoDate(detail.dateValues) !== null,
    currentlyActive: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export function openDataLicensedIsCurrent(): false {
  return false;
}

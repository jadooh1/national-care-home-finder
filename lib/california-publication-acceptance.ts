const FACILITY_NUMBER = /^(?:[1-9][0-9]{7}|[1-9][0-9]{8})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FIVE_DIGIT_ZIP = /^\d{5}$/;
const ADDRESS_PLACEHOLDERS = ["See FAQs", "Unavailable"] as const;
const PAGE_PREFIX = "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_RCFE_PUBLICATION_CATEGORIES = [
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
] as const;

export const CALIFORNIA_ARF_PUBLICATION_CATEGORIES = [
  "ADULT RESIDENTIAL",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
] as const;

export const CALIFORNIA_MANDATORY_UNRESOLVED = [
  "no-facilities-id",
  "facility-name-not-accepted",
  "no-authoritative-iso-export-date",
] as const;

export const CALIFORNIA_OPTIONAL_PUBLICATION_GAPS = [
  "coordinates",
] as const;

export const CALIFORNIA_FILE_EXPORT_DATE = null;

export type CaliforniaDateProvenance =
  | "authoritative-export"
  | "open-data-file-date"
  | "catalog-timestamp"
  | "license-date"
  | "visit-date"
  | "report-date"
  | "absent";

export type CaliforniaAcceptanceInput = {
  file: "RCFE" | "ARF";
  originalFacilityNumber: string;
  liveFacilityNumber: string | null;
  originalCategory: string;
  liveFacilityType: string | null;
  originalStatus: string;
  liveStatus: string | null;
  liveHttpStatus: number | null;
  identifierMatched: boolean;
  streetAddress: string | null;
  city: string | null;
  zipCode: string | null;
  sourceDate: string | null;
  sourceDateProvenance: CaliforniaDateProvenance;
  disclosureUrl: string | null;
  coordinatesPresent: boolean;
};

export type CaliforniaAcceptance = {
  accepted: false;
  acceptedLicense: null;
  acceptedName: null;
  acceptedAddress: null;
  acceptedStatus: null;
  exportDate: null;
  officialIdentifier: string | null;
  officialPageUrl: string | null;
  originals: {
    facilityNumber: string;
    category: string;
    status: string;
    streetAddress: string | null;
    sourceDate: string | null;
    sourceDateProvenance: CaliforniaDateProvenance;
  };
  fieldFailures: string[];
  mandatoryUnresolved: readonly string[];
  optionalMissing: string[];
};

const FIELD_FAILURE_ORDER = [
  "official-facility-identifier",
  "live-identifier-matches-source",
  "accepted-category",
  "live-category-matches-source",
  "current-status-from-detail-api",
  "live-status-licensed",
  "no-status-conflict",
  "usable-street-address",
  "city-present",
  "five-digit-zip",
  "authoritative-export-date",
  "facility-specific-disclosure-link",
] as const;

export function californiaPublicationAcceptance(input: CaliforniaAcceptanceInput): CaliforniaAcceptance {
  const originalNumber = input.originalFacilityNumber ?? "";
  const liveNumber = (input.liveFacilityNumber ?? "").trim();
  const officialIdentifier = FACILITY_NUMBER.test(originalNumber.trim()) && originalNumber.trim() === liveNumber
    ? originalNumber.trim()
    : FACILITY_NUMBER.test(originalNumber.trim()) ? originalNumber.trim() : null;
  const failures: string[] = [];
  if (!FACILITY_NUMBER.test(originalNumber.trim())) failures.push("official-facility-identifier");
  if (!input.identifierMatched || liveNumber === "" || liveNumber !== originalNumber.trim()) {
    failures.push("live-identifier-matches-source");
  }
  const categories = input.file === "RCFE" ? CALIFORNIA_RCFE_PUBLICATION_CATEGORIES : CALIFORNIA_ARF_PUBLICATION_CATEGORIES;
  if (!(categories as readonly string[]).includes(input.originalCategory)) failures.push("accepted-category");
  if (!input.liveFacilityType || input.liveFacilityType !== input.originalCategory) failures.push("live-category-matches-source");
  const liveStatus = (input.liveStatus ?? "").trim();
  const detailAvailable = input.liveHttpStatus === 200 && input.identifierMatched && liveStatus !== "";
  if (!detailAvailable) failures.push("current-status-from-detail-api");
  if (liveStatus !== "Licensed") failures.push("live-status-licensed");
  if (!detailAvailable || !statusesAgree(input.originalStatus, liveStatus)) failures.push("no-status-conflict");
  if (!usableStreet(input.streetAddress)) failures.push("usable-street-address");
  if ((input.city ?? "").trim() === "") failures.push("city-present");
  if (!FIVE_DIGIT_ZIP.test((input.zipCode ?? "").trim())) failures.push("five-digit-zip");
  if (!authoritativeExportDate(input)) failures.push("authoritative-export-date");
  const officialPageUrl = officialIdentifier && FACILITY_NUMBER.test(officialIdentifier)
    ? `${PAGE_PREFIX}${officialIdentifier}`
    : null;
  if (!officialPageUrl || input.disclosureUrl !== officialPageUrl) failures.push("facility-specific-disclosure-link");
  return {
    accepted: false,
    acceptedLicense: null,
    acceptedName: null,
    acceptedAddress: null,
    acceptedStatus: null,
    exportDate: null,
    officialIdentifier: FACILITY_NUMBER.test(originalNumber.trim()) ? originalNumber.trim() : null,
    officialPageUrl,
    originals: {
      facilityNumber: originalNumber,
      category: input.originalCategory,
      status: input.originalStatus,
      streetAddress: input.streetAddress,
      sourceDate: input.sourceDate,
      sourceDateProvenance: input.sourceDateProvenance,
    },
    fieldFailures: FIELD_FAILURE_ORDER.filter(failure => failures.includes(failure)),
    mandatoryUnresolved: CALIFORNIA_MANDATORY_UNRESOLVED,
    optionalMissing: input.coordinatesPresent ? [] : ["coordinates"],
  };
}

export function usableStreet(streetAddress: string | null): boolean {
  const street = (streetAddress ?? "").trim();
  if (!street) return false;
  return !(ADDRESS_PLACEHOLDERS as readonly string[]).includes(street);
}

function statusesAgree(openDataStatus: string, liveStatus: string): boolean {
  if (openDataStatus === "LICENSED") return liveStatus === "Licensed";
  if (openDataStatus === "PENDING") return liveStatus === "Pending";
  if (openDataStatus === "ON PROBATION") return liveStatus === "Probation";
  if (openDataStatus === "CLOSED") return liveStatus.includes("Closed");
  return false;
}

function authoritativeExportDate(input: CaliforniaAcceptanceInput): boolean {
  if (input.sourceDate == null || !isCalendarDate(input.sourceDate)) return false;
  if (input.sourceDateProvenance !== "authoritative-export") return false;
  return CALIFORNIA_FILE_EXPORT_DATE !== null && input.sourceDate === CALIFORNIA_FILE_EXPORT_DATE;
}

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

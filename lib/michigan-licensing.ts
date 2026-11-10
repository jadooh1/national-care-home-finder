const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LICENSE_SHAPE = /^[A-Z]{2}\d{9}$/;
const FIVE_DIGIT_ZIP = /^\d{5}$/;
const NINE_DIGIT_ZIP = /^\d{9}$/;
const EIGHT_DIGIT_DATE = /^\d{8}$/;

export const MICHIGAN_PROFILE_PREFIX = "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/";
export const MICHIGAN_POSITIONAL_FIELDS = 31;
export const MICHIGAN_RECORDED_EXPORT_DATE = null;
export const MICHIGAN_FILE_SERVER_CLOCK = "Mon, 09 Nov 2026 03:38:41 GMT";

const TYPE = 1;
const LICENSE = 2;
const NAME = 3;
const SUPPLEMENTAL = 4;
const STREET = 5;
const CITY = 6;
const STATE = 7;
const ZIP = 8;
const PHONE = 9;
const CAPACITY = 10;
const EFFECTIVE = 11;
const EXPIRATION = 12;
const STATUS = 13;

export const MICHIGAN_DESCRIBED_TYPES = [
  { code: "AF", label: "Family home (capacity 1-6)", minimumCapacity: 1, maximumCapacity: 6 },
  { code: "AS", label: "Small group (capacity 1-6)", minimumCapacity: 1, maximumCapacity: 6 },
  { code: "AM", label: "Medium group (capacity 7-12)", minimumCapacity: 7, maximumCapacity: 12 },
  { code: "AL", label: "Large group (capacity 13-20)", minimumCapacity: 13, maximumCapacity: 20 },
  { code: "AG", label: "Congregate (capacity greater than 20)", minimumCapacity: 21, maximumCapacity: null },
  { code: "AI", label: "County infirmary (capacity greater than 20)", minimumCapacity: 21, maximumCapacity: null },
  { code: "AH", label: "Home for the aged", minimumCapacity: null, maximumCapacity: null },
] as const;

export const MICHIGAN_UNDESCRIBED_TYPE = "XH";

const DESCRIBED = new Set<string>(MICHIGAN_DESCRIBED_TYPES.map(type => type.code));
const RANGE = new Map<string, { minimumCapacity: number | null; maximumCapacity: number | null }>(
  MICHIGAN_DESCRIBED_TYPES.filter(type => type.minimumCapacity != null).map(type => [type.code, type]),
);

export const MICHIGAN_OFFICIAL_VALIDATION = {
  rows: 4480,
  describedRows: 4246,
  undescribedRows: 234,
  types: { AF: 421, AS: 2487, AM: 425, AL: 556, AG: 4, AI: 2, AH: 351, XH: 234 },
  statuses: { REGULAR: 4001, TEMPORARY: 181, "1ST PROVISIONAL": 62, EXEMPT: 234, NONE: 2 },
  stateMi: 4480,
  fiveDigitZips: 4373,
  nineDigitZips: 107,
  supplementalLetterAndDigit: 4460,
  supplementalLetterOnly: 19,
  supplementalDigitOnly: 1,
  streetBlank: 4423,
  streetLetterAndDigit: 57,
  blankNames: 0,
  blankCities: 0,
  blankLicenses: 0,
  duplicateLicenses: 0,
  profileShapeMatches: 4480,
  phoneBlank: 8,
  capacityDigits: 4480,
  capacityOutsideDescribedRange: 0,
  eightDigitDatePairs: 4246,
  blankDatePairs: 234,
  distinctEightDigitEffectiveDates: 763,
  distinctEightDigitExpirationDates: 777,
  slashDates: 0,
  isoDates: 0,
  profilePathsRequested: 8,
  profilePathsReturned200: 8,
} as const;

export const MICHIGAN_ADDRESS_FIELD_KEY = {
  supplemental: "Facility Supplemental Address",
  street: "Street Address",
  licensee: "Licensee Address",
  licenseeSupplemental: "Licensee Supplemental Address",
} as const;

export const MICHIGAN_ADDRESS_INTERPRETATION = "unresolved" as const;

export const MICHIGAN_STREET_TEXT_BY_TYPE = {
  AF: 6,
  AS: 17,
  AM: 7,
  AL: 19,
  AG: 0,
  AI: 0,
  AH: 6,
  XH: 2,
} as const;

export const MICHIGAN_ADDRESS_COUNTS = {
  usablePhysicalStreetRows: 57,
  describedUsablePhysicalStreetRows: 55,
  undescribedStreetTextRows: 2,
  unresolvedBlankStreetRows: 4423,
  publicationEligibleRows: 0,
  supplementalEqualsLicenseeAddress: 904,
  streetEqualsLicenseeAddress: 4,
  supplementalEqualsStreet: 0,
  profileShowsStreetBeforeSupplemental: 56,
  profileShowsSupplementalBeforeStreet: 1,
} as const;

export function usablePhysicalStreet(street: string): string | null {
  const value = street.trim();
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) return value;
  return null;
}

export function retainedAddressFields(row: { street: string; supplemental: string }) {
  return {
    street: row.street,
    supplemental: row.supplemental,
    usablePhysicalStreet: usablePhysicalStreet(row.street),
    publicationEligible: false as const,
  };
}

export type MichiganRowCheck = {
  typeCode: string;
  describedType: boolean;
  status: string;
  licenseId: string;
  originalZip: string;
  normalizedZip: string | null;
  profileUrl: string | null;
};

export type MichiganValidationReport = {
  rowsRead: number;
  positionalFieldsOk: boolean;
  describedRows: number;
  undescribedRows: number;
  blankNames: number;
  blankCities: number;
  blankLicenses: number;
  duplicateLicenses: number;
  profileShapeMatches: number;
  fiveDigitZips: number;
  nineDigitZips: number;
  supplementalLetterAndDigit: number;
  supplementalLetterOnly: number;
  supplementalDigitOnly: number;
  streetBlank: number;
  streetLetterAndDigit: number;
  phoneBlank: number;
  capacityOutsideDescribedRange: number;
  eightDigitDatePairs: number;
  blankDatePairs: number;
  slashDates: number;
  isoDates: number;
  distinctEightDigitEffectiveDates: number;
  originalFieldsRewritten: false;
  recordedExportDate: null;
  coordinateColumns: false;
  availabilityInferred: false;
  directoryReady: false;
  rows: MichiganRowCheck[];
};

export function normalizedZip(original: string): string | null {
  const value = original.trim();
  if (FIVE_DIGIT_ZIP.test(value)) return value;
  if (NINE_DIGIT_ZIP.test(value)) return value.slice(0, 5);
  return null;
}

export function michiganFacilityProfileUrl(license: string): string | null {
  if (!LICENSE_SHAPE.test(license)) return null;
  return `${MICHIGAN_PROFILE_PREFIX}${license}`;
}

export function adoptMichiganExportDate(recorded: string | null, rawDates: readonly string[]): string | null {
  if (recorded == null || !ISO_DATE.test(recorded)) return null;
  if (!rawDates.includes(recorded)) return null;
  return recorded;
}

export function michiganDirectoryReady(): false {
  return false;
}

export function validateMichiganRoster(table: readonly (readonly string[])[]): MichiganValidationReport {
  const data = table.filter(row => row.some(cell => cell.trim() !== ""));
  const positionalFieldsOk = data.every(row => row.length === MICHIGAN_POSITIONAL_FIELDS);
  const seen = new Map<string, number>();
  const effectiveDates = new Set<string>();
  let describedRows = 0;
  let undescribedRows = 0;
  let blankNames = 0;
  let blankCities = 0;
  let blankLicenses = 0;
  let profileShapeMatches = 0;
  let fiveDigitZips = 0;
  let nineDigitZips = 0;
  let supplementalLetterAndDigit = 0;
  let supplementalLetterOnly = 0;
  let supplementalDigitOnly = 0;
  let streetBlank = 0;
  let streetLetterAndDigit = 0;
  let phoneBlank = 0;
  let capacityOutsideDescribedRange = 0;
  let eightDigitDatePairs = 0;
  let blankDatePairs = 0;
  let slashDates = 0;
  let isoDates = 0;
  const rows = data.map(row => {
    const typeCode = cell(row, TYPE);
    const licenseId = cell(row, LICENSE);
    const describedType = DESCRIBED.has(typeCode);
    if (describedType) describedRows += 1;
    if (typeCode === MICHIGAN_UNDESCRIBED_TYPE) undescribedRows += 1;
    if (cell(row, NAME) === "") blankNames += 1;
    if (cell(row, CITY) === "") blankCities += 1;
    if (licenseId === "") blankLicenses += 1;
    else seen.set(licenseId, (seen.get(licenseId) ?? 0) + 1);
    const profileUrl = michiganFacilityProfileUrl(licenseId);
    if (profileUrl && licenseId.slice(0, 2) === typeCode) profileShapeMatches += 1;
    const originalZip = cell(row, ZIP);
    if (FIVE_DIGIT_ZIP.test(originalZip)) fiveDigitZips += 1;
    if (NINE_DIGIT_ZIP.test(originalZip)) nineDigitZips += 1;
    const supplemental = textClass(cell(row, SUPPLEMENTAL));
    if (supplemental === "letter-and-digit") supplementalLetterAndDigit += 1;
    if (supplemental === "letter-only") supplementalLetterOnly += 1;
    if (supplemental === "digit-only") supplementalDigitOnly += 1;
    const street = textClass(cell(row, STREET));
    if (street === "blank") streetBlank += 1;
    if (street === "letter-and-digit") streetLetterAndDigit += 1;
    if (cell(row, PHONE) === "") phoneBlank += 1;
    if (outsideDescribedRange(typeCode, cell(row, CAPACITY))) capacityOutsideDescribedRange += 1;
    const effective = cell(row, EFFECTIVE);
    const expiration = cell(row, EXPIRATION);
    if (EIGHT_DIGIT_DATE.test(effective) && EIGHT_DIGIT_DATE.test(expiration)) {
      eightDigitDatePairs += 1;
      effectiveDates.add(effective);
    }
    if (effective === "" && expiration === "") blankDatePairs += 1;
    if (effective.includes("/") || expiration.includes("/")) slashDates += 1;
    if (ISO_DATE.test(effective) || ISO_DATE.test(expiration)) isoDates += 1;
    return {
      typeCode,
      describedType,
      status: cell(row, STATUS),
      licenseId,
      originalZip,
      normalizedZip: normalizedZip(originalZip),
      profileUrl,
    };
  });
  return {
    rowsRead: rows.length,
    positionalFieldsOk,
    describedRows,
    undescribedRows,
    blankNames,
    blankCities,
    blankLicenses,
    duplicateLicenses: [...seen.values()].filter(count => count > 1).length,
    profileShapeMatches,
    fiveDigitZips,
    nineDigitZips,
    supplementalLetterAndDigit,
    supplementalLetterOnly,
    supplementalDigitOnly,
    streetBlank,
    streetLetterAndDigit,
    phoneBlank,
    capacityOutsideDescribedRange,
    eightDigitDatePairs,
    blankDatePairs,
    slashDates,
    isoDates,
    distinctEightDigitEffectiveDates: effectiveDates.size,
    originalFieldsRewritten: false,
    recordedExportDate: null,
    coordinateColumns: false,
    availabilityInferred: false,
    directoryReady: false,
    rows,
  };
}

function outsideDescribedRange(typeCode: string, capacity: string): boolean {
  const range = RANGE.get(typeCode);
  if (!range || !/^\d+$/.test(capacity)) return false;
  const value = Number(capacity);
  if (range.minimumCapacity != null && value < range.minimumCapacity) return true;
  if (range.maximumCapacity != null && value > range.maximumCapacity) return true;
  return false;
}

function textClass(value: string): "blank" | "letter-and-digit" | "letter-only" | "digit-only" | "other" {
  if (value === "") return "blank";
  const letter = /[A-Za-z]/.test(value);
  const digit = /\d/.test(value);
  if (letter && digit) return "letter-and-digit";
  if (letter) return "letter-only";
  if (digit) return "digit-only";
  return "other";
}

function cell(row: readonly string[], index: number): string {
  return (row[index] ?? "").trim();
}

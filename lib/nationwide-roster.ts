export type IdentifierType = "license" | "certification" | "source-id" | "facility-id" | "object-id";
export type AddressRole = "physical" | "mailing" | "supplemental" | "unverified";
export type DisclosureKind = "facility-specific" | "generic-search" | "unverified-pattern";
export type CoordinateSource = "licensing" | "georeferenced" | "absent";
export type RosterPublication = "public" | "development" | "unpublished";

export type RosterAddress = {
  role: AddressRole;
  value: string | null;
  provenance: string | null;
};

export type ProposedRosterRecord = {
  licenseIdentifier: string | null;
  certificationIdentifier: string | null;
  facilityIdentifier: string | null;
  identifierType: IdentifierType | null;
  issuingAuthority: string | null;
  sourceRecordId: string | null;
  addresses: readonly RosterAddress[];
  officialExportDate: string | null;
  sourcePublicationDate: string | null;
  retrievalTimestamp: string | null;
  freshnessVerified: boolean;
  originalCategory: string | null;
  normalizedCategory: string | null;
  originalStatus: string | null;
  normalizedStatus: string | null;
  disclosureUrl: string | null;
  disclosureKind: DisclosureKind | null;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: CoordinateSource;
  coordinateAccuracy: string | null;
  publication: RosterPublication;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ROSTER_MIGRATION_PROPOSAL = {
  applied: false,
  executed: false,
  proposalSql: "supabase/proposals/20261110090000_nationwide_roster_development.sql",
  rollbackSql: "supabase/proposals/20261110090000_nationwide_roster_development_ROLLBACK.sql",
  migrationFile: null,
} as const;

function presentText(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

export function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function rosterViolations(record: ProposedRosterRecord): string[] {
  const violations: string[] = [];
  const physical = record.addresses.filter(item => item.role === "physical" && item.value);
  const mailing = record.addresses.filter(item => item.role === "mailing" && item.value);
  const supplemental = record.addresses.filter(item => item.role === "supplemental" && item.value);
  const unverified = record.addresses.filter(item => item.role === "unverified" && item.value);

  if (record.identifierType === "license" && !presentText(record.licenseIdentifier)) violations.push("license-identifier-missing");
  if (record.identifierType === "license" && presentText(record.certificationIdentifier)) violations.push("license-record-contains-a-certification");
  if (record.identifierType === "certification" && !presentText(record.certificationIdentifier)) violations.push("certification-identifier-missing");
  if (record.identifierType === "certification" && presentText(record.licenseIdentifier)) violations.push("certification-is-not-stored-as-a-license");
  if (record.identifierType === "facility-id" && !presentText(record.facilityIdentifier)) violations.push("facility-identifier-missing");
  if (record.identifierType === "facility-id" && (presentText(record.licenseIdentifier) || presentText(record.certificationIdentifier))) {
    violations.push("facility-id-is-not-a-license");
  }
  if (record.identifierType === "object-id" && (presentText(record.licenseIdentifier) || presentText(record.certificationIdentifier))) {
    violations.push("object-id-is-not-a-regulatory-identifier");
  }
  if ((record.identifierType === "object-id" || record.identifierType === "source-id") && !presentText(record.sourceRecordId)) {
    violations.push("source-record-id-missing");
  }
  if ((record.identifierType === "license" || record.identifierType === "certification" || record.identifierType === "facility-id") && !presentText(record.issuingAuthority)) {
    violations.push("identifier-needs-an-issuing-authority");
  }
  if (record.sourceRecordId && record.identifierType === "object-id" && record.sourceRecordId === record.licenseIdentifier) {
    violations.push("source-record-id-collapsed-into-regulatory-identifier");
  }
  if (physical.some(item => mailing.some(other => other.value === item.value))) violations.push("mailing-address-copied-into-physical");
  if (physical.some(item => supplemental.some(other => other.value === item.value))) violations.push("supplemental-address-copied-into-physical");
  if (physical.some(item => unverified.some(other => other.value === item.value))) violations.push("unverified-address-copied-into-physical");
  if (record.addresses.some(item => item.value && !item.provenance)) violations.push("address-missing-provenance");
  if (record.officialExportDate && !ISO_DATE.test(record.officialExportDate)) violations.push("official-export-date-is-not-iso");
  if (record.officialExportDate && ISO_DATE.test(record.officialExportDate) && !isCalendarDate(record.officialExportDate)) violations.push("official-export-date-is-impossible");
  if (record.sourcePublicationDate && ISO_DATE.test(record.sourcePublicationDate) && !isCalendarDate(record.sourcePublicationDate)) violations.push("source-publication-date-is-impossible");
  if (record.retrievalTimestamp && record.officialExportDate === record.retrievalTimestamp) violations.push("retrieval-timestamp-used-as-export-date");
  if (record.sourcePublicationDate && record.officialExportDate === record.sourcePublicationDate && !ISO_DATE.test(record.sourcePublicationDate)) {
    violations.push("source-publication-date-used-as-export-date");
  }
  if (record.freshnessVerified && !record.officialExportDate) violations.push("freshness-verified-without-official-export-date");
  if (record.disclosureKind === "facility-specific" && !record.disclosureUrl) violations.push("facility-disclosure-missing-url");
  if (record.publication === "public" && record.disclosureKind !== "facility-specific") violations.push("public-record-lacks-facility-disclosure");
  if (record.normalizedCategory && !record.originalCategory) violations.push("normalized-category-without-original");
  if (record.normalizedStatus && !record.originalStatus) violations.push("normalized-status-without-original");
  if (record.coordinateSource === "absent" && (record.latitude !== null || record.longitude !== null)) violations.push("coordinates-without-source");
  if ((record.latitude === null) !== (record.longitude === null)) violations.push("coordinates-are-incomplete");
  if ((record.latitude !== null || record.longitude !== null) && !record.coordinateAccuracy) violations.push("coordinates-missing-accuracy");
  if (record.coordinateSource === "georeferenced" && record.publication === "public") violations.push("georeferenced-coordinates-cannot-publish-a-map");
  return violations;
}

export function publicPublicationAllowed(record: ProposedRosterRecord): boolean {
  return record.publication === "public"
    && record.freshnessVerified
    && record.disclosureKind === "facility-specific"
    && record.officialExportDate !== null
    && isCalendarDate(record.officialExportDate)
    && rosterViolations(record).length === 0;
}

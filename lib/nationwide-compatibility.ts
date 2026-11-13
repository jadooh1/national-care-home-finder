export type CompatibilityClass = "A" | "B" | "C" | "D";
export type CompatibilityPublication = "public" | "development" | "unpublished";
export type CompatibilityConfidence = "high" | "medium";
export type EvidenceObservation = "present" | "absent" | "not-verified" | "rejected";
export type EvidenceConfidence = CompatibilityConfidence | "low";

export const EVIDENCE_FIELDS = [
  "regulatory-identifier",
  "identifier-type",
  "issuing-authority",
  "source-record-id",
  "physical-address",
  "mailing-address",
  "supplemental-address",
  "unverified-address",
  "official-export-date",
  "source-publication-date",
  "retrieval-timestamp",
  "freshness-verification",
  "facility-disclosure",
  "generic-search",
  "unverified-url-pattern",
  "original-category",
  "original-status",
  "normalized-category",
  "normalized-status",
  "coordinates",
  "coordinate-source",
  "coordinate-accuracy",
] as const;

export type EvidenceField = (typeof EVIDENCE_FIELDS)[number];

export type FieldEvidence = {
  field: EvidenceField;
  observation: EvidenceObservation;
  confidence: EvidenceConfidence;
  detail: string | null;
};

export type StateCompatibility = {
  state: string;
  compatibility: CompatibilityClass;
  publication: CompatibilityPublication;
  publicationReady: boolean;
  source: string | null;
  sourceUrl: string | null;
  observedRows: number | null;
  licenseIdentifier: boolean | null;
  physicalAddress: boolean | null;
  perRowStatus: boolean | null;
  disclosureLink: boolean | null;
  isoExportDate: boolean | null;
  coordinateColumns: boolean | null;
  adjustment: string;
  confidence: CompatibilityConfidence;
  evidence: readonly FieldEvidence[];
};

export const DIRECTORY_REQUIRES_COORDINATES = false;

export const SCHEMA_UPGRADE = {
  applied: false,
  migrationFile: null,
  approach: "additive-roster-contract",
} as const;

const ASSESSMENTS = [
  row("Alabama", "C", "unpublished", "Alabama Department of Public Health facility directory", "https://www.alabamapublichealth.gov/providerstandards/directory.html", null, false, null, null, null, null, "medium", "The directory is a search by facility type. A license identifier was not observed."),
  row("Alaska", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Arizona", "C", "unpublished", "Arizona provider search and mixed facility map layer", null, null, null, null, null, null, null, "medium", "Access is a provider search plus a mixed map layer. No licensing file was adopted."),
  row("Arkansas", "C", "unpublished", "Arkansas long-term care, rehabilitation, nursing, and assisted living list", "https://healthy.arkansas.gov/wp-content/uploads/Arkansas_LTC_Rehab_Nursing_Assisted_Living_Facility_List.pdf", null, false, true, null, null, null, "medium", "The list mixes facility types. The identifier was not verified as a state license number."),
  row("California", "B", "unpublished", "CDSS RCFE and ARF open-data files", null, 23020, true, true, true, true, false, "high", "License, name, address, status, and capacity exist across two files. The official facility-number route identifies a facility, but the checked live status text did not match the open-data status. Excluded rows stay unchanged. The raw file date, the temporal-coverage phrase, and the GIS service clock are not an export date. The GIS status code has no published domain."),
  row("Colorado", "C", "unpublished", "Colorado mixed health-facility open data", null, null, null, null, null, null, null, "medium", "The official layer mixes health-facility types. No assisted-living-only row count was adopted."),
  row("Connecticut", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Delaware", "B", "unpublished", "Delaware licensed assisted living facilities page", "https://dhss.delaware.gov/dhcq/dhcq/licensed-assisted-living-facilities/", null, true, true, false, false, false, "medium", "The HTML listing shows license number, address, and beds. It is not a delimited file, and it has no per-row status or disclosure prefix."),
  row("Florida", "C", "unpublished", "FloridaHealthFinder assisted living comparison", "https://quality.healthfinder.fl.gov/compare-tools/ALF", null, null, null, null, null, null, "medium", "The official tool is a comparison search. No licensing file was opened."),
  row("Georgia", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Hawaii", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Idaho", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Illinois", "B", "unpublished", "IDPH assisted living and shared housing licensed establishments", "https://data.illinois.gov/Health-and-Human-Services/IDPH-Assisted-Living-and-Shared-Housing-Licensed-E/8z4a-ix8q", 495, true, true, false, false, false, "high", "All 495 rows have a license number and address. There is no per-row status or disclosure prefix. The portal time 2024-02-16 is not an export date. The state column is blank on 169 rows."),
  row("Indiana", "B", "unpublished", "Indiana residential care facility directory", "https://www.in.gov/health/reports/QAMIS/resdir/wdirRes.htm", 225, true, true, false, false, false, "high", "The HTML directory posted 11/5/2026 has 225 facilities and a unique license number on each. That posted date is not an ISO export date. There is no status, bed, county, or facility disclosure link, and the address lines are not labeled physical or mailing."),
  row("Iowa", "B", "unpublished", "Iowa certified assisted living program file", "https://data.iowa.gov/catalog/dataset/562", 335, false, true, false, false, null, "high", "The identifier is a certification number, not a recorded license number. Address is present. Status, disclosure, and an export date are absent."),
  row("Kansas", "D", "unpublished", "Kansas adult care home directory index", "https://www.kdads.ks.gov/licensing-policy/adult-care-home-directory", null, null, null, null, null, null, "medium", "The index lists assisted living and other directories. A request on 2026-11-13 returned HTTP 403, so those files were not opened."),
  row("Kentucky", "B", "unpublished", "Kentucky assisted living community directory", "https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.pdf", null, true, true, false, false, false, "high", "The PDF has license number, address, county, and units. Expiration is not a status. The November 2026 label is not an adopted export date."),
  row("Louisiana", "C", "unpublished", "Louisiana adult residential care directory", "https://ldh.la.gov/directory/category/161", null, false, true, null, null, null, "medium", "The HTML directory shows addresses. A license identifier was not observed."),
  row("Maine", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Maryland", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "The licensing directory was not opened. A consumer rate list is not the licensing source."),
  row("Massachusetts", "C", "unpublished", "MassHealth adult foster care", null, null, false, false, null, null, null, "medium", "Adult foster care is organized as agency providers, not a facility roster."),
  row("Michigan", "C", "unpublished", "Michigan adult foster care and home-for-the-aged file", null, 4480, true, false, true, true, false, "high", "License, status, and a disclosure prefix exist. Most street values are blank, and the supplemental column is not a confirmed physical address."),
  row("Minnesota", "C", "unpublished", "Minnesota DHS Licensing Information Lookup", null, null, null, null, null, true, null, "high", "The lookup can post back a CSV. The profile-link count and the rendered license summary are not reconciled."),
  row("Mississippi", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Missouri", "C", "unpublished", "Missouri DHSS long-term care directory", "https://data.mo.gov/Health/LTC-DIRECTORY/fenu-sipv", 1102, true, true, false, false, false, "high", "The directory has 1,102 rows, a license number, an address column, separate mailing columns, and capacity. Facility numbers and license numbers are not unique, the file mixes residential, assisted-living, and nursing levels, and there is no per-row status or facility disclosure link. The catalog time 2026-11-04T18:30:08Z is not an export date."),
  row("Montana", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Nebraska", "C", "unpublished", "Nebraska HHS facility license search", "https://www.nebraska.gov/LISSearch/search.cgi", null, null, null, null, null, null, "medium", "The official access is a facility search. No roster file was opened."),
  row("Nevada", "C", "unpublished", "Nevada residential facility for groups search", "https://www.hcqc.nv.gov/regulatory/health-facility-licensing-and-information/non-medical-facilities/residential-facility-for-groups-adult-group-care-assisted-living/", null, null, null, null, null, null, "medium", "A spreadsheet is generated from a credential search. No stable file or columns were adopted."),
  row("New Hampshire", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("New Jersey", "C", "unpublished", "New Jersey long-term care facility search", "https://healthapps.nj.gov/facilities/fsSetSearch.aspx?by=county", null, null, null, null, null, null, "medium", "The search filters by county and type, including assisted living and adult family care. No roster file was opened."),
  row("New Mexico", "C", "unpublished", "New Mexico assisted living facility search", "https://alf.hca.nm.gov/facility-search/", null, null, null, null, null, null, "medium", "The official page is a map search. License and status columns were not observed."),
  row("New York", "C", "unpublished", "New York adult care facility sources", "https://www.health.ny.gov/facilities/adult_care/", null, null, null, null, null, null, "medium", "The standalone adult care directory was retired and later official access is split. No replacement row count was adopted."),
  row("North Carolina", "B", "unpublished", "North Carolina adult care home and family care home workbooks", "https://info.ncdhhs.gov/dhsr/reports.htm", 1086, true, true, false, false, false, "high", "Unique license numbers and site addresses exist. There is no per-row status and no coordinate column. The star-result identifier is not the license number, and neither observed date is an export date."),
  row("North Dakota", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Ohio", "C", "unpublished", "Ohio Department of Health residential care search", null, null, null, null, null, null, null, "medium", "The department search can generate a report. No stable file or reconciled row count was adopted."),
  row("Oklahoma", "B", "unpublished", "Oklahoma assisted living facility directory", "https://oklahoma.gov/content/dam/ok/en/health/health2/aem-documents/protective-health/hrds/health-facility-systems/2026/directory-of-facilities/Assisted%20Living.pdf", null, true, true, false, false, false, "high", "The PDF has facility id, address, licensed beds, and county. There is no per-row status or disclosure prefix, and the 2026 path is not an export date."),
  row("Oregon", "A", "development", "Oregon ODHS adult foster home provider export", "https://ltclicensing.oregon.gov/Providers", 1584, false, false, true, true, false, "high", "The existing reduced directory contract already accepts source id, name, city, county, type, status, beds, and profile URL. Missing coordinates do not make that directory incompatible."),
  row("Pennsylvania", "C", "unpublished", "Pennsylvania personal care home open data", "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD", 989, false, true, false, false, false, "high", "The open-data object id is not a license number, and there is no per-row status."),
  row("Rhode Island", "C", "unpublished", "Rhode Island assisted living residence search", "https://health.ri.gov/find/assistedliving", null, null, null, null, null, null, "medium", "The department page is a weekly-updated search. License columns were not observed."),
  row("South Carolina", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("South Dakota", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Tennessee", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Texas", "C", "unpublished", "Texas HHSC active assisted-living workbook and TULIP search", "https://apps.hhs.texas.gov/providers/directories/al.xlsx", 2016, true, true, true, false, false, "high", "The active-license workbook has 2,016 assisted-living rows, a unique facility id, a unique license number, a physical address, and capacity. Every Facility Licensed value is YES. The as-of label 11/12/2026 and the file Last-Modified are not an ISO export date. The TULIP detail page uses an account id that is not in the workbook, 78 geo cells are a comma, and the closures PDF was not reconciled."),
  row("Utah", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Vermont", "D", "unpublished", "Vermont assisted living residence directory", "https://dlp.vermont.gov/document/assisted-living-residence-directory", null, null, null, null, null, null, "medium", "A PDF dated January 27, 2025 is published. Its columns were not read."),
  row("Virginia", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Washington", "A", "public", "Washington DSHS adult family home listing", "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx", 6278, true, true, true, true, true, "high", "The public directory and map already accept the official license number, address, status, beds, coordinates, disclosure link, and source date."),
  row("West Virginia", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Wisconsin", "C", "unpublished", "Wisconsin adult family home PDF and GIS layer", null, null, null, null, null, null, null, "high", "The PDF and GIS counts are not reconciled, so neither source is the accepted directory."),
  row("Wyoming", "C", "unpublished", "Wyoming healthcare facility directory", "https://health.wyo.gov/aging/hls/healthcare-facility-directory/", null, true, false, false, false, false, "high", "The November 2026 workbook mixes facility classes. The ALF type code appears 31 times, and the name and physical address share one column. There is no status column or facility URL. The file Last-Modified is not an export date, and no facility count was adopted."),
] as const satisfies readonly Omit<StateCompatibility, "evidence">[];

function row(
  state: string,
  compatibility: CompatibilityClass,
  publication: CompatibilityPublication,
  source: string | null,
  sourceUrl: string | null,
  observedRows: number | null,
  licenseIdentifier: boolean | null,
  physicalAddress: boolean | null,
  perRowStatus: boolean | null,
  disclosureLink: boolean | null,
  coordinateColumns: boolean | null,
  confidence: CompatibilityConfidence,
  adjustment: string,
): Omit<StateCompatibility, "evidence"> {
  return {
    state,
    compatibility,
    publication,
    publicationReady: publication === "public",
    source,
    sourceUrl,
    observedRows,
    licenseIdentifier,
    physicalAddress,
    perRowStatus,
    disclosureLink,
    isoExportDate: publication === "public",
    coordinateColumns,
    adjustment,
    confidence,
  };
}

type EvidenceFact = { observation: EvidenceObservation; confidence: EvidenceConfidence; detail: string | null };

function fact(observation: EvidenceObservation, confidence: EvidenceConfidence, detail: string | null = null): EvidenceFact {
  return { observation, confidence, detail };
}

const FIELD_EVIDENCE: Record<string, Partial<Record<EvidenceField, EvidenceFact>>> = {
  Washington: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "issuing-authority": fact("present", "high", "Washington DSHS"),
    "physical-address": fact("present", "high", "physical"),
    "official-export-date": fact("present", "high", "2026-11-09"),
    "freshness-verification": fact("present", "high"),
    "facility-disclosure": fact("present", "high", "facility-specific"),
    "generic-search": fact("absent", "high"),
    "original-category": fact("present", "high"),
    "original-status": fact("present", "high"),
    "normalized-category": fact("absent", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("present", "high"),
    "coordinate-source": fact("present", "high", "licensing"),
  },
  Oregon: {
    "regulatory-identifier": fact("absent", "high"),
    "identifier-type": fact("present", "high", "source-id"),
    "issuing-authority": fact("present", "high", "Oregon ODHS"),
    "source-record-id": fact("present", "high", "source-id"),
    "physical-address": fact("absent", "high"),
    "official-export-date": fact("absent", "high"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("present", "high", "facility-specific"),
    "generic-search": fact("absent", "high"),
    "original-category": fact("present", "high"),
    "original-status": fact("present", "high"),
    "normalized-category": fact("absent", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
    "coordinate-source": fact("absent", "high"),
  },
  California: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "issuing-authority": fact("present", "high", "CDSS"),
    "physical-address": fact("present", "high", "physical"),
    "official-export-date": fact("rejected", "high"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("present", "high", "facility-specific"),
    "original-category": fact("present", "high"),
    "original-status": fact("present", "high"),
    "normalized-category": fact("absent", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
    "coordinate-source": fact("absent", "high"),
  },
  Michigan: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "issuing-authority": fact("present", "high"),
    "physical-address": fact("absent", "high"),
    "supplemental-address": fact("rejected", "high", "supplemental"),
    "official-export-date": fact("rejected", "high"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("present", "high", "facility-specific"),
    "original-category": fact("present", "high"),
    "original-status": fact("present", "high"),
    "normalized-category": fact("rejected", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
    "coordinate-source": fact("absent", "high"),
  },
  Pennsylvania: {
    "regulatory-identifier": fact("rejected", "high", "object-id"),
    "identifier-type": fact("rejected", "high", "object-id"),
    "source-record-id": fact("present", "high", "object-id"),
    "physical-address": fact("present", "high", "physical"),
    "official-export-date": fact("rejected", "high"),
    "retrieval-timestamp": fact("present", "high", "catalog-timestamp"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("rejected", "high", "georeferenced"),
    "coordinate-source": fact("present", "high", "georeferenced"),
  },
  Iowa: {
    "regulatory-identifier": fact("absent", "high"),
    "identifier-type": fact("present", "high", "certification"),
    "issuing-authority": fact("present", "high"),
    "physical-address": fact("present", "high", "physical"),
    "official-export-date": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("rejected", "high", "georeferenced"),
    "coordinate-source": fact("rejected", "high", "georeferenced"),
  },
  Illinois: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "issuing-authority": fact("present", "high", "IDPH"),
    "unverified-address": fact("present", "high", "unverified"),
    "official-export-date": fact("absent", "high"),
    "retrieval-timestamp": fact("present", "high", "2024-02-16"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
  },
  "North Carolina": {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "issuing-authority": fact("present", "high"),
    "physical-address": fact("present", "high", "physical"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("present", "high"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "generic-search"),
    "original-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
  },
  Kentucky: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "issuing-authority": fact("present", "high"),
    "unverified-address": fact("present", "high", "unverified"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("present", "high"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
  },
  Oklahoma: {
    "regulatory-identifier": fact("present", "high", "facility-id"),
    "identifier-type": fact("present", "high", "facility-id"),
    "issuing-authority": fact("present", "high"),
    "unverified-address": fact("present", "high", "unverified"),
    "official-export-date": fact("rejected", "high"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
  },
  Missouri: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "mailing-address": fact("present", "high", "mailing"),
    "unverified-address": fact("present", "high", "street-city-zip"),
    "official-export-date": fact("rejected", "high"),
    "retrieval-timestamp": fact("present", "high", "2026-11-04T18:30:08Z"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "generic-search"),
    "original-category": fact("present", "high", "level-of-care"),
    "original-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
  },
  Indiana: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "unverified-address": fact("present", "high", "street-and-city-zip"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("present", "high", "11/5/2026"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
  },
  Delaware: {
    "regulatory-identifier": fact("present", "medium", "license"),
    "identifier-type": fact("present", "medium", "license"),
    "issuing-authority": fact("present", "medium"),
    "unverified-address": fact("present", "medium", "unverified"),
    "official-export-date": fact("absent", "medium"),
    "facility-disclosure": fact("absent", "medium"),
    "original-status": fact("absent", "medium"),
  },
  Minnesota: {
    "facility-disclosure": fact("present", "medium", "facility-specific"),
    "generic-search": fact("present", "medium", "generic-search"),
    "freshness-verification": fact("absent", "high"),
  },
  Arkansas: {
    "regulatory-identifier": fact("rejected", "medium"),
    "unverified-address": fact("present", "medium", "unverified"),
  },
  Louisiana: {
    "regulatory-identifier": fact("absent", "medium"),
    "unverified-address": fact("present", "medium", "unverified"),
  },
  Massachusetts: {
    "regulatory-identifier": fact("absent", "medium"),
    "physical-address": fact("absent", "medium"),
  },
  Texas: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "source-record-id": fact("present", "high", "facility-id"),
    "physical-address": fact("present", "high", "physical"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("present", "high", "11/12/2026"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "generic-search"),
    "original-category": fact("present", "high", "service-type"),
    "original-status": fact("present", "high", "facility-licensed"),
    "coordinates": fact("present", "high", "geo-location"),
    "coordinate-source": fact("not-verified", "low"),
  },
  Vermont: {
    "source-publication-date": fact("present", "medium"),
    "official-export-date": fact("not-verified", "low"),
  },
  Wyoming: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "physical-address": fact("absent", "high"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("present", "medium"),
    "facility-disclosure": fact("absent", "high"),
    "original-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
  },
};

for (const state of ["Alabama", "Florida", "Nebraska", "Nevada", "New Jersey", "New Mexico", "Ohio", "Rhode Island"]) {
  FIELD_EVIDENCE[state] = {
    "generic-search": fact("present", "medium", "generic-search"),
    "facility-disclosure": fact("not-verified", "low"),
  };
}

function fieldEvidence(item: Omit<StateCompatibility, "evidence">): readonly FieldEvidence[] {
  const known = FIELD_EVIDENCE[item.state] ?? {};
  return EVIDENCE_FIELDS.map(field => {
    const found = known[field];
    if (found) return { field, ...found };
    if (field === "issuing-authority" && item.source) return { field, ...fact("present", item.confidence) };
    if (field === "regulatory-identifier" && item.licenseIdentifier === false) return { field, ...fact("absent", item.confidence) };
    if (field === "facility-disclosure" && item.disclosureLink === false) return { field, ...fact("absent", item.confidence) };
    return { field, observation: "not-verified", confidence: "low", detail: null };
  });
}

export function compatibilityAssessments(): readonly StateCompatibility[] {
  return ASSESSMENTS.map(item => ({ ...item, evidence: fieldEvidence(item) }));
}

export function compatibilityAssessment(state: string): StateCompatibility | null {
  const item = ASSESSMENTS.find(entry => entry.state === state);
  return item ? { ...item, evidence: fieldEvidence(item) } : null;
}

export function compatibilityClassCounts(): Record<CompatibilityClass, number> {
  return {
    A: ASSESSMENTS.filter(item => item.compatibility === "A").length,
    B: ASSESSMENTS.filter(item => item.compatibility === "B").length,
    C: ASSESSMENTS.filter(item => item.compatibility === "C").length,
    D: ASSESSMENTS.filter(item => item.compatibility === "D").length,
  };
}

export const ONBOARDING_SEQUENCE = [
  "Washington",
  "Oregon",
  "Illinois",
  "North Carolina",
  "Kentucky",
  "Oklahoma",
  "Indiana",
  "Delaware",
  "California",
  "Iowa",
  "Michigan",
  "Pennsylvania",
  "Wisconsin",
  "Minnesota",
  "Alabama",
  "Arizona",
  "Arkansas",
  "Colorado",
  "Florida",
  "Louisiana",
  "Massachusetts",
  "Nebraska",
  "Nevada",
  "New Jersey",
  "New Mexico",
  "New York",
  "Ohio",
  "Rhode Island",
  "Texas",
  "Alaska",
  "Connecticut",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Kansas",
  "Maine",
  "Maryland",
  "Mississippi",
  "Missouri",
  "Montana",
  "New Hampshire",
  "North Dakota",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Utah",
  "Vermont",
  "Virginia",
  "West Virginia",
  "Wyoming",
] as const;

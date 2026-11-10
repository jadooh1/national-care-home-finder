export type CompatibilityClass = "A" | "B" | "C" | "D";
export type CompatibilityPublication = "public" | "development" | "unpublished";
export type CompatibilityConfidence = "high" | "medium";

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
  row("California", "B", "unpublished", "CDSS RCFE and ARF open-data files", null, 23020, true, true, true, false, false, "high", "License, name, address, status, and capacity exist across two files. Status vocabulary, excluded rows, the missing disclosure prefix, and the unadopted file date need a mapping layer."),
  row("Colorado", "C", "unpublished", "Colorado mixed health-facility open data", null, null, null, null, null, null, null, "medium", "The official layer mixes health-facility types. No assisted-living-only row count was adopted."),
  row("Connecticut", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Delaware", "B", "unpublished", "Delaware licensed assisted living facilities page", "https://dhss.delaware.gov/dhcq/dhcq/licensed-assisted-living-facilities/", null, true, true, false, false, false, "medium", "The HTML listing shows license number, address, and beds. It is not a delimited file, and it has no per-row status or disclosure prefix."),
  row("Florida", "C", "unpublished", "FloridaHealthFinder assisted living comparison", "https://quality.healthfinder.fl.gov/compare-tools/ALF", null, null, null, null, null, null, "medium", "The official tool is a comparison search. No licensing file was opened."),
  row("Georgia", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Hawaii", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Idaho", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Illinois", "B", "unpublished", "IDPH assisted living and shared housing licensed establishments", "https://data.illinois.gov/Health-and-Human-Services/IDPH-Assisted-Living-and-Shared-Housing-Licensed-E/8z4a-ix8q", 495, true, true, false, false, false, "high", "All 495 rows have a license number and address. There is no per-row status or disclosure prefix. The portal time 2024-02-16 is not an export date. The state column is blank on 169 rows."),
  row("Indiana", "B", "unpublished", "Indiana residential care facility directory", "https://www.in.gov/health/reports/QAMIS/resdir/wdirRes.htm", null, true, true, false, false, false, "medium", "The HTML directory posted 11/5/2026 shows license number, address, and expiration. Expiration is not a status, and no row count was adopted."),
  row("Iowa", "B", "unpublished", "Iowa certified assisted living program file", "https://data.iowa.gov/catalog/dataset/562", 335, false, true, false, false, null, "high", "The identifier is a certification number, not a recorded license number. Address is present. Status, disclosure, and an export date are absent."),
  row("Kansas", "D", "unpublished", "Kansas adult care home directory index", "https://www.kdads.ks.gov/licensing-policy/adult-care-home-directory", null, null, null, null, null, null, "medium", "The index lists assisted living and other directories. Those files were not opened."),
  row("Kentucky", "B", "unpublished", "Kentucky assisted living community directory", "https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.pdf", null, true, true, false, false, false, "high", "The PDF has license number, address, county, and units. Expiration is not a status. The November 2026 label is not an adopted export date."),
  row("Louisiana", "C", "unpublished", "Louisiana adult residential care directory", "https://ldh.la.gov/directory/category/161", null, false, true, null, null, null, "medium", "The HTML directory shows addresses. A license identifier was not observed."),
  row("Maine", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Maryland", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "The licensing directory was not opened. A consumer rate list is not the licensing source."),
  row("Massachusetts", "C", "unpublished", "MassHealth adult foster care", null, null, false, false, null, null, null, "medium", "Adult foster care is organized as agency providers, not a facility roster."),
  row("Michigan", "C", "unpublished", "Michigan adult foster care and home-for-the-aged file", null, 4480, true, false, true, true, false, "high", "License, status, and a disclosure prefix exist. Most street values are blank, and the supplemental column is not a confirmed physical address."),
  row("Minnesota", "C", "unpublished", "Minnesota DHS Licensing Information Lookup", null, null, null, null, null, true, null, "high", "The lookup can post back a CSV. The profile-link count and the rendered license summary are not reconciled."),
  row("Mississippi", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Missouri", "D", "unpublished", "Missouri long-term care directory", null, null, null, null, null, null, null, "medium", "A CSV resource is listed. Its columns were not read."),
  row("Montana", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Nebraska", "C", "unpublished", "Nebraska HHS facility license search", "https://www.nebraska.gov/LISSearch/search.cgi", null, null, null, null, null, null, "medium", "The official access is a facility search. No roster file was opened."),
  row("Nevada", "C", "unpublished", "Nevada residential facility for groups search", "https://www.hcqc.nv.gov/regulatory/health-facility-licensing-and-information/non-medical-facilities/residential-facility-for-groups-adult-group-care-assisted-living/", null, null, null, null, null, null, "medium", "A spreadsheet is generated from a credential search. No stable file or columns were adopted."),
  row("New Hampshire", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("New Jersey", "C", "unpublished", "New Jersey long-term care facility search", "https://healthapps.nj.gov/facilities/fsSetSearch.aspx?by=county", null, null, null, null, null, null, "medium", "The search filters by county and type, including assisted living and adult family care. No roster file was opened."),
  row("New Mexico", "C", "unpublished", "New Mexico assisted living facility search", "https://alf.hca.nm.gov/facility-search/", null, null, null, null, null, null, "medium", "The official page is a map search. License and status columns were not observed."),
  row("New York", "C", "unpublished", "New York adult care facility sources", "https://www.health.ny.gov/facilities/adult_care/", null, null, null, null, null, null, "medium", "The standalone adult care directory was retired and later official access is split. No replacement row count was adopted."),
  row("North Carolina", "B", "unpublished", "North Carolina adult care home and family care home workbooks", "https://info.ncdhhs.gov/dhsr/reports.htm", 1086, true, true, false, false, false, "high", "Unique license numbers and site addresses exist. There is no per-row status, no license-based disclosure link, and neither observed date is an export date."),
  row("North Dakota", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Ohio", "C", "unpublished", "Ohio Department of Health residential care search", null, null, null, null, null, null, null, "medium", "The department search can generate a report. No stable file or reconciled row count was adopted."),
  row("Oklahoma", "B", "unpublished", "Oklahoma assisted living facility directory", "https://oklahoma.gov/content/dam/ok/en/health/health2/aem-documents/protective-health/hrds/health-facility-systems/2026/directory-of-facilities/Assisted%20Living.pdf", null, true, true, false, false, false, "high", "The PDF has facility id, address, licensed beds, and county. There is no per-row status or disclosure prefix, and the 2026 path is not an export date."),
  row("Oregon", "A", "development", "Oregon ODHS adult foster home provider export", "https://ltclicensing.oregon.gov/Providers", 1584, false, false, true, true, false, "high", "The existing reduced directory contract already accepts source id, name, city, county, type, status, beds, and profile URL. Missing coordinates do not make that directory incompatible."),
  row("Pennsylvania", "C", "unpublished", "Pennsylvania personal care home open data", "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD", 989, false, true, false, false, false, "high", "The open-data object id is not a license number, and there is no per-row status."),
  row("Rhode Island", "C", "unpublished", "Rhode Island assisted living residence search", "https://health.ri.gov/find/assistedliving", null, null, null, null, null, null, "medium", "The department page is a weekly-updated search. License columns were not observed."),
  row("South Carolina", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("South Dakota", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Tennessee", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Texas", "C", "unpublished", "Texas HHSC assisted living workbook and TULIP search", null, null, null, null, null, null, null, "medium", "Access is a workbook plus a separate search. Workbook columns and a row count were not adopted."),
  row("Utah", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Vermont", "D", "unpublished", "Vermont assisted living residence directory", "https://dlp.vermont.gov/document/assisted-living-residence-directory", null, null, null, null, null, null, "medium", "A PDF dated January 27, 2025 is published. Its columns were not read."),
  row("Virginia", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Washington", "A", "public", "Washington DSHS adult family home listing", "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx", 6278, true, true, true, true, true, "high", "The public directory and map already accept the official license number, address, status, beds, coordinates, disclosure link, and source date."),
  row("West Virginia", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Wisconsin", "C", "unpublished", "Wisconsin adult family home PDF and GIS layer", null, null, null, null, null, null, null, "high", "The PDF and GIS counts are not reconciled, so neither source is the accepted directory."),
  row("Wyoming", "D", "unpublished", "Wyoming healthcare facility directory", "https://health.wyo.gov/aging/hls/healthcare-facility-directory/", null, null, null, null, null, null, "medium", "An Excel directory updated November 2, 2026 is linked. Its columns were not read."),
] as const satisfies readonly StateCompatibility[];

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
): StateCompatibility {
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

export function compatibilityAssessments(): readonly StateCompatibility[] {
  return ASSESSMENTS;
}

export function compatibilityAssessment(state: string): StateCompatibility | null {
  return ASSESSMENTS.find(item => item.state === state) ?? null;
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

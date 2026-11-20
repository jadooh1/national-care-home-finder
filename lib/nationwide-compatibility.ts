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
  row("Arizona", "B", "unpublished", "ADHS Assisted Living Home and Center FeatureServers", "https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/Assisted_Living_Home_Feb_2025/FeatureServer/18", 2047, true, true, true, false, true, "high", "Assisted Living Home 1,719 rows (capacity ≤10) and Center 328 rows (capacity ≥13) with unique FACID/LICENSE_NUMBER, ADDRESS, ACTIVE status, and geocoded N_LAT/N_LON. ARS §36-401 keeps Home and Center separate; neither is Washington AFH. RUN_DATE 2025-02-03 and Feb_2025 service stamps are not an ISO export date. AZ Care Check is a Salesforce search SPA; Facility.aspx?id={FACID} returns an empty shell. Arizona stays unpublished."),
  row("Arkansas", "C", "unpublished", "Arkansas long-term care, rehabilitation, nursing, and assisted living list", "https://healthy.arkansas.gov/wp-content/uploads/Arkansas_LTC_Rehab_Nursing_Assisted_Living_Facility_List.pdf", null, false, true, null, null, null, "medium", "The list mixes facility types. The identifier was not verified as a state license number."),
  row("California", "B", "unpublished", "CDSS RCFE and ARF open-data files", null, 23020, true, true, true, true, false, "high", "License, name, address, status, and capacity exist across two files. The official facility-number route identifies a facility, but the checked live status text did not match the open-data status. Excluded rows stay unchanged. The raw file date, the temporal-coverage phrase, and the GIS service clock are not an export date. The GIS status code has no published domain."),
  row("Colorado", "B", "unpublished", "CDPHE health facilities FeatureServer (ALR filter)", "https://services3.arcgis.com/66aUo8zsujfVXRIT/arcgis/rest/services/CDPHE_Health_Facilities/FeatureServer/0", 685, true, true, true, false, true, "high", "Facility_Type Assisted Living Residence returns 685 unique Facility_ID rows with Address_Full, Operating_Status, Licensed_Beds_Total, and geocoded Latitude/Longitude. The mixed layer still requires an ALR filter. Date_Data_Updated, layer editingInfo, and HTTP Last-Modified are not an ISO export date. Find and Compare is a Tableau search dashboard, not a verified Facility_ID detail prefix. Coordinates are address geocode matches, not licensing coordinates. ALR under 6 CCR 1011-1 Ch. 7 is not Washington AFH. Colorado stays unpublished."),
  row("Connecticut", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Delaware", "B", "unpublished", "Delaware licensed assisted living facilities page", "https://dhss.delaware.gov/dhcq/dhcq/licensed-assisted-living-facilities/", null, true, true, false, false, false, "medium", "The HTML listing shows license number, address, and beds. It is not a delimited file, and it has no per-row status or disclosure prefix."),
  row("Florida", "B", "unpublished", "FloridaHealthFinder ALF comparison embed and AHCA profile/inspection links", "https://quality.healthfinder.fl.gov/Facility-Provider/ALF?LS=1&type=1", 3025, true, true, true, true, true, "high", "ALF embed has 3,025 rows with unique FileNumber/LicenseID, street address, BedCount 4–510, and LicenseStatus (LICENSED 2,253). LicenseID → Profile/?LID= and FileNumber → AHCA inspection details are verified. No ISO export date; nightly-update claim and Miami-Dade sample stamp rejected. Coordinates present but undescribed and not accepted as licensing coordinates. County/specialty absent from list embed. AFCH is a separate ≤5-resident type (230 rows). DOH GIS layer is a May 2013 snapshot and is rejected. ALF/AFCH are not Washington AFH. Florida stays unpublished."),
  row("Georgia", "B", "unpublished", "Georgia DCH/HFRD GetFacilitiesData PCH and ALC roster", "https://forms.dch.georgia.gov/HFRD/GetFacilitiesData.svc/GetData", 1899, true, true, true, false, true, "high", "Verified 2026-11-20: GetFacilitiesData returns PERSONAL CARE HOME 1,573 and ASSISTED LIVING COMMUNITY 326 (1,899 unique FACIDs, overlap 0) with ADDRESS, OPERSTDESC Active/ACTIVE, Beds, and geocoded Latitude/Longitude Accuracy. No ISO export date; HTTP Last-Modified absent; List_Of_Regulated_Facilities.pdf Last-Modified 2020-03-10 rejected. FACID disclosure prefix not verified (Verify_License/GaMap2Care ignore FACID; WebLink inspection is generic search). Status domain Active-only; closed-facility presence unverified. Coordinates are Google geocode, not licensing. PCH (Ch. 111-8-62) and ALC (Ch. 111-8-63) stay separate and are not Washington AFH. Georgia stays unpublished."),
  row("Hawaii", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Idaho", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Illinois", "B", "unpublished", "IDPH assisted living and shared housing licensed establishments", "https://data.illinois.gov/Health-and-Human-Services/IDPH-Assisted-Living-and-Shared-Housing-Licensed-E/8z4a-ix8q", 495, true, true, false, false, false, "high", "All 495 rows have a license number and address. There is no per-row status or disclosure prefix. The portal time 2024-02-16 is not an export date. The state column is blank on 169 rows."),
  row("Indiana", "B", "unpublished", "Indiana residential care facility directory", "https://www.in.gov/health/reports/QAMIS/resdir/wdirRes.htm", 225, true, true, false, false, false, "high", "The HTML directory posted 11/5/2026 has 225 facilities and a unique license number on each. That posted date is not an ISO export date. There is no status, bed, county, or facility disclosure link, and the address lines are not labeled physical or mailing."),
  row("Iowa", "B", "unpublished", "Iowa certified assisted living program file", "https://data.iowa.gov/catalog/dataset/562", 335, false, true, false, false, null, "high", "The identifier is a certification number, not a recorded license number. Address is present. Status, disclosure, and an export date are absent."),
  row("Kansas", "D", "unpublished", "Kansas adult care home directory index", "https://www.kdads.ks.gov/licensing-policy/adult-care-home-directory", null, null, null, null, null, null, "medium", "The index lists assisted living and other directories. A request on 2026-11-13 returned HTTP 403, so those files were not opened."),
  row("Kentucky", "B", "unpublished", "Kentucky assisted living community directory", "https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.pdf", null, true, true, false, false, false, "high", "The PDF has license number, address, county, and units. Expiration is not a status. The November 2026 label is not an adopted export date."),
  row("Louisiana", "C", "unpublished", "Louisiana adult residential care directory", "https://ldh.la.gov/directory/category/161", null, false, true, null, null, null, "medium", "The HTML directory shows addresses. A license identifier was not observed."),
  row("Maine", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Maryland", "B", "unpublished", "Maryland OHCQ Assisted Living Excel licensee directory", "https://health.maryland.gov/ohcq/docs/Provider-Listings/Excel/Assisted-Living-Excel.xlsx", 1675, true, true, false, false, false, "high", "Verified 2026-11-20: OHCQ Assisted-Living-Excel.xlsx sheet “ALs-EXCEL as of 11-05-26” has 1,676 rows / 1,675 unique License Numbers with Street Address, Capacity 2–319 (≤16: 1,472; >16: 204), and Level of Care (Level 3 1,623 / Level 2 51 / Level 1 1 / blank 1). One near-dup AL-00064. No per-row status. No ISO export date; sheet as-of, page Last Updated Nov 16, and HTTP Last-Modified Nov 6 rejected. No License Number disclosure prefix; Uniform Disclosure is on-request. IMAP/OP&R FeatureServer (1,568 rows, X/Y) rejected as licensing roster/coords. Maryland ALP is not Washington AFH. Maryland stays unpublished."),
  row("Massachusetts", "B", "unpublished", "EOEA/AGE certified Assisted Living Residences list", "https://www.mass.gov/doc/list-of-certified-assisted-living-residences-as-of-june-2026/download", 271, false, true, true, true, false, "high", "Verified 2026-11-20: EOEA/AGE certified ALR Excel (as of June 25, 2026) has 271 Certified usable rows with unique ALR Name, Address/City, Status=Certified, Total # of Units 8–173 (Traditional+SCR), and # SCR Units (204 with SCR>0). No certification-number column; Federal EIN is shared across residences. One status-anomaly row and one blank trailing row excluded. Title as-of, HTTP Last-Modified Jul 14, 2026, and Date of Last Update rejected as ISO export; April 2025 URL redirects to June 2026 file. mass.gov/locations/{slug-from-name} is a verified disclosure path. No coords on the list; MassGIS LTC (March 2024 / Oct–Nov 2023) mixes NH/RH/ALR and is rejected. ALR certification is not DPH nursing/rest-home license, not MassHealth AFC, and not Washington AFH. Massachusetts stays unpublished."),
  row("Michigan", "C", "unpublished", "Michigan adult foster care and home-for-the-aged file", null, 4480, true, false, true, true, false, "high", "License, status, and a disclosure prefix exist. Most street values are blank, and the supplemental column is not a confirmed physical address."),
  row("Minnesota", "C", "unpublished", "Minnesota DHS Licensing Information Lookup", null, null, null, null, null, true, null, "high", "The lookup can post back a CSV. The profile-link count and the rendered license summary are not reconciled."),
  row("Mississippi", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Missouri", "C", "unpublished", "Missouri DHSS long-term care directory", "https://data.mo.gov/Health/LTC-DIRECTORY/fenu-sipv", 1102, true, true, false, false, false, "high", "The directory has 1,102 rows, a license number, an address column, separate mailing columns, and capacity. Facility numbers and license numbers are not unique, the file mixes residential, assisted-living, and nursing levels, and there is no per-row status or facility disclosure link. The catalog time 2026-11-04T18:30:08Z is not an export date."),
  row("Montana", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Nebraska", "C", "unpublished", "Nebraska HHS facility license search", "https://www.nebraska.gov/LISSearch/search.cgi", null, null, null, null, null, null, "medium", "The official access is a facility search. No roster file was opened."),
  row("Nevada", "C", "unpublished", "Nevada residential facility for groups search", "https://www.hcqc.nv.gov/regulatory/health-facility-licensing-and-information/non-medical-facilities/residential-facility-for-groups-adult-group-care-assisted-living/", null, null, null, null, null, null, "medium", "A spreadsheet is generated from a credential search. No stable file or columns were adopted."),
  row("New Hampshire", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("New Jersey", "B", "unpublished", "NJDOH All_LTC.xlsx (ALR, CPCH, ALP)", "https://healthapps.nj.gov/facilities/documents2/All_LTC.xlsx", 305, true, true, false, true, true, "high", "Verified 2026-11-20: All_LTC.xlsx has ASSISTED LIVING RESIDENCE 256, COMPREHENSIVE PERSONAL CARE HOME 32, and ASSISTED LIVING PROGRAM 17 (305 unique FacID/LIC#, overlap 0) with ADDRESS, Lic_Beds_Slots (ALR 21–288 / CPCH 16–308 / ALP all 0), Lic_Expires, and LAT/LNG. No Active/Closed status column. RunDate 2026-11-06 and HTTP Last-Modified rejected as ISO export. fsFacilityDetails.aspx?item={FacID} is a verified disclosure prefix for ALR/CPCH/ALP. LAT/LNG undescribed and not accepted as licensing coordinates (ALR 10 / ALP 2 zero pairs). ALR/CPCH/ALP and Adult Family Care are not Washington AFH. New Jersey stays unpublished."),
  row("New Mexico", "C", "unpublished", "New Mexico assisted living facility search", "https://alf.hca.nm.gov/facility-search/", null, null, null, null, null, null, "medium", "The official page is a map search. License and status columns were not observed."),
  row("New York", "C", "unpublished", "New York adult care facility sources", "https://www.health.ny.gov/facilities/adult_care/", null, null, null, null, null, null, "medium", "The standalone adult care directory was retired and later official access is split. No replacement row count was adopted."),
  row("North Carolina", "B", "unpublished", "North Carolina adult care home and family care home workbooks", "https://info.ncdhhs.gov/dhsr/reports.htm", 1086, true, true, false, false, false, "high", "Re-verified 2026-11-20: Ahlist.xlsx has 566 HAL rows (beds 9–201) and Fchlist.xlsx has 520 FCL rows (beds 2–6); 1,086 unique licenses, overlap 0, NC site addresses on all licensed rows. Listings 10/28/2026, As of 10/2026, and Last-Modified are not an ISO export date. No per-row status or coordinates. Star search has no license field; guessed License # detail URLs failed. FCL is not Washington AFH. Stale fch.txt (2021) rejected. North Carolina stays unpublished."),
  row("North Dakota", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Ohio", "B", "unpublished", "Ohio Department of Health EID Facility Listing (Residential Care)", "https://publicapps.odh.ohio.gov/EID/reports/EID_Report_Criteria.aspx", 1152, true, true, true, false, false, "high", "Verified 2026-11-20: Facility Listing CSV for provider type Residential Care or Assisted Living has 1,152 unique L12 FACIDs (OHL#####) with STATEID, ADDRESS, OPERSTDESC (ACTIVE 801 / ACTIVE-PENDING RENEWAL 16 / PENDING 26 / CLOSED-* 309), and LIC_BED_TOTAL on ACTIVE rows 5–508. No ISO export date; PDF filename timestamp, server deploy 10/4/2026, software release 01/27/2026, ArcGIS OneSource dataLastEditDate 2026-10-05, and program-page “approximately 720” are rejected. Detail_StateLicense.aspx is session-bound; FACID/STATEID query-string guesses fail. No coordinate columns on the listing; OEMA ArcGIS derivative geocodes are not licensing coordinates. Ohio RCF (ORC 3721 / OAC 3701-16) is not Washington AFH. Ohio stays unpublished."),
  row("Oklahoma", "B", "unpublished", "Oklahoma assisted living facility directory", "https://oklahoma.gov/content/dam/ok/en/health/health2/aem-documents/protective-health/hrds/health-facility-systems/2026/directory-of-facilities/Assisted%20Living.pdf", null, true, true, false, false, false, "high", "The PDF has facility id, address, licensed beds, and county. There is no per-row status or disclosure prefix, and the 2026 path is not an export date."),
  row("Oregon", "A", "development", "Oregon ODHS adult foster home provider export", "https://ltclicensing.oregon.gov/Providers", 1584, false, false, true, true, false, "high", "The existing reduced directory contract already accepts source id, name, city, county, type, status, beds, and profile URL. Missing coordinates do not make that directory incompatible."),
  row("Pennsylvania", "C", "unpublished", "Pennsylvania personal care home open data", "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD", 989, false, true, false, false, false, "high", "The open-data object id is not a license number, and there is no per-row status."),
  row("Rhode Island", "C", "unpublished", "Rhode Island assisted living residence search", "https://health.ri.gov/find/assistedliving", null, null, null, null, null, null, "medium", "The department page is a weekly-updated search. License columns were not observed."),
  row("South Carolina", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("South Dakota", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Tennessee", "B", "unpublished", "Tennessee HFC Assisted Care Living Facilities Full Bed Report", "https://www.tn.gov/content/dam/tn/health/healthprofboards/hcf/ACLF-Full-Beds-Report.pdf", 333, true, true, true, false, false, "high", "Verified 2026-11-20: HFC ACLF Full Bed Report PDF (index latest “October 2026”) has 333 unique lic_no values with street, lic_status (Licensed 331 / On Probation 1 / LLC Licensed 1), and total_beds 6–184 (secured>0 on 188). Blank city on 7 rows (city often embedded in street); do not invent. No ISO export date; October 2026 index label and unavailable HTTP Last-Modified rejected. FacilityListings is search-only; lic_no detail URL prefix not verified (egress 403). No coordinate columns. RHA Full Bed Report is a separate type; undated PDF footer Generated May 25, 2022 is not accepted as the October 2026 RHA roster. ACLF is not RHA, nursing home, or Washington AFH. Tennessee stays unpublished."),
  row("Texas", "B", "unpublished", "Texas HHSC active assisted-living workbook and TULIP search", "https://apps.hhs.texas.gov/providers/directories/al.xlsx", 2019, true, true, true, false, false, "high", "The active-license workbook has 2,019 assisted-living rows (TYPE A 335 / B 1,676 / C 8), unique Facility ID (leading zeros preserved) and License No, physical address, and capacity. Facility Licensed=YES on all rows is a membership flag, not operating status. As-of label 11/19/2026 and Last-Modified are not an ISO export date. TULIP detail needs an account id absent from the workbook. Closures PDF overlap with active IDs is 0. Geo Location has 82 comma-only cells; coordinate source is undescribed. Type A/B/C (26 TAC §553.5) are not Washington AFH. Texas stays unpublished."),
  row("Utah", "D", "unpublished", null, null, null, null, null, null, null, null, "medium", "Official licensing fields were not verified."),
  row("Vermont", "D", "unpublished", "Vermont assisted living residence directory", "https://dlp.vermont.gov/document/assisted-living-residence-directory", null, null, null, null, null, null, "medium", "A PDF dated January 27, 2025 is published. Its columns were not read."),
  row("Virginia", "B", "unpublished", "Virginia DSS Assisted Living Facility Search", "https://www.dss.virginia.gov/licensed-care/search-licensing-programs/assisted-living-facility-search/", 575, true, true, true, true, false, "high", "Verified 2026-11-20: ALF Search returns 576 list rows / 575 unique licenseId values with licensed=true, facilityType Assisted Living Facility, and street/city/state/ZIP. One duplicate licenseId (53896). No ISO export date; HTTP Last-Modified absent; legacy alf.cgi redirects to licensed-care. Capacity and licenseType (1YR/2YR/3YR/COND in a 32-row detail sample) are detail-only and not extrapolated. ?licenseId={id}&endpoint=alf is a verified disclosure prefix with inspections. No coordinates. Virginia ALF is not Washington AFH. Virginia stays unpublished."),
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
  Colorado: {
    "regulatory-identifier": fact("present", "high", "facility-id"),
    "identifier-type": fact("present", "high", "facility-id"),
    "issuing-authority": fact("present", "high", "CDPHE HFEMS"),
    "physical-address": fact("present", "high", "Address_Full"),
    "official-export-date": fact("rejected", "high"),
    "retrieval-timestamp": fact("present", "high", "layer-editingInfo"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "find-and-compare"),
    "unverified-url-pattern": fact("rejected", "high", "Facility_ID query"),
    "original-category": fact("present", "high", "Assisted Living Residence"),
    "original-status": fact("present", "high", "Operating_Status"),
    "normalized-category": fact("rejected", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("present", "high"),
    "coordinate-source": fact("rejected", "high", "address-geocode"),
    "coordinate-accuracy": fact("present", "medium", "geocode-match"),
  },
  Arizona: {
    "regulatory-identifier": fact("present", "high", "facility-id"),
    "identifier-type": fact("present", "high", "license-number"),
    "issuing-authority": fact("present", "high", "ADHS"),
    "physical-address": fact("present", "high", "ADDRESS"),
    "official-export-date": fact("rejected", "high"),
    "retrieval-timestamp": fact("present", "high", "RUN_DATE"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "az-care-check"),
    "unverified-url-pattern": fact("rejected", "high", "Facility.aspx"),
    "original-category": fact("present", "high", "ASSISTED LIVING HOME/CENTER"),
    "original-status": fact("present", "high", "OPERATION_STATUS"),
    "normalized-category": fact("rejected", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("present", "high"),
    "coordinate-source": fact("rejected", "high", "centrus-tomtom-geocode"),
    "coordinate-accuracy": fact("present", "medium", "geocode-match"),
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
    "regulatory-identifier": fact("absent", "high"),
    "identifier-type": fact("absent", "high"),
    "issuing-authority": fact("present", "high", "EOEA / AGE"),
    "physical-address": fact("present", "high", "Address"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("rejected", "high", "title-as-of / http-last-modified / date-of-last-update"),
    "retrieval-timestamp": fact("present", "high", "2026-11-20"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("present", "high", "mass.gov/locations slug-from-name"),
    "generic-search": fact("present", "high", "locations-directory"),
    "original-category": fact("present", "high", "Assisted Living Residence"),
    "original-status": fact("present", "high", "Certified"),
    "normalized-category": fact("rejected", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
    "coordinate-source": fact("rejected", "high", "massgis-ltc-mixed-stale"),
  },
  Tennessee: {
    "regulatory-identifier": fact("present", "high", "lic_no"),
    "identifier-type": fact("present", "high", "license-number"),
    "issuing-authority": fact("present", "high", "Tennessee Health Facilities Commission"),
    "physical-address": fact("present", "high", "street; blank city on 7 rows"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("rejected", "high", "october-2026-index-label / http-last-modified-unavailable"),
    "retrieval-timestamp": fact("present", "high", "2026-11-20"),
    "freshness-verification": fact("absent", "high"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "FacilityListings"),
    "unverified-url-pattern": fact("rejected", "high", "lic_no query-string guesses"),
    "original-category": fact("present", "high", "Assisted Care Living Facility"),
    "original-status": fact("present", "high", "lic_status"),
    "normalized-category": fact("rejected", "high"),
    "normalized-status": fact("absent", "high"),
    "coordinates": fact("absent", "high"),
    "coordinate-source": fact("absent", "high"),
  },
  Texas: {
    "regulatory-identifier": fact("present", "high", "license"),
    "identifier-type": fact("present", "high", "license"),
    "source-record-id": fact("present", "high", "facility-id"),
    "physical-address": fact("present", "high", "physical"),
    "mailing-address": fact("present", "high", "owner-mailing"),
    "official-export-date": fact("rejected", "high"),
    "source-publication-date": fact("present", "high", "11/19/2026"),
    "facility-disclosure": fact("absent", "high"),
    "generic-search": fact("present", "high", "tulip-search"),
    "unverified-url-pattern": fact("rejected", "high", "account-id"),
    "original-category": fact("present", "high", "service-type"),
    "original-status": fact("present", "high", "facility-licensed"),
    "normalized-category": fact("rejected", "high"),
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

FIELD_EVIDENCE.Florida = {
  "regulatory-identifier": fact("present", "high", "FileNumber and LicenseID"),
  "identifier-type": fact("present", "high", "AHCA file number / license id"),
  "physical-address": fact("present", "high", "street AddressType=ST"),
  "mailing-address": fact("present", "medium", "profile AddressType=MA"),
  "official-export-date": fact("rejected", "high"),
  "source-publication-date": fact("rejected", "high", "nightly-update claim / Miami-Dade sample stamp"),
  "retrieval-timestamp": fact("present", "high", "2026-11-20"),
  "facility-disclosure": fact("present", "high", "Profile/?LID={LicenseID}"),
  "original-category": fact("present", "high", "Assisted Living Facility"),
  "original-status": fact("present", "high", "LicenseStatus"),
  "coordinates": fact("present", "medium"),
  "coordinate-source": fact("absent", "high"),
  "coordinate-accuracy": fact("not-verified", "low"),
};

FIELD_EVIDENCE.Virginia = {
  "regulatory-identifier": fact("present", "high", "licenseId"),
  "identifier-type": fact("present", "high", "license-id"),
  "issuing-authority": fact("present", "high", "Virginia DSS DOLP"),
  "physical-address": fact("present", "high", "streetNumber+addressLine1"),
  "official-export-date": fact("rejected", "high"),
  "retrieval-timestamp": fact("present", "high", "2026-11-20"),
  "freshness-verification": fact("absent", "high"),
  "facility-disclosure": fact("present", "high", "licenseId query endpoint=alf"),
  "generic-search": fact("present", "high", "alf-search"),
  "original-category": fact("present", "high", "Assisted Living Facility"),
  "original-status": fact("present", "medium", "licensed boolean"),
  "normalized-category": fact("rejected", "high"),
  "normalized-status": fact("absent", "high"),
  "coordinates": fact("absent", "high"),
  "coordinate-source": fact("absent", "high"),
};

FIELD_EVIDENCE.Maryland = {
  "regulatory-identifier": fact("present", "high", "License Number"),
  "identifier-type": fact("present", "high", "license-number"),
  "issuing-authority": fact("present", "high", "Maryland Department of Health OHCQ"),
  "physical-address": fact("present", "high", "Street Address"),
  "official-export-date": fact("rejected", "high"),
  "source-publication-date": fact("rejected", "high", "sheet-as-of / page-last-updated / http-last-modified"),
  "retrieval-timestamp": fact("present", "high", "2026-11-20"),
  "freshness-verification": fact("absent", "high"),
  "facility-disclosure": fact("absent", "high"),
  "generic-search": fact("present", "high", "mhcc-consumer-guide"),
  "unverified-url-pattern": fact("rejected", "high", "MHCC Facility license query"),
  "original-category": fact("present", "high", "Assisted Living Program / Level of Care"),
  "original-status": fact("absent", "high"),
  "normalized-category": fact("rejected", "high"),
  "normalized-status": fact("absent", "high"),
  "coordinates": fact("absent", "high"),
  "coordinate-source": fact("rejected", "high", "imap-opr-derivative-geocode"),
};

FIELD_EVIDENCE["New Jersey"] = {
  "regulatory-identifier": fact("present", "high", "FacID / LIC#"),
  "identifier-type": fact("present", "high", "facility-id / license-number"),
  "issuing-authority": fact("present", "high", "New Jersey Department of Health"),
  "physical-address": fact("present", "high", "ADDRESS"),
  "official-export-date": fact("rejected", "high"),
  "source-publication-date": fact("rejected", "high", "RunDate / http-last-modified"),
  "retrieval-timestamp": fact("present", "high", "2026-11-20"),
  "freshness-verification": fact("absent", "high"),
  "facility-disclosure": fact("present", "high", "fsFacilityDetails.aspx?item={FacID}"),
  "generic-search": fact("present", "high", "fsSetSearch county/type"),
  "original-category": fact("present", "high", "ALR / CPCH / ALP"),
  "original-status": fact("absent", "high"),
  "normalized-category": fact("rejected", "high"),
  "normalized-status": fact("absent", "high"),
  "coordinates": fact("present", "medium"),
  "coordinate-source": fact("absent", "high"),
  "coordinate-accuracy": fact("not-verified", "low"),
};

FIELD_EVIDENCE.Ohio = {
  "regulatory-identifier": fact("present", "high", "FACID"),
  "identifier-type": fact("present", "high", "facility-id / state-id"),
  "issuing-authority": fact("present", "high", "Ohio Department of Health"),
  "physical-address": fact("present", "high", "ADDRESS"),
  "mailing-address": fact("present", "medium", "detail mailing when different"),
  "official-export-date": fact("rejected", "high"),
  "source-publication-date": fact("rejected", "high", "server-deploy / software-release / arcgis-edit"),
  "retrieval-timestamp": fact("present", "high", "2026-11-20"),
  "freshness-verification": fact("absent", "high"),
  "facility-disclosure": fact("absent", "high"),
  "generic-search": fact("present", "high", "provider-search"),
  "unverified-url-pattern": fact("rejected", "high", "Detail_StateLicense query"),
  "original-category": fact("present", "high", "L12 Residential Care"),
  "original-status": fact("present", "high", "OPERSTDESC"),
  "normalized-category": fact("rejected", "high"),
  "normalized-status": fact("absent", "high"),
  "coordinates": fact("absent", "high"),
  "coordinate-source": fact("rejected", "high", "arcgis-derivative-geocode"),
};

FIELD_EVIDENCE.Georgia = {
  "regulatory-identifier": fact("present", "high", "FACID"),
  "identifier-type": fact("present", "high", "facility-id"),
  "issuing-authority": fact("present", "high", "Georgia DCH/HFRD"),
  "physical-address": fact("present", "high", "ADDRESS"),
  "official-export-date": fact("rejected", "high"),
  "source-publication-date": fact("rejected", "high", "regulated-pdf-2020"),
  "retrieval-timestamp": fact("present", "high", "2026-11-20"),
  "freshness-verification": fact("absent", "high"),
  "facility-disclosure": fact("absent", "high"),
  "generic-search": fact("present", "high", "verify-license-gamap2care-weblink"),
  "unverified-url-pattern": fact("rejected", "high", "FACID query"),
  "original-category": fact("present", "high", "PERSONAL CARE HOME / ASSISTED LIVING COMMUNITY"),
  "original-status": fact("present", "high", "OPERSTDESC"),
  "normalized-category": fact("rejected", "high"),
  "normalized-status": fact("absent", "high"),
  "coordinates": fact("present", "high"),
  "coordinate-source": fact("rejected", "high", "google-geocode"),
  "coordinate-accuracy": fact("present", "medium", "Accuracy ROOFTOP"),
};

for (const state of ["Alabama", "Nebraska", "Nevada", "New Mexico", "Rhode Island"]) {
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
  "Colorado",
  "Arizona",
  "Texas",
  "Florida",
  "Georgia",
  "Ohio",
  "Virginia",
  "Maryland",
  "New Jersey",
  "Massachusetts",
  "Tennessee",
  "Alabama",
  "Arkansas",
  "Louisiana",
  "Nebraska",
  "Nevada",
  "New Mexico",
  "New York",
  "Rhode Island",
  "Alaska",
  "Connecticut",
  "Hawaii",
  "Idaho",
  "Kansas",
  "Maine",
  "Mississippi",
  "Missouri",
  "Montana",
  "New Hampshire",
  "North Dakota",
  "South Carolina",
  "South Dakota",
  "Utah",
  "Vermont",
  "West Virginia",
  "Wyoming",
] as const;

/**
 * California Tier 1 disclosure coverage + prelaunch acceptance (post-#204).
 *
 * Validates facility-specific CDSS FacDetail coverage for the offline Tier 1
 * set (15,429 under approved Pending Increase future-eligibility mapping)
 * using: (1) deterministic URL generation for every valid official ID,
 * (2) rate-limited stratified live sampling, (3) inherited Phase 20/23
 * roster-wide FacDetail evidence. Distinguishes facility detail pages from
 * inspection/complaint report documents. Refuses invalid / placeholder /
 * unverified links.
 *
 * Development-only. Does not activate exclusions, publish California, or
 * write Supabase. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_COVERAGE_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_COVERAGE_BASELINE = "b4e19bd" as const;

export const CALIFORNIA_COVERAGE_OFFICIAL_URLS = {
  facilityDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  facilityReportsListApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityReports/",
  facilityReportDocumentApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityReports",
  careFacilitySearchHome: "https://www.ccld.dss.ca.gov/carefacilitysearch/",
  downloadDataPage:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata",
} as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

export const CALIFORNIA_COVERAGE_DOWNLOAD = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-15" as const,
  rcfeContentDisposition:
    "attachment; filename=ResidentialElderCareFacility11152026.csv",
  arfContentDisposition:
    "attachment; filename=AdultResidentialFacilities11152026.csv",
  rcfeSha256:
    "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arfSha256:
    "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  newerDownloadAvailable: false as const,
} as const;

/**
 * Approved disclosure policy after #204: facility-specific FacDetail is the
 * publication-grade link; CDSS Search/Download is supplemental only.
 */
export const CALIFORNIA_COVERAGE_DISCLOSURE_POLICY = {
  facilitySpecificFacDetailApproved: true as const,
  generalSearchLinksSupplementalOnly: true as const,
  reportPageFakeoutNeverPublish: true as const,
  inspectionComplaintDocsViaFacNumInx: true as const,
  preserveLeadingZeros: true as const,
  refuseInvalidUnverifiedPlaceholderLinks: true as const,
  offlineTier1DisclosureRequired: false as const,
  publicationAcceptanceRequiresFacilitySpecificFacDetail: true as const,
} as const;

export const CALIFORNIA_COVERAGE_TIER1_COUNTS = {
  offlineTier1Candidates: 15429,
  remainingListingExclusions: 22,
  pendingIncreaseFutureEligible: 66,
  otherwiseClearPreApproval: 15363,
  publicationEligible: 0,
  exclusionsActivated: false as const,
} as const;

/**
 * Coverage methodology — reproducible, rate-limited; does not crawl all
 * 15,429 live endpoints in one uncontrolled session.
 */
export const CALIFORNIA_COVERAGE_METHODOLOGY = {
  id: "generator-plus-stratified-live-sample-plus-inherited-roster-evidence",
  rateLimitMsBetweenRequests: 400,
  fullLiveCrawlOf15429NotRunThisSession: true as const,
  fullLiveCrawlRequiresSeparateMultiSessionApproval: true as const,
  estimatedFullLiveProbeDurationHoursAt400ms: 2,
  components: [
    {
      id: "deterministic-facdetail-generator",
      covers: "all-valid-8-9-digit-official-ids-in-tier1-set",
      coveragePercent: 100,
      evidence:
        "unit-tested URL builder preserves leading zeros; invalid IDs return null",
    },
    {
      id: "stratified-live-sample",
      covers: "rate-limited-live-FacilityDetail-plus-FacDetail-plus-FacilityReports",
      sampleSize: 44,
      workingFacilitySpecific: 44,
      fail: 0,
      pendingIncreaseInSample: 12,
      leadingZeroInSample: 15,
      rcfeFileRows: 23,
      arfFileRows: 21,
      evidence:
        "2026-11-21 live probes; exact Facility Number match; report docs via facNum+inx; REPORTPAGE fakeout refused",
    },
    {
      id: "inherited-phase20-23-roster-facdetail-evidence",
      covers: "parent-active-restricted-15451-cumulative-disclosure-verified",
      cumulativeDisclosureVerified: 15451,
      evidence:
        "Phase 23 matrix cumulativeDisclosureVerified=15451 for parent roster; Tier 1 15429 is subset under approved mapping",
    },
  ],
} as const;

export type CaliforniaCoverageSampleObservation = {
  facilityNumber: string;
  downloadFile: "RCFE" | "ARF";
  facilityType: string;
  facilityName: string;
  downloadStatus: string;
  licenseFirstDate: string | null;
  capacity: string | null;
  pendingIncrease: boolean;
  leadingZero: boolean;
  pageHttpStatus: number;
  apiHttpStatus: number;
  apiStatus: string | null;
  identifierExactMatch: boolean;
  reportsCount: number;
  reportDocumentHttpStatus: number | null;
  reportDocumentContainsFacilityNumber: boolean | null;
  reportPageFieldIsFakeoutPlaceholder: boolean | null;
  classification: "working-facility-specific" | "fail";
};

/** Stratified live sample (2026-11-21), rate-limited at 400ms. */
export const CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS: readonly CaliforniaCoverageSampleObservation[] =
  [
  {
    "facilityNumber": "079201384",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "ECOLUX ASSISTED LIVING",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "7/31/2024",
    "capacity": "6",
    "pendingIncrease": true,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 12,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "015601083",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "MARYMOUNT VILLA RETIREMENT CENTER",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "11/23/2004",
    "capacity": "99",
    "pendingIncrease": true,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 57,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "015601284",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "RAKSHA 6",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "5/11/2007",
    "capacity": "6",
    "pendingIncrease": true,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 7,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "079201349",
    "downloadFile": "ARF",
    "facilityType": "ADULT DAY PROGRAM",
    "facilityName": "CATALYST CARES ADULT DAY PROGRAM",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "5/2/2024",
    "capacity": "60",
    "pendingIncrease": true,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 10,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "335530021",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "SYCAMORE HOUSE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "10/17/2022",
    "capacity": "3",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 6,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "392701658",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "CORRAL HOLLOW NEW HORIZONS",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "7/7/2025",
    "capacity": "3",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 5,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "107200486",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "SIERRA PALACE FOR ELDERLY",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "2/4/1997",
    "capacity": "6",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 13,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "335530026",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "PRINCE OF PEACE CORPORATION",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "11/9/2022",
    "capacity": "4",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 11,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "107206560",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "SIERRA PALACE FOR THE ELDERLY",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "6/13/2012",
    "capacity": "6",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 8,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "371881418",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "VILLA BERNARDO",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "6/21/2023",
    "capacity": "10",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 8,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "157204130",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "RIVERSTONE TERRACE SENIOR LIVING",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "7/30/2008",
    "capacity": "55",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 19,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "374604454",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "HUNTINGTON MANOR",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "5/27/2021",
    "capacity": "21",
    "pendingIncrease": true,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed/Pending Increase",
    "identifierExactMatch": true,
    "reportsCount": 25,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "092700093",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "SUNSHINE MANOR",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/14/2017",
    "capacity": "14",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 9,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "079201524",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "BUENAVISTA HOME AT PEPPERWOOD III",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "8/5/2025",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 2,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "075600575",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "EL CERRITO ROYALE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "6/4/2002",
    "capacity": "145",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 17,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "045002766",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "CASA DE AMOR",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/31/2020",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 8,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "037001001",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "GOLD QUARTZ INN RETIREMENT HOME",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "2/27/1998",
    "capacity": "47",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 18,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "015600562",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "MORNING SUN CARE HOME",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "10/12/2001",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 10,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "079201229",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "BRENT HOME, LLC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "3/24/2023",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 5,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "015202110",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
    "facilityName": "ELWYN NC - MEADOWLARK",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/24/2008",
    "capacity": "5",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 20,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "079200820",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "STONEHEDGE GUEST HOME",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/11/2018",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 8,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "015601298",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "JASMINE COURT",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "2/28/2008",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 4,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "547209219",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "KAWEAH HEALTH RUTH WOOD OPEN ARMS HOUSE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "7/20/2022",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 7,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "507206765",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "GOLDEN AGE VII",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "6/30/2016",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 12,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "306006568",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "BAYSIDE COTTAGES II",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "2/7/2025",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 2,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "198320631",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "PINE RESIDENTIAL VILLA INC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "11/21/2025",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 1,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "366413080",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "TUPARAN RESIDENTIAL CARE FACILITY INC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "4/26/2007",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 10,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "079201615",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "SILVERWAY II",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/17/2025",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": true,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 4,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "371881380",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "COUNTRY GARDENS",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "1/17/2023",
    "capacity": "16",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 7,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "195850546",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "SAVANT OF WOODLAND HILLS",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/31/2024",
    "capacity": "322",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 13,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "565801812",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "COMPASSIONATE CARE RESIDENCE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "9/5/2012",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 5,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "435200238",
    "downloadFile": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "facilityName": "SNOW WHITE CARE HOME",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "2/27/1996",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 6,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "502701826",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "JADE WAY COMMONS, LLC DBA",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "4/15/2026",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 1,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "490111817",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "LAUGHLIN COUNTRY HOME",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "10/13/1993",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 5,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "306006569",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "NICO BRIGHT HORIZONS CARE HOME - DONNA LANE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "10/31/2024",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 4,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "331881043",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "NOAH'S ARK ADULT HOME",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "3/23/2021",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 8,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "547209130",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "BAXTER-LEYVA ADULT FACILITY, LLC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "4/29/2021",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 6,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "342701241",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "BUEN VIAJE RESIDENCE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "7/25/2023",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 6,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "198600903",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "LA QUAY'S RESIDENTIAL FACILITY",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "2/8/2008",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 7,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "392701349",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "CARDINAL CARE HOME, LLC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "9/9/2024",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 5,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "342701164",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "CHIDIKE CARE HOME LLC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "8/4/2022",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 13,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "295920185",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "BRAGG HOUSE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "12/11/2024",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 7,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "198603780",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "CASA COLINA TRANSITIONAL LIVING CENTER-MELBOURNE",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "10/28/2024",
    "capacity": "5",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 3,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  },
  {
    "facilityNumber": "191800897",
    "downloadFile": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "facilityName": "ANNE SIPPI CLINIC",
    "downloadStatus": "LICENSED",
    "licenseFirstDate": "7/10/1989",
    "capacity": "37",
    "pendingIncrease": false,
    "leadingZero": false,
    "pageHttpStatus": 200,
    "apiHttpStatus": 200,
    "apiStatus": "Licensed",
    "identifierExactMatch": true,
    "reportsCount": 9,
    "reportDocumentHttpStatus": 200,
    "reportDocumentContainsFacilityNumber": true,
    "reportPageFieldIsFakeoutPlaceholder": true,
    "classification": "working-facility-specific"
  }
] as const;

export const CALIFORNIA_COVERAGE_SAMPLE_SUMMARY = {
  probed: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.length,
  workingFacilitySpecific: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.classification === "working-facility-specific",
  ).length,
  fail: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.classification === "fail",
  ).length,
  pendingIncreaseWorking: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.pendingIncrease && r.classification === "working-facility-specific",
  ).length,
  leadingZeroWorking: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.leadingZero && r.classification === "working-facility-specific",
  ).length,
  reportDocumentsChecked: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.reportDocumentHttpStatus !== null,
  ).length,
  reportDocumentsContainId: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.reportDocumentContainsFacilityNumber,
  ).length,
  reportPageAlwaysFakeoutWhenPresent: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS
    .filter((r) => r.reportPageFieldIsFakeoutPlaceholder !== null)
    .every((r) => r.reportPageFieldIsFakeoutPlaceholder === true),
} as const;

/**
 * Link classification: facility detail vs inspection/complaint reports.
 */
export const CALIFORNIA_COVERAGE_LINK_CLASSES = {
  facilityDetail: {
    kind: "facility-specific-detail" as const,
    urlPattern: "?Rewrite=FacDetail/{exactFacilityNumber}",
    publishableWhenVerified: true as const,
  },
  inspectionOrComplaintDocument: {
    kind: "inspection-or-complaint-report-document" as const,
    urlPattern: "FacilityReports?facNum={exactId}&inx={n}",
    publishableWhenVerified: true as const,
    distinctFromFacilityDetail: true as const,
  },
  reportPagePlaceholder: {
    kind: "reportpage-fakeout-placeholder" as const,
    neverPublish: true as const,
  },
  generalSearchOrDownload: {
    kind: "supplemental-attribution-only" as const,
    notFacilitySpecific: true as const,
  },
} as const;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function isCaliforniaCoverageFacilityNumber(facilityNumber: string): boolean {
  return FACILITY_NUMBER.test(text(facilityNumber));
}

export function californiaCoverageFacilityDetailPageUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  return `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityDetailPagePrefix}${id}`;
}

export function californiaCoverageFacilityDetailApiUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  return `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityDetailApi}${id}`;
}

export function californiaCoverageReportDocumentUrl(
  facilityNumber: string,
  reportIndex: number,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  if (!Number.isInteger(reportIndex) || reportIndex < 0) return null;
  return `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityReportDocumentApi}?facNum=${encodeURIComponent(id)}&inx=${reportIndex}`;
}

export function isCaliforniaCoverageFakeoutReportPageUrl(
  url: string | null | undefined,
): boolean {
  const u = text(url).toLowerCase();
  return u.includes("fakeout.gov");
}

export function californiaCoverageRefuseUnverifiedLink(input: {
  facilityNumber: string;
  candidateUrl?: string | null;
  linkClass?: "facility-detail" | "report-document" | "search-fallback";
}): { accepted: boolean; reason: string; canonicalUrl: string | null } {
  const id = text(input.facilityNumber);
  const linkClass = input.linkClass ?? "facility-detail";
  if (linkClass === "search-fallback") {
    return {
      accepted: false,
      reason: "search-fallback-not-facility-specific-disclosure",
      canonicalUrl: californiaCoverageFacilityDetailPageUrl(id),
    };
  }
  const canonical =
    linkClass === "report-document"
      ? californiaCoverageReportDocumentUrl(id, 0)
      : californiaCoverageFacilityDetailPageUrl(id);
  if (!canonical && linkClass === "facility-detail") {
    return {
      accepted: false,
      reason: "invalid-facility-number-no-link-generated",
      canonicalUrl: null,
    };
  }
  const candidate = text(input.candidateUrl);
  if (!candidate) {
    return {
      accepted: false,
      reason: "missing-candidate-url",
      canonicalUrl: canonical,
    };
  }
  if (isCaliforniaCoverageFakeoutReportPageUrl(candidate)) {
    return {
      accepted: false,
      reason: "fakeout-reportpage-refused",
      canonicalUrl: canonical,
    };
  }
  if (linkClass === "facility-detail" && candidate !== canonical) {
    return {
      accepted: false,
      reason: "candidate-not-canonical-facdetail-rewrite",
      canonicalUrl: canonical,
    };
  }
  if (linkClass === "report-document") {
    const expectedPrefix = `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityReportDocumentApi}?facNum=${encodeURIComponent(id)}&inx=`;
    if (!candidate.startsWith(expectedPrefix)) {
      return {
        accepted: false,
        reason: "candidate-not-canonical-report-document",
        canonicalUrl: canonical,
      };
    }
  }
  return {
    accepted: true,
    reason:
      linkClass === "report-document"
        ? "exact-canonical-report-document"
        : "exact-canonical-facdetail-rewrite",
    canonicalUrl: canonical,
  };
}

/**
 * Generator coverage over the Tier 1 ID space: every valid official ID maps
 * to exactly one FacDetail URL; invalid IDs produce no link (fail-closed).
 */
export function californiaCoverageGeneratorCoversTier1Id(facilityNumber: string): {
  covered: boolean;
  url: string | null;
  leadingZerosPreserved: boolean;
} {
  const id = text(facilityNumber);
  const url = californiaCoverageFacilityDetailPageUrl(id);
  return {
    covered: url !== null,
    url,
    leadingZerosPreserved: url !== null && url.endsWith(id),
  };
}

/** Representative RCFE/ARF facilities for development directory UX (not public). */
export type CaliforniaCoverageDirectorySample = {
  facilityNumber: string;
  facilityName: string;
  category: "RCFE" | "ARF";
  facilityType: string;
  apiStatus: string;
  licenseFirstDate: string | null;
  capacity: string | null;
  pendingIncrease: boolean;
  leadingZero: boolean;
  disclosureUrl: string;
  sourceAsOfIso: "2026-11-15";
};

export const CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES: readonly CaliforniaCoverageDirectorySample[] =
  [
  {
    "facilityNumber": "079201384",
    "facilityName": "ECOLUX ASSISTED LIVING",
    "category": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "apiStatus": "Licensed/Pending Increase",
    "licenseFirstDate": "7/31/2024",
    "capacity": "6",
    "pendingIncrease": true,
    "leadingZero": true,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/079201384",
    "sourceAsOfIso": "2026-11-15"
  },
  {
    "facilityNumber": "335530021",
    "facilityName": "SYCAMORE HOUSE",
    "category": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "apiStatus": "Licensed/Pending Increase",
    "licenseFirstDate": "10/17/2022",
    "capacity": "3",
    "pendingIncrease": true,
    "leadingZero": false,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/335530021",
    "sourceAsOfIso": "2026-11-15"
  },
  {
    "facilityNumber": "092700093",
    "facilityName": "SUNSHINE MANOR",
    "category": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "apiStatus": "Licensed",
    "licenseFirstDate": "12/14/2017",
    "capacity": "14",
    "pendingIncrease": false,
    "leadingZero": true,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/092700093",
    "sourceAsOfIso": "2026-11-15"
  },
  {
    "facilityNumber": "079201524",
    "facilityName": "BUENAVISTA HOME AT PEPPERWOOD III",
    "category": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "apiStatus": "Licensed",
    "licenseFirstDate": "8/5/2025",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": true,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/079201524",
    "sourceAsOfIso": "2026-11-15"
  },
  {
    "facilityNumber": "045002766",
    "facilityName": "CASA DE AMOR",
    "category": "ARF",
    "facilityType": "ADULT RESIDENTIAL",
    "apiStatus": "Licensed",
    "licenseFirstDate": "12/31/2020",
    "capacity": "4",
    "pendingIncrease": false,
    "leadingZero": true,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/045002766",
    "sourceAsOfIso": "2026-11-15"
  },
  {
    "facilityNumber": "547209219",
    "facilityName": "KAWEAH HEALTH RUTH WOOD OPEN ARMS HOUSE",
    "category": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "apiStatus": "Licensed",
    "licenseFirstDate": "7/20/2022",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/547209219",
    "sourceAsOfIso": "2026-11-15"
  },
  {
    "facilityNumber": "507206765",
    "facilityName": "GOLDEN AGE VII",
    "category": "RCFE",
    "facilityType": "RESIDENTIAL CARE ELDERLY",
    "apiStatus": "Licensed",
    "licenseFirstDate": "6/30/2016",
    "capacity": "6",
    "pendingIncrease": false,
    "leadingZero": false,
    "disclosureUrl": "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/507206765",
    "sourceAsOfIso": "2026-11-15"
  }
] as const;

export const CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO = {
  invalidFacilityNumber: "95354",
  disclosureUrl: null as null,
  reason: "invalid-facility-number-no-link-generated",
} as const;

export type CaliforniaCoveragePrelaunchArea =
  | "disclosure-coverage"
  | "identifier-integrity"
  | "link-classification"
  | "directory-experience"
  | "accessibility-licensing-dates"
  | "fail-closed"
  | "eligibility-accounting"
  | "publication-gate"
  | "security";

export type CaliforniaCoveragePrelaunchRow = {
  area: CaliforniaCoveragePrelaunchArea;
  title: string;
  status:
    | "pass"
    | "pass-with-sampling"
    | "blocked"
    | "policy-ready-not-activated";
  evidence: string;
  stopGo: "GO" | "STOP" | "CONDITIONAL";
};

export const CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT: readonly CaliforniaCoveragePrelaunchRow[] =
  [
    {
      area: "disclosure-coverage",
      title: "Facility-specific FacDetail coverage for offline Tier 1 (15,429)",
      status: "pass-with-sampling",
      evidence:
        "Deterministic generator covers 100% of valid official IDs. Stratified live sample 44/44 working (RCFE+ARF, Pending Increase, leading zeros). Inherited Phase 20/23 cumulative FacDetail verification for parent 15,451. Full 15,429 live re-probe not re-run this session (rate-limited; separate multi-session approval).",
      stopGo: "CONDITIONAL",
    },
    {
      area: "identifier-integrity",
      title: "Exact license identifiers including leading zeros",
      status: "pass",
      evidence:
        "All live sample FacilityDetail responses matched Facility Number exactly (including 15 leading-zero IDs). Truncated 8-digit forms refused as disclosure URLs for 9-digit canonical IDs.",
      stopGo: "GO",
    },
    {
      area: "link-classification",
      title: "Facility detail vs inspection/complaint reports",
      status: "pass",
      evidence:
        "FacDetail rewrite = facility detail. FacilityReports?facNum=&inx= = public inspection/complaint HTML (44/44 docs contained exact ID). REPORTPAGE fakeout.gov never publishable. Search/Download supplemental only.",
      stopGo: "GO",
    },
    {
      area: "directory-experience",
      title: "Development-only California directory under approved disclosure policy",
      status: "pass",
      evidence:
        "/development/california shows representative RCFE/ARF samples with FacDetail links, licensing status, License First Date, capacity, source as-of 2026-11-15. No public publication; fail-closed invalid ID demo.",
      stopGo: "GO",
    },
    {
      area: "accessibility-licensing-dates",
      title: "Accessibility, licensing information, and source dates",
      status: "pass",
      evidence:
        "Semantic headings/lists, clear link text to official CDSS pages, visible source as-of date, API license status + License First Date + capacity on samples. Unpublished banner and STOP alert.",
      stopGo: "GO",
    },
    {
      area: "fail-closed",
      title: "Reject invalid, placeholder, or unverified links",
      status: "pass",
      evidence:
        "Invalid 95354 → null disclosure URL. Fakeout REPORTPAGE refused. Non-canonical candidates refused. Search fallback not accepted as facility-specific disclosure.",
      stopGo: "GO",
    },
    {
      area: "eligibility-accounting",
      title: "Offline Tier 1 accounting under approved mapping",
      status: "policy-ready-not-activated",
      evidence:
        "15,429 offline Tier 1 future-eligible; 22 residual exclusions; exclusions inactive; publicationEligible=0.",
      stopGo: "CONDITIONAL",
    },
    {
      area: "publication-gate",
      title: "California public publication",
      status: "blocked",
      evidence:
        "State authorization unpublished. Disclosure/terms and statewide publication approvals still required. Development preview only.",
      stopGo: "STOP",
    },
    {
      area: "security",
      title: "Security / production boundary",
      status: "pass",
      evidence:
        "No Supabase writes, no exclusion activation, no California publication, no production deploy. WA/OR/FL/OH unchanged.",
      stopGo: "GO",
    },
  ];

export const CALIFORNIA_COVERAGE_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "activate-california-exclusion-ledger-in-app-db",
    title: "Activate California offline exclusion / eligibility ledger in app/DB",
    recommendation:
      "Defer until statewide publication plan is ready; keep inactive.",
    blocksPublicationAlone: false,
  },
  {
    id: "approve-california-statewide-public-publication",
    title: "Approve California statewide public publication",
    recommendation:
      "Do not approve yet — disclosure/authorization gates remain STOP.",
    blocksPublicationAlone: true,
  },
  {
    id: "authorize-full-15429-live-facdetail-reprobe",
    title:
      "Authorize multi-session rate-limited live FacDetail re-probe of all 15,429 Tier 1 IDs",
    recommendation:
      "Optional hardening. Current coverage argument (generator + stratified sample + inherited Phase 20/23 roster evidence) is sufficient for prelaunch assessment; full re-probe is not a publication unlock by itself.",
    blocksPublicationAlone: false,
  },
  {
    id: "reclassify-prior-control-pending-increase-ids",
    title:
      "Reclassify prior-control IDs 019201167 / 019201133 under Pending Increase mapping",
    recommendation:
      "Optional. Keep excluded as prior controls unless explicitly wanted under the mapping.",
    blocksPublicationAlone: false,
  },
] as const;

export const CALIFORNIA_COVERAGE_RESOLVED = [
  "facility-specific-facdetail-policy-approved-search-supplemental-only",
  "deterministic-generator-covers-all-valid-tier1-ids",
  "stratified-live-sample-44-of-44-working",
  "pending-increase-and-leading-zero-samples-verified",
  "facility-detail-vs-inspection-complaint-distinguished",
  "fakeout-reportpage-refused",
  "invalid-unverified-links-fail-closed",
  "development-directory-refined-under-approved-policy",
  "source-asof-2026-11-15-unchanged",
] as const;

export const CALIFORNIA_COVERAGE_REMAINING_BLOCKERS = [
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive-not-activated",
  "disclosure-terms-not-cleared-for-public-launch",
  "full-15429-live-reprobe-not-run-this-session",
  "missing-first-date-14-remain-excluded",
  "provisional-5-remain-excluded",
  "prior-conflicts-3-remain-excluded",
  "publication-approval-required",
] as const;

export function buildCaliforniaDisclosureCoveragePrelaunchPreview() {
  const c = CALIFORNIA_COVERAGE_TIER1_COUNTS;
  const s = CALIFORNIA_COVERAGE_SAMPLE_SUMMARY;
  const m = CALIFORNIA_COVERAGE_METHODOLOGY;
  const p = CALIFORNIA_COVERAGE_DISCLOSURE_POLICY;
  const d = CALIFORNIA_COVERAGE_DOWNLOAD;

  const sampleOk =
    s.probed === 44
    && s.workingFacilitySpecific === 44
    && s.fail === 0
    && s.pendingIncreaseWorking >= 10
    && s.leadingZeroWorking >= 10
    && s.reportDocumentsContainId === s.reportDocumentsChecked
    && s.reportPageAlwaysFakeoutWhenPresent;

  const generatorOk =
    californiaCoverageFacilityDetailPageUrl("015601083")
      === `${CALIFORNIA_COVERAGE_OFFICIAL_URLS.facilityDetailPagePrefix}015601083`
    && californiaCoverageFacilityDetailPageUrl("95354") === null
    && californiaCoverageRefuseUnverifiedLink({
      facilityNumber: "015601083",
      candidateUrl: californiaCoverageFacilityDetailPageUrl("15601083"),
    }).accepted === false
    && californiaCoverageRefuseUnverifiedLink({
      facilityNumber: "015601083",
      candidateUrl:
        "http://www.fakeout.gov/WebReports/FASWebReportDisplay.nsf/0/abc?OpenDocument",
    }).accepted === false
    && californiaCoverageRefuseUnverifiedLink({
      facilityNumber: "015601083",
      linkClass: "search-fallback",
      candidateUrl: CALIFORNIA_COVERAGE_OFFICIAL_URLS.careFacilitySearchHome,
    }).accepted === false
    && californiaCoverageGeneratorCoversTier1Id("079201384").covered
    && californiaCoverageGeneratorCoversTier1Id("079201384")
      .leadingZerosPreserved;

  const arithmeticOk =
    sampleOk
    && generatorOk
    && c.offlineTier1Candidates === 15429
    && c.publicationEligible === 0
    && !c.exclusionsActivated
    && c.offlineTier1Candidates
      === c.otherwiseClearPreApproval + c.pendingIncreaseFutureEligible
    && p.facilitySpecificFacDetailApproved
    && p.generalSearchLinksSupplementalOnly
    && p.reportPageFakeoutNeverPublish
    && d.adoptedAsOfIso === "2026-11-15"
    && !d.newerDownloadAvailable
    && m.fullLiveCrawlOf15429NotRunThisSession
    && CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.length >= 6
    && CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.some((r) => r.pendingIncrease)
    && CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.some((r) => r.category === "RCFE")
    && CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES.some((r) => r.category === "ARF")
    && CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO.disclosureUrl === null;

  const assessmentGo = CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT.filter(
    (r) => r.stopGo === "GO",
  ).length;
  const assessmentConditional = CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT.filter(
    (r) => r.stopGo === "CONDITIONAL",
  ).length;
  const assessmentStop = CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT.filter(
    (r) => r.stopGo === "STOP",
  ).length;

  return {
    observedOn: CALIFORNIA_COVERAGE_OBSERVED_ON,
    baseline: CALIFORNIA_COVERAGE_BASELINE,
    download: d,
    policy: p,
    methodology: m,
    counts: c,
    sampleSummary: s,
    samples: CALIFORNIA_COVERAGE_SAMPLE_OBSERVATIONS,
    linkClasses: CALIFORNIA_COVERAGE_LINK_CLASSES,
    directorySamples: CALIFORNIA_COVERAGE_DIRECTORY_SAMPLES,
    failClosedDemo: CALIFORNIA_COVERAGE_FAIL_CLOSED_DEMO,
    assessment: CALIFORNIA_COVERAGE_PRELAUNCH_ASSESSMENT,
    decisionsRequiringApproval: CALIFORNIA_COVERAGE_DECISIONS_REQUIRING_APPROVAL,
    resolvedFindings: CALIFORNIA_COVERAGE_RESOLVED,
    remainingBlockers: CALIFORNIA_COVERAGE_REMAINING_BLOCKERS,
    arithmeticOk,
    assessmentGo,
    assessmentConditional,
    assessmentStop,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    stopGoDisclosureCoverage: "CONDITIONAL" as const,
    mostActionableNextStep:
      "Public California remains STOP. Disclosure coverage is CONDITIONAL-GO for development (generator + stratified sample + inherited roster evidence). Remaining human gates: exclusion ledger activation, statewide publication/authorization, optional full 15,429 live re-probe, optional prior-control reclassify.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "california-unpublished",
      "search-links-supplemental-only",
      "fakeout-reportpage-never-published",
      "leading-zeros-preserved",
    ] as const,
  };
}

export function californiaDisclosureCoverageAllowsPublication(): false {
  return false;
}

export function californiaDisclosureCoverageDirectoryReady(): false {
  return false;
}

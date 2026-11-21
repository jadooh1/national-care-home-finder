/**
 * California official CDSS disclosure-link verification (post-#203).
 *
 * Verifies FacDetail page / FacilityDetail API / FacilityReports document
 * patterns. Preserves exact 8–9 digit license IDs (including leading zeros).
 * Refuses unverified / invalid / fakeout REPORTPAGE URLs.
 *
 * Development-only. Does not activate exclusions, publish California, or
 * write Supabase. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_DISCLOSURE_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_DISCLOSURE_BASELINE = "f524b66" as const;

export const CALIFORNIA_DISCLOSURE_OFFICIAL_URLS = {
  facilityDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  facilityReportsListApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityReports/",
  /** SPA uses this to open a public inspection/complaint HTML document. */
  facilityReportDocumentApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityReports",
  careFacilitySearchHome: "https://www.ccld.dss.ca.gov/carefacilitysearch/",
  downloadDataPage:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata",
} as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

export type CaliforniaDisclosureSampleRole =
  | "control-licensed"
  | "leading-zero-licensed"
  | "leading-zero-pending-increase"
  | "pending-increase"
  | "missing-first-date"
  | "provisional"
  | "prior-pending-incomplete"
  | "invalid-id";

export type CaliforniaDisclosureSampleObservation = {
  facilityNumber: string;
  role: CaliforniaDisclosureSampleRole;
  pageHttpStatus: number;
  pageIsSpaShell: true;
  apiHttpStatus: number;
  apiFound: boolean;
  apiFacilityNumber: string | null;
  apiStatus: string | null;
  identifierExactMatch: boolean;
  reportsListHttpStatus: number;
  reportsCount: number;
  reportDocumentHttpStatus: number | null;
  reportDocumentContainsFacilityNumber: boolean | null;
  reportPageFieldIsFakeoutPlaceholder: boolean | null;
  classification:
    | "working-facility-specific"
    | "invalid-identifier-refused"
    | "api-mismatch";
};

/**
 * Live sample observations (2026-11-21). Page URLs always return SPA shell 200;
 * FacilityDetail API proves the correct facility. Report documents are fetched
 * via FacilityReports?facNum=&inx= (not REPORTPAGE, which is fakeout.gov).
 */
export const CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS: readonly CaliforniaDisclosureSampleObservation[] =
  [
    {
      facilityNumber: "100400070",
      role: "control-licensed",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "100400070",
      apiStatus: "Licensed",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 17,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "015601302",
      role: "leading-zero-licensed",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "015601302",
      apiStatus: "Licensed",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 13,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "015601083",
      role: "leading-zero-pending-increase",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "015601083",
      apiStatus: "Licensed/Pending Increase",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 57,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "374604742",
      role: "pending-increase",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "374604742",
      apiStatus: "Licensed/Pending Increase",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 4,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "336426330",
      role: "pending-increase",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "336426330",
      apiStatus: "Licensed/Pending Increase",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 41,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "079201725",
      role: "missing-first-date",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "079201725",
      apiStatus: "Licensed",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 3,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "198320787",
      role: "provisional",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "198320787",
      apiStatus: "Provisional License",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 9,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "502701867",
      role: "prior-pending-incomplete",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: true,
      apiFacilityNumber: "502701867",
      apiStatus: "Pending Incomplete Application",
      identifierExactMatch: true,
      reportsListHttpStatus: 200,
      reportsCount: 1,
      reportDocumentHttpStatus: 200,
      reportDocumentContainsFacilityNumber: true,
      reportPageFieldIsFakeoutPlaceholder: true,
      classification: "working-facility-specific",
    },
    {
      facilityNumber: "95354",
      role: "invalid-id",
      pageHttpStatus: 200,
      pageIsSpaShell: true,
      apiHttpStatus: 200,
      apiFound: false,
      apiFacilityNumber: null,
      apiStatus: null,
      identifierExactMatch: false,
      reportsListHttpStatus: 200,
      reportsCount: 0,
      reportDocumentHttpStatus: 404,
      reportDocumentContainsFacilityNumber: false,
      reportPageFieldIsFakeoutPlaceholder: null,
      classification: "invalid-identifier-refused",
    },
  ];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function isCaliforniaOfficialFacilityNumber(facilityNumber: string): boolean {
  return FACILITY_NUMBER.test(text(facilityNumber));
}

/**
 * Fail-closed facility-specific disclosure page URL. Never invents IDs;
 * never truncates leading zeros; returns null for invalid identifiers.
 */
export function californiaOfficialFacilityDetailPageUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  return `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityDetailPagePrefix}${id}`;
}

export function californiaOfficialFacilityDetailApiUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  return `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityDetailApi}${id}`;
}

/**
 * Public inspection/complaint HTML document URL used by the CDSS SPA.
 * Requires a non-negative report index from FacilityReports list.
 */
export function californiaOfficialFacilityReportDocumentUrl(
  facilityNumber: string,
  reportIndex: number,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  if (!Number.isInteger(reportIndex) || reportIndex < 0) return null;
  return `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityReportDocumentApi}?facNum=${encodeURIComponent(id)}&inx=${reportIndex}`;
}

/** REPORTPAGE values observed as http://www.fakeout.gov/... must never be published. */
export function isCaliforniaFakeoutReportPageUrl(url: string | null | undefined): boolean {
  const u = text(url).toLowerCase();
  return u.includes("fakeout.gov") || u.includes("www.fakeout.gov");
}

export function californiaRefuseUnverifiedDisclosureUrl(input: {
  facilityNumber: string;
  candidateUrl?: string | null;
}): {
  accepted: boolean;
  reason: string;
  canonicalPageUrl: string | null;
} {
  const id = text(input.facilityNumber);
  const canonical = californiaOfficialFacilityDetailPageUrl(id);
  if (!canonical) {
    return {
      accepted: false,
      reason: "invalid-facility-number-no-link-generated",
      canonicalPageUrl: null,
    };
  }
  const candidate = text(input.candidateUrl);
  if (!candidate) {
    return {
      accepted: false,
      reason: "missing-candidate-url",
      canonicalPageUrl: canonical,
    };
  }
  if (isCaliforniaFakeoutReportPageUrl(candidate)) {
    return {
      accepted: false,
      reason: "fakeout-reportpage-refused",
      canonicalPageUrl: canonical,
    };
  }
  if (candidate !== canonical) {
    return {
      accepted: false,
      reason: "candidate-not-canonical-facdetail-rewrite",
      canonicalPageUrl: canonical,
    };
  }
  return {
    accepted: true,
    reason: "exact-canonical-facdetail-rewrite",
    canonicalPageUrl: canonical,
  };
}

/**
 * Transparent fallback when facility-specific disclosure is unavailable or
 * not yet wired: point users to the official CDSS Care Facility Search and
 * Download Data pages (not invented facility URLs).
 */
export const CALIFORNIA_DISCLOSURE_FALLBACK_PROPOSAL = {
  id: "official-cdss-search-and-download-fallback",
  title: "Official CDSS Care Facility Search / Download Data fallback",
  links: {
    careFacilitySearchHome:
      CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.careFacilitySearchHome,
    downloadDataPage: CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.downloadDataPage,
  },
  whenToUse: [
    "Facility number is invalid / non-canonical (no facility-specific link generated).",
    "Facility-specific FacDetail URL not yet verified for a candidate.",
    "Supplemental attribution alongside (not instead of) a verified FacDetail link.",
  ],
  doesNotInventFacilityUrls: true as const,
  preservesLeadingZeros: true as const,
} as const;

/**
 * Tier 1 / publication policy assessment for disclosure links + fallback.
 */
export const CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT = {
  offlineTier1DisclosureRequired:
    false as const /* matches CALIFORNIA_TRANSPARENCY_TIER1_RULES.disclosureRequired */,
  facilitySpecificFacDetailAvailableForValidIds: true as const,
  inspectionDocumentsPublicViaFacilityReportsQuery: true as const,
  reportPageFieldPublishable: false as const,
  fallbackSatisfiesOfflineTier1:
    true as const /* offline Tier 1 does not require facility-specific disclosure */,
  fallbackSatisfiesPublicationAcceptanceFacilitySpecificLink:
    false as const /* publication-acceptance still requires exact FacDetail rewrite */,
  fallbackNeedsSeparateApprovalToReplaceFacilitySpecificPublicationLinks:
    true as const,
  rationale: [
    "Offline Tier 1 already sets disclosureRequired=false; a transparent CDSS Search/Download fallback satisfies offline Tier 1 attribution without inventing facility URLs.",
    "Publication acceptance still requires an exact facility-specific FacDetail rewrite URL for the official ID. Using only the Search/Download fallback for public listing links needs separate human policy approval.",
    "FacilityReports REPORTPAGE values resolve to fakeout.gov placeholders and must never be published; use FacilityReports?facNum=&inx= for real public HTML documents.",
  ],
} as const;

export const CALIFORNIA_DISCLOSURE_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "approve-cdss-search-fallback-as-sole-public-disclosure-link",
    title:
      "Approve CDSS Search/Download fallback as the sole public disclosure link (replacing facility-specific FacDetail)",
    decisionText:
      "Approve using only the official CDSS Care Facility Search home and/or Download Data page as the public disclosure link for California listings, instead of facility-specific FacDetail rewrite URLs — knowing this does not satisfy the current publication-acceptance facility-specific-disclosure-link rule.",
    recommendation:
      "Reject for publication. Prefer facility-specific FacDetail URLs for valid 8–9 digit IDs; keep Search/Download as supplemental attribution / offline Tier 1 fallback only.",
    blocksOfflineTier1: false,
    blocksPublication: true,
  },
] as const;

export const CALIFORNIA_DISCLOSURE_COUNTS = {
  sampleSize: CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS.length,
  workingFacilitySpecific: CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.classification === "working-facility-specific",
  ).length,
  invalidRefused: CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS.filter(
    (r) => r.classification === "invalid-identifier-refused",
  ).length,
  leadingZeroSamplesVerified: 2,
  pendingIncreaseSamplesVerified: 3,
  excludedFacilitySamplesVerified: 3,
  tier1OfflineEligible: 15429,
  remainingListingExclusions: 22,
  publicationEligible: 0,
} as const;

export const CALIFORNIA_DISCLOSURE_RESOLVED = [
  "facdetail-rewrite-pattern-reconfirmed",
  "facilitydetail-api-proves-correct-facility-including-leading-zeros",
  "facilityreports-documents-publicly-accessible-via-facnum-inx",
  "reportpage-fakeout-placeholder-refused",
  "invalid-id-95354-no-facility-specific-link",
  "offline-tier1-fallback-satisfies-disclosureRequired-false",
] as const;

export const CALIFORNIA_DISCLOSURE_REMAINING = [
  "california-publication-blocked",
  "publication-still-requires-facility-specific-facdetail-link",
  "fallback-as-sole-public-link-needs-separate-approval",
  "exclusion-policy-inactive",
  "publication-approval-required",
] as const;

export function buildCaliforniaDisclosureLinkVerificationPreview() {
  const c = CALIFORNIA_DISCLOSURE_COUNTS;
  const samplesOk =
    c.workingFacilitySpecific + c.invalidRefused === c.sampleSize
    && c.workingFacilitySpecific >= 7
    && c.invalidRefused === 1;

  const leadingZeroOk = CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS.filter((r) =>
    r.facilityNumber.startsWith("0"),
  ).every((r) => r.identifierExactMatch && r.classification === "working-facility-specific");

  const arithmeticOk =
    samplesOk
    && leadingZeroOk
    && c.publicationEligible === 0
    && c.tier1OfflineEligible === 15429
    && CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT.fallbackSatisfiesOfflineTier1
    && !CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT
      .fallbackSatisfiesPublicationAcceptanceFacilitySpecificLink
    && californiaOfficialFacilityDetailPageUrl("015601302")
      === `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityDetailPagePrefix}015601302`
    && californiaOfficialFacilityDetailPageUrl("95354") === null
    && californiaRefuseUnverifiedDisclosureUrl({
      facilityNumber: "015601302",
      candidateUrl: californiaOfficialFacilityDetailPageUrl("15601302"),
    }).accepted === false
    && isCaliforniaFakeoutReportPageUrl(
      "http://www.fakeout.gov/WebReports/FASWebReportDisplay.nsf/0/abc?OpenDocument",
    )
    && californiaOfficialFacilityReportDocumentUrl("015601302", 0)
      === `${CALIFORNIA_DISCLOSURE_OFFICIAL_URLS.facilityReportDocumentApi}?facNum=015601302&inx=0`;

  return {
    observedOn: CALIFORNIA_DISCLOSURE_OBSERVED_ON,
    baseline: CALIFORNIA_DISCLOSURE_BASELINE,
    urls: CALIFORNIA_DISCLOSURE_OFFICIAL_URLS,
    samples: CALIFORNIA_DISCLOSURE_SAMPLE_OBSERVATIONS,
    counts: c,
    fallback: CALIFORNIA_DISCLOSURE_FALLBACK_PROPOSAL,
    tier1Policy: CALIFORNIA_DISCLOSURE_TIER1_POLICY_ASSESSMENT,
    decisionsRequiringApproval:
      CALIFORNIA_DISCLOSURE_DECISIONS_REQUIRING_APPROVAL,
    resolvedFindings: CALIFORNIA_DISCLOSURE_RESOLVED,
    remainingBlockers: CALIFORNIA_DISCLOSURE_REMAINING,
    arithmeticOk,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    mostActionableNextStep:
      "Use facility-specific FacDetail rewrite URLs for valid official IDs; never publish fakeout REPORTPAGE values; keep CDSS Search/Download as offline Tier 1 / supplemental fallback unless humans approve it as the sole public disclosure link.",
    preservedRestrictions: [
      "leading-zeros-preserved",
      "no-unverified-links-generated",
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "california-unpublished",
    ] as const,
  };
}

export function californiaDisclosureLinkVerificationAllowsPublication(): false {
  return false;
}

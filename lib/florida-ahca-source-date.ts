/**
 * Florida AHCA / FloridaHealthFinder authoritative source-date verification.
 * Intentionally free of sibling runtime imports.
 *
 * Does not re-run the 3,025-facility roster investigation. Does not publish
 * Florida, flip directoryContract, enable owner claims, or write Supabase.
 * Agency email draft only — do not send from agents.
 */

export const FLORIDA_SOURCE_DATE_OBSERVED_ON = "2026-11-21";
export const FLORIDA_SOURCE_DATE_BASE_COMMIT =
  "1467525876470b320659b466f3d76276ccd5b297";

/** Preserved from Florida Tier 1 eligibility verification (#192). */
export const FLORIDA_SOURCE_DATE_PRESERVED_COUNTS = {
  denominatorRows: 3025,
  tier1OfflineEligible: 2251,
  publicationEligible: 0,
  finalPublicVisibility: false,
} as const;

export const FLORIDA_SOURCE_DATE_SURFACES = {
  alfEmbed:
    "https://quality.healthfinder.fl.gov/Facility-Provider/ALF?LS=1&type=1",
  consumerGuide:
    "https://quality.healthfinder.fl.gov/report-guides/assisted-living",
  orderData: "https://quality.healthfinder.fl.gov/researchers/order-data/",
  goLivePdf:
    "https://fhfstore.blob.core.windows.net/documents/researchers/Reference/Methodology/FHF%20Go%20Live%20Date%20Table.pdf",
  ahcaAlfUnit:
    "https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/assisted-living-unit/assisted-living-facility.html",
  miamiDadeSample:
    "https://quality.healthfinder.fl.gov/files/AllFacilityData_MiamiDade_08242026.xlsx",
  dohGis2013:
    "https://maps.floridahealth.gov/server/rest/services/DEMO/HealthCareFacilities/FeatureServer/3",
} as const;

/**
 * Nationwide freshness gate (lib/publication-eligibility.ts evaluateFreshness):
 * Tier 1 freshness passes only with a source-issued ISO calendar export date,
 * OR a documented human-approved policy exception PLUS independent official
 * currentness evidence with no rejected clock proxies.
 */
export const FLORIDA_SOURCE_DATE_POLICY_GATE = {
  requiresSourceIssuedIsoOrDocumentedException: true as const,
  policyExceptionRequiresDocumentedPolicy: true as const,
  policyExceptionRequiresIndependentEvidence: true as const,
  nightlyScheduleAloneInsufficient: true as const,
  httpLastModifiedRejected: true as const,
  pageTimestampRejected: true as const,
  retrievalTimestampRejected: true as const,
  filenameTimestampRejected: true as const,
  countySampleRejected: true as const,
  unrelatedGisRejected: true as const,
  /** No human-approved Florida freshness exception text exists in-repo. */
  floridaFreshnessPolicyDocumented: false as const,
  floridaIndependentCurrentnessEvidence: false as const,
  permitsTier1WithoutIsoExportDate: false as const,
} as const;

export const FLORIDA_SOURCE_DATE_CANDIDATES = [
  {
    id: "alf-embed-iso-stamp",
    surface: "FloridaHealthFinder ALF comparison embed (ClientCode 11)",
    observation: "No source-issued ISO export/version stamp on the roster embed",
    disposition: "absent" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "http-date-header",
    surface: "ALF embed response Date header",
    observation: "Present as HTTP Date (e.g. Sat, 21 Nov 2026); Last-Modified absent",
    disposition: "rejected-http-clock" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "consumer-guide-nightly",
    surface: "Assisted Living consumer guide",
    observation:
      "States the Comparison Tool is updated nightly; also shows brochure 'as of November 2024' / 'last updated in 2025'",
    disposition: "rejected-schedule-claim" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "go-live-pdf-alf-nightly",
    surface: "FHF Go Live Date Table PDF",
    observation: "ALF column lists approximate schedule 'Nightly' — not a dated export stamp",
    disposition: "rejected-schedule-claim" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "order-data-patient-files",
    surface: "FloridaHealthFinder Order Data / Data Dictionary",
    observation:
      "Hospital/ASC/ED patient data sales and certification tables — not the statewide ALF licensing roster",
    disposition: "rejected-wrong-dataset" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "miami-dade-sample-xlsx",
    surface: "AllFacilityData_MiamiDade_08242026.xlsx",
    observation:
      "County mixed-type sample; HTTP Last-Modified 2026-09-16; filename 08242026 is not statewide ALF ISO",
    disposition: "rejected-county-sample" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "doh-gis-2013",
    surface: "Florida DOH HealthCareFacilities FeatureServer layer 3",
    observation: "May 2013 GIS snapshot — unrelated and stale for AHCA ALF embed freshness",
    disposition: "rejected-unrelated-gis" as const,
    acceptedAsOfficialExport: false,
  },
  {
    id: "ahca-alf-unit-page",
    surface: "AHCA Assisted Living Unit web page",
    observation:
      "Directs consumers to FloridaHealthFinder search; no dated statewide ALF bulk export linked",
    disposition: "absent" as const,
    acceptedAsOfficialExport: false,
  },
] as const;

export const FLORIDA_SOURCE_DATE_DECISION = {
  verdict: "STOP" as const,
  authoritativeIsoExportDate: null,
  freshnessPolicyExceptionApplies: false as const,
  blocksPublicTier1: true as const,
  preservesOfflineTier1Candidates: true as const,
  changesPublicationEligible: false as const,
  reason:
    "No source-issued ISO export/version stamp was found for the statewide ALF roster. The nationwide freshness policy does not permit Tier 1 listings on nightly-update claims, HTTP clocks, brochure month-years, county samples, or unrelated GIS alone, and no Florida documented policy exception with independent evidence exists.",
  mostActionableNextStep:
    "Human sends the prepared AHCA clarification email (agents must not send) requesting a dated statewide ALF export or written version stamp matching the FloridaHealthFinder ClientCode 11 embed.",
} as const;

/**
 * Draft only — do not send from the agent.
 */
export const FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT = {
  doNotSend: true as const,
  toSuggested: "assistedliving@ahca.myflorida.com (AHCA Assisted Living Unit — verify current contact)",
  ccSuggested: "contactus@ahca.myflorida.com (FloridaHealthFinder / data steward — verify)",
  subject:
    "Request for authoritative statewide ALF roster export date / version stamp (FloridaHealthFinder)",
  body: `Hello,

We are independently verifying the statewide Assisted Living Facility (ALF) licensing roster published through FloridaHealthFinder for a development-only consumer directory review. Nothing is publicly launched from this request.

Could you please provide an authoritative freshness statement for the statewide ALF roster that corresponds to the FloridaHealthFinder ALF comparison/list embed (ClientCode 11)?

Specifically:

1. Is there an official ISO calendar date or version stamp for that statewide ALF roster (for example, “export as of YYYY-MM-DD” or a numbered data version)?
2. If freshness is maintained through a nightly refresh, is there a machine-readable or written as-of date for a given night’s statewide ALF extract that consumers may cite?
3. Is there a dated bulk file (CSV/XLSX) that matches the statewide ALF embed and carries an official export/version label?

For our verification rules we cannot treat as the statewide ALF export date:
- HTTP Date / Last-Modified headers
- Page generation clocks
- Consumer “updated nightly” language alone
- The Miami-Dade sample workbook title or its Last-Modified
- Unrelated DOH GIS layers
- Hospital/patient Order Data certification dates

Thank you for any written guidance or a dated statewide ALF file.

Regards,
`,
} as const;

export function buildFloridaAhcaSourceDateReport() {
  const accepted = FLORIDA_SOURCE_DATE_CANDIDATES.filter((c) => c.acceptedAsOfficialExport);
  return {
    observedOn: FLORIDA_SOURCE_DATE_OBSERVED_ON,
    baseCommit: FLORIDA_SOURCE_DATE_BASE_COMMIT,
    surfaces: FLORIDA_SOURCE_DATE_SURFACES,
    policyGate: FLORIDA_SOURCE_DATE_POLICY_GATE,
    candidates: [...FLORIDA_SOURCE_DATE_CANDIDATES],
    acceptedOfficialExportCandidates: accepted.length,
    decision: FLORIDA_SOURCE_DATE_DECISION,
    preservedCounts: FLORIDA_SOURCE_DATE_PRESERVED_COUNTS,
    agencyEmailDraft: FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT,
    emailSent: false as const,
    developmentPreviewOnly: true as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    oregonUnchanged: true as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
  };
}

export function floridaSourceDateAllowsPublication(): false {
  return false;
}

export function floridaSourceDateClearsFreshnessGate(): false {
  return false;
}

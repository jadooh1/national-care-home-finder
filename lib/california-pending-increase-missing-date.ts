/**
 * California Pending Increase + missing License First Date verification
 * (post-#200). Uses agency-confirmed Transparency filename/header as-of.
 *
 * Distinguishes existing license status and approved capacity from any
 * proposed capacity increase (not published in Transparency APIs).
 * Reconciles the 14 missing-first-date IDs against live Download + FacilityDetail.
 *
 * Development-only. Does not activate exclusions, publish California, write
 * Supabase, or invent License First Dates from LICENSEEFFECTIVEDATE.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PENDING_MISSING_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_PENDING_MISSING_BASELINE = "84d9d15" as const;

export const CALIFORNIA_PENDING_MISSING_DOWNLOAD = {
  pathway: "downloadstatedata-transparency-csv" as const,
  rcfeUrl:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData/ResidentialElderCareFacility",
  arfUrl:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData/AdultResidentialFacilities",
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  rcfeContentDisposition:
    "attachment; filename=ResidentialElderCareFacility11152026.csv",
  arfContentDisposition:
    "attachment; filename=AdultResidentialFacilities11152026.csv",
  adoptedAsOfIso: "2026-11-15" as const,
  rcfeSha256:
    "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arfSha256:
    "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  rcfeBytes: 8635782,
  arfBytes: 5434124,
  rcfeRows: 13337,
  arfRows: 11040,
  unchangedFromPr199: true as const,
  cdssFilenameHeaderIsAsOfConfirmed: true as const,
} as const;

/** Same 66 IDs as Phase 23 / #200 listing exclusions. */
export const CALIFORNIA_PENDING_INCREASE_IDS = [
  "374604742",
  "045920148",
  "392701057",
  "374604751",
  "392700647",
  "435294286",
  "197606348",
  "552701748",
  "336426330",
  "392701601",
  "306005986",
  "374604986",
  "347000846",
  "015601083",
  "392701730",
  "366425800",
  "335530021",
  "365530102",
  "331881673",
  "107200486",
  "157204130",
  "374604375",
  "079201349",
  "336426289",
  "107209383",
  "374603495",
  "306006109",
  "371881418",
  "107206544",
  "331881036",
  "198603784",
  "374604213",
  "365530299",
  "374601445",
  "342700591",
  "392701427",
  "392701658",
  "107209533",
  "347001484",
  "331880891",
  "336400036",
  "079201384",
  "410508825",
  "342701384",
  "342700984",
  "370808095",
  "107206560",
  "435201626",
  "306004005",
  "374601420",
  "486804268",
  "015601284",
  "347001961",
  "335530026",
  "374604454",
  "300605585",
  "331881303",
  "306000870",
  "374604710",
  "370808447",
  "374600429",
  "195850551",
  "371881438",
  "191603551",
  "342701723",
  "374604532",
] as const;

export const CALIFORNIA_MISSING_LICENSE_FIRST_IDS = [
  "079201725",
  "502701889",
  "374605020",
  "342701856",
  "197610992",
  "342701894",
  "502701880",
  "198604006",
  "195850781",
  "107209715",
  "195850785",
  "197611051",
  "360951409",
  "198320716",
] as const;

/**
 * FacilityDetail LICENSEFIRSTDATE still empty AND LICENSEEFFECTIVEDATE empty
 * (strongest never-licensed / incomplete-evidence subclass).
 */
export const CALIFORNIA_MISSING_BOTH_LICENSE_DATES = [
  "079201725",
  "197610992",
  "342701894",
  "502701880",
  "107209715",
] as const;

/**
 * LICENSEFIRSTDATE empty on Download + FacilityDetail, but FacilityDetail
 * LICENSEEFFECTIVEDATE present. Effective date is NOT adopted as first date.
 */
export const CALIFORNIA_MISSING_FIRST_EFFECTIVE_PRESENT = [
  "502701889",
  "374605020",
  "342701856",
  "198604006",
  "195850781",
  "195850785",
  "197611051",
  "360951409",
  "198320716",
] as const;

export type CaliforniaPendingIncreaseFinding = {
  facilityNumber: string;
  downloadStatus: "LICENSED";
  facilityDetailStatus: "Licensed/Pending Increase";
  /** Currently approved licensed capacity from Download / FacilityDetail CAPACITY. */
  approvedCapacity: string | null;
  /** Proposed increase amount — not published in Transparency Download or FacilityDetail. */
  proposedCapacityIncrease: null;
  proposedCapacityPublishedInTransparencyApis: false;
  existingLicenseRecognized: true;
  mappingApprovedForPublication: false;
  offlineListingExcluded: true;
  publicationApproved: false;
  rationale: string;
};

export type CaliforniaMissingDateSubclass =
  | "both-license-dates-empty"
  | "first-empty-effective-present";

export type CaliforniaMissingDateFinding = {
  facilityNumber: string;
  downloadStatus: "LICENSED";
  downloadLicenseFirstDate: "";
  facilityDetailLicenseFirstDate: null;
  facilityDetailLicenseEffectiveDate: string | null;
  subclass: CaliforniaMissingDateSubclass;
  treatEffectiveAsFirstDate: false;
  offlineListingExcluded: true;
  publicationApproved: false;
  rationale: string;
};

export type CaliforniaPendingMissingDecisionRow = {
  id: string;
  area: "pending-increase" | "missing-license-first-date" | "freshness" | "publication";
  title: string;
  status: "resolved-documented" | "open-blocker" | "policy-pending";
  evidence: string;
  decision: string;
  publicationImpact: "none-still-excluded" | "none-still-blocked" | "clears-candidates";
};

/**
 * Documented decision matrix. No row clears publication or activates exclusions.
 */
export const CALIFORNIA_PENDING_MISSING_DECISION_MATRIX: readonly CaliforniaPendingMissingDecisionRow[] =
  [
    {
      id: "transparency-asof-revalidated",
      area: "freshness",
      title: "Latest official RCFE/ARF downloads revalidated via filename/header as-of",
      status: "resolved-documented",
      evidence:
        "2026-11-21 live DownloadStateData path-style GETs: Content-Disposition still ResidentialElderCareFacility11152026.csv / AdultResidentialFacilities11152026.csv; dual-file as-of 2026-11-15; sha256 unchanged from #199.",
      decision:
        "Adopted as-of remains 2026-11-15 under CDSS confirmation. No newer Transparency roster available at observation time.",
      publicationImpact: "none-still-blocked",
    },
    {
      id: "pending-increase-existing-license",
      area: "pending-increase",
      title: "Existing license status for Licensed/Pending Increase facilities",
      status: "resolved-documented",
      evidence:
        "All 66 IDs are Download LICENSED with non-empty License First Date and Facility Capacity. FacilityDetail sample 22/22 still \"Licensed/Pending Increase\" (none cleared to exact Licensed).",
      decision:
        "Recognize an existing licensed facility with a pending capacity-increase process overlay. Do not invent Licensed≡Licensed/Pending Increase equivalence for publication.",
      publicationImpact: "none-still-excluded",
    },
    {
      id: "pending-increase-approved-vs-proposed-capacity",
      area: "pending-increase",
      title: "Approved capacity vs proposed capacity increase",
      status: "resolved-documented",
      evidence:
        "Download Facility Capacity matches FacilityDetail CAPACITY on 10/10 capacity-compared samples. FacilityDetail schema exposes CAPACITY only — no proposed/pending-increase capacity field.",
      decision:
        "Treat CAPACITY / Facility Capacity as currently approved licensed capacity. Proposed increase amount is not published in Transparency APIs; never invent it. Capacity changes that disagree between Download and FacilityDetail stay fail-closed.",
      publicationImpact: "none-still-excluded",
    },
    {
      id: "pending-increase-publication-mapping",
      area: "pending-increase",
      title: "Publication mapping for Licensed/Pending Increase",
      status: "policy-pending",
      evidence:
        "Overlay is explainable coarsening/timing relative to bulk LICENSED, but no human-approved publication mapping exists (#200).",
      decision:
        "Keep all 66 offline listing-excluded and publicationApproved=false until a human-approved mapping is recorded. Exclusions stay inactive in app/DB.",
      publicationImpact: "none-still-excluded",
    },
    {
      id: "missing-first-date-download-unchanged",
      area: "missing-license-first-date",
      title: "Download License First Date still empty for all 14",
      status: "resolved-documented",
      evidence:
        "Fresh 2026-11-15 Transparency CSVs: all 14 still LICENSED with empty License First Date (0 cleared on download).",
      decision:
        "Missing-date listing exclusion remains CDSS-download-backed. FAQ \"No date on file\" does not authorize undated publication.",
      publicationImpact: "none-still-excluded",
    },
    {
      id: "missing-first-date-facilitydetail-subclasses",
      area: "missing-license-first-date",
      title: "FacilityDetail LICENSEFIRSTDATE vs LICENSEEFFECTIVEDATE",
      status: "resolved-documented",
      evidence:
        "All 14 FacilityDetail LICENSEFIRSTDATE null. Subclass A (5): both first and effective empty. Subclass B (9): LICENSEEFFECTIVEDATE present only.",
      decision:
        "Never treat LICENSEEFFECTIVEDATE as License First Date without human approval. Both subclasses remain offline listing-excluded.",
      publicationImpact: "none-still-excluded",
    },
    {
      id: "california-publication-still-stop",
      area: "publication",
      title: "California public publication gate",
      status: "open-blocker",
      evidence:
        "Offline Tier 1 candidates remain 15,363; publicationEligible=0; exclusions inactive; state authorization unpublished.",
      decision: "Public STOP. No exclusion activation and no California publication in this change.",
      publicationImpact: "none-still-blocked",
    },
  ];

export const CALIFORNIA_PENDING_MISSING_COUNTS = {
  pendingIncreaseIds: 66,
  pendingIncreaseFacilityDetailSample: 22,
  pendingIncreaseClearedToExactLicensed: 0,
  pendingIncreaseCapacitySampleCompared: 10,
  pendingIncreaseCapacityMatches: 10,
  missingLicenseFirstIds: 14,
  missingStillEmptyOnDownload: 14,
  missingClearedOnDownload: 0,
  missingBothDatesEmpty: 5,
  missingFirstEmptyEffectivePresent: 9,
  tier1OfflineEligible: 15363,
  publicationEligible: 0,
  exclusionsActivated: false,
} as const;

export const CALIFORNIA_PENDING_MISSING_RESOLVED = [
  "transparency-asof-revalidated-unchanged-2026-11-15",
  "pending-increase-existing-license-vs-proposed-capacity-distinguished",
  "pending-increase-approved-capacity-matches-sample",
  "proposed-capacity-increase-not-published-in-transparency-apis",
  "missing-first-date-download-still-empty-for-all-14",
  "missing-first-date-subclasses-documented",
  "effective-date-not-adopted-as-first-date",
] as const;

export const CALIFORNIA_PENDING_MISSING_REMAINING = [
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive",
  "pending-increase-mapping-not-approved-for-publication",
  "missing-date-requires-download-first-date-or-human-adoption",
  "arcgis-rejected-as-tier1-roster",
  "publication-approval-required",
] as const;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isPendingIncrease(live: string): boolean {
  return /^licensed\s*\/\s*pending\s+increase$/i.test(live);
}

function isExactLicensed(live: string): boolean {
  return /^licensed$/i.test(live);
}

function isBlank(value: unknown): boolean {
  return text(value) === "";
}

/**
 * Classify one Pending Increase candidate.
 * Approved capacity may be recorded; proposed increase is always null.
 */
export function classifyCaliforniaPendingIncrease(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
  downloadCapacity?: string | null;
  facilityDetailCapacity?: string | null;
}): CaliforniaPendingIncreaseFinding {
  const facilityNumber = text(input.facilityNumber);
  const downloadCapacity = text(input.downloadCapacity) || null;
  const detailCapacity = text(input.facilityDetailCapacity) || null;
  const approvedCapacity =
    downloadCapacity && detailCapacity && downloadCapacity === detailCapacity
      ? downloadCapacity
      : downloadCapacity ?? detailCapacity;

  return {
    facilityNumber,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    approvedCapacity,
    proposedCapacityIncrease: null,
    proposedCapacityPublishedInTransparencyApis: false,
    existingLicenseRecognized: true,
    mappingApprovedForPublication: false,
    offlineListingExcluded: true,
    publicationApproved: false,
    rationale:
      "Existing license is recognized with a Pending Increase overlay. CAPACITY is treated as currently approved capacity only. Proposed increase is not published in Transparency APIs. Keep listing-excluded until a human-approved publication mapping exists.",
  };
}

/**
 * Detect capacity disagreement between Download and FacilityDetail.
 * A mismatch is a stale/changing-capacity signal — fail-closed.
 */
export function evaluateCaliforniaCapacityChange(input: {
  downloadCapacity?: string | null;
  facilityDetailCapacity?: string | null;
}): {
  capacitiesPresent: boolean;
  capacitiesMatch: boolean | null;
  staleOrChangingCapacity: boolean;
  publicationApproved: false;
  rationale: string;
} {
  const download = text(input.downloadCapacity);
  const detail = text(input.facilityDetailCapacity);
  if (!download || !detail) {
    return {
      capacitiesPresent: false,
      capacitiesMatch: null,
      staleOrChangingCapacity: false,
      publicationApproved: false,
      rationale:
        "Capacity comparison requires both Download Facility Capacity and FacilityDetail CAPACITY.",
    };
  }
  const match = download === detail;
  return {
    capacitiesPresent: true,
    capacitiesMatch: match,
    staleOrChangingCapacity: !match,
    publicationApproved: false,
    rationale: match
      ? "Download and FacilityDetail capacities agree; treat as currently approved capacity."
      : "Download Facility Capacity disagrees with FacilityDetail CAPACITY. Treat as stale/changing-capacity signal and fail-closed; do not invent a merged capacity or proposed increase.",
  };
}

/**
 * Reconcile one missing License First Date ID.
 * LICENSEEFFECTIVEDATE never substitutes for License First Date here.
 */
export function reconcileCaliforniaMissingLicenseFirstDate(input: {
  facilityNumber: string;
  downloadLicenseFirstDate?: string | null;
  facilityDetailLicenseFirstDate?: string | null;
  facilityDetailLicenseEffectiveDate?: string | null;
  downloadStatus?: string | null;
}): CaliforniaMissingDateFinding {
  const facilityNumber = text(input.facilityNumber);
  const effective = text(input.facilityDetailLicenseEffectiveDate) || null;
  const subclass: CaliforniaMissingDateSubclass = effective
    ? "first-empty-effective-present"
    : "both-license-dates-empty";

  return {
    facilityNumber,
    downloadStatus: "LICENSED",
    downloadLicenseFirstDate: "",
    facilityDetailLicenseFirstDate: null,
    facilityDetailLicenseEffectiveDate: effective,
    subclass,
    treatEffectiveAsFirstDate: false,
    offlineListingExcluded: true,
    publicationApproved: false,
    rationale:
      subclass === "both-license-dates-empty"
        ? "Download and FacilityDetail both lack License First Date (and effective date). Keep unknown-ineligible / listing-excluded."
        : "FacilityDetail LICENSEEFFECTIVEDATE is present but LICENSEFIRSTDATE and Download License First Date remain empty. Do not adopt effective date as first date; keep listing-excluded.",
  };
}

/**
 * Status conflict / clearance check for Pending Increase ledger members.
 */
export function evaluateCaliforniaPendingIncreaseStatus(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
}): {
  stillPendingIncrease: boolean;
  clearedToExactLicensed: boolean;
  conflictingUnexpectedStatus: boolean;
  offlineListingExcluded: boolean;
  publicationApproved: false;
  rationale: string;
} {
  const download = text(input.downloadStatus).toUpperCase();
  const live = text(input.facilityDetailStatus);
  if (download === "LICENSED" && isPendingIncrease(live)) {
    return {
      stillPendingIncrease: true,
      clearedToExactLicensed: false,
      conflictingUnexpectedStatus: false,
      offlineListingExcluded: true,
      publicationApproved: false,
      rationale:
        "Still Licensed/Pending Increase on FacilityDetail. Keep offline listing-excluded.",
    };
  }
  if (download === "LICENSED" && isExactLicensed(live)) {
    return {
      stillPendingIncrease: false,
      clearedToExactLicensed: true,
      conflictingUnexpectedStatus: false,
      offlineListingExcluded: true,
      publicationApproved: false,
      rationale:
        "FacilityDetail cleared to exact Licensed. Record for ledger refresh only — do not auto-reinstate or publish without human review of the exclusion ledger.",
    };
  }
  return {
    stillPendingIncrease: false,
    clearedToExactLicensed: false,
    conflictingUnexpectedStatus: true,
    offlineListingExcluded: true,
    publicationApproved: false,
    rationale:
      "Unexpected Download/FacilityDetail status combination for a Pending Increase ledger ID. Fail-closed.",
  };
}

/**
 * Stale missing-date signal: Download still empty first date while an effective
 * date exists on FacilityDetail (or vice versa). Never auto-clears exclusion.
 */
export function evaluateCaliforniaMissingDateStaleness(input: {
  downloadLicenseFirstDate?: string | null;
  facilityDetailLicenseFirstDate?: string | null;
  facilityDetailLicenseEffectiveDate?: string | null;
}): {
  downloadFirstStillEmpty: boolean;
  detailFirstStillEmpty: boolean;
  effectivePresent: boolean;
  staleRelativeToEffective: boolean;
  exclusionCleared: false;
  publicationApproved: false;
  rationale: string;
} {
  const downloadFirstEmpty = isBlank(input.downloadLicenseFirstDate);
  const detailFirstEmpty = isBlank(input.facilityDetailLicenseFirstDate);
  const effectivePresent = !isBlank(input.facilityDetailLicenseEffectiveDate);
  return {
    downloadFirstStillEmpty: downloadFirstEmpty,
    detailFirstStillEmpty: detailFirstEmpty,
    effectivePresent,
    staleRelativeToEffective: downloadFirstEmpty && effectivePresent,
    exclusionCleared: false,
    publicationApproved: false,
    rationale:
      downloadFirstEmpty && effectivePresent
        ? "Download License First Date is stale/empty relative to FacilityDetail LICENSEEFFECTIVEDATE. Exclusion remains until Download first date appears or humans adopt an explicit date rule."
        : downloadFirstEmpty && detailFirstEmpty
          ? "License First Date missing on both Download and FacilityDetail. Exclusion stands."
          : "License First Date evidence present on Download; evaluate reinstatement only under human-approved ledger refresh.",
  };
}

export function buildCaliforniaPendingIncreaseMissingDatePreview() {
  const c = CALIFORNIA_PENDING_MISSING_COUNTS;
  const d = CALIFORNIA_PENDING_MISSING_DOWNLOAD;
  const arithmeticOk =
    CALIFORNIA_PENDING_INCREASE_IDS.length === c.pendingIncreaseIds
    && CALIFORNIA_MISSING_LICENSE_FIRST_IDS.length === c.missingLicenseFirstIds
    && CALIFORNIA_MISSING_BOTH_LICENSE_DATES.length === c.missingBothDatesEmpty
    && CALIFORNIA_MISSING_FIRST_EFFECTIVE_PRESENT.length
      === c.missingFirstEmptyEffectivePresent
    && c.missingBothDatesEmpty + c.missingFirstEmptyEffectivePresent
      === c.missingLicenseFirstIds
    && c.missingStillEmptyOnDownload === c.missingLicenseFirstIds
    && c.missingClearedOnDownload === 0
    && c.pendingIncreaseClearedToExactLicensed === 0
    && c.pendingIncreaseCapacityMatches === c.pendingIncreaseCapacitySampleCompared
    && c.publicationEligible === 0
    && c.exclusionsActivated === false
    && d.adoptedAsOfIso === "2026-11-15"
    && d.unchangedFromPr199
    && d.cdssFilenameHeaderIsAsOfConfirmed;

  const resolvedCount = CALIFORNIA_PENDING_MISSING_DECISION_MATRIX.filter(
    (r) => r.status === "resolved-documented",
  ).length;
  const openCount = CALIFORNIA_PENDING_MISSING_DECISION_MATRIX.filter(
    (r) => r.status === "open-blocker" || r.status === "policy-pending",
  ).length;

  return {
    observedOn: CALIFORNIA_PENDING_MISSING_OBSERVED_ON,
    baseline: CALIFORNIA_PENDING_MISSING_BASELINE,
    download: d,
    counts: c,
    decisionMatrix: CALIFORNIA_PENDING_MISSING_DECISION_MATRIX,
    resolvedFindings: CALIFORNIA_PENDING_MISSING_RESOLVED,
    remainingBlockers: CALIFORNIA_PENDING_MISSING_REMAINING,
    arithmeticOk,
    resolvedDecisionRows: resolvedCount,
    openOrPolicyDecisionRows: openCount,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    mostActionableNextStep:
      "Decide whether Licensed/Pending Increase receives a human-approved publication mapping, and whether LICENSEEFFECTIVEDATE may ever substitute for License First Date — without activating exclusions or publishing California.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "offline-candidates-not-publication-approved",
      "arcgis-status-cannot-override-cdss",
    ] as const,
  };
}

export function californiaPendingIncreaseMissingDateAllowsPublication(): false {
  return false;
}

export function californiaPendingIncreaseMissingDateDirectoryReady(): false {
  return false;
}

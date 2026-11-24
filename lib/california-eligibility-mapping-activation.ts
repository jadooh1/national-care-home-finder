/**
 * California Pending Increase eligibility mapping activation (post-#214).
 *
 * APPROVED development-only application-level activation of the Pending
 * Increase eligibility mapping. Exclusion ledger stays ON. Does NOT publish
 * California, write Supabase, change production, or raise publicationEligible
 * above zero. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_OBSERVED_ON =
  "2026-11-24";
export const CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_BASELINE =
  "b7fb8d8" as const;

/** Cache generation bumped on mapping activation for consumer invalidation. */
export const CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION =
  "eligibility-mapping-activated-v1" as const;

export const CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-22" as const,
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  newerDownloadAvailable: false as const,
  liveReconciledOn: "2026-11-24" as const,
  listablePendingIncrease: 58 as const,
  historicalOutOfScope: 8 as const,
  historicalPendingIncreaseTotal: 66 as const,
} as const;

export const CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION = {
  decisionId: "activate-pending-increase-mapping-in-app-db",
  approved: true as const,
  scope: "development-only" as const,
  applicationLevel: true as const,
  databaseWrites: false as const,
  exclusionsRemainActivated: true as const,
  eligibilityMappingActivated: true as const,
  californiaPublished: false as const,
  publicationEligibleCount: 0 as const,
  productionChanges: false as const,
  authenticationChanges: false as const,
  billingChanges: false as const,
} as const;

export const CALIFORNIA_ELIGIBILITY_MAPPING_BEFORE = {
  exclusionsActivated: true as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
  publicationEligibleCount: 0 as const,
} as const;

export const CALIFORNIA_ELIGIBILITY_MAPPING_AFTER = {
  exclusionsActivated: true as const,
  eligibilityMappingActivated: true as const,
  californiaPublished: false as const,
  publicationEligibleCount: 0 as const,
  environment: "development-only" as const,
  cacheGeneration: CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION,
} as const;

/**
 * 58 historical Pending Increase IDs present as listable RCFE/ARF rows in the
 * 2026-11-22 development roster (informational `pi` flag).
 */
export const CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS = [
  "015601083",
  "015601284",
  "045920148",
  "079201384",
  "107200486",
  "107206544",
  "107206560",
  "107209383",
  "107209533",
  "157204130",
  "195850551",
  "306000870",
  "306005986",
  "306006109",
  "331880891",
  "331881036",
  "331881303",
  "331881673",
  "335530021",
  "335530026",
  "336400036",
  "336426289",
  "336426330",
  "342700591",
  "342700984",
  "342701384",
  "342701723",
  "347000846",
  "347001484",
  "347001961",
  "365530102",
  "365530299",
  "366425800",
  "370808095",
  "371881418",
  "371881438",
  "374600429",
  "374601420",
  "374601445",
  "374603495",
  "374604213",
  "374604375",
  "374604454",
  "374604532",
  "374604742",
  "374604751",
  "374604986",
  "392700647",
  "392701057",
  "392701427",
  "392701601",
  "392701658",
  "392701730",
  "410508825",
  "435201626",
  "435294286",
  "486804268",
  "552701748",
] as const;

/**
 * 8 historical Pending Increase IDs that remain out of RCFE/ARF listable scope
 * (Adult Day Program / Social Rehabilitation Facility). Mapping does not bring
 * them into the development roster.
 */
export const CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS = [
  "079201349",
  "191603551",
  "197606348",
  "198603784",
  "300605585",
  "306004005",
  "370808447",
  "374604710",
] as const;

export const CALIFORNIA_MAPPING_OUT_OF_SCOPE_TYPES = [
  "ADULT DAY PROGRAM",
  "SOCIAL REHABILITATION FACILITY",
] as const;

/** Residual-22 ledger (exact IDs; leading zeros preserved). */
export const CALIFORNIA_MAPPING_RESIDUAL_IDS = [
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
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
  "502701867",
  "019201167",
  "019201133",
] as const;

/**
 * Live FacilityDetail sample reconciliation (2026-11-24): 8 listable Pending
 * Increase rows + all 8 out-of-scope historical IDs.
 */
export const CALIFORNIA_MAPPING_LIVE_RECONCILIATION = [
  {
    facilityNumber: "392701427",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    facilityDetailCapacity: "6",
    downloadCapacity: "6",
    downloadFirstDate: "8/20/2024",
    downloadStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "486804268",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "10/29/2024",
    facilityDetailCapacity: "6",
    downloadCapacity: "6",
    downloadFirstDate: "10/29/2024",
    downloadStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "331881673",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "3/12/2025",
    facilityDetailCapacity: "4",
    downloadCapacity: "4",
    downloadFirstDate: "3/12/2025",
    downloadStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "342701384",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "7/17/2024",
    facilityDetailCapacity: "5",
    downloadCapacity: "5",
    downloadFirstDate: "7/17/2024",
    downloadStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "552701748",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "2/17/2026",
    facilityDetailCapacity: "20",
    downloadCapacity: "20",
    downloadFirstDate: "2/17/2026",
    downloadStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "306000870",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "3/8/1999",
    facilityDetailCapacity: "6",
    downloadCapacity: "6",
    downloadFirstDate: "3/8/1999",
    downloadStatus: "LICENSED",
    facilityType: "ADULT RESIDENTIAL",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "374604532",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "4/15/2022",
    facilityDetailCapacity: "6",
    downloadCapacity: "6",
    downloadFirstDate: "4/15/2022",
    downloadStatus: "LICENSED",
    facilityType: "ADULT RESIDENTIAL",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "347001484",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "7/19/2000",
    facilityDetailCapacity: "5",
    downloadCapacity: "5",
    downloadFirstDate: "7/19/2000",
    downloadStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    listable: true,
    capacityAgreement: true,
    firstDateAgreement: true,
    exactId: true,
  },
  {
    facilityNumber: "197606348",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "1/30/2006",
    facilityDetailCapacity: "120",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "079201349",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "5/2/2024",
    facilityDetailCapacity: "60",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "198603784",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "1/27/2025",
    facilityDetailCapacity: "30",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "306004005",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "9/15/2008",
    facilityDetailCapacity: "75",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "300605585",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "9/1/1993",
    facilityDetailCapacity: "40",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "374604710",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/2/2023",
    facilityDetailCapacity: "60",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "370808447",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "11/22/1993",
    facilityDetailCapacity: "12",
    facilityType: "SOCIAL REHABILITATION FACILITY",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
  {
    facilityNumber: "191603551",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/2/1993",
    facilityDetailCapacity: "45",
    facilityType: "ADULT DAY PROGRAM",
    listable: false,
    outOfScopeReason: "non-rcfe-arf-type",
    exactId: true,
  },
] as const;

const RESIDUAL_SET: ReadonlySet<string> = new Set(
  CALIFORNIA_MAPPING_RESIDUAL_IDS,
);
const LISTABLE_PI_SET: ReadonlySet<string> = new Set(
  CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS,
);
const OUT_OF_SCOPE_SET: ReadonlySet<string> = new Set(
  CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS,
);
const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function californiaEligibilityMappingIdCandidates(
  facilityNumber: string,
): string[] {
  const id = text(facilityNumber);
  const out = new Set<string>();
  if (!id) return [];
  out.add(id);
  if (/^\d{8}$/.test(id)) out.add(`0${id}`);
  if (/^\d{9}$/.test(id) && id.startsWith("0")) out.add(id.slice(1));
  return [...out];
}

export function californiaEligibilityMappingIsResidual(
  facilityNumber: string,
): boolean {
  return californiaEligibilityMappingIdCandidates(facilityNumber).some((c) =>
    RESIDUAL_SET.has(c),
  );
}

export function californiaEligibilityMappingIsListablePendingIncrease(
  facilityNumber: string,
): boolean {
  return LISTABLE_PI_SET.has(text(facilityNumber));
}

export function californiaEligibilityMappingIsOutOfScopePendingIncrease(
  facilityNumber: string,
): boolean {
  return OUT_OF_SCOPE_SET.has(text(facilityNumber));
}

/** Live development controls after approved mapping activation. */
export function californiaEligibilityMappingActiveControls() {
  return {
    exclusionsActivated: true as const,
    eligibilityMappingActivated: true as const,
    californiaPublished: false as const,
    publicationEligibleCount: 0 as const,
    environment: "development-only" as const,
    cacheGeneration: CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION,
  };
}

export function californiaEligibilityMappingActivated(): true {
  return true;
}

export function californiaEligibilityMappingAllowsPublication(): false {
  return false;
}

export type CaliforniaEligibilityMappingGateSurface =
  | "development-search"
  | "development-detail"
  | "publication-selection"
  | "public-search"
  | "public-detail"
  | "api"
  | "map"
  | "owner-claim"
  | "sitemap";

/**
 * Development gate under activated mapping. Residuals always blocked.
 * Mapping recognizes Pending Increase for future eligibility only; public
 * surfaces and publication-selection stay fail-closed while unpublished.
 */
export function californiaEligibilityMappingDevelopmentGate(input: {
  facilityNumber: string;
  surface: CaliforniaEligibilityMappingGateSurface;
  pendingIncrease?: boolean;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
  licenseFirstDate?: string | null;
  downloadCapacity?: string | null;
  facilityDetailCapacity?: string | null;
}): { allowed: boolean; reasons: string[]; mappingApplied: boolean } {
  const id = text(input.facilityNumber);
  const reasons: string[] = [];
  let mappingApplied = false;
  const residual = californiaEligibilityMappingIsResidual(id);
  const candidates = californiaEligibilityMappingIdCandidates(id);
  const canonical = candidates.find((c) => RESIDUAL_SET.has(c)) ?? null;
  const trunc = residual && canonical != null && canonical !== id;

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (residual) reasons.push("residual-exclusion");
  if (trunc) reasons.push("leading-zero-truncation-alias");
  if (OUT_OF_SCOPE_SET.has(id)) reasons.push("pending-increase-out-of-scope");
  reasons.push("exclusion-ledger-activated");
  reasons.push("eligibility-mapping-activated");
  reasons.push(`cache:${CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION}`);

  const pending =
    Boolean(input.pendingIncrease)
    || LISTABLE_PI_SET.has(id)
    || /^licensed\s*\/\s*pending\s+increase$/i.test(
      text(input.facilityDetailStatus),
    );

  if (pending && !residual && FACILITY_NUMBER.test(id) && !OUT_OF_SCOPE_SET.has(id)) {
    mappingApplied = true;
    const download = text(input.downloadStatus).toUpperCase();
    const detail = text(input.facilityDetailStatus);
    const first = text(input.licenseFirstDate);
    const capDown = text(input.downloadCapacity);
    const capDetail = text(input.facilityDetailCapacity);
    if (input.downloadStatus !== undefined && download !== "LICENSED") {
      reasons.push("mapping:download-status-not-licensed");
    }
    if (input.facilityDetailStatus !== undefined) {
      const detailOk =
        /^licensed$/i.test(detail)
        || /^licensed\s*\/\s*pending\s+increase$/i.test(detail);
      if (!detailOk) reasons.push("mapping:facility-detail-status-not-allowed");
    }
    if (input.licenseFirstDate !== undefined && !first) {
      reasons.push("mapping:license-first-date-missing");
    }
    if (
      input.downloadCapacity !== undefined
      || input.facilityDetailCapacity !== undefined
    ) {
      if (!capDown || !capDetail) reasons.push("mapping:capacity-missing");
      else if (capDown !== capDetail) {
        reasons.push("mapping:capacity-disagreement");
      }
    }
  }

  if (
    input.surface === "public-search"
    || input.surface === "public-detail"
    || input.surface === "api"
    || input.surface === "map"
    || input.surface === "owner-claim"
    || input.surface === "sitemap"
    || input.surface === "publication-selection"
  ) {
    reasons.push("california-unpublished");
    reasons.push("publication-eligible-zero");
    reasons.push(`blocked-from-${input.surface}`);
    return {
      allowed: false,
      reasons: [...new Set(reasons)],
      mappingApplied,
    };
  }

  if (
    !FACILITY_NUMBER.test(id)
    || residual
    || OUT_OF_SCOPE_SET.has(id)
    || reasons.some((r) => r.startsWith("mapping:"))
  ) {
    reasons.push(`blocked-from-${input.surface}`);
    return {
      allowed: false,
      reasons: [...new Set(reasons)],
      mappingApplied,
    };
  }

  reasons.push("development-roster-allowed");
  return {
    allowed: true,
    reasons: [...new Set(reasons)],
    mappingApplied,
  };
}

export type CaliforniaEligibilityMappingRollbackStep = {
  id: string;
  title: string;
  detail: string;
  status: "ready";
};

/**
 * Executable mapping rollback (application-level; no DB writes).
 * Restores mapping OFF while keeping the exclusion ledger ON.
 */
export function californiaEligibilityMappingRollbackProcedure(): {
  reversible: true;
  databaseWrites: false;
  restoresControls: {
    exclusionsActivated: true;
    eligibilityMappingActivated: false;
    californiaPublished: false;
    publicationEligibleCount: 0;
  };
  steps: CaliforniaEligibilityMappingRollbackStep[];
  postRollbackVerification: string[];
} {
  return {
    reversible: true,
    databaseWrites: false,
    restoresControls: {
      exclusionsActivated: true,
      eligibilityMappingActivated: false,
      californiaPublished: false,
      publicationEligibleCount: 0,
    },
    steps: [
      {
        id: "record-mapping-rollback-approval",
        title: "Record human mapping-rollback approval",
        detail:
          "Append rollback actor/timestamp against decision activate-pending-increase-mapping-in-app-db.",
        status: "ready",
      },
      {
        id: "flip-mapping-flag",
        title: "Set eligibilityMappingActivated → false",
        detail:
          "Revert CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.eligibilityMappingActivated. Exclusion ledger stays ON. No Supabase writes.",
        status: "ready",
      },
      {
        id: "bump-mapping-cache-generation",
        title: "Bump eligibility mapping cache generation",
        detail:
          "Advance CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION so hosts drop mapping-activated cache entries.",
        status: "ready",
      },
      {
        id: "verify-exclusions-remain-on",
        title: "Verify residual-22 ledger remains activated",
        detail:
          "exclusionsActivated stays true; all 22 residuals + truncation aliases remain blocked.",
        status: "ready",
      },
      {
        id: "verify-fail-closed-publication",
        title: "Verify publication remains STOP",
        detail:
          "californiaPublished=false; publicationEligibleCount=0; Pending Increase no longer mapping-selected.",
        status: "ready",
      },
      {
        id: "verify-cross-state",
        title: "Verify Washington / Oregon unchanged",
        detail: "WA public and OR development contracts remain intact.",
        status: "ready",
      },
    ],
    postRollbackVerification: [
      "exclusionsActivated=true",
      "eligibilityMappingActivated=false",
      "californiaPublished=false",
      "publicationEligibleCount=0",
      "residual-22-still-blocked",
      "washington-oregon-unaffected",
    ],
  };
}

export function buildCaliforniaEligibilityMappingActivationPreview() {
  const controls = californiaEligibilityMappingActiveControls();
  const live = CALIFORNIA_MAPPING_LIVE_RECONCILIATION;
  const listableLive = live.filter((r) => r.listable);
  const outOfScopeLive = live.filter((r) => !r.listable);

  const residualBlocked = CALIFORNIA_MAPPING_RESIDUAL_IDS.every((id) => {
    const gate = californiaEligibilityMappingDevelopmentGate({
      facilityNumber: id,
      surface: "development-detail",
    });
    return !gate.allowed && gate.reasons.includes("residual-exclusion");
  });
  const truncBlocked = !californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "19201167",
    surface: "development-detail",
  }).allowed;

  const sampleMapped = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  });
  const capacityMismatchBlocked = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "7",
  });
  const missingFirstBlocked = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "development-detail",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  });
  const invalidBlocked = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "95354",
    surface: "development-detail",
  });
  const outOfScopeBlocked = californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "197606348",
    surface: "development-detail",
    pendingIncrease: true,
    facilityDetailStatus: "Licensed/Pending Increase",
  });
  const publicBlocked = !californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "public-search",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  }).allowed;
  const selectionBlocked = !californiaEligibilityMappingDevelopmentGate({
    facilityNumber: "392701427",
    surface: "publication-selection",
    pendingIncrease: true,
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/20/2024",
    downloadCapacity: "6",
    facilityDetailCapacity: "6",
  }).allowed;

  const rollback = californiaEligibilityMappingRollbackProcedure();

  const arithmeticOk =
    CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS.length === 58
    && CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS.length === 8
    && CALIFORNIA_MAPPING_LISTABLE_PENDING_INCREASE_IDS.length
      + CALIFORNIA_MAPPING_OUT_OF_SCOPE_PENDING_INCREASE_IDS.length
      === 66
    && CALIFORNIA_MAPPING_RESIDUAL_IDS.length === 22
    && listableLive.length === 8
    && outOfScopeLive.length === 8
    && listableLive.every(
      (r) =>
        r.exactId
        && r.capacityAgreement
        && r.firstDateAgreement
        && r.facilityDetailStatus === "Licensed/Pending Increase",
    )
    && outOfScopeLive.every((r) => r.exactId && !r.listable)
    && CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION.approved
    && CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION.scope
      === "development-only"
    && !CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION.databaseWrites
    && CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION
      .exclusionsRemainActivated
    && CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION
      .eligibilityMappingActivated
    && !CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION
      .californiaPublished
    && CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION
      .publicationEligibleCount === 0
    && CALIFORNIA_ELIGIBILITY_MAPPING_BEFORE.exclusionsActivated
    && !CALIFORNIA_ELIGIBILITY_MAPPING_BEFORE.eligibilityMappingActivated
    && CALIFORNIA_ELIGIBILITY_MAPPING_AFTER.exclusionsActivated
    && CALIFORNIA_ELIGIBILITY_MAPPING_AFTER.eligibilityMappingActivated
    && !CALIFORNIA_ELIGIBILITY_MAPPING_AFTER.californiaPublished
    && CALIFORNIA_ELIGIBILITY_MAPPING_AFTER.publicationEligibleCount === 0
    && controls.exclusionsActivated
    && controls.eligibilityMappingActivated
    && !controls.californiaPublished
    && controls.publicationEligibleCount === 0
    && californiaEligibilityMappingActivated()
    && !californiaEligibilityMappingAllowsPublication()
    && residualBlocked
    && truncBlocked
    && sampleMapped.allowed
    && sampleMapped.mappingApplied
    && !capacityMismatchBlocked.allowed
    && capacityMismatchBlocked.reasons.includes("mapping:capacity-disagreement")
    && !missingFirstBlocked.allowed
    && missingFirstBlocked.reasons.includes(
      "mapping:license-first-date-missing",
    )
    && !invalidBlocked.allowed
    && !outOfScopeBlocked.allowed
    && publicBlocked
    && selectionBlocked
    && rollback.reversible
    && !rollback.databaseWrites
    && rollback.restoresControls.exclusionsActivated
    && !rollback.restoresControls.eligibilityMappingActivated
    && rollback.steps.length >= 6;

  return {
    observedOn: CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_OBSERVED_ON,
    baseline: CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_BASELINE,
    source: CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_SOURCE,
    authorization: CALIFORNIA_ELIGIBILITY_MAPPING_ACTIVATION_AUTHORIZATION,
    before: CALIFORNIA_ELIGIBILITY_MAPPING_BEFORE,
    after: CALIFORNIA_ELIGIBILITY_MAPPING_AFTER,
    controls,
    pendingIncrease: {
      historicalTotal: 66,
      listableInformational: 58,
      historicalOutOfScope: 8,
      outOfScopeTypes: CALIFORNIA_MAPPING_OUT_OF_SCOPE_TYPES,
    },
    residualCount: CALIFORNIA_MAPPING_RESIDUAL_IDS.length,
    liveReconciliation: live,
    residualBlocked,
    truncBlocked,
    sampleMappedAllowed: sampleMapped.allowed,
    mappingAppliedOnSample: sampleMapped.mappingApplied,
    capacityMismatchBlocked: !capacityMismatchBlocked.allowed,
    missingFirstBlocked: !missingFirstBlocked.allowed,
    invalidBlocked: !invalidBlocked.allowed,
    outOfScopeBlocked: !outOfScopeBlocked.allowed,
    publicSurfacesBlocked: publicBlocked,
    publicationSelectionBlocked: selectionBlocked,
    rollback,
    arithmeticOk,
    stopGoPublic: "STOP" as const,
    mostActionableNextStep:
      "Eligibility mapping is ON for development only. Keep California unpublished and publicationEligible=0 until a separate publication approval.",
    preservedRestrictions: [
      "development-only-activation",
      "exclusion-ledger-remains-on",
      "california-unpublished",
      "publication-eligible-zero",
      "no-database-writes",
      "no-production-changes",
      "washington-oregon-unaffected",
      "out-of-scope-pending-increase-not-listable",
    ] as const,
  };
}

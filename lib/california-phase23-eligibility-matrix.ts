/**
 * California Phase 23 — machine-readable offline eligibility matrix for 15,451
 * candidates. Exception overlays + residual otherwise-clear-offline accounting.
 * Exclusions not activated. Gate stays BLOCKED.
 * Intentionally free of sibling runtime imports (IDs inlined from Phase 16–22).
 */

export const CALIFORNIA_PHASE23_MATRIX_OBSERVED_ON = "2026-11-20";
export const CALIFORNIA_PHASE23_MATRIX_ROSTER_DENOMINATOR = 15451;

const PROVISIONAL = [
  "198320787", "455920513", "197611076", "197611060", "134605014",
] as const;

const PENDING_INCREASE = [
  "374604742", "045920148", "392701057", "374604751", "392700647", "435294286",
  "197606348", "552701748", "336426330", "392701601", "306005986", "374604986",
  "347000846", "015601083", "392701730", "366425800", "335530021",
  "365530102", "331881673", "107200486", "157204130", "374604375", "079201349",
  "336426289", "107209383", "374603495", "306006109", "371881418",
  "107206544", "331881036", "198603784", "374604213", "365530299", "374601445",
  "342700591", "392701427", "392701658", "107209533", "347001484", "331880891",
  "336400036", "079201384", "410508825", "342701384", "342700984",
  "370808095", "107206560", "435201626", "306004005", "374601420", "486804268",
  "015601284", "347001961", "335530026", "374604454", "300605585", "331881303",
  "306000870", "374604710", "370808447", "374600429",
  "195850551", "371881438", "191603551", "342701723", "374604532",
] as const;

const PRIOR = ["502701867", "019201167", "019201133"] as const;

const MISSING_DATE = [
  "079201725", "502701889", "374605020", "342701856", "197610992", "342701894",
  "502701880", "198604006", "195850781", "107209715", "195850785", "197611051",
  "360951409", "198320716",
] as const;

const WITHDRAWN = [
  "306006749", "306006799", "405802282", "374604911", "019201529",
] as const;

const UNRESOLVED_COORDS = [
  "345920416", "365530238", "365530117", "347000691", "079200787", "331880803",
  "547209622", "435202953", "197609365", "019200734", "197610054", "374604082",
  "079200750", "331881453", "019200744", "019200684", "565850301", "331881184",
  "019200753", "502701867", "198602394", "374604054", "315920188", "198600856",
  "366425640", "565850358", "198602399", "011405838",
] as const;

export type CaliforniaPhase23MatrixEntry = {
  facilityNumber: string;
  category:
    | "provisional-license-conflict"
    | "licensed-pending-increase-overlay"
    | "prior-status-conflict"
    | "missing-license-evidence"
    | "withdrawn-regression-control"
    | "invalid-identifier"
    | "unresolved-coordinates-map-only";
  scopes: Array<
    | "complete-listing-exclusion"
    | "feature-suppression-map"
    | "feature-suppression-disclosure"
    | "feature-suppression-owner-claim"
  >;
  listingEligibleOffline: boolean;
  mapEligibleOffline: boolean;
  disclosureEligibleOffline: boolean;
  publicationEligible: false;
  ownerClaimEligible: false;
  activatedInApplicationOrDatabase: false;
  evidence: Record<string, unknown>;
};

export type CaliforniaPhase23EligibilityMatrix = {
  observedOn: string;
  title: string;
  rosterDenominator: 15451;
  cumulativeDisclosureVerified: 15451;
  statewideRosterVerificationComplete: true;
  adoption: {
    exclusionPolicyAdoptedForOfflineClassification: true;
    activatedInApplicationOrDatabase: false;
    altersAuthoritativeGovernmentRecords: false;
  };
  entries: CaliforniaPhase23MatrixEntry[];
  accounting: {
    uniqueListingExcludedIds: number;
    uniqueMapSuppressedOnlyIds: number;
    uniqueDisclosureSuppressedIds: number;
    otherwiseClearOfflineEstimate: number;
    residualPlusExceptionsEqualsDenominator: boolean;
    overlapNotes: string[];
  };
  summaryByCategory: Record<string, number>;
  allowsPublication: false;
  gate: "blocked";
  stopGo: "STOP";
};

function pushEntry(
  entries: CaliforniaPhase23MatrixEntry[],
  seen: Map<string, CaliforniaPhase23MatrixEntry>,
  facilityNumber: string,
  category: CaliforniaPhase23MatrixEntry["category"],
  scopes: CaliforniaPhase23MatrixEntry["scopes"],
  evidence: Record<string, unknown>,
) {
  const existing = seen.get(facilityNumber);
  if (existing) {
    const scopeSet = new Set<CaliforniaPhase23MatrixEntry["scopes"][number]>([
      ...existing.scopes,
      ...scopes,
    ]);
    existing.scopes = [...scopeSet];
    existing.listingEligibleOffline = !scopeSet.has("complete-listing-exclusion");
    existing.mapEligibleOffline = existing.listingEligibleOffline
      && !scopeSet.has("feature-suppression-map");
    existing.disclosureEligibleOffline = existing.listingEligibleOffline
      && !scopeSet.has("feature-suppression-disclosure");
    existing.evidence = {
      ...existing.evidence,
      additionalCategories: [
        ...((existing.evidence.additionalCategories as string[] | undefined) ?? []),
        category,
      ],
      ...evidence,
    };
    return;
  }
  const listingExcluded = scopes.includes("complete-listing-exclusion");
  const entry: CaliforniaPhase23MatrixEntry = {
    facilityNumber,
    category,
    scopes,
    listingEligibleOffline: !listingExcluded,
    mapEligibleOffline: !listingExcluded && !scopes.includes("feature-suppression-map"),
    disclosureEligibleOffline:
      !listingExcluded && !scopes.includes("feature-suppression-disclosure"),
    publicationEligible: false,
    ownerClaimEligible: false,
    activatedInApplicationOrDatabase: false,
    evidence,
  };
  seen.set(facilityNumber, entry);
  entries.push(entry);
}

/**
 * Build the offline eligibility matrix from Phase 16–22 exception ledgers.
 * Residual otherwise-clear-offline = denominator − unique listing-excluded IDs
 * that are treated as within the candidate set (withdrawn/invalid may be outside
 * the 15,451 active/restricted candidates and are labeled accordingly).
 */
export function buildCaliforniaPhase23EligibilityMatrix(input?: {
  observedOn?: string;
}): CaliforniaPhase23EligibilityMatrix {
  const entries: CaliforniaPhase23MatrixEntry[] = [];
  const seen = new Map<string, CaliforniaPhase23MatrixEntry>();

  for (const id of PROVISIONAL) {
    pushEntry(entries, seen, id, "provisional-license-conflict", [
      "complete-listing-exclusion",
      "feature-suppression-owner-claim",
    ], { source: "phase21-22", downloadStatus: "LICENSED", liveStatus: "Provisional License" });
  }

  for (const id of PENDING_INCREASE) {
    pushEntry(entries, seen, id, "licensed-pending-increase-overlay", [
      "complete-listing-exclusion",
      "feature-suppression-owner-claim",
    ], {
      source: "phase21",
      downloadStatus: "LICENSED",
      liveStatus: "Licensed/Pending Increase",
      mappingApprovedForPublication: false,
    });
  }

  for (const id of PRIOR) {
    pushEntry(entries, seen, id, "prior-status-conflict", [
      "complete-listing-exclusion",
      "feature-suppression-owner-claim",
    ], {
      source: id === "502701867" ? "phase14-22" : "phase19-22",
      note: id === "502701867"
        ? "Pending Incomplete Application"
        : "Licensed/Pending Increase control",
    });
  }

  for (const id of MISSING_DATE) {
    pushEntry(entries, seen, id, "missing-license-evidence", [
      "complete-listing-exclusion",
      "feature-suppression-owner-claim",
    ], { source: "phase16-22", downloadStatus: "LICENSED", licenseFirstDate: "" });
  }

  for (const id of WITHDRAWN) {
    pushEntry(entries, seen, id, "withdrawn-regression-control", [
      "complete-listing-exclusion",
      "feature-suppression-owner-claim",
    ], {
      source: "phase11-22",
      note: "CLOSED→Application Withdrawn regression; may sit outside active/restricted candidate set",
      candidateSetMembership: "likely-excluded-bucket",
    });
  }

  pushEntry(entries, seen, "95354", "invalid-identifier", [
    "complete-listing-exclusion",
    "feature-suppression-disclosure",
    "feature-suppression-owner-claim",
  ], {
    source: "phase13-22",
    note: "Non 8–9 digit control; outside publication-candidate set",
    candidateSetMembership: "not-in-15451",
  });

  for (const id of UNRESOLVED_COORDS) {
    pushEntry(entries, seen, id, "unresolved-coordinates-map-only", [
      "feature-suppression-map",
    ], {
      source: "phase9-22",
      fabricatedCoordinates: 0,
      reprobeAllowed: false,
    });
  }

  const listingExcluded = new Set<string>();
  const mapOnly = new Set<string>();
  const disclosureSuppressed = new Set<string>();
  const inCandidateListingExcluded = new Set<string>();

  for (const e of entries) {
    if (!e.listingEligibleOffline) {
      listingExcluded.add(e.facilityNumber);
      if (
        e.evidence.candidateSetMembership !== "not-in-15451"
        && e.evidence.candidateSetMembership !== "likely-excluded-bucket"
      ) {
        inCandidateListingExcluded.add(e.facilityNumber);
      }
    }
    if (!e.mapEligibleOffline && e.listingEligibleOffline) {
      mapOnly.add(e.facilityNumber);
    }
    if (!e.disclosureEligibleOffline) {
      disclosureSuppressed.add(e.facilityNumber);
    }
  }

  // Withdrawn controls are CLOSED bucket historically — keep them out of the
  // 15,451 residual math. Invalid 95354 also outside. Prior/provisional/pending/
  // missing-date/unresolved-coord overlaps counted via inCandidateListingExcluded.
  const otherwiseClearOfflineEstimate =
    CALIFORNIA_PHASE23_MATRIX_ROSTER_DENOMINATOR - inCandidateListingExcluded.size;

  const summaryByCategory: Record<string, number> = {};
  for (const e of entries) {
    summaryByCategory[e.category] = (summaryByCategory[e.category] ?? 0) + 1;
  }

  return {
    observedOn: input?.observedOn ?? CALIFORNIA_PHASE23_MATRIX_OBSERVED_ON,
    title: "California Phase 23 offline eligibility matrix (15,451 candidates)",
    rosterDenominator: 15451,
    cumulativeDisclosureVerified: 15451,
    statewideRosterVerificationComplete: true,
    adoption: {
      exclusionPolicyAdoptedForOfflineClassification: true,
      activatedInApplicationOrDatabase: false,
      altersAuthoritativeGovernmentRecords: false,
    },
    entries,
    accounting: {
      uniqueListingExcludedIds: listingExcluded.size,
      uniqueMapSuppressedOnlyIds: mapOnly.size,
      uniqueDisclosureSuppressedIds: disclosureSuppressed.size,
      otherwiseClearOfflineEstimate,
      residualPlusExceptionsEqualsDenominator:
        otherwiseClearOfflineEstimate + inCandidateListingExcluded.size
          === CALIFORNIA_PHASE23_MATRIX_ROSTER_DENOMINATOR,
      overlapNotes: [
        "Map-only suppressions apply to unresolved-coord IDs not already listing-excluded.",
        "502701867 appears in prior-status-conflict and unresolved-coordinates (listing exclusion wins).",
        "019201167 / 019201133 are prior controls (Pending Increase) not double-counted in the 66 Phase 21 overlays.",
        "Withdrawn regression IDs and invalid 95354 are documented but treated outside the 15,451 residual denominator.",
        "Phase 21 resolved prior HTTP 500 inconclusives to Licensed — no disclosure-bad residual for those IDs.",
        "otherwiseClearOfflineEstimate is NOT publication-eligible while gate BLOCKED.",
      ],
    },
    summaryByCategory,
    allowsPublication: false,
    gate: "blocked",
    stopGo: "STOP",
  };
}

/**
 * California Phase 23 — offline exception ID sets from Phase 16–22 ledgers.
 * Used to build the 15,451-candidate eligibility matrix. No statewide re-crawl.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE23_OBSERVED_ON = "2026-11-20";
export const CALIFORNIA_PHASE23_ROSTER_DENOMINATOR = 15451;

/** Five genuine LICENSED ↔ Provisional License conflicts (Phase 21/22). */
export const CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

/**
 * Phase 20/21 LICENSED ↔ Licensed/Pending Increase overlays (66 of 71 conflicts).
 * Provisional five removed from the Phase 21 conflict list for this bucket.
 */
export const CALIFORNIA_PHASE23_PENDING_INCREASE_IDS = [
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

export const CALIFORNIA_PHASE23_PRIOR_CONTROL_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_PHASE23_MISSING_LICENSE_EVIDENCE_IDS = [
  "079201725", "502701889", "374605020", "342701856", "197610992", "342701894",
  "502701880", "198604006", "195850781", "107209715", "195850785", "197611051",
  "360951409", "198320716",
] as const;

export const CALIFORNIA_PHASE23_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE23_INVALID_ID_CONTROL = "95354";

/** 28 unresolved official coordinates (map suppression). Phase 16 baseline. */
export const CALIFORNIA_PHASE23_UNRESOLVED_COORDINATE_IDS = [
  "345920416", "365530238", "365530117", "347000691", "079200787", "331880803",
  "547209622", "435202953", "197609365", "019200734", "197610054", "374604082",
  "079200750", "331881453", "019200744", "019200684", "565850301", "331881184",
  "019200753", "502701867", "198602394", "374604054", "315920188", "198600856",
  "366425640", "565850358", "198602399", "011405838",
] as const;

/** Phase 21 re-probed HTTP 500 IDs that resolved to exact Licensed (no longer disclosure-bad). */
export const CALIFORNIA_PHASE23_RESOLVED_INCONCLUSIVE_IDS = [
  "365530371",
  "331881723",
] as const;

export function californiaPhase23ProvisionalSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS);
}

export function californiaPhase23PendingIncreaseSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE23_PENDING_INCREASE_IDS);
}

export function californiaPhase23MissingLicenseSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE23_MISSING_LICENSE_EVIDENCE_IDS);
}

export function californiaPhase23UnresolvedCoordSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE23_UNRESOLVED_COORDINATE_IDS);
}

export function californiaPhase23PriorControlSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE23_PRIOR_CONTROL_IDS);
}

export function californiaPhase23WithdrawnSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE23_WITHDRAWN_REGRESSION_IDS);
}

/** Assert set cardinalities used by tests and matrix accounting. */
export const CALIFORNIA_PHASE23_EXCEPTION_COUNTS = {
  provisionalConflicts: 5,
  pendingIncreaseOverlays: 66,
  priorControls: 3,
  missingLicenseEvidence: 14,
  withdrawnRegression: 5,
  unresolvedCoordinates: 28,
  invalidIdControls: 1,
  resolvedInconclusives: 2,
  phase20Conflicts: 71,
} as const;

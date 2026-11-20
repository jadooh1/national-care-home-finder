/**
 * California Phase 21 — investigation ID sets from Phase 20 staged crawl.
 * 71 FacilityDetail licensing conflicts + 2 HTTP 500 inconclusive IDs.
 * Does not authorize a statewide re-crawl.
 *
 * Intentionally free of sibling runtime imports.
 */

/** Phase 20 status-mapping conflict count (Download ↔ FacilityDetail). */
export const CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT = 71;

/**
 * Exact facility numbers from Phase 20 conflict sample after removing the two
 * HTTP 500 inconclusive IDs that were incorrectly listed alongside conflicts.
 */
export const CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS = [
  "374604742", "045920148", "392701057", "374604751", "392700647", "435294286",
  "197606348", "552701748", "336426330", "392701601", "306005986", "374604986",
  "347000846", "198320787", "015601083", "392701730", "366425800", "335530021",
  "365530102", "331881673", "107200486", "157204130", "374604375", "079201349",
  "336426289", "455920513", "107209383", "374603495", "306006109", "371881418",
  "107206544", "331881036", "198603784", "374604213", "365530299", "374601445",
  "342700591", "392701427", "392701658", "107209533", "347001484", "331880891",
  "197611076", "336400036", "079201384", "410508825", "342701384", "342700984",
  "370808095", "107206560", "435201626", "306004005", "374601420", "486804268",
  "015601284", "347001961", "335530026", "374604454", "300605585", "331881303",
  "306000870", "374604710", "197611060", "134605014", "370808447", "374600429",
  "195850551", "371881438", "191603551", "342701723", "374604532",
] as const;

export const CALIFORNIA_PHASE21_INCONCLUSIVE_IDS = [
  "365530371",
  "331881723",
] as const;

/** Prior known conflicts preserved into the Phase 21 ledger. */
export const CALIFORNIA_PHASE21_PRIOR_STATUS_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_PHASE21_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE21_INVALID_ID_CONTROL = "95354";

export const CALIFORNIA_PHASE21_MISSING_LICENSE_EVIDENCE_IDS = [
  "079201725", "502701889", "374605020", "342701856", "197610992", "342701894",
  "502701880", "198604006", "195850781", "107209715", "195850785", "197611051",
  "360951409", "198320716",
] as const;

export const CALIFORNIA_PHASE21_UNRESOLVED_COORDINATE_COUNT = 28;

export function californiaPhase21ConflictIdSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS);
}

export function californiaPhase21InconclusiveIdSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE21_INCONCLUSIVE_IDS);
}

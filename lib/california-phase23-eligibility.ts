/**
 * California Phase 23 — offline eligibility classifier for publication candidates.
 * Distinguishes complete listing exclusion vs map-only vs disclosure suppression.
 * Never activates exclusions in app/DB. publicationEligible always false while gate blocked.
 * Intentionally free of sibling runtime imports.
 */

export type CaliforniaPhase23SuppressionScope =
  | "complete-listing-exclusion"
  | "feature-suppression-map"
  | "feature-suppression-disclosure"
  | "feature-suppression-owner-claim"
  | "none-clear-offline";

export type CaliforniaPhase23ExceptionReason =
  | "provisional-license-conflict"
  | "licensed-pending-increase-overlay"
  | "prior-status-conflict"
  | "missing-license-evidence"
  | "withdrawn-regression-control"
  | "invalid-identifier"
  | "unresolved-coordinates"
  | "none";

export type CaliforniaPhase23EligibilityDecision = {
  facilityNumber: string;
  reasons: CaliforniaPhase23ExceptionReason[];
  scopes: CaliforniaPhase23SuppressionScope[];
  listingEligibleOffline: boolean;
  mapEligibleOffline: boolean;
  disclosureEligibleOffline: boolean;
  ownerClaimEligible: false;
  publicationEligible: false;
  activatedInApplicationOrDatabase: false;
  altersAuthoritativeGovernmentRecords: false;
  note: string;
};

const PROVISIONAL = new Set([
  "198320787", "455920513", "197611076", "197611060", "134605014",
]);

const PENDING_INCREASE = new Set([
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
]);

const PRIOR = new Set(["502701867", "019201167", "019201133"]);

const MISSING_DATE = new Set([
  "079201725", "502701889", "374605020", "342701856", "197610992", "342701894",
  "502701880", "198604006", "195850781", "107209715", "195850785", "197611051",
  "360951409", "198320716",
]);

const WITHDRAWN = new Set([
  "306006749", "306006799", "405802282", "374604911", "019201529",
]);

const UNRESOLVED_COORDS = new Set([
  "345920416", "365530238", "365530117", "347000691", "079200787", "331880803",
  "547209622", "435202953", "197609365", "019200734", "197610054", "374604082",
  "079200750", "331881453", "019200744", "019200684", "565850301", "331881184",
  "019200753", "502701867", "198602394", "374604054", "315920188", "198600856",
  "366425640", "565850358", "198602399", "011405838",
]);

const INVALID_ID = "95354";

/**
 * Classify one candidate/control ID for the offline eligibility matrix.
 * Gate remains blocked: publicationEligible is always false.
 */
export function classifyCaliforniaPhase23Eligibility(
  facilityNumber: string,
): CaliforniaPhase23EligibilityDecision {
  const id = String(facilityNumber ?? "").trim();
  const reasons: CaliforniaPhase23ExceptionReason[] = [];
  const scopes = new Set<CaliforniaPhase23SuppressionScope>();

  if (id === INVALID_ID || !/^\d{8,9}$/.test(id)) {
    reasons.push("invalid-identifier");
    scopes.add("complete-listing-exclusion");
    scopes.add("feature-suppression-disclosure");
    scopes.add("feature-suppression-owner-claim");
  }

  if (PROVISIONAL.has(id)) {
    reasons.push("provisional-license-conflict");
    scopes.add("complete-listing-exclusion");
    scopes.add("feature-suppression-owner-claim");
  }

  if (PENDING_INCREASE.has(id)) {
    reasons.push("licensed-pending-increase-overlay");
    scopes.add("complete-listing-exclusion");
    scopes.add("feature-suppression-owner-claim");
  }

  if (PRIOR.has(id)) {
    reasons.push("prior-status-conflict");
    scopes.add("complete-listing-exclusion");
    scopes.add("feature-suppression-owner-claim");
  }

  if (MISSING_DATE.has(id)) {
    reasons.push("missing-license-evidence");
    scopes.add("complete-listing-exclusion");
    scopes.add("feature-suppression-owner-claim");
  }

  if (WITHDRAWN.has(id)) {
    reasons.push("withdrawn-regression-control");
    scopes.add("complete-listing-exclusion");
    scopes.add("feature-suppression-owner-claim");
  }

  if (UNRESOLVED_COORDS.has(id)) {
    reasons.push("unresolved-coordinates");
    scopes.add("feature-suppression-map");
  }

  if (reasons.length === 0) {
    scopes.add("none-clear-offline");
  }

  const listingExcluded = scopes.has("complete-listing-exclusion");
  const mapSuppressed = scopes.has("feature-suppression-map") || listingExcluded;
  const disclosureSuppressed = scopes.has("feature-suppression-disclosure")
    || listingExcluded;

  return {
    facilityNumber: id,
    reasons: reasons.length ? reasons : ["none"],
    scopes: [...scopes],
    listingEligibleOffline: !listingExcluded,
    mapEligibleOffline: !mapSuppressed,
    disclosureEligibleOffline: !disclosureSuppressed,
    ownerClaimEligible: false,
    publicationEligible: false,
    activatedInApplicationOrDatabase: false,
    altersAuthoritativeGovernmentRecords: false,
    note: listingExcluded
      ? "Offline complete-listing exclusion until human-approved mapping/activation; publication still gated statewide."
      : scopes.has("feature-suppression-map")
      ? "Listing may be otherwise clear offline, but map pin suppressed until authoritative coords exist; publication still gated statewide."
      : "No Phase 16–22 exception overlay; still unpublished while statewide gate BLOCKED.",
  };
}

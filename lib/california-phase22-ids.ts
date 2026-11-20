/**
 * California Phase 22 — investigation ID sets for launch-blocker evidence.
 * Five Provisional License conflicts + three prior controls.
 * Does not authorize a statewide re-crawl.
 *
 * Intentionally free of sibling runtime imports.
 */

/** Genuine unresolved LICENSED ↔ Provisional License conflicts from Phase 20/21. */
export const CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

/** Prior known status-conflict controls preserved into Phase 22 reassessment. */
export const CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_PHASE22_INVALID_ID_CONTROL = "95354";

export const CALIFORNIA_PHASE22_TRUNCATED_ID_EXAMPLE = {
  truncatedNonCanonical: "15601219",
  canonicalWithLeadingZero: "015601219",
} as const;

export const CALIFORNIA_PHASE22_MISSING_LICENSE_EVIDENCE_IDS = [
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

export const CALIFORNIA_PHASE22_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE22_UNRESOLVED_COORDINATE_COUNT = 28;

export function californiaPhase22ProvisionalIdSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS);
}

export function californiaPhase22PriorControlIdSet(): Set<string> {
  return new Set(CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS);
}

export function californiaPhase22NarrowProbeIds(): readonly string[] {
  return [
    ...CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS,
    ...CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS,
  ];
}

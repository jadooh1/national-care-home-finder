/**
 * Michigan XH / EXEMPT licensing-classification investigation.
 * Keeps XH ineligible unless authoritative evidence supports inclusion.
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_EXEMPT_OBSERVED_ON = "2026-11-20";

export const MICHIGAN_DESCRIBED_TYPE_CODES = [
  "AF",
  "AS",
  "AM",
  "AL",
  "AG",
  "AI",
  "AH",
] as const;

export const MICHIGAN_XH_EXEMPT_COHORT = {
  typeCode: "XH",
  rows: 234,
  statusExempt: 234,
  statusOther: 0,
  blankEffectiveAndExpirationPairs: 234,
  describedInRecordKey: false,
  categoryLabelAssigned: false,
  publicationEligible: false,
  ownerClaimEligible: false,
} as const;

export type MichiganExemptFinding = {
  id: string;
  verdict: "undescribed-keep-ineligible" | "profile-reachable-not-authorization" | "record-key-unavailable";
  evidence: string;
};

export const MICHIGAN_EXEMPT_FINDINGS: readonly MichiganExemptFinding[] = [
  {
    id: "xh-absent-from-described-type-key",
    verdict: "undescribed-keep-ineligible",
    evidence:
      "Prior LARA adult foster care record description lists AF/AS/AM/AL/AG/AI/AH only. XH is not a described type code.",
  },
  {
    id: "xh-all-exempt-blank-dates",
    verdict: "undescribed-keep-ineligible",
    evidence:
      "Current capture: all 234 XH rows have status EXEMPT and blank effective/expiration date pairs.",
  },
  {
    id: "xh-profile-http-200",
    verdict: "profile-reachable-not-authorization",
    evidence:
      "FacilityProfile URLs for XH licenses return HTTP 200 (sampled). Reachability is not a licensing-category definition or publication authorization.",
  },
  {
    id: "record-description-page-403",
    verdict: "record-key-unavailable",
    evidence:
      "Record-description page returned HTTP 403 during this investigation; prior documented key remains the described-type authority. No new XH definition was obtained.",
  },
] as const;

export function classifyMichiganTypeEligibility(typeCode: string): {
  described: boolean;
  publicationEligible: false;
  reason: string;
} {
  const described = (MICHIGAN_DESCRIBED_TYPE_CODES as readonly string[]).includes(typeCode);
  if (typeCode === "XH") {
    return {
      described: false,
      publicationEligible: false,
      reason: "XH is undescribed and observed only with EXEMPT + blank dates; kept ineligible.",
    };
  }
  return {
    described,
    publicationEligible: false,
    reason: described
      ? "Described type still blocked by address/freshness/publication safeguards."
      : "Unknown type code remains ineligible.",
  };
}

export function evaluateMichiganExemptInvestigation() {
  return {
    observedOn: MICHIGAN_EXEMPT_OBSERVED_ON,
    cohort: MICHIGAN_XH_EXEMPT_COHORT,
    findings: MICHIGAN_EXEMPT_FINDINGS,
    inclusionAuthorized: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

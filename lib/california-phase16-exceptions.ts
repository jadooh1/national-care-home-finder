/**
 * California Phase 16 — preserve exception safeguards from Phase 14/15.
 * Five CLOSED→Application Withdrawn remain withdrawn-ineligible; invalid
 * 95354 refuse-closed; leading zeros preserved; 28 unresolved coords are
 * NOT re-probed unless genuinely new authoritative evidence appears.
 * Avoid repeating unsuccessful coordinate checks.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE16_EXCEPTIONS_OBSERVED_ON = "2026-11-20";

const FACILITY_NUMBER = /^\d{8,9}$/;

export type CaliforniaPhase16LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid"
  | "inconclusive";

export type CaliforniaPhase16LinkValidationResult = {
  facilityNumber: string;
  classification: CaliforniaPhase16LinkValidationClass;
  identifierRelation:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable";
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  apiHttpStatus?: number | null;
  timedOut?: boolean;
  rationale: string;
  sampleIsStatewideConclusion: false;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function classifyDisclosureProbe(input: {
  facilityNumber: string;
  apiHttpStatus?: number | null;
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  timedOut?: boolean;
}): CaliforniaPhase16LinkValidationResult {
  const id = text(input.facilityNumber);
  if (!FACILITY_NUMBER.test(id)) {
    return {
      facilityNumber: id,
      classification: "invalid",
      identifierRelation: "not-applicable",
      rationale: "Facility number is not an official 8–9 digit CDSS identifier; generator refuses URLs (fail-closed).",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.timedOut === true || input.apiHttpStatus === 0) {
    return {
      facilityNumber: id,
      classification: "inconclusive",
      identifierRelation: "missing",
      rationale: "FacilityDetail request timed out or failed at the transport layer; link target inconclusive.",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiHttpStatus != null && input.apiHttpStatus !== 200) {
    return {
      facilityNumber: id,
      classification: "inconclusive",
      identifierRelation: "missing",
      rationale: `FacilityDetail HTTP ${input.apiHttpStatus}; cannot confirm disclosure target.`,
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiFound === false || input.liveFacilityNumber == null || input.liveFacilityNumber === "") {
    return {
      facilityNumber: id,
      classification: "missing",
      identifierRelation: "missing",
      rationale: "FacilityDetail returned Facility Number Not Found (or empty).",
      sampleIsStatewideConclusion: false,
    };
  }
  const live = text(input.liveFacilityNumber);
  if (id === live) {
    return {
      facilityNumber: id,
      classification: "working",
      identifierRelation: "exact",
      liveFacilityNumber: live,
      apiFound: true,
      rationale: "FacilityDetail FACILITYNUMBER matches exactly.",
      sampleIsStatewideConclusion: false,
    };
  }
  const collapse = (v: string) => v.replace(/^0+/, "") || "0";
  if (collapse(id) === collapse(live) && id !== live) {
    return {
      facilityNumber: id,
      classification: "ambiguous",
      identifierRelation: "leading-zero-canonicalization",
      liveFacilityNumber: live,
      apiFound: true,
      rationale: "FacilityDetail canonicalized a leading-zero difference.",
      sampleIsStatewideConclusion: false,
    };
  }
  return {
    facilityNumber: id,
    classification: "ambiguous",
    identifierRelation: "mismatch",
    liveFacilityNumber: live,
    apiFound: true,
    rationale: "FacilityDetail FACILITYNUMBER does not match the requested license identifier.",
    sampleIsStatewideConclusion: false,
  };
}

/** Phase 13/14 ambiguous truncated leading-zero negative control — preserved. */
export const CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE = {
  officialFacilityNumber: "015601219",
  truncatedRequest: "15601219",
  file: "RCFE" as const,
  downloadStatus: "ON PROBATION",
  priorResolution: "resolved-exact-official-id-works" as const,
  note:
    "Exact official ID 015601219 works; truncated 15601219 remains non-canonical. Do not repeat unsuccessful truncated-as-canonical checks.",
} as const;

/** Invalid five-digit ID (generator refuse-closed) — preserved. */
export const CALIFORNIA_PHASE16_INVALID_DISCLOSURE_CASE = {
  facilityNumber: "95354",
  file: "ARF" as const,
  downloadStatus: "PENDING",
  priorResolution: "confirmed-invalid-id-refuse-closed" as const,
  note:
    "Not an official 8–9 digit CDSS identifier; disclosure URL generator refuses closed.",
} as const;

/**
 * Phase 9/14 unresolved candidate coordinates baseline = 28.
 * Phase 16 does not re-probe these unless genuinely new authoritative
 * evidence appears (avoids repeating unsuccessful checks). Do not repeat
 * unsuccessful investigation of the 28 unresolved coordinates.
 */
export const CALIFORNIA_PHASE16_UNRESOLVED_COORDINATE_BASELINE = 28;

export const CALIFORNIA_PHASE16_UNRESOLVED_COORDINATE_CASES = [
  { facilityNumber: "345920416", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "365530238", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "365530117", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "347000691", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "079200787", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "331880803", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "547209622", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "435202953", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "197609365", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "019200734", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "197610054", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "374604082", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "079200750", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "331881453", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "019200744", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "019200684", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "565850301", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "331881184", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "019200753", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "502701867", file: "ARF" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "198602394", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "374604054", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "315920188", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "198600856", file: "ARF" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "366425640", file: "ARF" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "565850358", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "198602399", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "011405838", file: "ARF" as const, priorMatchKind: "leading-zero-identity-rejected" },
] as const;

export type CaliforniaPhase16DisclosureExceptionResolution =
  | "resolved-exact-official-id-works"
  | "confirmed-invalid-id-refuse-closed"
  | "preserved-from-phase15-no-repeat";

export type CaliforniaPhase16DisclosureExceptionFinding = {
  kind: "ambiguous-truncated-leading-zero" | "invalid-id";
  officialFacilityNumber: string;
  requestFacilityNumber: string;
  truncatedProbe: CaliforniaPhase16LinkValidationResult | null;
  canonicalProbe: CaliforniaPhase16LinkValidationResult | null;
  resolution: CaliforniaPhase16DisclosureExceptionResolution;
  fabricatedLink: false;
  rationale: string;
};

export function investigateCaliforniaPhase16InvalidDisclosure():
  CaliforniaPhase16DisclosureExceptionFinding {
  const probe = classifyDisclosureProbe({
    facilityNumber: CALIFORNIA_PHASE16_INVALID_DISCLOSURE_CASE.facilityNumber,
  });
  return {
    kind: "invalid-id",
    officialFacilityNumber: CALIFORNIA_PHASE16_INVALID_DISCLOSURE_CASE.facilityNumber,
    requestFacilityNumber: CALIFORNIA_PHASE16_INVALID_DISCLOSURE_CASE.facilityNumber,
    truncatedProbe: null,
    canonicalProbe: probe,
    resolution: "confirmed-invalid-id-refuse-closed",
    fabricatedLink: false,
    rationale:
      probe.classification === "invalid"
        ? "Confirmed: 95354 is not an 8–9 digit CDSS identifier; generator refuse-closed; no disclosure URL fabricated."
        : "Invalid ID remains fail-closed.",
  };
}

export function preserveCaliforniaPhase16AmbiguousDisclosure():
  CaliforniaPhase16DisclosureExceptionFinding {
  return {
    kind: "ambiguous-truncated-leading-zero",
    officialFacilityNumber:
      CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
    requestFacilityNumber:
      CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE.truncatedRequest,
    truncatedProbe: classifyDisclosureProbe({
      facilityNumber: CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE.truncatedRequest,
      apiHttpStatus: 200,
      liveFacilityNumber: CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
      apiFound: true,
    }),
    canonicalProbe: classifyDisclosureProbe({
      facilityNumber: CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
      apiHttpStatus: 200,
      liveFacilityNumber: CALIFORNIA_PHASE16_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
      apiFound: true,
    }),
    resolution: "preserved-from-phase15-no-repeat",
    fabricatedLink: false,
    rationale:
      "Phases 14–15 already resolved exact official ID 015601219 works; truncated remains non-canonical. Phase 16 preserves the safeguard without repeating unsuccessful truncated-as-canonical checks.",
  };
}

export type CaliforniaPhase16ExceptionSummary = {
  observedOn: string | null;
  disclosureExceptions: {
    investigated: number;
    resolvedExactOfficialIdWorks: number;
    confirmedInvalidRefuseClosed: number;
    preservedNoRepeat: number;
  };
  coordinateExceptions: {
    investigated: number;
    resolvedWithOfficialCoords: number;
    remainingUnresolved: number;
    fabricatedCoordinates: 0;
    geocoded: 0;
    baselineUnresolved: 28;
    reProbedUnsuccessfulChecks: false;
    note: string;
  };
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};

export function summarizeCaliforniaPhase16Exceptions(input: {
  observedOn?: string | null;
  disclosureFindings: readonly CaliforniaPhase16DisclosureExceptionFinding[];
  /** Phase 16 intentionally skips re-probing the 28 unless new evidence. */
  coordinateReprobePerformed?: boolean;
  resolvedWithOfficialCoords?: number;
}): CaliforniaPhase16ExceptionSummary {
  const disclosureExceptions = {
    investigated: input.disclosureFindings.length,
    resolvedExactOfficialIdWorks: 0,
    confirmedInvalidRefuseClosed: 0,
    preservedNoRepeat: 0,
  };
  for (const row of input.disclosureFindings) {
    if (row.resolution === "resolved-exact-official-id-works") {
      disclosureExceptions.resolvedExactOfficialIdWorks += 1;
    } else if (row.resolution === "confirmed-invalid-id-refuse-closed") {
      disclosureExceptions.confirmedInvalidRefuseClosed += 1;
    } else if (row.resolution === "preserved-from-phase15-no-repeat") {
      disclosureExceptions.preservedNoRepeat += 1;
    }
  }

  const resolved = Math.max(
    0,
    Math.min(28, Math.floor(input.resolvedWithOfficialCoords ?? 0)),
  );

  return {
    observedOn: input.observedOn ?? null,
    disclosureExceptions,
    coordinateExceptions: {
      investigated: input.coordinateReprobePerformed === true ? 28 : 0,
      resolvedWithOfficialCoords: resolved,
      remainingUnresolved: 28 - resolved,
      fabricatedCoordinates: 0,
      geocoded: 0,
      baselineUnresolved: 28,
      reProbedUnsuccessfulChecks: false,
      note:
        input.coordinateReprobePerformed === true
          ? "Coordinate re-probe performed only because new authoritative evidence was supplied."
          : "Phase 16 preserves the 28 unresolved coords without repeating unsuccessful Phase 14/15 FacilityDetail+ArcGIS checks (no new authoritative evidence).",
    },
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export function californiaPhase16AllowsCoordinateFabrication(): false {
  return false;
}

export function californiaPhase16ShouldReprobeUnresolvedCoordinates(input: {
  genuinelyNewAuthoritativeEvidence: boolean;
}): boolean {
  return input.genuinelyNewAuthoritativeEvidence === true;
}

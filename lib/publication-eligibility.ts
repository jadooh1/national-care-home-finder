/**
 * Nationwide evidence-based tiered publication eligibility (development-only).
 *
 * Fail-closed per-facility evaluator. State authorization stays separate from
 * row eligibility. Never invents values, coordinates, or public visibility.
 * Intentionally free of sibling runtime imports.
 *
 * Tiers:
 *   0 blocked — not publicly listable
 *   1 verified directory listing — no coordinates required
 *   2 mapped listing — Tier 1 + independently verified licensing coordinates
 *   3 enhanced listing — Tier 1/2 + separately verified optional fields
 */

export const PUBLICATION_ELIGIBILITY_OBSERVED_ON = "2026-11-21";
export const PUBLICATION_ELIGIBILITY_SPEC_VERSION = "1.0.0";

export type PublicationTier = 0 | 1 | 2 | 3;
export type StateAuthorization = "public" | "development" | "unpublished";
export type EvaluationScope = "fixture" | "sample" | "full-dataset";
export type FreshnessVerdict =
  | "official-iso-export"
  | "documented-policy-exception"
  | "missing-export-stop"
  | "rejected-clock-proxy";

export type GateId =
  | "identity"
  | "provenance"
  | "category"
  | "status"
  | "physical-address"
  | "freshness"
  | "disclosure"
  | "coordinates"
  | "enhanced-fields"
  | "exclusion"
  | "state-authorization";

export type ReasonCode =
  | "invalid-or-blank-identifier"
  | "ambiguous-identifier"
  | "duplicate-identifier"
  | "unverified-source-provenance"
  | "ambiguous-license-status"
  | "closed-or-ineligible-status"
  | "unusable-physical-address"
  | "missing-city"
  | "category-conflict"
  | "category-out-of-scope"
  | "unresolved-exclusion"
  | "missing-official-iso-export-date"
  | "rejected-http-last-modified-as-export"
  | "rejected-page-timestamp-as-export"
  | "rejected-retrieval-timestamp-as-export"
  | "rejected-filename-timestamp-as-export"
  | "freshness-policy-undocumented"
  | "freshness-independent-evidence-absent"
  | "disclosure-unverified"
  | "disclosure-absent-nonblocking"
  | "coordinates-absent"
  | "coordinates-unverified-provenance"
  | "coordinates-address-mismatch"
  | "georeferenced-coordinates-not-licensing"
  | "capacity-unverified"
  | "inspection-link-absent-nonblocking"
  | "enhanced-field-unverified"
  | "state-authorization-unpublished"
  | "state-authorization-development-only"
  | "state-authorization-public"
  | "owner-claim-disabled-outside-washington"
  | "california-publication-blocked"
  | "oregon-map-disabled"
  | "manual-review-required"
  | "tier1-gates-cleared"
  | "tier2-gates-cleared"
  | "tier3-gates-cleared";

export type EvidenceProvenance = {
  field: string;
  observation: "present" | "absent" | "rejected" | "not-verified" | "accepted";
  detail: string | null;
  source: string | null;
};

export type GateResult = {
  gate: GateId;
  passed: boolean;
  reasons: ReasonCode[];
  evidence: EvidenceProvenance[];
};

export type FacilityEligibilityInput = {
  state: string;
  stateAuthorization: StateAuthorization;
  evaluationScope: EvaluationScope;
  /** Stable regulatory or documented composite facility identity. */
  facilityIdentity: string | null;
  identityKind: "license" | "facility-id" | "source-id" | "composite" | "unknown" | null;
  identityAmbiguous: boolean;
  identityDuplicate: boolean;
  issuingAuthority: string | null;
  sourceProvenanceVerified: boolean;
  originalCategory: string | null;
  categoryInScope: boolean;
  categoryConflict: boolean;
  originalStatus: string | null;
  statusDomainKnown: boolean;
  statusAllowsListing: boolean;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  physicalAddressUsable: boolean;
  officialExportDateIso: string | null;
  /** Rejected proxies must stay false for official export. */
  rejectedHttpLastModifiedAsExport: boolean;
  rejectedPageTimestampAsExport: boolean;
  rejectedRetrievalAsExport: boolean;
  rejectedFilenameTimestampAsExport: boolean;
  /** Documented freshness policy exception (human-approved policy text exists). */
  freshnessPolicyDocumented: boolean;
  /** Independent official currentness evidence supporting the policy exception. */
  freshnessIndependentEvidence: boolean;
  disclosureUrl: string | null;
  disclosureVerified: boolean;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: "licensing" | "georeferenced" | "absent" | "unknown";
  coordinatesAddressAligned: boolean;
  capacityValue: number | null;
  capacityVerified: boolean;
  inspectionOrDisclosureEnhancedVerified: boolean;
  exclusionUnresolved: boolean;
  californiaPublicationBlocked: boolean;
  oregonMapDisabled: boolean;
};

export type FacilityEligibilityDecision = {
  specVersion: typeof PUBLICATION_ELIGIBILITY_SPEC_VERSION;
  state: string;
  evaluationScope: EvaluationScope;
  stateAuthorization: StateAuthorization;
  tier: PublicationTier;
  listingEligible: boolean;
  mapEligible: boolean;
  enhancedEligible: boolean;
  /** Never true solely because listingEligible is true. */
  finalPublicVisibility: boolean;
  ownerClaimEligible: boolean;
  freshness: {
    verdict: FreshnessVerdict;
    officialExportDateIso: string | null;
    limitationFlags: ReasonCode[];
  };
  gates: GateResult[];
  reasons: ReasonCode[];
  evidence: EvidenceProvenance[];
  manualReview: boolean;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function present(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

function evaluateFreshness(input: FacilityEligibilityInput): {
  verdict: FreshnessVerdict;
  passedForTier1: boolean;
  reasons: ReasonCode[];
  evidence: EvidenceProvenance[];
} {
  const reasons: ReasonCode[] = [];
  const evidence: EvidenceProvenance[] = [];
  const iso = input.officialExportDateIso;

  if (input.rejectedHttpLastModifiedAsExport) {
    reasons.push("rejected-http-last-modified-as-export");
    evidence.push({
      field: "official-export-date",
      observation: "rejected",
      detail: "HTTP Last-Modified is not an official dataset export date",
      source: null,
    });
  }
  if (input.rejectedPageTimestampAsExport) {
    reasons.push("rejected-page-timestamp-as-export");
    evidence.push({
      field: "official-export-date",
      observation: "rejected",
      detail: "Page update timestamp is not an official dataset export date",
      source: null,
    });
  }
  if (input.rejectedRetrievalAsExport) {
    reasons.push("rejected-retrieval-timestamp-as-export");
    evidence.push({
      field: "official-export-date",
      observation: "rejected",
      detail: "Retrieval timestamp is not an official dataset export date",
      source: null,
    });
  }
  if (input.rejectedFilenameTimestampAsExport) {
    reasons.push("rejected-filename-timestamp-as-export");
    evidence.push({
      field: "official-export-date",
      observation: "rejected",
      detail: "Filename generation timestamp is not an official dataset export date",
      source: null,
    });
  }

  if (present(iso) && isCalendarDate(iso!)) {
    evidence.push({
      field: "official-export-date",
      observation: "accepted",
      detail: iso,
      source: "source-issued-iso",
    });
    return {
      verdict: "official-iso-export",
      passedForTier1: true,
      reasons,
      evidence,
    };
  }

  if (!present(iso)) {
    reasons.push("missing-official-iso-export-date");
    evidence.push({
      field: "official-export-date",
      observation: "absent",
      detail: null,
      source: null,
    });
  } else {
    reasons.push("missing-official-iso-export-date");
    evidence.push({
      field: "official-export-date",
      observation: "rejected",
      detail: iso,
      source: null,
    });
  }

  const proxyRejected =
    input.rejectedHttpLastModifiedAsExport
    || input.rejectedPageTimestampAsExport
    || input.rejectedRetrievalAsExport
    || input.rejectedFilenameTimestampAsExport;

  if (
    input.freshnessPolicyDocumented
    && input.freshnessIndependentEvidence
    && !proxyRejected
  ) {
    evidence.push({
      field: "freshness-policy",
      observation: "accepted",
      detail: "Documented freshness policy with independent official currentness evidence",
      source: "policy-exception",
    });
    return {
      verdict: "documented-policy-exception",
      passedForTier1: true,
      reasons,
      evidence,
    };
  }

  if (!input.freshnessPolicyDocumented) reasons.push("freshness-policy-undocumented");
  if (!input.freshnessIndependentEvidence) {
    reasons.push("freshness-independent-evidence-absent");
  }

  if (proxyRejected) {
    return {
      verdict: "rejected-clock-proxy",
      passedForTier1: false,
      reasons,
      evidence,
    };
  }

  return {
    verdict: "missing-export-stop",
    passedForTier1: false,
    reasons,
    evidence,
  };
}

/**
 * Evaluate one facility record. Fail-closed on unknowns.
 * Does not mutate directory contracts or publish any state.
 */
export function evaluateFacilityEligibility(
  input: FacilityEligibilityInput,
): FacilityEligibilityDecision {
  const gates: GateResult[] = [];
  const reasons: ReasonCode[] = [];
  const evidence: EvidenceProvenance[] = [];

  // Identity
  const identityReasons: ReasonCode[] = [];
  const identityEvidence: EvidenceProvenance[] = [];
  if (!present(input.facilityIdentity) || input.identityKind === "unknown" || input.identityKind === null) {
    identityReasons.push("invalid-or-blank-identifier");
  }
  if (input.identityAmbiguous) identityReasons.push("ambiguous-identifier");
  if (input.identityDuplicate) identityReasons.push("duplicate-identifier");
  identityEvidence.push({
    field: "facility-identity",
    observation: present(input.facilityIdentity) ? "present" : "absent",
    detail: input.facilityIdentity,
    source: input.issuingAuthority,
  });
  const identityOk = identityReasons.length === 0;
  gates.push({
    gate: "identity",
    passed: identityOk,
    reasons: identityReasons,
    evidence: identityEvidence,
  });
  reasons.push(...identityReasons);
  evidence.push(...identityEvidence);

  // Provenance
  const provenanceReasons: ReasonCode[] = [];
  if (!input.sourceProvenanceVerified || !present(input.issuingAuthority)) {
    provenanceReasons.push("unverified-source-provenance");
  }
  const provenanceEvidence: EvidenceProvenance[] = [{
    field: "issuing-authority",
    observation: present(input.issuingAuthority) ? "present" : "absent",
    detail: input.issuingAuthority,
    source: null,
  }];
  gates.push({
    gate: "provenance",
    passed: provenanceReasons.length === 0,
    reasons: provenanceReasons,
    evidence: provenanceEvidence,
  });
  reasons.push(...provenanceReasons);
  evidence.push(...provenanceEvidence);

  // Category
  const categoryReasons: ReasonCode[] = [];
  if (input.categoryConflict) categoryReasons.push("category-conflict");
  if (!input.categoryInScope || !present(input.originalCategory)) {
    categoryReasons.push("category-out-of-scope");
  }
  const categoryEvidence: EvidenceProvenance[] = [{
    field: "original-category",
    observation: present(input.originalCategory) ? "present" : "absent",
    detail: input.originalCategory,
    source: null,
  }];
  gates.push({
    gate: "category",
    passed: categoryReasons.length === 0,
    reasons: categoryReasons,
    evidence: categoryEvidence,
  });
  reasons.push(...categoryReasons);
  evidence.push(...categoryEvidence);

  // Status
  const statusReasons: ReasonCode[] = [];
  if (!input.statusDomainKnown || !present(input.originalStatus)) {
    statusReasons.push("ambiguous-license-status");
  } else if (!input.statusAllowsListing) {
    statusReasons.push("closed-or-ineligible-status");
  }
  const statusEvidence: EvidenceProvenance[] = [{
    field: "original-status",
    observation: present(input.originalStatus) ? "present" : "absent",
    detail: input.originalStatus,
    source: null,
  }];
  gates.push({
    gate: "status",
    passed: statusReasons.length === 0,
    reasons: statusReasons,
    evidence: statusEvidence,
  });
  reasons.push(...statusReasons);
  evidence.push(...statusEvidence);

  // Physical address
  const addressReasons: ReasonCode[] = [];
  if (!input.physicalAddressUsable || !present(input.street)) {
    addressReasons.push("unusable-physical-address");
  }
  if (!present(input.city)) addressReasons.push("missing-city");
  const addressEvidence: EvidenceProvenance[] = [{
    field: "physical-address",
    observation: input.physicalAddressUsable ? "present" : "absent",
    detail: [input.street, input.city, input.postalCode].filter(present).join(", ") || null,
    source: null,
  }];
  gates.push({
    gate: "physical-address",
    passed: addressReasons.length === 0,
    reasons: addressReasons,
    evidence: addressEvidence,
  });
  reasons.push(...addressReasons);
  evidence.push(...addressEvidence);

  // Freshness
  const freshness = evaluateFreshness(input);
  gates.push({
    gate: "freshness",
    passed: freshness.passedForTier1,
    reasons: freshness.reasons,
    evidence: freshness.evidence,
  });
  reasons.push(...freshness.reasons);
  evidence.push(...freshness.evidence);

  // Disclosure (missing alone does not block Tier 1)
  const disclosureReasons: ReasonCode[] = [];
  if (!input.disclosureVerified) {
    if (present(input.disclosureUrl)) disclosureReasons.push("disclosure-unverified");
    else disclosureReasons.push("disclosure-absent-nonblocking");
  }
  const disclosureEvidence: EvidenceProvenance[] = [{
    field: "facility-disclosure",
    observation: input.disclosureVerified
      ? "accepted"
      : present(input.disclosureUrl)
      ? "not-verified"
      : "absent",
    detail: input.disclosureUrl,
    source: null,
  }];
  gates.push({
    gate: "disclosure",
    passed: true,
    reasons: disclosureReasons,
    evidence: disclosureEvidence,
  });
  reasons.push(...disclosureReasons);
  evidence.push(...disclosureEvidence);

  // Exclusion
  const exclusionReasons: ReasonCode[] = [];
  if (input.exclusionUnresolved) exclusionReasons.push("unresolved-exclusion");
  if (input.californiaPublicationBlocked) {
    exclusionReasons.push("california-publication-blocked");
  }
  gates.push({
    gate: "exclusion",
    passed: exclusionReasons.length === 0,
    reasons: exclusionReasons,
    evidence: [],
  });
  reasons.push(...exclusionReasons);

  // Coordinates (Tier 2)
  const coordinateReasons: ReasonCode[] = [];
  let mapGatePass = false;
  if (
    input.latitude === null
    || input.longitude === null
    || input.coordinateSource === "absent"
  ) {
    coordinateReasons.push("coordinates-absent");
  } else if (input.coordinateSource === "georeferenced") {
    coordinateReasons.push("georeferenced-coordinates-not-licensing");
  } else if (input.coordinateSource === "unknown") {
    coordinateReasons.push("coordinates-unverified-provenance");
  } else if (!input.coordinatesAddressAligned) {
    coordinateReasons.push("coordinates-address-mismatch");
  } else if (input.oregonMapDisabled && input.state === "Oregon") {
    coordinateReasons.push("oregon-map-disabled");
  } else if (input.coordinateSource === "licensing") {
    mapGatePass = true;
  } else {
    coordinateReasons.push("coordinates-unverified-provenance");
  }
  gates.push({
    gate: "coordinates",
    passed: mapGatePass,
    reasons: coordinateReasons,
    evidence: [{
      field: "coordinates",
      observation: mapGatePass ? "accepted" : "absent",
      detail: input.coordinateSource,
      source: null,
    }],
  });
  reasons.push(...coordinateReasons);

  // Enhanced (Tier 3) — optional; missing inspection does not block Tier 1/2
  const enhancedReasons: ReasonCode[] = [];
  let enhancedPass = false;
  if (input.capacityValue !== null && !input.capacityVerified) {
    enhancedReasons.push("capacity-unverified");
  }
  if (!input.inspectionOrDisclosureEnhancedVerified) {
    enhancedReasons.push("inspection-link-absent-nonblocking");
  }
  if (
    input.capacityVerified
    && input.inspectionOrDisclosureEnhancedVerified
    && input.disclosureVerified
  ) {
    enhancedPass = true;
    enhancedReasons.push("tier3-gates-cleared");
  } else {
    enhancedReasons.push("enhanced-field-unverified");
  }
  gates.push({
    gate: "enhanced-fields",
    passed: enhancedPass,
    reasons: enhancedReasons,
    evidence: [],
  });
  reasons.push(...enhancedReasons);

  // State authorization (never auto-upgrades)
  const authReasons: ReasonCode[] = [];
  if (input.stateAuthorization === "unpublished") {
    authReasons.push("state-authorization-unpublished");
  } else if (input.stateAuthorization === "development") {
    authReasons.push("state-authorization-development-only");
  } else {
    authReasons.push("state-authorization-public");
  }
  gates.push({
    gate: "state-authorization",
    passed: input.stateAuthorization === "public",
    reasons: authReasons,
    evidence: [{
      field: "state-authorization",
      observation: "present",
      detail: input.stateAuthorization,
      source: "directory-contract",
    }],
  });
  reasons.push(...authReasons);

  const hardBlock =
    !identityOk
    || provenanceReasons.length > 0
    || categoryReasons.length > 0
    || statusReasons.length > 0
    || addressReasons.length > 0
    || !freshness.passedForTier1
    || exclusionReasons.length > 0
    || input.californiaPublicationBlocked;

  let tier: PublicationTier = 0;
  if (!hardBlock) {
    tier = 1;
    reasons.push("tier1-gates-cleared");
    if (mapGatePass) {
      tier = 2;
      reasons.push("tier2-gates-cleared");
      if (enhancedPass) {
        tier = 3;
      }
    }
  }

  const listingEligible = tier >= 1;
  const mapEligible = tier >= 2;
  const enhancedEligible = tier >= 3;

  // Final public visibility requires public state authorization AND listingEligible.
  // Development authorization never yields finalPublicVisibility.
  const finalPublicVisibility =
    input.stateAuthorization === "public"
    && listingEligible
    && !input.californiaPublicationBlocked;

  const ownerClaimEligible =
    input.state === "Washington"
    && input.stateAuthorization === "public"
    && listingEligible;

  if (input.state !== "Washington") {
    reasons.push("owner-claim-disabled-outside-washington");
  }

  const manualReview =
    reasons.includes("ambiguous-identifier")
    || reasons.includes("duplicate-identifier")
    || reasons.includes("ambiguous-license-status")
    || reasons.includes("category-conflict")
    || reasons.includes("unresolved-exclusion")
    || reasons.includes("manual-review-required");

  const uniqueReasons = [...new Set(reasons)];

  return {
    specVersion: PUBLICATION_ELIGIBILITY_SPEC_VERSION,
    state: input.state,
    evaluationScope: input.evaluationScope,
    stateAuthorization: input.stateAuthorization,
    tier,
    listingEligible,
    mapEligible,
    enhancedEligible,
    finalPublicVisibility,
    ownerClaimEligible,
    freshness: {
      verdict: freshness.verdict,
      officialExportDateIso:
        present(input.officialExportDateIso)
        && isCalendarDate(input.officialExportDateIso!)
          ? input.officialExportDateIso
          : null,
      limitationFlags: freshness.reasons,
    },
    gates,
    reasons: uniqueReasons,
    evidence,
    manualReview,
  };
}

/** Build a minimal blocked decision helper for fixtures. */
export function blockedFixtureInput(
  overrides: Partial<FacilityEligibilityInput> & Pick<FacilityEligibilityInput, "state">,
): FacilityEligibilityInput {
  return {
    stateAuthorization: "unpublished",
    evaluationScope: "fixture",
    facilityIdentity: null,
    identityKind: null,
    identityAmbiguous: false,
    identityDuplicate: false,
    issuingAuthority: null,
    sourceProvenanceVerified: false,
    originalCategory: null,
    categoryInScope: false,
    categoryConflict: false,
    originalStatus: null,
    statusDomainKnown: false,
    statusAllowsListing: false,
    street: null,
    city: null,
    postalCode: null,
    physicalAddressUsable: false,
    officialExportDateIso: null,
    rejectedHttpLastModifiedAsExport: false,
    rejectedPageTimestampAsExport: false,
    rejectedRetrievalAsExport: false,
    rejectedFilenameTimestampAsExport: false,
    freshnessPolicyDocumented: false,
    freshnessIndependentEvidence: false,
    disclosureUrl: null,
    disclosureVerified: false,
    latitude: null,
    longitude: null,
    coordinateSource: "absent",
    coordinatesAddressAligned: false,
    capacityValue: null,
    capacityVerified: false,
    inspectionOrDisclosureEnhancedVerified: false,
    exclusionUnresolved: false,
    californiaPublicationBlocked: false,
    oregonMapDisabled: false,
    ...overrides,
  };
}

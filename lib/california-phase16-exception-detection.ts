/**
 * California Phase 16 — automated deterministic exception detection for unsafe
 * facility records. Detects facility ID mismatches / malformed IDs / lost
 * leading zeros; conflicting official licensing statuses; LICENSED rows with
 * missing initial license dates; ambiguous/invalid/redirected/mismatched
 * disclosure pages; and unexpected changes in official source data.
 *
 * Uncertain records stay ineligible until authoritative evidence. Sample
 * findings are never statewide conclusions. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE16_EXCEPTION_DETECTION_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE16_FACILITY_NUMBER = /^\d{8,9}$/;

export const CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER = "502701867";

export const CALIFORNIA_PHASE16_INVALID_FACILITY_NUMBER = "95354";

export const CALIFORNIA_PHASE16_CANONICAL_LEADING_ZERO_FACILITY_NUMBER = "015601219";

export const CALIFORNIA_PHASE16_TRUNCATED_LEADING_ZERO_REQUEST = "15601219";

export const CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE16_BASELINE_DOWNLOAD_SHA256 = {
  rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
} as const;

export type CaliforniaPhase16ExceptionClass =
  | "facility-id-malformed"
  | "facility-id-lost-leading-zeros"
  | "facility-id-mismatch"
  | "status-conflict"
  | "licensed-missing-initial-date"
  | "disclosure-ambiguous"
  | "disclosure-invalid"
  | "disclosure-redirected"
  | "disclosure-mismatched"
  | "disclosure-missing"
  | "source-data-unexpected-change"
  | "withdrawn-ineligible-control"
  | "unknown-ineligible-control";

export type CaliforniaPhase16ExceptionScope = "sampled" | "statewide-check" | "regression-control";

export type CaliforniaPhase16ExceptionEligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "invalid-id-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase16DetectedException = {
  facilityNumber: string;
  exceptionClass: CaliforniaPhase16ExceptionClass;
  eligibility: CaliforniaPhase16ExceptionEligibility;
  scope: CaliforniaPhase16ExceptionScope;
  sourceEvidence: {
    downloadStatus?: string | null;
    liveStatus?: string | null;
    downloadLicenseFirstDate?: string | null;
    liveLicenseFirstDate?: string | null;
    liveLicenseEffectiveDate?: string | null;
    requestedFacilityNumber?: string | null;
    liveFacilityNumber?: string | null;
    pageHttpStatus?: number | null;
    pageFinalUrl?: string | null;
    apiHttpStatus?: number | null;
    downloadSha256?: { rcfe?: string | null; arf?: string | null } | null;
    notes?: string | null;
  };
  classification: string;
  unresolvedQuestions: readonly string[];
  publicationEligible: false;
  ownerClaimEligible: false;
  sampleIsStatewideConclusion: false;
  rationale: string;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

function collapseLeadingZeros(value: string): string {
  return value.replace(/^0+/, "") || "0";
}

/**
 * Deterministic facility-ID checks: malformed length, lost leading zeros,
 * and exact mismatch vs FacilityDetail FACILITYNUMBER.
 */
export function detectCaliforniaPhase16FacilityIdExceptions(input: {
  facilityNumber: string;
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  apiHttpStatus?: number | null;
  scope?: CaliforniaPhase16ExceptionScope;
}): CaliforniaPhase16DetectedException[] {
  const id = text(input.facilityNumber);
  const scope = input.scope ?? "sampled";
  const out: CaliforniaPhase16DetectedException[] = [];

  if (!CALIFORNIA_PHASE16_FACILITY_NUMBER.test(id)) {
    out.push({
      facilityNumber: id,
      exceptionClass: "facility-id-malformed",
      eligibility: "invalid-id-ineligible",
      scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        liveFacilityNumber: input.liveFacilityNumber ?? null,
        apiHttpStatus: input.apiHttpStatus ?? null,
        notes: "Official CDSS facility numbers are 8–9 digits; generator refuse-closed.",
      },
      classification: "malformed-facility-id",
      unresolvedQuestions: [
        "Is there an authoritative corrected facility number for this download row?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale:
        `Facility number "${id}" is not an official 8–9 digit CDSS identifier; treat as invalid-id-ineligible.`,
    });
    return out;
  }

  const live = text(input.liveFacilityNumber);
  if (input.apiFound === true && live !== "" && id !== live) {
    if (collapseLeadingZeros(id) === collapseLeadingZeros(live) && id !== live) {
      out.push({
        facilityNumber: id,
        exceptionClass: "facility-id-lost-leading-zeros",
        eligibility: "unknown-ineligible",
        scope,
        sourceEvidence: {
          requestedFacilityNumber: id,
          liveFacilityNumber: live,
          apiHttpStatus: input.apiHttpStatus ?? null,
          notes: "Leading-zero difference between request and FacilityDetail FACILITYNUMBER.",
        },
        classification: "lost-or-padded-leading-zeros",
        unresolvedQuestions: [
          "Which exact official ID (with leading zeros) is authoritative for disclosure URLs?",
        ],
        publicationEligible: false,
        ownerClaimEligible: false,
        sampleIsStatewideConclusion: false,
        rationale:
          `Request ${id} and live ${live} collapse to the same digits but differ in leading zeros; keep exact official ID only.`,
      });
    } else {
      out.push({
        facilityNumber: id,
        exceptionClass: "facility-id-mismatch",
        eligibility: "unknown-ineligible",
        scope,
        sourceEvidence: {
          requestedFacilityNumber: id,
          liveFacilityNumber: live,
          apiHttpStatus: input.apiHttpStatus ?? null,
        },
        classification: "facility-id-mismatch",
        unresolvedQuestions: [
          "Why does FacilityDetail return a different FACILITYNUMBER than the requested license ID?",
        ],
        publicationEligible: false,
        ownerClaimEligible: false,
        sampleIsStatewideConclusion: false,
        rationale:
          `FacilityDetail FACILITYNUMBER ${live} does not match requested ${id}; keep unknown-ineligible.`,
      });
    }
  }

  return out;
}

/**
 * Conflicting official licensing statuses across DownloadStateData and
 * FacilityDetail. Never invents equivalence.
 */
export function detectCaliforniaPhase16StatusConflictExceptions(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  timedOut?: boolean;
  apiHttpStatus?: number | null;
  scope?: CaliforniaPhase16ExceptionScope;
}): CaliforniaPhase16DetectedException[] {
  const id = text(input.facilityNumber);
  const scope = input.scope ?? "sampled";
  if (input.timedOut === true || input.apiHttpStatus === 0) {
    return [];
  }
  const download = upper(input.downloadStatus);
  const live = upper(input.liveStatus);
  if (!download || !live) return [];

  const knownDocumentedCoarsening =
    download === "CLOSED"
    && (live === "APPLICATION WITHDRAWN" || live.includes("APPLICATION WITHDRAWN"));

  if (knownDocumentedCoarsening) {
    return [{
      facilityNumber: id,
      exceptionClass: "withdrawn-ineligible-control",
      eligibility: "withdrawn-ineligible",
      scope: (CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS as readonly string[]).includes(id)
        ? "regression-control"
        : scope,
      sourceEvidence: {
        downloadStatus: text(input.downloadStatus),
        liveStatus: text(input.liveStatus),
        downloadLicenseFirstDate: text(input.downloadLicenseFirstDate) || null,
        liveLicenseFirstDate: text(input.liveLicenseFirstDate) || null,
        liveLicenseEffectiveDate: text(input.liveLicenseEffectiveDate) || null,
        notes: "Documented Download CLOSED → FacilityDetail Application Withdrawn coarsening.",
      },
      classification: "documented-coarsening-withdrawn-ineligible",
      unresolvedQuestions: [],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale:
        "Download CLOSED coarsens to FacilityDetail Application Withdrawn; remain withdrawn-ineligible.",
    }];
  }

  // Normalize common Licensed / On Probation casing equivalence as match (not conflict).
  const downloadNormalized = download === "ON PROBATION" ? "ON PROBATION" : download;
  const liveNormalized = live === "ON PROBATION"
    ? "ON PROBATION"
    : live === "LICENSED"
      ? "LICENSED"
      : live;

  const licensedFamilyMatch =
    (downloadNormalized === "LICENSED" && liveNormalized === "LICENSED")
    || (downloadNormalized === "ON PROBATION" && liveNormalized === "ON PROBATION")
    || (downloadNormalized === "PENDING" && liveNormalized.startsWith("PENDING"))
    || (downloadNormalized === "CLOSED" && liveNormalized.startsWith("CLOSED"));

  if (licensedFamilyMatch) return [];

  if (downloadNormalized !== liveNormalized && download !== live) {
    const neverLicensed =
      text(input.downloadLicenseFirstDate) === ""
      && text(input.liveLicenseFirstDate) === ""
      && text(input.liveLicenseEffectiveDate) === "";
    return [{
      facilityNumber: id,
      exceptionClass: id === CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER
        ? "unknown-ineligible-control"
        : "status-conflict",
      eligibility: "unknown-ineligible",
      scope: id === CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER
        ? "regression-control"
        : scope,
      sourceEvidence: {
        downloadStatus: text(input.downloadStatus),
        liveStatus: text(input.liveStatus),
        downloadLicenseFirstDate: text(input.downloadLicenseFirstDate) || null,
        liveLicenseFirstDate: text(input.liveLicenseFirstDate) || null,
        liveLicenseEffectiveDate: text(input.liveLicenseEffectiveDate) || null,
        notes: neverLicensed
          ? "Never-licensed markers present (empty license dates on both sources)."
          : "Status labels disagree across authoritative sources.",
      },
      classification: "conflicting-official-licensing-status",
      unresolvedQuestions: [
        "Which official status is authoritative for eligibility until CDSS clarifies?",
        "Is this a reporting delay, record reuse, or substantive inconsistency?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale:
        `Download status "${text(input.downloadStatus)}" conflicts with FacilityDetail "${text(input.liveStatus)}"; keep unknown-ineligible; do not invent equivalence.`,
    }];
  }

  return [];
}

/**
 * LICENSED Download rows with a missing initial license date are unsafe for
 * publication until dates are confirmed.
 */
export function detectCaliforniaPhase16LicensedMissingDateExceptions(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  downloadLicenseFirstDate?: string | null;
  liveStatus?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  scope?: CaliforniaPhase16ExceptionScope;
}): CaliforniaPhase16DetectedException[] {
  const id = text(input.facilityNumber);
  const scope = input.scope ?? "sampled";
  const download = upper(input.downloadStatus);
  if (download !== "LICENSED") return [];
  if (text(input.downloadLicenseFirstDate) !== "") return [];

  return [{
    facilityNumber: id,
    exceptionClass: "licensed-missing-initial-date",
    eligibility: "unknown-ineligible",
    scope: id === CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER
      ? "regression-control"
      : scope,
    sourceEvidence: {
      downloadStatus: text(input.downloadStatus),
      liveStatus: text(input.liveStatus) || null,
      downloadLicenseFirstDate: "",
      liveLicenseFirstDate: text(input.liveLicenseFirstDate) || null,
      liveLicenseEffectiveDate: text(input.liveLicenseEffectiveDate) || null,
      notes: "Download LICENSED with empty License First Date.",
    },
    classification: "licensed-missing-initial-license-date",
    unresolvedQuestions: [
      "Was this facility ever licensed, or is Download mislabeling a pending/never-licensed row?",
      "What is the authoritative initial license date if any?",
    ],
    publicationEligible: false,
    ownerClaimEligible: false,
    sampleIsStatewideConclusion: false,
    rationale:
      `Facility ${id} is Download LICENSED with empty License First Date; keep unknown-ineligible until authoritative dates exist.`,
  }];
}

/**
 * Disclosure page/API probes: invalid, missing, ambiguous (leading-zero),
 * mismatched identity, or redirected FacDetail URLs.
 */
export function detectCaliforniaPhase16DisclosurePageExceptions(input: {
  facilityNumber: string;
  classification?:
    | "working"
    | "missing"
    | "ambiguous"
    | "invalid"
    | "inconclusive"
    | null;
  identifierRelation?:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable"
    | null;
  liveFacilityNumber?: string | null;
  pageHttpStatus?: number | null;
  pageFinalUrl?: string | null;
  expectedPageUrlPrefix?: string | null;
  apiHttpStatus?: number | null;
  scope?: CaliforniaPhase16ExceptionScope;
}): CaliforniaPhase16DetectedException[] {
  const id = text(input.facilityNumber);
  const scope = input.scope ?? "sampled";
  const out: CaliforniaPhase16DetectedException[] = [];
  const expectedPrefix = text(input.expectedPageUrlPrefix)
    || "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";
  const finalUrl = text(input.pageFinalUrl);

  if (input.classification === "invalid" || !CALIFORNIA_PHASE16_FACILITY_NUMBER.test(id)) {
    out.push({
      facilityNumber: id,
      exceptionClass: "disclosure-invalid",
      eligibility: "invalid-id-ineligible",
      scope: id === CALIFORNIA_PHASE16_INVALID_FACILITY_NUMBER ? "regression-control" : scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        apiHttpStatus: input.apiHttpStatus ?? null,
        pageHttpStatus: input.pageHttpStatus ?? null,
        notes: "Disclosure URL generator refuse-closed for non 8–9 digit IDs.",
      },
      classification: "invalid-disclosure-id",
      unresolvedQuestions: [
        "Is there a corrected official facility number that should replace this row?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale: `Disclosure ID ${id} is invalid; refuse-closed; no fabricated URL.`,
    });
    return out;
  }

  if (
    finalUrl
    && input.pageHttpStatus != null
    && input.pageHttpStatus >= 200
    && input.pageHttpStatus < 400
    && !finalUrl.includes(`FacDetail/${id}`)
    && finalUrl.startsWith("http")
  ) {
    out.push({
      facilityNumber: id,
      exceptionClass: "disclosure-redirected",
      eligibility: "unknown-ineligible",
      scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        pageHttpStatus: input.pageHttpStatus,
        pageFinalUrl: finalUrl,
        notes: `Expected FacDetail path under ${expectedPrefix}${id}`,
      },
      classification: "disclosure-page-redirected-or-rewritten",
      unresolvedQuestions: [
        "Where did the FacDetail page redirect, and does the final page still identify this facility?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale:
        `Disclosure page for ${id} resolved to a final URL that does not preserve FacDetail/${id}.`,
    });
  }

  if (input.classification === "missing") {
    out.push({
      facilityNumber: id,
      exceptionClass: "disclosure-missing",
      eligibility: "unknown-ineligible",
      scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        liveFacilityNumber: input.liveFacilityNumber ?? null,
        apiHttpStatus: input.apiHttpStatus ?? null,
        pageHttpStatus: input.pageHttpStatus ?? null,
      },
      classification: "disclosure-target-missing",
      unresolvedQuestions: [
        "Was the facility removed from FacilityDetail, or is the Download ID stale?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale: `FacilityDetail target missing for ${id}; disclosure link unsafe for publication.`,
    });
  }

  if (input.classification === "ambiguous") {
    const lostZeros = input.identifierRelation === "leading-zero-canonicalization";
    out.push({
      facilityNumber: id,
      exceptionClass: lostZeros ? "facility-id-lost-leading-zeros" : "disclosure-ambiguous",
      eligibility: "unknown-ineligible",
      scope: id === CALIFORNIA_PHASE16_TRUNCATED_LEADING_ZERO_REQUEST
        || id === CALIFORNIA_PHASE16_CANONICAL_LEADING_ZERO_FACILITY_NUMBER
        ? "regression-control"
        : scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        liveFacilityNumber: input.liveFacilityNumber ?? null,
        apiHttpStatus: input.apiHttpStatus ?? null,
        notes: input.identifierRelation ?? null,
      },
      classification: lostZeros
        ? "ambiguous-leading-zero-disclosure"
        : "ambiguous-disclosure-identity",
      unresolvedQuestions: [
        "Which exact official facility number should be used in the disclosure URL?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale: lostZeros
        ? `Ambiguous leading-zero disclosure for request ${id}; publish only exact official ID.`
        : `Ambiguous disclosure identity for ${id}; keep unknown-ineligible.`,
    });
  }

  if (
    input.classification === "working"
    && input.identifierRelation === "mismatch"
  ) {
    out.push({
      facilityNumber: id,
      exceptionClass: "disclosure-mismatched",
      eligibility: "unknown-ineligible",
      scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        liveFacilityNumber: input.liveFacilityNumber ?? null,
        apiHttpStatus: input.apiHttpStatus ?? null,
      },
      classification: "disclosure-identity-mismatch",
      unresolvedQuestions: [
        "Why does a working HTTP response identify a different facility number?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale: `Disclosure response identity mismatches requested ${id}.`,
    });
  }

  if (
    input.identifierRelation === "mismatch"
    && input.classification !== "ambiguous"
    && input.classification !== "working"
  ) {
    out.push({
      facilityNumber: id,
      exceptionClass: "disclosure-mismatched",
      eligibility: "unknown-ineligible",
      scope,
      sourceEvidence: {
        requestedFacilityNumber: id,
        liveFacilityNumber: input.liveFacilityNumber ?? null,
        apiHttpStatus: input.apiHttpStatus ?? null,
      },
      classification: "disclosure-identity-mismatch",
      unresolvedQuestions: [
        "Why does FacilityDetail FACILITYNUMBER disagree with the disclosure request?",
      ],
      publicationEligible: false,
      ownerClaimEligible: false,
      sampleIsStatewideConclusion: false,
      rationale: `Disclosure identity mismatch for ${id}; keep unknown-ineligible.`,
    });
  }

  return out;
}

/**
 * Statewide-check style detector for unexpected DownloadStateData sha256 drift
 * vs the Phase 10–15 preserved baseline. Not a per-facility sample finding.
 */
export function detectCaliforniaPhase16SourceDataChangeExceptions(input: {
  downloadSha256: { rcfe: string; arf: string };
  baselineSha256?: { rcfe: string; arf: string };
  observedOn?: string | null;
}): CaliforniaPhase16DetectedException[] {
  const baseline = input.baselineSha256 ?? CALIFORNIA_PHASE16_BASELINE_DOWNLOAD_SHA256;
  const rcfeChanged = input.downloadSha256.rcfe !== baseline.rcfe;
  const arfChanged = input.downloadSha256.arf !== baseline.arf;
  if (!rcfeChanged && !arfChanged) return [];

  return [{
    facilityNumber: "*",
    exceptionClass: "source-data-unexpected-change",
    eligibility: "unknown-ineligible",
    scope: "statewide-check",
    sourceEvidence: {
      downloadSha256: input.downloadSha256,
      notes:
        `Baseline rcfe=${baseline.rcfe}; arf=${baseline.arf}. `
        + `Observed rcfe changed=${rcfeChanged}; arf changed=${arfChanged}. `
        + `observedOn=${input.observedOn ?? CALIFORNIA_PHASE16_EXCEPTION_DETECTION_OBSERVED_ON}.`,
    },
    classification: "unexpected-official-source-data-change",
    unresolvedQuestions: [
      "Did CDSS publish a new weekly DownloadStateData attachment?",
      "Which roster / eligibility / coordinate baselines must be revalidated before any gate change?",
    ],
    publicationEligible: false,
    ownerClaimEligible: false,
    sampleIsStatewideConclusion: false,
    rationale:
      "DownloadStateData sha256 differs from the preserved Phase 10–15 baseline; treat as unexpected source change and keep the gate blocked until revalidated.",
  }];
}

/**
 * Run the full deterministic detector suite for one facility observation.
 */
export function detectCaliforniaPhase16ExceptionsForFacility(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  liveStatus?: string | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  apiHttpStatus?: number | null;
  timedOut?: boolean;
  pageHttpStatus?: number | null;
  pageFinalUrl?: string | null;
  disclosureClassification?:
    | "working"
    | "missing"
    | "ambiguous"
    | "invalid"
    | "inconclusive"
    | null;
  identifierRelation?:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable"
    | null;
  scope?: CaliforniaPhase16ExceptionScope;
}): CaliforniaPhase16DetectedException[] {
  const scope = input.scope ?? "sampled";
  return [
    ...detectCaliforniaPhase16FacilityIdExceptions({
      facilityNumber: input.facilityNumber,
      liveFacilityNumber: input.liveFacilityNumber,
      apiFound: input.apiFound,
      apiHttpStatus: input.apiHttpStatus,
      scope,
    }),
    ...detectCaliforniaPhase16StatusConflictExceptions({
      facilityNumber: input.facilityNumber,
      downloadStatus: input.downloadStatus,
      liveStatus: input.liveStatus,
      downloadLicenseFirstDate: input.downloadLicenseFirstDate,
      liveLicenseFirstDate: input.liveLicenseFirstDate,
      liveLicenseEffectiveDate: input.liveLicenseEffectiveDate,
      timedOut: input.timedOut,
      apiHttpStatus: input.apiHttpStatus,
      scope,
    }),
    ...detectCaliforniaPhase16LicensedMissingDateExceptions({
      facilityNumber: input.facilityNumber,
      downloadStatus: input.downloadStatus,
      downloadLicenseFirstDate: input.downloadLicenseFirstDate,
      liveStatus: input.liveStatus,
      liveLicenseFirstDate: input.liveLicenseFirstDate,
      liveLicenseEffectiveDate: input.liveLicenseEffectiveDate,
      scope,
    }),
    ...detectCaliforniaPhase16DisclosurePageExceptions({
      facilityNumber: input.facilityNumber,
      classification: input.disclosureClassification,
      identifierRelation: input.identifierRelation,
      liveFacilityNumber: input.liveFacilityNumber,
      pageHttpStatus: input.pageHttpStatus,
      pageFinalUrl: input.pageFinalUrl,
      apiHttpStatus: input.apiHttpStatus,
      scope,
    }),
  ];
}

export type CaliforniaPhase16ExceptionReport = {
  observedOn: string | null;
  sampledFindings: CaliforniaPhase16DetectedException[];
  statewideChecks: CaliforniaPhase16DetectedException[];
  regressionControls: CaliforniaPhase16DetectedException[];
  byClass: Record<string, number>;
  newlyDetectedCount: number;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  gate: "blocked";
  notes: readonly string[];
};

export function summarizeCaliforniaPhase16ExceptionReport(input: {
  observedOn?: string | null;
  findings: readonly CaliforniaPhase16DetectedException[];
}): CaliforniaPhase16ExceptionReport {
  const sampledFindings = input.findings.filter(f => f.scope === "sampled");
  const statewideChecks = input.findings.filter(f => f.scope === "statewide-check");
  const regressionControls = input.findings.filter(f => f.scope === "regression-control");
  const byClass: Record<string, number> = {};
  for (const finding of input.findings) {
    byClass[finding.exceptionClass] = (byClass[finding.exceptionClass] ?? 0) + 1;
  }
  return {
    observedOn: input.observedOn ?? null,
    sampledFindings: [...sampledFindings],
    statewideChecks: [...statewideChecks],
    regressionControls: [...regressionControls],
    byClass,
    newlyDetectedCount: sampledFindings.length + statewideChecks.length,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    gate: "blocked",
    notes: [
      "Sampled findings are not statewide conclusions.",
      "Statewide checks (e.g. Download sha256 drift) are roster-level, not per-facility samples.",
      "Regression controls preserve known unsafe/ineligible cases.",
      "Uncertain records remain ineligible until authoritative evidence supports another class.",
      "Do not repeat unsuccessful investigation of the 28 unresolved coordinates without new evidence.",
    ],
  };
}

/** Fixture-shaped regression probes used by tests and the live runner. */
export const CALIFORNIA_PHASE16_REGRESSION_DETECTION_CASES = {
  statusConflict502701867: {
    facilityNumber: CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER,
    downloadStatus: "LICENSED",
    liveStatus: "Pending Incomplete Application",
    downloadLicenseFirstDate: "",
    liveLicenseFirstDate: "",
    liveLicenseEffectiveDate: "",
    liveFacilityNumber: "502701867",
    apiFound: true,
    apiHttpStatus: 200,
    disclosureClassification: "working" as const,
    identifierRelation: "exact" as const,
  },
  invalid95354: {
    facilityNumber: CALIFORNIA_PHASE16_INVALID_FACILITY_NUMBER,
    downloadStatus: "PENDING",
    disclosureClassification: "invalid" as const,
    identifierRelation: "not-applicable" as const,
  },
  truncatedLeadingZero: {
    facilityNumber: CALIFORNIA_PHASE16_TRUNCATED_LEADING_ZERO_REQUEST,
    liveFacilityNumber: CALIFORNIA_PHASE16_CANONICAL_LEADING_ZERO_FACILITY_NUMBER,
    apiFound: true,
    apiHttpStatus: 200,
    disclosureClassification: "ambiguous" as const,
    identifierRelation: "leading-zero-canonicalization" as const,
  },
  canonicalLeadingZero: {
    facilityNumber: CALIFORNIA_PHASE16_CANONICAL_LEADING_ZERO_FACILITY_NUMBER,
    liveFacilityNumber: CALIFORNIA_PHASE16_CANONICAL_LEADING_ZERO_FACILITY_NUMBER,
    apiFound: true,
    apiHttpStatus: 200,
    disclosureClassification: "working" as const,
    identifierRelation: "exact" as const,
  },
  withdrawnControls: CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS.map(facilityNumber => ({
    facilityNumber,
    downloadStatus: "CLOSED",
    liveStatus: "Application Withdrawn",
    downloadLicenseFirstDate: "",
    liveLicenseFirstDate: "",
    liveLicenseEffectiveDate: "",
    apiFound: true,
    apiHttpStatus: 200,
  })),
} as const;

export function runCaliforniaPhase16RegressionExceptionDetection():
  CaliforniaPhase16DetectedException[] {
  const out: CaliforniaPhase16DetectedException[] = [];
  out.push(
    ...detectCaliforniaPhase16ExceptionsForFacility({
      ...CALIFORNIA_PHASE16_REGRESSION_DETECTION_CASES.statusConflict502701867,
      scope: "regression-control",
    }),
  );
  out.push(
    ...detectCaliforniaPhase16ExceptionsForFacility({
      ...CALIFORNIA_PHASE16_REGRESSION_DETECTION_CASES.invalid95354,
      scope: "regression-control",
    }),
  );
  out.push(
    ...detectCaliforniaPhase16ExceptionsForFacility({
      ...CALIFORNIA_PHASE16_REGRESSION_DETECTION_CASES.truncatedLeadingZero,
      scope: "regression-control",
    }),
  );
  // Canonical exact ID must NOT raise a leading-zero exception.
  out.push(
    ...detectCaliforniaPhase16ExceptionsForFacility({
      ...CALIFORNIA_PHASE16_REGRESSION_DETECTION_CASES.canonicalLeadingZero,
      scope: "regression-control",
    }),
  );
  for (const row of CALIFORNIA_PHASE16_REGRESSION_DETECTION_CASES.withdrawnControls) {
    out.push(
      ...detectCaliforniaPhase16ExceptionsForFacility({
        ...row,
        scope: "regression-control",
      }),
    );
  }
  return out;
}

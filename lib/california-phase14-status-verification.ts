/**
 * California Phase 14 — licensing-status evidence strengthening notes and
 * withdrawn-control constants. Status mapping observation helpers live in the
 * Phase 13 module and are imported by the runner/tests (not by this file) so
 * Next.js typecheck stays free of sibling `.ts` imports.
 * Sample results are not statewide. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE14_STATUS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE14_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_PHASE14_WITHDRAWN_EVIDENCE = {
  pin2401DisplayDomain: [
    "Licensed",
    "Pending",
    "Closed",
    "On Probation",
  ] as const,
  title22WithdrawalOfApplication: "CCR Title 22 §80029 Withdrawal of Application",
  facilityDetailLabel: "Application Withdrawn",
  downloadCoarseLabel: "CLOSED",
  neverLicensedMarkers: [
    "empty Download License First Date",
    "empty FacilityDetail LICENSEFIRSTDATE",
    "empty FacilityDetail LICENSEEFFECTIVEDATE",
  ] as const,
  closedStarContrastMarkers: [
    "non-empty License First Date on formerly licensed Closed* rows",
    "FacilityDetail STATUS begins with Closed",
  ] as const,
  phase11GapIds: [
    "306006749",
    "306006799",
    "405802282",
    "374604911",
    "019201529",
  ] as const,
  downloadClosedEmptyLicenseFirstCount: 1241,
  downloadClosedWithLicenseFirstCount: 4868,
  downloadClosedTotal: 6109,
  evidenceSource: "facility-detail" as const,
  downloadOnlyIndicator: "download-license-first-date-empty" as const,
} as const;

export type CaliforniaPhase14ClosedInterpretation =
  | "closed-star-formerly-licensed"
  | "application-withdrawn-documented-coarsening"
  | "unresolved-inconsistency"
  | "not-applicable";

export type CaliforniaPhase14StatusRelation =
  | "match"
  | "documented-coarsening"
  | "conflict"
  | "missing"
  | "inconclusive"
  | "invalid-id";

export type CaliforniaPhase14Eligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "invalid-id-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase14EvidenceKind =
  | "facility-detail-verified"
  | "download-only-indicator"
  | "not-applicable";

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

/**
 * Interpret CLOSED download rows against FacilityDetail. Preserves withdrawn
 * as documented coarsening / withdrawn-ineligible. Never invents Closed*.
 */
export function interpretCaliforniaPhase14ClosedMapping(input: {
  downloadStatus: string;
  liveStatus: string | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  downloadClosedDate?: string | null;
  liveDateClosed?: string | null;
}): {
  relation: CaliforniaPhase14StatusRelation;
  closedInterpretation: CaliforniaPhase14ClosedInterpretation;
  eligibility: CaliforniaPhase14Eligibility;
  treatsAsClosedStar: boolean;
  evidenceKind: CaliforniaPhase14EvidenceKind;
} {
  const download = upper(input.downloadStatus);
  const live = text(input.liveStatus);
  const liveUpper = upper(live);
  const neverLicensed =
    text(input.downloadLicenseFirstDate) === ""
    && text(input.liveLicenseFirstDate) === ""
    && text(input.liveLicenseEffectiveDate) === "";

  if (download !== "CLOSED") {
    return {
      relation: "match",
      closedInterpretation: "not-applicable",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      evidenceKind: "facility-detail-verified",
    };
  }

  if (liveUpper === "APPLICATION WITHDRAWN" || liveUpper.includes("APPLICATION WITHDRAWN")) {
    return {
      relation: "documented-coarsening",
      closedInterpretation: "application-withdrawn-documented-coarsening",
      eligibility: "withdrawn-ineligible",
      treatsAsClosedStar: false,
      evidenceKind: "facility-detail-verified",
    };
  }

  if (liveUpper.startsWith("CLOSED")) {
    return {
      relation: "match",
      closedInterpretation: "closed-star-formerly-licensed",
      eligibility: "closed-ineligible",
      treatsAsClosedStar: true,
      evidenceKind: "facility-detail-verified",
    };
  }

  if (!live) {
    return {
      relation: "missing",
      closedInterpretation: "unresolved-inconsistency",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      evidenceKind: "not-applicable",
    };
  }

  return {
    relation: neverLicensed ? "conflict" : "conflict",
    closedInterpretation: "unresolved-inconsistency",
    eligibility: "unknown-ineligible",
    treatsAsClosedStar: false,
    evidenceKind: "facility-detail-verified",
  };
}

export function isCaliforniaPhase14DownloadOnlyWithdrawnIndicator(input: {
  downloadStatus: string;
  downloadLicenseFirstDate?: string | null;
}): boolean {
  return upper(input.downloadStatus) === "CLOSED"
    && text(input.downloadLicenseFirstDate) === "";
}

/** Phase 14 status-sample notes (exact denominators; not statewide). */
export const CALIFORNIA_PHASE14_STATUS_NOTES = [
  "Phase 14 strengthens FacilityDetail status evidence on a bounded sample that includes all five CLOSED→Application Withdrawn regression controls.",
  "Withdrawn remains withdrawn-ineligible; never invent Closed* equivalence; never treat withdrawn as licensed.",
  "Download CLOSED + empty License First Date is a download-only indicator, not FacilityDetail-verified statewide withdrawn status.",
  "Do not extrapolate sample results to the full 15,451 publication-candidate roster.",
] as const;

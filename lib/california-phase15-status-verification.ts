/**
 * California Phase 15 — licensing-status evidence notes and withdrawn-control
 * constants. Retains five CLOSED→Application Withdrawn regression controls.
 * Status conflict 502701867 stays unknown-ineligible. Sample results are not
 * statewide. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE15_STATUS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE15_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_PHASE15_WITHDRAWN_EVIDENCE = {
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

export type CaliforniaPhase15ClosedInterpretation =
  | "closed-star-formerly-licensed"
  | "application-withdrawn-documented-coarsening"
  | "unresolved-inconsistency"
  | "not-applicable";

export type CaliforniaPhase15StatusRelation =
  | "match"
  | "documented-coarsening"
  | "conflict"
  | "missing"
  | "inconclusive"
  | "invalid-id";

export type CaliforniaPhase15Eligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "invalid-id-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase15EvidenceKind =
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
export function interpretCaliforniaPhase15ClosedMapping(input: {
  downloadStatus: string;
  liveStatus: string | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  downloadClosedDate?: string | null;
  liveDateClosed?: string | null;
}): {
  relation: CaliforniaPhase15StatusRelation;
  closedInterpretation: CaliforniaPhase15ClosedInterpretation;
  eligibility: CaliforniaPhase15Eligibility;
  treatsAsClosedStar: boolean;
  evidenceKind: CaliforniaPhase15EvidenceKind;
} {
  const download = upper(input.downloadStatus);
  const live = text(input.liveStatus);
  const liveUpper = upper(live);

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
    relation: "conflict",
    closedInterpretation: "unresolved-inconsistency",
    eligibility: "unknown-ineligible",
    treatsAsClosedStar: false,
    evidenceKind: "facility-detail-verified",
  };
}

export function isCaliforniaPhase15DownloadOnlyWithdrawnIndicator(input: {
  downloadStatus: string;
  downloadLicenseFirstDate?: string | null;
}): boolean {
  return upper(input.downloadStatus) === "CLOSED"
    && text(input.downloadLicenseFirstDate) === "";
}

/** Phase 15 status-sample notes (exact denominators; not statewide). */
export const CALIFORNIA_PHASE15_STATUS_NOTES = [
  "Phase 15 retains five CLOSED→Application Withdrawn regression controls as withdrawn-ineligible.",
  "Status conflict 502701867 (Download LICENSED vs FacilityDetail Pending Incomplete Application) remains unknown-ineligible.",
  "Withdrawn remains withdrawn-ineligible; never invent Closed* equivalence; never treat withdrawn as licensed.",
  "Do not extrapolate sample results to the full 15,451 publication-candidate roster.",
] as const;

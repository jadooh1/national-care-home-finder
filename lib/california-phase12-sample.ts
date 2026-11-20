/**
 * Bounded stratified samples for California Phase 12 status-mapping and
 * expanded disclosure-link verification. Larger than Phase 11; still not a
 * statewide conclusion. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export type CaliforniaPhase12DisclosureSampleTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum:
    | "rcfe-licensed"
    | "arf-licensed"
    | "rcfe-ccrc"
    | "probationary"
    | "closed"
    | "pending"
    | "withdrawn"
    | "leading-zero-9"
    | "leading-zero-closed"
    | "leading-zero-licensed"
    | "exceptional-invalid"
    | "exceptional-documented"
    | "truncated-leading-zero-request";
  label: string;
  requestFacilityNumber?: string;
};

export type CaliforniaPhase12StatusSampleTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum:
    | "active-licensed"
    | "probationary"
    | "closed-star"
    | "application-withdrawn"
    | "pending"
    | "exceptional"
    | "leading-zero-active"
    | "leading-zero-closed"
    | "leading-zero-withdrawn";
  label: string;
};

/**
 * Expanded disclosure-link sample (N=40). Stratified across RCFE/ARF,
 * licensed / probationary / closed / pending / withdrawn, leading-zero IDs,
 * known exceptions, and one truncated leading-zero negative control.
 */
export const CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE: readonly CaliforniaPhase12DisclosureSampleTarget[] = [
  // —— licensed / CCRC ——
  {
    facilityNumber: "100400070",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed",
  },
  {
    facilityNumber: "197610772",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "rcfe-licensed",
    label: "rcfe-licensed-standard",
  },
  {
    facilityNumber: "565800841",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "rcfe-licensed",
    label: "rcfe-licensed-2",
  },
  {
    facilityNumber: "216801686",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-2",
  },
  {
    facilityNumber: "198603605",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-3",
  },
  {
    facilityNumber: "100403816",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-standard",
  },
  {
    facilityNumber: "366401835",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "exceptional-documented",
    label: "arf-historical-defect-but-licensed-live",
  },
  {
    facilityNumber: "361800222",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-2",
  },
  {
    facilityNumber: "361800089",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-3",
  },
  {
    facilityNumber: "198320080",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-4",
  },
  // —— probationary ——
  {
    facilityNumber: "015601219",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "probationary",
    label: "rcfe-probation-leading-zero",
  },
  {
    facilityNumber: "374603279",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "probationary",
    label: "rcfe-on-probation",
  },
  {
    facilityNumber: "198603445",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "probationary",
    label: "rcfe-on-probation-2",
  },
  {
    facilityNumber: "079201014",
    file: "ARF",
    downloadStatus: "ON PROBATION",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "probationary",
    label: "arf-on-probation",
  },
  {
    facilityNumber: "075600352",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "leading-zero-9",
    label: "rcfe-probation-leading-zero-2",
  },
  // —— closed (Closed*) ——
  {
    facilityNumber: "011400493",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "leading-zero-closed",
    label: "arf-closed-leading-zero",
  },
  {
    facilityNumber: "198603652",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "closed",
    label: "rcfe-closed-licensee-initiated",
  },
  {
    facilityNumber: "306004560",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "closed",
    label: "arf-closed-change-of-location",
  },
  {
    facilityNumber: "157203395",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "closed",
    label: "rcfe-closed-change-of-ownership",
  },
  {
    facilityNumber: "342700440",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "closed",
    label: "rcfe-closed-agency-initiated",
  },
  // —— pending ——
  {
    facilityNumber: "198601400",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "pending",
    label: "arf-pending-exceptional",
  },
  {
    facilityNumber: "216804480",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "(blank)",
    stratum: "pending",
    label: "arf-pending-blank-type",
  },
  // —— withdrawn (Application Withdrawn / Phase 11 gaps) ——
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "withdrawn",
    label: "arf-application-withdrawn",
  },
  {
    facilityNumber: "306006799",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "withdrawn",
    label: "arf-application-withdrawn-2",
  },
  {
    facilityNumber: "405802282",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "withdrawn",
    label: "rcfe-application-withdrawn",
  },
  {
    facilityNumber: "374604911",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "withdrawn",
    label: "rcfe-application-withdrawn-2",
  },
  {
    facilityNumber: "019201529",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "leading-zero-9",
    label: "arf-leading-zero-withdrawn",
  },
  // —— leading-zero licensed ——
  {
    facilityNumber: "015601219",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "leading-zero-9",
    label: "leading-zero-exact-id-control",
  },
  // —— exceptions / negative controls ——
  {
    facilityNumber: "015601219",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "truncated-leading-zero-request",
    label: "truncated-leading-zero-must-not-match-exact",
    requestFacilityNumber: "15601219",
  },
  {
    facilityNumber: "95354",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "exceptional-invalid",
    label: "invalid-five-digit-id",
  },
  {
    facilityNumber: "374604731",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "exceptional-documented",
    label: "arf-adp-out-of-scope-licensed",
  },
  // —— additional licensed diversity ——
  {
    facilityNumber: "197609293",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-5",
  },
  {
    facilityNumber: "198202438",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-6",
  },
  {
    facilityNumber: "191222081",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-4",
  },
  {
    facilityNumber: "191500146",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-5",
  },
  {
    facilityNumber: "197802543",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-6",
  },
  {
    facilityNumber: "421700369",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-7",
  },
  {
    facilityNumber: "198320478",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-8",
  },
  {
    facilityNumber: "374604407",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "rcfe-ccrc",
    label: "rcfe-ccrc-licensed-9",
  },
  {
    facilityNumber: "198603954",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-7",
  },
] as const;

/**
 * Status-mapping sample focused on Phase 11 CLOSED→Application Withdrawn gaps,
 * Closed* controls, and surrounding strata. Not statewide.
 */
export const CALIFORNIA_PHASE12_STATUS_MAPPING_SAMPLE: readonly CaliforniaPhase12StatusSampleTarget[] = [
  {
    facilityNumber: "100400070",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "active-licensed",
    label: "rcfe-ccrc-licensed",
  },
  {
    facilityNumber: "197610772",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "active-licensed",
    label: "rcfe-licensed",
  },
  {
    facilityNumber: "100403816",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "active-licensed",
    label: "arf-licensed",
  },
  {
    facilityNumber: "366401835",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "active-licensed",
    label: "arf-licensed-documented-exception",
  },
  {
    facilityNumber: "015601219",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "leading-zero-active",
    label: "rcfe-probation-leading-zero",
  },
  {
    facilityNumber: "374603279",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "probationary",
    label: "rcfe-on-probation",
  },
  {
    facilityNumber: "079201014",
    file: "ARF",
    downloadStatus: "ON PROBATION",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "probationary",
    label: "arf-on-probation",
  },
  // Closed* controls (formerly licensed)
  {
    facilityNumber: "011400493",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "leading-zero-closed",
    label: "arf-closed-leading-zero",
  },
  {
    facilityNumber: "198603652",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "closed-star",
    label: "rcfe-closed-licensee",
  },
  {
    facilityNumber: "306004560",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "closed-star",
    label: "arf-closed-change-of-location",
  },
  {
    facilityNumber: "157203395",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "closed-star",
    label: "rcfe-closed-change-of-ownership",
  },
  {
    facilityNumber: "342700440",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "closed-star",
    label: "rcfe-closed-agency",
  },
  // Phase 11 Application Withdrawn gaps (all five)
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "application-withdrawn",
    label: "arf-withdrawn-gap-1",
  },
  {
    facilityNumber: "306006799",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "application-withdrawn",
    label: "arf-withdrawn-gap-2",
  },
  {
    facilityNumber: "405802282",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "application-withdrawn",
    label: "rcfe-withdrawn-gap-3",
  },
  {
    facilityNumber: "374604911",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "application-withdrawn",
    label: "rcfe-withdrawn-gap-4",
  },
  {
    facilityNumber: "019201529",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "leading-zero-withdrawn",
    label: "arf-withdrawn-gap-5-leading-zero",
  },
  {
    facilityNumber: "198601400",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "pending",
    label: "arf-pending",
  },
  {
    facilityNumber: "216804480",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "(blank)",
    stratum: "pending",
    label: "arf-pending-blank-type",
  },
  {
    facilityNumber: "95354",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "exceptional",
    label: "invalid-id",
  },
  {
    facilityNumber: "374604731",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "exceptional",
    label: "arf-adp-licensed-out-of-scope",
  },
] as const;

export const CALIFORNIA_PHASE12_SAMPLE_NOTES = [
  "Disclosure-link sample size is expanded vs Phase 11 but still bounded; statewideCoverageClaimed remains false.",
  "Status-mapping sample re-checks all five Phase 11 CLOSED→Application Withdrawn gaps with license-date evidence.",
  "Truncated leading-zero request 15601219 is a negative control for exact-ID disclosure matching.",
  "Do not infer current status from historical CHHS rows.",
  "Do not invent Closed* equivalence for Application Withdrawn.",
] as const;

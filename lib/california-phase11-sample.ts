/**
 * Bounded stratified samples for California Phase 11 disclosure-link and
 * licensing-status verification. Representative across RCFE/ARF, statuses,
 * identifier formats, and exceptional records. Not a statewide conclusion.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export type CaliforniaPhase11DisclosureSampleTarget = {
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
    | "exceptional-invalid"
    | "exceptional-documented"
    | "truncated-leading-zero-request";
  label: string;
  /**
   * When set, the live probe uses this request ID (for truncated leading-zero
   * negative cases) while documenting the official download ID separately.
   */
  requestFacilityNumber?: string;
};

export type CaliforniaPhase11StatusSampleTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum:
    | "active-licensed"
    | "probationary"
    | "closed"
    | "withdrawn"
    | "pending"
    | "exceptional"
    | "leading-zero-active"
    | "leading-zero-closed"
    | "category-control";
  label: string;
};

/**
 * Disclosure-link sample. Includes valid 8/9-digit IDs with and without leading
 * zeros, status/category diversity, withdrawn/exceptional rows, and one
 * truncated leading-zero negative request that must not count as working.
 */
export const CALIFORNIA_PHASE11_DISCLOSURE_LINK_SAMPLE: readonly CaliforniaPhase11DisclosureSampleTarget[] = [
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
    facilityNumber: "100403816",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "arf-licensed",
    label: "arf-licensed-standard",
  },
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
    facilityNumber: "079201014",
    file: "ARF",
    downloadStatus: "ON PROBATION",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "probationary",
    label: "arf-on-probation",
  },
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
    facilityNumber: "198601400",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "pending",
    label: "arf-pending-exceptional",
  },
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "withdrawn",
    label: "arf-application-withdrawn",
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
    facilityNumber: "019201529",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "leading-zero-9",
    label: "arf-leading-zero-9-digit",
  },
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
    facilityNumber: "366401835",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "exceptional-documented",
    label: "arf-historical-defect-but-licensed-live",
  },
  {
    facilityNumber: "374604731",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "exceptional-documented",
    label: "arf-adp-out-of-scope-licensed",
  },
  {
    facilityNumber: "565800841",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "rcfe-licensed",
    label: "rcfe-licensed-control-2",
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
] as const;

/**
 * Stratified status-verification sample against current DownloadStateData labels.
 * Includes active, probationary, closed, withdrawn, pending, and exceptional rows.
 */
export const CALIFORNIA_PHASE11_STATUS_SAMPLE: readonly CaliforniaPhase11StatusSampleTarget[] = [
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
    facilityNumber: "565800841",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "active-licensed",
    label: "rcfe-licensed-2",
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
    label: "rcfe-closed",
  },
  {
    facilityNumber: "306004560",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "closed",
    label: "arf-closed",
  },
  {
    facilityNumber: "157203395",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "closed",
    label: "rcfe-closed-coo",
  },
  {
    facilityNumber: "342700440",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "closed",
    label: "rcfe-closed-agency",
  },
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "withdrawn",
    label: "arf-withdrawn",
  },
  {
    facilityNumber: "306006799",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "withdrawn",
    label: "arf-withdrawn-2",
  },
  {
    facilityNumber: "405802282",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "withdrawn",
    label: "rcfe-withdrawn",
  },
  {
    facilityNumber: "374604911",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "withdrawn",
    label: "rcfe-withdrawn-2",
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
  {
    facilityNumber: "019201529",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "leading-zero-closed",
    label: "arf-leading-zero-closed-or-withdrawn",
  },
] as const;

export const CALIFORNIA_PHASE11_SAMPLE_NOTES = [
  "Disclosure-link sample size is bounded; statewideCoverageClaimed remains false.",
  "Status sample is stratified across active, probationary, closed, withdrawn, pending, and exceptional records.",
  "Truncated leading-zero request 15601219 is a negative control for exact-ID disclosure matching.",
  "Do not infer current status from historical CHHS rows.",
] as const;

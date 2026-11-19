/**
 * Bounded stratified sample for DownloadStateData vs FacilityDetail verification.
 * Not a statewide publication conclusion.
 */

export type CaliforniaTransparencyDownloadSampleTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  stratum:
    | "licensed"
    | "licensed-leading-zero"
    | "closed"
    | "pending"
    | "on-probation"
    | "known-conflict"
    | "invalid-id";
  label: string;
};

/**
 * Reproducible Phase 3 strata covering status domain, leading zeros,
 * known historical LICENSED→Closed conflict, and an invalid identifier.
 */
export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE: readonly CaliforniaTransparencyDownloadSampleTarget[] = [
  {
    facilityNumber: "100400070",
    file: "RCFE",
    downloadStatus: "LICENSED",
    stratum: "licensed",
    label: "rcfe-licensed",
  },
  {
    facilityNumber: "015601302",
    file: "RCFE",
    downloadStatus: "LICENSED",
    stratum: "licensed-leading-zero",
    label: "rcfe-licensed-leading-zero",
  },
  {
    facilityNumber: "011400246",
    file: "RCFE",
    downloadStatus: "CLOSED",
    stratum: "closed",
    label: "rcfe-closed",
  },
  {
    facilityNumber: "015601270",
    file: "RCFE",
    downloadStatus: "CLOSED",
    stratum: "closed",
    label: "rcfe-closed-phase2-conflict",
  },
  {
    facilityNumber: "015601219",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    stratum: "on-probation",
    label: "rcfe-on-probation",
  },
  {
    facilityNumber: "100403816",
    file: "ARF",
    downloadStatus: "LICENSED",
    stratum: "licensed",
    label: "arf-licensed",
  },
  {
    facilityNumber: "011400493",
    file: "ARF",
    downloadStatus: "CLOSED",
    stratum: "known-conflict",
    label: "arf-011400493-historical-licensed-now-closed",
  },
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    stratum: "closed",
    label: "arf-closed-application-withdrawn-risk",
  },
  {
    facilityNumber: "95354",
    file: "ARF",
    downloadStatus: "PENDING",
    stratum: "invalid-id",
    label: "arf-invalid-facility-number-zip-shift",
  },
] as const;

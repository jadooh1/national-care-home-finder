/**
 * Bounded stratified FacilityDetail sample for California Phase 4.
 * Includes required conflict/invalid identifiers. Not a statewide conclusion.
 */

export type CaliforniaPhase4SampleTarget = {
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
    | "application-withdrawn-risk"
    | "invalid-id"
    | "blank-type"
    | "arf-nonresidential-type";
  label: string;
};

/**
 * Reproducible Phase 4 strata covering status domain, leading zeros,
 * known conflicts, Application Withdrawn risk, invalid id, blank type,
 * and ARF non-residential category rows.
 */
export const CALIFORNIA_PHASE4_FACILITY_DETAIL_SAMPLE: readonly CaliforniaPhase4SampleTarget[] = [
  {
    facilityNumber: "011400493",
    file: "ARF",
    downloadStatus: "CLOSED",
    stratum: "known-conflict",
    label: "arf-011400493-historical-licensed-download-closed",
  },
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    stratum: "application-withdrawn-risk",
    label: "arf-306006749-closed-vs-application-withdrawn",
  },
  {
    facilityNumber: "95354",
    file: "ARF",
    downloadStatus: "PENDING",
    stratum: "invalid-id",
    label: "arf-invalid-facility-number-zip-shift",
  },
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
    label: "rcfe-closed-phase2-conflict-now-aligned",
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
    facilityNumber: "306006799",
    file: "ARF",
    downloadStatus: "CLOSED",
    stratum: "application-withdrawn-risk",
    label: "arf-306006799-closed-vs-application-withdrawn",
  },
  {
    facilityNumber: "306007045",
    file: "RCFE",
    downloadStatus: "PENDING",
    stratum: "pending",
    label: "rcfe-pending",
  },
  {
    facilityNumber: "374605141",
    file: "ARF",
    downloadStatus: "PENDING",
    stratum: "pending",
    label: "arf-pending",
  },
  {
    facilityNumber: "198603445",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    stratum: "on-probation",
    label: "rcfe-on-probation-extra",
  },
  {
    facilityNumber: "397000014",
    file: "ARF",
    downloadStatus: "ON PROBATION",
    stratum: "on-probation",
    label: "arf-on-probation",
  },
  {
    facilityNumber: "486804477",
    file: "RCFE",
    downloadStatus: "LICENSED",
    stratum: "blank-type",
    label: "rcfe-blank-facility-type",
  },
  {
    facilityNumber: "286803618",
    file: "ARF",
    downloadStatus: "LICENSED",
    stratum: "arf-nonresidential-type",
    label: "arf-adult-day-program-licensed",
  },
] as const;

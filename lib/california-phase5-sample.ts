/**
 * Bounded stratified FacilityDetail sample for California Phase 5.
 * Covers historical conflicts, Application Withdrawn, category gates, and controls.
 * Not a statewide conclusion.
 */

export type CaliforniaPhase5SampleTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum:
    | "anomaly-relicense"
    | "anomaly-unusual"
    | "anomaly-historical-defect"
    | "application-withdrawn"
    | "licensed-to-closed"
    | "pending-to-licensed"
    | "pending-to-closed"
    | "licensed-to-probation"
    | "probation-to-licensed"
    | "probation-to-closed"
    | "category-adult-day"
    | "category-srf"
    | "category-rfci"
    | "category-mfhv"
    | "category-blank"
    | "control-licensed"
    | "control-closed"
    | "control-probation"
    | "invalid-id";
  label: string;
};

export const CALIFORNIA_PHASE5_FACILITY_DETAIL_SAMPLE: readonly CaliforniaPhase5SampleTarget[] = [
  {
    facilityNumber: "374604731",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "anomaly-relicense",
    label: "arf-closed-to-licensed-relicense-candidate",
  },
  {
    facilityNumber: "198601400",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "anomaly-unusual",
    label: "arf-licensed-to-pending-unusual",
  },
  {
    facilityNumber: "366401835",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "anomaly-historical-defect",
    label: "arf-historical-status-was-date",
  },
  {
    facilityNumber: "306006749",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "application-withdrawn",
    label: "arf-application-withdrawn-known",
  },
  {
    facilityNumber: "306006799",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "application-withdrawn",
    label: "arf-application-withdrawn-known-2",
  },
  {
    facilityNumber: "405802282",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "application-withdrawn",
    label: "rcfe-application-withdrawn",
  },
  {
    facilityNumber: "374604911",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "application-withdrawn",
    label: "rcfe-application-withdrawn-2",
  },
  {
    facilityNumber: "157203395",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "licensed-to-closed",
    label: "rcfe-closed-change-of-ownership",
  },
  {
    facilityNumber: "198603652",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "licensed-to-closed",
    label: "rcfe-closed-licensee-initiated",
  },
  {
    facilityNumber: "306004560",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "licensed-to-closed",
    label: "arf-closed-change-of-location",
  },
  {
    facilityNumber: "342700440",
    file: "RCFE",
    downloadStatus: "CLOSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "probation-to-closed",
    label: "rcfe-closed-agency-initiated",
  },
  {
    facilityNumber: "197610772",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "pending-to-licensed",
    label: "rcfe-pending-to-licensed",
  },
  {
    facilityNumber: "019201529",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "pending-to-closed",
    label: "arf-pending-to-closed-application-withdrawn",
  },
  {
    facilityNumber: "374603279",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "licensed-to-probation",
    label: "rcfe-on-probation-probationary-license",
  },
  {
    facilityNumber: "079201014",
    file: "ARF",
    downloadStatus: "ON PROBATION",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "licensed-to-probation",
    label: "arf-on-probation-probationary-license",
  },
  {
    facilityNumber: "565800841",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "probation-to-licensed",
    label: "rcfe-probation-to-licensed",
  },
  {
    facilityNumber: "286803618",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    stratum: "category-adult-day",
    label: "arf-adult-day-program-out-of-scope",
  },
  {
    facilityNumber: "198320562",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "SOCIAL REHABILITATION FACILITY",
    stratum: "category-srf",
    label: "arf-social-rehabilitation-out-of-scope",
  },
  {
    facilityNumber: "380540483",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "RESIDENTIAL FACILITY CHRONICALLY ILL",
    stratum: "category-rfci",
    label: "arf-rcfci-out-of-scope",
  },
  {
    facilityNumber: "198604102",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "MEDICAL FOSTER HOMES FOR VETERANS",
    stratum: "category-mfhv",
    label: "arf-mfhv-out-of-scope",
  },
  {
    facilityNumber: "486804477",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "(blank)",
    stratum: "category-blank",
    label: "rcfe-blank-type-licensed",
  },
  {
    facilityNumber: "216804480",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "(blank)",
    stratum: "category-blank",
    label: "arf-blank-type-pending",
  },
  {
    facilityNumber: "100400070",
    file: "RCFE",
    downloadStatus: "LICENSED",
    downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
    stratum: "control-licensed",
    label: "rcfe-control-licensed",
  },
  {
    facilityNumber: "100403816",
    file: "ARF",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "control-licensed",
    label: "arf-control-licensed",
  },
  {
    facilityNumber: "011400493",
    file: "ARF",
    downloadStatus: "CLOSED",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "control-closed",
    label: "arf-control-closed-licensee-initiated",
  },
  {
    facilityNumber: "015601219",
    file: "RCFE",
    downloadStatus: "ON PROBATION",
    downloadType: "RESIDENTIAL CARE ELDERLY",
    stratum: "control-probation",
    label: "rcfe-control-probationary-license",
  },
  {
    facilityNumber: "95354",
    file: "ARF",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    stratum: "invalid-id",
    label: "arf-invalid-facility-number",
  },
] as const;

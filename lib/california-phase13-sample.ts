/**
 * Predefined seed + stratum quotas for California Phase 13 disclosure audit
 * and expanded licensing-status verification. The live runner expands the
 * seed deterministically from DownloadStateData to the target sample size.
 * Still bounded — never a statewide conclusion. Retains Phase 11/12
 * CLOSED→Application Withdrawn regression controls. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export type CaliforniaPhase13DisclosureSampleTarget = {
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
    | "leading-zero-licensed"
    | "leading-zero-probation"
    | "leading-zero-closed"
    | "leading-zero-withdrawn"
    | "exceptional-invalid"
    | "exceptional-documented"
    | "truncated-leading-zero-request";
  label: string;
  requestFacilityNumber?: string;
  publicationCandidate: boolean;
};

export type CaliforniaPhase13StatusSampleTarget = {
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
  /** Phase 11/12 CLOSED→Application Withdrawn regression control. */
  regressionControl?: boolean;
};

/** Five Phase 11/12 CLOSED→Application Withdrawn cases retained as regression controls. */
export const CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

/** Target size for the Phase 13 disclosure stratified sample (not statewide). */
export const CALIFORNIA_PHASE13_DISCLOSURE_SAMPLE_TARGET_SIZE = 120;

/** Target size for the Phase 13 status stratified sample (not statewide). */
export const CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE = 48;

/**
 * Verified seed for disclosure-link sampling (Phase 11/12 known IDs + controls).
 * The runner expands this seed from live DownloadStateData to N=120.
 */
export const CALIFORNIA_PHASE13_DISCLOSURE_SEED: readonly CaliforniaPhase13DisclosureSampleTarget[] = [
  // licensed RCFE / CCRC
  { facilityNumber: "100400070", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-1", publicationCandidate: true },
  { facilityNumber: "197610772", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "rcfe-lic-1", publicationCandidate: true },
  { facilityNumber: "565800841", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "rcfe-lic-2", publicationCandidate: true },
  { facilityNumber: "216801686", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-2", publicationCandidate: true },
  { facilityNumber: "198603605", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-3", publicationCandidate: true },
  { facilityNumber: "191222081", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-4", publicationCandidate: true },
  { facilityNumber: "191500146", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-5", publicationCandidate: true },
  { facilityNumber: "197802543", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-6", publicationCandidate: true },
  { facilityNumber: "421700369", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-7", publicationCandidate: true },
  { facilityNumber: "198320478", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-8", publicationCandidate: true },
  { facilityNumber: "374604407", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "rcfe-ccrc", label: "rcfe-ccrc-9", publicationCandidate: true },
  // licensed ARF
  { facilityNumber: "100403816", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-1", publicationCandidate: true },
  { facilityNumber: "361800222", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-2", publicationCandidate: true },
  { facilityNumber: "361800089", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-3", publicationCandidate: true },
  { facilityNumber: "198320080", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-4", publicationCandidate: true },
  { facilityNumber: "197609293", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-5", publicationCandidate: true },
  { facilityNumber: "198202438", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-6", publicationCandidate: true },
  { facilityNumber: "198603954", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "arf-lic-7", publicationCandidate: true },
  { facilityNumber: "366401835", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional-documented", label: "arf-historical-defect-licensed", publicationCandidate: true },
  // probationary
  { facilityNumber: "015601219", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-probation", label: "rcfe-prob-lz-1", publicationCandidate: true },
  { facilityNumber: "374603279", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "probationary", label: "rcfe-prob-1", publicationCandidate: true },
  { facilityNumber: "198603445", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "probationary", label: "rcfe-prob-2", publicationCandidate: true },
  { facilityNumber: "079201014", file: "ARF", downloadStatus: "ON PROBATION", downloadType: "ADULT RESIDENTIAL", stratum: "probationary", label: "arf-prob-1", publicationCandidate: true },
  { facilityNumber: "075600352", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-probation", label: "rcfe-prob-lz-2", publicationCandidate: true },
  // closed
  { facilityNumber: "011400493", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT RESIDENTIAL", stratum: "leading-zero-closed", label: "arf-closed-lz", publicationCandidate: false },
  { facilityNumber: "198603652", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "closed", label: "rcfe-closed-1", publicationCandidate: false },
  { facilityNumber: "306004560", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT RESIDENTIAL", stratum: "closed", label: "arf-closed-1", publicationCandidate: false },
  { facilityNumber: "157203395", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "closed", label: "rcfe-closed-2", publicationCandidate: false },
  { facilityNumber: "342700440", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "closed", label: "rcfe-closed-3", publicationCandidate: false },
  // pending
  { facilityNumber: "198601400", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "pending", label: "arf-pending-1", publicationCandidate: false },
  { facilityNumber: "216804480", file: "ARF", downloadStatus: "PENDING", downloadType: "(blank)", stratum: "pending", label: "arf-pending-blank", publicationCandidate: false },
  // withdrawn regression controls
  { facilityNumber: "306006749", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "withdrawn", label: "withdrawn-reg-1", publicationCandidate: false },
  { facilityNumber: "306006799", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "withdrawn", label: "withdrawn-reg-2", publicationCandidate: false },
  { facilityNumber: "405802282", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "withdrawn", label: "withdrawn-reg-3", publicationCandidate: false },
  { facilityNumber: "374604911", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "withdrawn", label: "withdrawn-reg-4", publicationCandidate: false },
  { facilityNumber: "019201529", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "leading-zero-withdrawn", label: "withdrawn-reg-5-lz", publicationCandidate: false },
  // exceptional / negative controls
  { facilityNumber: "015601219", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "truncated-leading-zero-request", label: "truncated-lz-negative", requestFacilityNumber: "15601219", publicationCandidate: true },
  { facilityNumber: "95354", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional-invalid", label: "invalid-five-digit", publicationCandidate: false },
  { facilityNumber: "374604731", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT DAY PROGRAM", stratum: "exceptional-documented", label: "arf-adp-out-of-scope", publicationCandidate: false },
] as const;

/**
 * Broader status-mapping seed (expanded at runtime toward N=48).
 * Retains all five withdrawn regression controls.
 */
export const CALIFORNIA_PHASE13_STATUS_SEED: readonly CaliforniaPhase13StatusSampleTarget[] = [
  { facilityNumber: "100400070", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-licensed" },
  { facilityNumber: "197610772", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "active-licensed", label: "rcfe-licensed" },
  { facilityNumber: "565800841", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "active-licensed", label: "rcfe-licensed-2" },
  { facilityNumber: "100403816", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed" },
  { facilityNumber: "361800222", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-2" },
  { facilityNumber: "198320080", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-3" },
  { facilityNumber: "366401835", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-documented-exception" },
  { facilityNumber: "197609293", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-4" },
  { facilityNumber: "198202438", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-5" },
  { facilityNumber: "191222081", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-2" },
  { facilityNumber: "216801686", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-3" },
  { facilityNumber: "198603605", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-4" },
  { facilityNumber: "191500146", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-5" },
  { facilityNumber: "197802543", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-6" },
  { facilityNumber: "421700369", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-7" },
  { facilityNumber: "198320478", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-8" },
  { facilityNumber: "374604407", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "active-licensed", label: "rcfe-ccrc-9" },
  { facilityNumber: "361800089", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-6" },
  { facilityNumber: "198603954", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "arf-licensed-7" },
  // probationary
  { facilityNumber: "015601219", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-active", label: "rcfe-probation-leading-zero" },
  { facilityNumber: "374603279", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "probationary", label: "rcfe-on-probation" },
  { facilityNumber: "198603445", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "probationary", label: "rcfe-on-probation-2" },
  { facilityNumber: "079201014", file: "ARF", downloadStatus: "ON PROBATION", downloadType: "ADULT RESIDENTIAL", stratum: "probationary", label: "arf-on-probation" },
  { facilityNumber: "075600352", file: "RCFE", downloadStatus: "ON PROBATION", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-active", label: "rcfe-probation-lz-2" },
  // Closed* formerly licensed
  { facilityNumber: "011400493", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT RESIDENTIAL", stratum: "leading-zero-closed", label: "arf-closed-leading-zero" },
  { facilityNumber: "198603652", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "closed-star", label: "rcfe-closed-licensee" },
  { facilityNumber: "306004560", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT RESIDENTIAL", stratum: "closed-star", label: "arf-closed-change-of-location" },
  { facilityNumber: "157203395", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "closed-star", label: "rcfe-closed-change-of-ownership" },
  { facilityNumber: "342700440", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "closed-star", label: "rcfe-closed-agency" },
  // Phase 11/12 Application Withdrawn regression controls (all five)
  { facilityNumber: "306006749", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "withdrawn-reg-1", regressionControl: true },
  { facilityNumber: "306006799", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "withdrawn-reg-2", regressionControl: true },
  { facilityNumber: "405802282", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "application-withdrawn", label: "withdrawn-reg-3", regressionControl: true },
  { facilityNumber: "374604911", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "application-withdrawn", label: "withdrawn-reg-4", regressionControl: true },
  { facilityNumber: "019201529", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "leading-zero-withdrawn", label: "withdrawn-reg-5-lz", regressionControl: true },
  // pending
  { facilityNumber: "198601400", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "pending", label: "arf-pending" },
  { facilityNumber: "216804480", file: "ARF", downloadStatus: "PENDING", downloadType: "(blank)", stratum: "pending", label: "arf-pending-blank-type" },
  // exceptional
  { facilityNumber: "95354", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional", label: "invalid-id" },
  { facilityNumber: "374604731", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT DAY PROGRAM", stratum: "exceptional", label: "arf-adp-licensed-out-of-scope" },
] as const;

/** Alias used by fixtures/tests for the expanded disclosure plan after runtime fill. */
export const CALIFORNIA_PHASE13_DISCLOSURE_LINK_SAMPLE = CALIFORNIA_PHASE13_DISCLOSURE_SEED;

/** Alias used by fixtures/tests for the status seed (runtime may expand). */
export const CALIFORNIA_PHASE13_STATUS_MAPPING_SAMPLE = CALIFORNIA_PHASE13_STATUS_SEED;

/** Target stratum quotas when expanding disclosure sample from DownloadStateData. */
export const CALIFORNIA_PHASE13_DISCLOSURE_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase13DisclosureSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "rcfe-licensed", targetCount: 40 },
  { stratum: "arf-licensed", targetCount: 25 },
  { stratum: "rcfe-ccrc", targetCount: 9 },
  { stratum: "probationary", targetCount: 6 },
  { stratum: "leading-zero-licensed", targetCount: 10 },
  { stratum: "leading-zero-probation", targetCount: 2 },
  { stratum: "closed", targetCount: 8 },
  { stratum: "leading-zero-closed", targetCount: 3 },
  { stratum: "pending", targetCount: 4 },
  { stratum: "withdrawn", targetCount: 4 },
  { stratum: "leading-zero-withdrawn", targetCount: 1 },
  { stratum: "exceptional-invalid", targetCount: 1 },
  { stratum: "exceptional-documented", targetCount: 2 },
  { stratum: "truncated-leading-zero-request", targetCount: 1 },
] as const;

/** Target stratum quotas when expanding status sample from DownloadStateData. */
export const CALIFORNIA_PHASE13_STATUS_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase13StatusSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "active-licensed", targetCount: 20 },
  { stratum: "probationary", targetCount: 4 },
  { stratum: "leading-zero-active", targetCount: 4 },
  { stratum: "closed-star", targetCount: 8 },
  { stratum: "leading-zero-closed", targetCount: 2 },
  { stratum: "application-withdrawn", targetCount: 4 },
  { stratum: "leading-zero-withdrawn", targetCount: 1 },
  { stratum: "pending", targetCount: 3 },
  { stratum: "exceptional", targetCount: 2 },
] as const;

export type CaliforniaPhase13DownloadRowLike = {
  facilityNumber: string;
  facilityStatus: string;
  facilityType: string;
  licenseFirstDate?: string;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

const FACILITY_NUMBER = /^\d{8,9}$/;

/**
 * Map a DownloadStateData row into a disclosure stratum for sample planning.
 * Publication-candidate flag is download-rule based (LICENSED / ON PROBATION
 * with a valid 8–9 digit ID); final gate eligibility is unchanged elsewhere.
 */
export function classifyCaliforniaPhase13DisclosureStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase13DownloadRowLike,
): CaliforniaPhase13DisclosureSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);

  if (!valid) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type || "(blank)",
      stratum: "exceptional-invalid",
      label: `invalid-${facilityNumber || "empty"}`,
      publicationCandidate: false,
    };
  }

  if (status === "ON PROBATION") {
    return {
      facilityNumber,
      file,
      downloadStatus: "ON PROBATION",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-probation" : "probationary",
      label: `${file.toLowerCase()}-prob-${facilityNumber}`,
      publicationCandidate: true,
    };
  }

  if (status === "PENDING") {
    return {
      facilityNumber,
      file,
      downloadStatus: "PENDING",
      downloadType: type || "(blank)",
      stratum: "pending",
      label: `${file.toLowerCase()}-pending-${facilityNumber}`,
      publicationCandidate: false,
    };
  }

  if (status === "CLOSED") {
    const emptyLicenseFirst = text(row.licenseFirstDate) === "";
    // Download-only heuristic for planning withdrawn vs closed strata.
    // Not FacilityDetail-verified; live status run distinguishes officially.
    if (emptyLicenseFirst && typeUpper.includes("DAY PROGRAM")) {
      return {
        facilityNumber,
        file,
        downloadStatus: "CLOSED",
        downloadType: type,
        stratum: leadingZero ? "leading-zero-withdrawn" : "withdrawn",
        label: `${file.toLowerCase()}-withdrawn-plan-${facilityNumber}`,
        publicationCandidate: false,
      };
    }
    return {
      facilityNumber,
      file,
      downloadStatus: "CLOSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-closed" : "closed",
      label: `${file.toLowerCase()}-closed-${facilityNumber}`,
      publicationCandidate: false,
    };
  }

  if (status === "LICENSED") {
    if (typeUpper.includes("ADULT DAY PROGRAM") || typeUpper === "ADULT DAY PROGRAM") {
      return {
        facilityNumber,
        file,
        downloadStatus: "LICENSED",
        downloadType: type,
        stratum: "exceptional-documented",
        label: `${file.toLowerCase()}-adp-${facilityNumber}`,
        publicationCandidate: false,
      };
    }
    if (typeUpper.includes("CONTINUING CARE")) {
      return {
        facilityNumber,
        file,
        downloadStatus: "LICENSED",
        downloadType: type,
        stratum: "rcfe-ccrc",
        label: `rcfe-ccrc-${facilityNumber}`,
        publicationCandidate: true,
      };
    }
    if (file === "ARF") {
      return {
        facilityNumber,
        file,
        downloadStatus: "LICENSED",
        downloadType: type,
        stratum: leadingZero ? "leading-zero-licensed" : "arf-licensed",
        label: `arf-lic-${facilityNumber}`,
        publicationCandidate: true,
      };
    }
    return {
      facilityNumber,
      file,
      downloadStatus: "LICENSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-licensed" : "rcfe-licensed",
      label: `rcfe-lic-${facilityNumber}`,
      publicationCandidate: true,
    };
  }

  return null;
}

export function classifyCaliforniaPhase13StatusStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase13DownloadRowLike,
): CaliforniaPhase13StatusSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);

  if (!valid) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type || "(blank)",
      stratum: "exceptional",
      label: `invalid-${facilityNumber || "empty"}`,
    };
  }

  if (status === "ON PROBATION") {
    return {
      facilityNumber,
      file,
      downloadStatus: "ON PROBATION",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-active" : "probationary",
      label: `${file.toLowerCase()}-prob-${facilityNumber}`,
    };
  }

  if (status === "PENDING") {
    return {
      facilityNumber,
      file,
      downloadStatus: "PENDING",
      downloadType: type || "(blank)",
      stratum: "pending",
      label: `${file.toLowerCase()}-pending-${facilityNumber}`,
    };
  }

  if (status === "CLOSED") {
    const emptyLicenseFirst = text(row.licenseFirstDate) === "";
    if (emptyLicenseFirst && typeUpper.includes("DAY PROGRAM")) {
      return {
        facilityNumber,
        file,
        downloadStatus: "CLOSED",
        downloadType: type,
        stratum: leadingZero ? "leading-zero-withdrawn" : "application-withdrawn",
        label: `${file.toLowerCase()}-withdrawn-plan-${facilityNumber}`,
      };
    }
    return {
      facilityNumber,
      file,
      downloadStatus: "CLOSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-closed" : "closed-star",
      label: `${file.toLowerCase()}-closed-${facilityNumber}`,
    };
  }

  if (status === "LICENSED") {
    if (typeUpper.includes("ADULT DAY PROGRAM")) {
      return {
        facilityNumber,
        file,
        downloadStatus: "LICENSED",
        downloadType: type,
        stratum: "exceptional",
        label: `${file.toLowerCase()}-adp-${facilityNumber}`,
      };
    }
    return {
      facilityNumber,
      file,
      downloadStatus: "LICENSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-active" : "active-licensed",
      label: `${file.toLowerCase()}-lic-${facilityNumber}`,
    };
  }

  return null;
}

export const CALIFORNIA_PHASE13_SAMPLE_NOTES = [
  "Disclosure-link sample target is N=120 (seed expanded from live DownloadStateData); still bounded; statewideCoverageClaimed remains false.",
  "Status-mapping sample target is N=48 and retains all five Phase 11/12 CLOSED→Application Withdrawn regression controls.",
  "Truncated leading-zero request 15601219 is a negative control for exact-ID disclosure matching.",
  "Download CLOSED empty-License-First-Date is a planning heuristic only — FacilityDetail is the official status evidence.",
  "Do not invent Closed* equivalence for Application Withdrawn; withdrawn remains ineligible.",
  "Harness supports resumable roster-wide audit of all 15,451 publication candidates; Phase 13 begins with the stratified sample only.",
] as const;

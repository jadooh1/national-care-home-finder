/**
 * Predefined additional batch for California Phase 14 disclosure audit and
 * strengthened status verification. Excludes Phase 13 already-probed IDs so
 * the batch is previously unverified. Adds geographic-region strata while
 * retaining RCFE/ARF, licensed/probationary, and ID-format diversity.
 * Five CLOSED→Application Withdrawn regression controls remain. Bounded —
 * never a statewide conclusion. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

/**
 * Official facility numbers already probed in the Phase 13 disclosure sample
 * (fixture-backed). Phase 14 incremental batch must exclude these.
 */
export const CALIFORNIA_PHASE14_PHASE13_PROBED_FACILITY_NUMBERS = [
  "100400070", "197610772", "565800841", "216801686", "198603605", "191222081",
  "191500146", "197802543", "421700369", "198320478", "374604407", "100403816",
  "361800222", "361800089", "198320080", "197609293", "198202438", "198603954",
  "366401835", "015601219", "374603279", "198603445", "079201014", "075600352",
  "011400493", "198603652", "306004560", "157203395", "342700440", "198601400",
  "216804480", "306006749", "306006799", "405802282", "374604911", "019201529",
  "95354", "374604731", "335530321", "345920133", "306004637", "216803982",
  "198320059", "331881659", "374604894", "415600658", "374602634", "197609847",
  "107209588", "306005447", "310303287", "198603444", "455002748", "331880740",
  "198603597", "197610393", "331880734", "547208809", "374604353", "197610407",
  "306005761", "306006359", "415601034", "306004629", "195850574", "306006759",
  "435202880", "435202942", "340318075", "306004628", "335530129", "198320312",
  "306005618", "157208817", "197611001", "486804068", "198200202", "198603338",
  "315002820", "405802289", "198603151", "198320104", "306002984", "306002985",
  "342700347", "197606568", "157209320", "415601227", "107200699", "372008410",
  "435202906", "197608661", "370808625", "198600145", "317005563", "342701003",
  "374601463", "030317773", "015601400", "019200521", "079201303", "079201688",
  "015600144", "079201614", "079200335", "079201020", "075601349", "401703699",
  "374603264", "486803861", "300606398", "075601399", "075601494", "197611118",
  "392701988",
] as const;

export const CALIFORNIA_PHASE14_PHASE13_PROBED_SET = new Set<string>(
  CALIFORNIA_PHASE14_PHASE13_PROBED_FACILITY_NUMBERS,
);

export const CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE = 120;
export const CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE = 36;

export type CaliforniaPhase14GeographicRegion =
  | "southern"
  | "central"
  | "bay-northern"
  | "unknown";

export type CaliforniaPhase14DisclosureSampleTarget = {
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
  geographicRegion: CaliforniaPhase14GeographicRegion;
  previouslyUnverified: true;
};

export type CaliforniaPhase14StatusSampleTarget = {
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
  regressionControl?: boolean;
  geographicRegion: CaliforniaPhase14GeographicRegion;
  previouslyUnverified: boolean;
};

export type CaliforniaPhase14DownloadRowLike = {
  facilityNumber: string;
  facilityStatus: string;
  facilityType: string;
  licenseFirstDate?: string;
  facilityZip?: string | null;
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityName?: string | null;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

const FACILITY_NUMBER = /^\d{8,9}$/;

export function classifyCaliforniaPhase14GeographicRegion(
  zip: string | null | undefined,
): CaliforniaPhase14GeographicRegion {
  const z = text(zip).replace(/\D/g, "");
  if (z.length < 1) return "unknown";
  const first = z[0];
  if (first === "9") {
    const second = z[1] ?? "";
    if (second === "0" || second === "1" || second === "2") return "southern";
    if (second === "3") return "central";
    if (second === "4" || second === "5" || second === "6") return "bay-northern";
  }
  return "unknown";
}

export function isCaliforniaPhase14PreviouslyUnverified(
  facilityNumber: string,
): boolean {
  return !CALIFORNIA_PHASE14_PHASE13_PROBED_SET.has(text(facilityNumber));
}

export const CALIFORNIA_PHASE14_DISCLOSURE_SEED: readonly CaliforniaPhase14DisclosureSampleTarget[] = [
  { facilityNumber: "345920416", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-345920416", publicationCandidate: true, geographicRegion: "central", previouslyUnverified: true },
  { facilityNumber: "365530238", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-365530238", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "365530117", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-365530117", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "347000691", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-347000691", publicationCandidate: true, geographicRegion: "central", previouslyUnverified: true },
  { facilityNumber: "079200787", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-licensed", label: "p14-coord-ex-079200787", publicationCandidate: true, geographicRegion: "bay-northern", previouslyUnverified: true },
  { facilityNumber: "331880803", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-331880803", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "547209622", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-547209622", publicationCandidate: true, geographicRegion: "central", previouslyUnverified: true },
  { facilityNumber: "435202953", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-435202953", publicationCandidate: true, geographicRegion: "bay-northern", previouslyUnverified: true },
  { facilityNumber: "197609365", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-197609365", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "019200734", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-licensed", label: "p14-coord-ex-019200734", publicationCandidate: true, geographicRegion: "bay-northern", previouslyUnverified: true },
  { facilityNumber: "197610054", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-197610054", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "374604082", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "rcfe-licensed", label: "p14-coord-ex-374604082", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "502701867", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "p14-coord-ex-502701867", publicationCandidate: true, geographicRegion: "central", previouslyUnverified: true },
  { facilityNumber: "198602394", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "p14-coord-ex-198602394", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "374604054", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "p14-coord-ex-374604054", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "198600856", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "p14-coord-ex-198600856", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "366425640", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "arf-licensed", label: "p14-coord-ex-366425640", publicationCandidate: true, geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "011405838", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "leading-zero-licensed", label: "p14-coord-ex-011405838", publicationCandidate: true, geographicRegion: "bay-northern", previouslyUnverified: true },
] as const;

export const CALIFORNIA_PHASE14_STATUS_SEED: readonly CaliforniaPhase14StatusSampleTarget[] = [
  { facilityNumber: "306006749", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p14-withdrawn-reg-1", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "306006799", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p14-withdrawn-reg-2", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "405802282", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "application-withdrawn", label: "p14-withdrawn-reg-3", regressionControl: true, geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "374604911", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "application-withdrawn", label: "p14-withdrawn-reg-4", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "019201529", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "leading-zero-withdrawn", label: "p14-withdrawn-reg-5-lz", regressionControl: true, geographicRegion: "bay-northern", previouslyUnverified: false },
  { facilityNumber: "345920416", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "active-licensed", label: "p14-status-rcfe-1", geographicRegion: "central", previouslyUnverified: true },
  { facilityNumber: "502701867", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "p14-status-arf-1", geographicRegion: "central", previouslyUnverified: true },
  { facilityNumber: "019200734", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "leading-zero-active", label: "p14-status-lz-1", geographicRegion: "bay-northern", previouslyUnverified: true },
  { facilityNumber: "011405838", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "leading-zero-active", label: "p14-status-lz-2", geographicRegion: "bay-northern", previouslyUnverified: true },
  { facilityNumber: "374604082", file: "RCFE", downloadStatus: "LICENSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "active-licensed", label: "p14-status-rcfe-2", geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "198600856", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "active-licensed", label: "p14-status-arf-2", geographicRegion: "southern", previouslyUnverified: true },
  { facilityNumber: "95354", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional", label: "p14-status-invalid", geographicRegion: "unknown", previouslyUnverified: false },
] as const;

export const CALIFORNIA_PHASE14_DISCLOSURE_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase14DisclosureSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "rcfe-licensed", targetCount: 40 },
  { stratum: "arf-licensed", targetCount: 25 },
  { stratum: "rcfe-ccrc", targetCount: 8 },
  { stratum: "probationary", targetCount: 6 },
  { stratum: "leading-zero-licensed", targetCount: 12 },
  { stratum: "leading-zero-probation", targetCount: 3 },
  { stratum: "closed", targetCount: 8 },
  { stratum: "leading-zero-closed", targetCount: 3 },
  { stratum: "pending", targetCount: 4 },
  { stratum: "withdrawn", targetCount: 4 },
  { stratum: "leading-zero-withdrawn", targetCount: 1 },
  { stratum: "exceptional-documented", targetCount: 2 },
] as const;

export const CALIFORNIA_PHASE14_STATUS_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase14StatusSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "active-licensed", targetCount: 12 },
  { stratum: "probationary", targetCount: 3 },
  { stratum: "leading-zero-active", targetCount: 4 },
  { stratum: "closed-star", targetCount: 5 },
  { stratum: "leading-zero-closed", targetCount: 2 },
  { stratum: "application-withdrawn", targetCount: 4 },
  { stratum: "leading-zero-withdrawn", targetCount: 1 },
  { stratum: "pending", targetCount: 3 },
  { stratum: "exceptional", targetCount: 2 },
] as const;

export const CALIFORNIA_PHASE14_GEOGRAPHIC_QUOTAS: readonly {
  region: CaliforniaPhase14GeographicRegion;
  minCount: number;
}[] = [
  { region: "southern", minCount: 30 },
  { region: "central", minCount: 15 },
  { region: "bay-northern", minCount: 25 },
] as const;

export function classifyCaliforniaPhase14DisclosureStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase14DownloadRowLike,
): CaliforniaPhase14DisclosureSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  if (!isCaliforniaPhase14PreviouslyUnverified(facilityNumber)) return null;
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase14GeographicRegion(row.facilityZip);

  if (!valid) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type || "(blank)",
      stratum: "exceptional-invalid",
      label: `invalid-${facilityNumber || "empty"}`,
      publicationCandidate: false,
      geographicRegion,
      previouslyUnverified: true,
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
      geographicRegion,
      previouslyUnverified: true,
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
      geographicRegion,
      previouslyUnverified: true,
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
        stratum: leadingZero ? "leading-zero-withdrawn" : "withdrawn",
        label: `${file.toLowerCase()}-withdrawn-plan-${facilityNumber}`,
        publicationCandidate: false,
        geographicRegion,
        previouslyUnverified: true,
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
      geographicRegion,
      previouslyUnverified: true,
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
        geographicRegion,
        previouslyUnverified: true,
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
        geographicRegion,
        previouslyUnverified: true,
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
        geographicRegion,
        previouslyUnverified: true,
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
      geographicRegion,
      previouslyUnverified: true,
    };
  }

  return null;
}

export function classifyCaliforniaPhase14StatusStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase14DownloadRowLike,
): CaliforniaPhase14StatusSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase14GeographicRegion(row.facilityZip);
  const isRegression = (CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS as readonly string[])
    .includes(facilityNumber);
  if (!isRegression && !isCaliforniaPhase14PreviouslyUnverified(facilityNumber)) {
    return null;
  }

  if (!valid) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type || "(blank)",
      stratum: "exceptional",
      label: `invalid-${facilityNumber || "empty"}`,
      geographicRegion,
      previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
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
      geographicRegion,
      previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
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
      geographicRegion,
      previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
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
        regressionControl: isRegression,
        geographicRegion,
        previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
      };
    }
    return {
      facilityNumber,
      file,
      downloadStatus: "CLOSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-closed" : "closed-star",
      label: `${file.toLowerCase()}-closed-${facilityNumber}`,
      geographicRegion,
      previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
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
        geographicRegion,
        previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
      };
    }
    return {
      facilityNumber,
      file,
      downloadStatus: "LICENSED",
      downloadType: type,
      stratum: leadingZero ? "leading-zero-active" : "active-licensed",
      label: `${file.toLowerCase()}-lic-${facilityNumber}`,
      geographicRegion,
      previouslyUnverified: isCaliforniaPhase14PreviouslyUnverified(facilityNumber),
    };
  }

  return null;
}

export function californiaPhase14SampleStableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function balanceCaliforniaPhase14GeographicDiversity<
  T extends { facilityNumber: string; geographicRegion: CaliforniaPhase14GeographicRegion; label?: string },
>(
  selected: readonly T[],
  pool: readonly T[],
  quotas: readonly { region: CaliforniaPhase14GeographicRegion; minCount: number }[] =
    CALIFORNIA_PHASE14_GEOGRAPHIC_QUOTAS,
): T[] {
  const out = [...selected];
  const selectedKeys = new Set(
    out.map(row => `${row.facilityNumber}::${row.label ?? ""}`),
  );

  for (const quota of quotas) {
    const have = out.filter(row => row.geographicRegion === quota.region).length;
    const need = Math.max(0, quota.minCount - have);
    if (need === 0) continue;
    const candidates = pool
      .filter(
        row =>
          row.geographicRegion === quota.region
          && !selectedKeys.has(`${row.facilityNumber}::${row.label ?? ""}`),
      )
      .slice()
      .sort((a, b) => {
        const ha = californiaPhase14SampleStableHash(
          `${a.facilityNumber}|${a.geographicRegion}|${a.label ?? ""}`,
        );
        const hb = californiaPhase14SampleStableHash(
          `${b.facilityNumber}|${b.geographicRegion}|${b.label ?? ""}`,
        );
        return ha - hb || a.facilityNumber.localeCompare(b.facilityNumber);
      });
    for (const row of candidates.slice(0, need)) {
      out.push(row);
      selectedKeys.add(`${row.facilityNumber}::${row.label ?? ""}`);
    }
  }
  return out;
}

export const CALIFORNIA_PHASE14_SAMPLE_NOTES = [
  "Phase 14 disclosure batch excludes Phase 13 probed facility numbers (previously unverified only).",
  "Geographic region bands (southern / central / bay-northern) diversify the sample; they are not publication claims.",
  "Disclosure target N=120 incremental; cumulative = Phase 13 baseline 116 + incremental.",
  "Status target N=36 retains all five CLOSED→Application Withdrawn regression controls as withdrawn-ineligible.",
  "statewideCoverageClaimed remains false until a dedicated roster-complete run is signed off.",
  "Do not invent Closed* equivalence; withdrawn remains ineligible.",
] as const;

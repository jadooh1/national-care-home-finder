/**
 * Predefined additional batch for California Phase 15 disclosure audit and
 * status-conflict follow-up. Excludes Phase 13 + Phase 14 already-probed IDs
 * so the batch is previously unverified. Retains geographic strata and the
 * five CLOSED→Application Withdrawn regression controls. Bounded — never a
 * statewide conclusion. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE15_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE15_STATUS_CONFLICT_ID = "502701867";

/**
 * Official facility numbers already probed in Phase 13 or Phase 14 disclosure
 * samples (fixture-backed). Phase 15 incremental batch must exclude these.
 */
export const CALIFORNIA_PHASE15_PRIOR_PROBED_FACILITY_NUMBERS = [
  "011400493", "011405838", "015600045", "015600144", "015601219", "015601400",
  "019200403", "019200521", "019200734", "019201182", "019201345", "019201518",
  "019201529", "019201537", "030317773", "045002459", "071441088", "075600352",
  "075600702", "075601349", "075601399", "075601411", "075601494", "079200335",
  "079200787", "079200811", "079200966", "079201014", "079201020", "079201303",
  "079201595", "079201614", "079201688", "092700445", "100400070", "100403816",
  "107200699", "107204175", "107206749", "107209588", "15601219", "157203395",
  "157208817", "157209320", "176800009", "191222081", "191500146", "191500219",
  "195850574", "197606568", "197607628", "197607893", "197608661", "197609293",
  "197609365", "197609740", "197609847", "197610054", "197610286", "197610339",
  "197610346", "197610393", "197610407", "197610571", "197610607", "197610626",
  "197610772", "197610836", "197611001", "197611014", "197611118", "197802543",
  "198200202", "198202438", "198203165", "198320059", "198320080", "198320104",
  "198320247", "198320312", "198320347", "198320478", "198320510", "198600145",
  "198600856", "198601188", "198601400", "198602093", "198602394", "198602563",
  "198602994", "198603151", "198603338", "198603444", "198603445", "198603597",
  "198603598", "198603605", "198603652", "198603954", "198604055", "216801686",
  "216803982", "216804212", "216804480", "236804207", "275201815", "300603988",
  "300606398", "306001351", "306002926", "306002984", "306002985", "306004560",
  "306004628", "306004629", "306004637", "306005447", "306005618", "306005761",
  "306005855", "306006242", "306006282", "306006359", "306006749", "306006759",
  "306006799", "310303287", "315002820", "315002883", "315920256", "317005394",
  "317005563", "331880671", "331880734", "331880740", "331880803", "331881280",
  "331881586", "331881659", "335530129", "335530285", "335530321", "340318075",
  "342700064", "342700347", "342700440", "342700925", "342701003", "342701504",
  "342702029", "345003017", "345920045", "345920084", "345920133", "345920416",
  "347000691", "347005580", "360902944", "361800089", "361800222", "361880893",
  "365530117", "365530141", "365530238", "365530434", "366400567", "366401835",
  "366412322", "366425640", "370808625", "372008410", "374601463", "374602369",
  "374602634", "374602825", "374603081", "374603264", "374603279", "374603510",
  "374604054", "374604082", "374604279", "374604353", "374604374", "374604407",
  "374604459", "374604731", "374604894", "374604911", "374605079", "385600432",
  "392701988", "397000014", "397002666", "401703699", "405802282", "405802289",
  "405850667", "410508359", "415600658", "415601034", "415601227", "421700369",
  "421700457", "435200964", "435201057", "435202880", "435202906", "435202942",
  "435202953", "435202972", "435203037", "435203064", "445202914", "455002689",
  "455002748", "486803861", "486804068", "496803657", "496803691", "502701255",
  "502701867", "515002791", "547208809", "547209622", "547209747", "565800841",
  "565800978", "565801690", "565802425", "95354",
] as const;

export const CALIFORNIA_PHASE15_PRIOR_PROBED_SET = new Set<string>(
  CALIFORNIA_PHASE15_PRIOR_PROBED_FACILITY_NUMBERS,
);

export const CALIFORNIA_PHASE15_DISCLOSURE_SAMPLE_TARGET_SIZE = 120;
export const CALIFORNIA_PHASE15_STATUS_SAMPLE_TARGET_SIZE = 36;

export type CaliforniaPhase15GeographicRegion =
  | "southern"
  | "central"
  | "bay-northern"
  | "unknown";

export type CaliforniaPhase15DisclosureSampleTarget = {
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
    | "truncated-leading-zero-request"
    | "status-conflict";
  label: string;
  requestFacilityNumber?: string;
  publicationCandidate: boolean;
  geographicRegion: CaliforniaPhase15GeographicRegion;
  previouslyUnverified: true;
};

export type CaliforniaPhase15StatusSampleTarget = {
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
    | "leading-zero-withdrawn"
    | "status-conflict";
  label: string;
  regressionControl?: boolean;
  geographicRegion: CaliforniaPhase15GeographicRegion;
  previouslyUnverified: boolean;
};

export type CaliforniaPhase15DownloadRowLike = {
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

export function classifyCaliforniaPhase15GeographicRegion(
  zip: string | null | undefined,
): CaliforniaPhase15GeographicRegion {
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

export function isCaliforniaPhase15PreviouslyUnverified(
  facilityNumber: string,
): boolean {
  return !CALIFORNIA_PHASE15_PRIOR_PROBED_SET.has(text(facilityNumber));
}

/**
 * Disclosure seed is empty for Phase 15 — the live stratified planner fills
 * quotas from previously-unverified DownloadStateData rows. Avoid hard-coded
 * IDs that may not exist in the current roster.
 */
export const CALIFORNIA_PHASE15_DISCLOSURE_SEED: readonly CaliforniaPhase15DisclosureSampleTarget[] = [] as const;

export const CALIFORNIA_PHASE15_STATUS_SEED: readonly CaliforniaPhase15StatusSampleTarget[] = [
  { facilityNumber: "306006749", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p15-withdrawn-reg-1", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "306006799", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p15-withdrawn-reg-2", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "405802282", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "application-withdrawn", label: "p15-withdrawn-reg-3", regressionControl: true, geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "374604911", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "application-withdrawn", label: "p15-withdrawn-reg-4", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "019201529", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "leading-zero-withdrawn", label: "p15-withdrawn-reg-5-lz", regressionControl: true, geographicRegion: "bay-northern", previouslyUnverified: false },
  { facilityNumber: "502701867", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "status-conflict", label: "p15-status-conflict-502701867", geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "95354", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional", label: "p15-status-invalid", geographicRegion: "unknown", previouslyUnverified: false },
] as const;

export const CALIFORNIA_PHASE15_DISCLOSURE_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase15DisclosureSampleTarget["stratum"];
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

export const CALIFORNIA_PHASE15_STATUS_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase15StatusSampleTarget["stratum"];
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
  { stratum: "status-conflict", targetCount: 1 },
] as const;

export const CALIFORNIA_PHASE15_GEOGRAPHIC_QUOTAS: readonly {
  region: CaliforniaPhase15GeographicRegion;
  minCount: number;
}[] = [
  { region: "southern", minCount: 30 },
  { region: "central", minCount: 15 },
  { region: "bay-northern", minCount: 25 },
] as const;

export function classifyCaliforniaPhase15DisclosureStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase15DownloadRowLike,
): CaliforniaPhase15DisclosureSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  if (!isCaliforniaPhase15PreviouslyUnverified(facilityNumber)) return null;
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase15GeographicRegion(row.facilityZip);

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

export function classifyCaliforniaPhase15StatusStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase15DownloadRowLike,
): CaliforniaPhase15StatusSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase15GeographicRegion(row.facilityZip);
  const isRegression = (CALIFORNIA_PHASE15_WITHDRAWN_REGRESSION_IDS as readonly string[])
    .includes(facilityNumber);
  const isConflict = facilityNumber === CALIFORNIA_PHASE15_STATUS_CONFLICT_ID;
  if (!isRegression && !isConflict && !isCaliforniaPhase15PreviouslyUnverified(facilityNumber)) {
    return null;
  }

  if (isConflict) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type,
      stratum: "status-conflict",
      label: `p15-status-conflict-${facilityNumber}`,
      geographicRegion,
      previouslyUnverified: false,
    };
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
      previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
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
        previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
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
        previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase15PreviouslyUnverified(facilityNumber),
    };
  }

  return null;
}

export function californiaPhase15SampleStableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function balanceCaliforniaPhase15GeographicDiversity<
  T extends { facilityNumber: string; geographicRegion: CaliforniaPhase15GeographicRegion; label?: string },
>(
  selected: readonly T[],
  pool: readonly T[],
  quotas: readonly { region: CaliforniaPhase15GeographicRegion; minCount: number }[] =
    CALIFORNIA_PHASE15_GEOGRAPHIC_QUOTAS,
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
        const ha = californiaPhase15SampleStableHash(
          `${a.facilityNumber}|${a.geographicRegion}|${a.label ?? ""}`,
        );
        const hb = californiaPhase15SampleStableHash(
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

export const CALIFORNIA_PHASE15_SAMPLE_NOTES = [
  "Phase 15 disclosure batch excludes Phase 13 + Phase 14 probed facility numbers (previously unverified only).",
  "Geographic region bands (southern / central / bay-northern) diversify the sample; they are not publication claims.",
  "Disclosure target N=120 incremental; cumulative = Phase 14 cumulative 233 + incremental.",
  "Status sample retains five CLOSED→Application Withdrawn regression controls and the 502701867 conflict case.",
  "statewideCoverageClaimed remains false until a dedicated roster-complete run is signed off.",
  "Do not invent Closed* equivalence; withdrawn remains ineligible; conflict remains unknown-ineligible.",
] as const;

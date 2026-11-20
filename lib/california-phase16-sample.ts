/**
 * Predefined additional batch for California Phase 16 disclosure audit and
 * automated exception detection. Excludes Phase 13–15 already-probed IDs
 * so the batch is previously unverified. Retains geographic strata and the
 * five CLOSED→Application Withdrawn regression controls. Bounded — never a
 * statewide conclusion. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE16_STATUS_CONFLICT_ID = "502701867";

/**
 * Official facility numbers already probed in Phase 13, 14, or 15 disclosure /
 * status samples (fixture-backed). Phase 16 incremental batch must exclude these.
 */
export const CALIFORNIA_PHASE16_PRIOR_PROBED_FACILITY_NUMBERS = [
  "011400493", "011405838", "011441026", "015600045", "015600144", "015600912", "015601187",
  "015601219", "015601400", "019200403", "019200487", "019200509", "019200521", "019200734",
  "019200753", "019200900", "019201132", "019201144", "019201182", "019201345", "019201483",
  "019201518", "019201529", "019201537", "019201663", "030317773", "045002459", "045002485",
  "045003003", "071441088", "075600352", "075600395", "075600702", "075601349", "075601399",
  "075601411", "075601494", "079200335", "079200363", "079200787", "079200811", "079200966",
  "079201014", "079201020", "079201090", "079201194", "079201214", "079201279", "079201303",
  "079201595", "079201614", "079201688", "092700445", "097005553", "100400070", "100403816",
  "100406684", "107200699", "107204175", "107206749", "107206952", "107208895", "107209588",
  "107209643", "15601219", "157200526", "157203139", "157203395", "157208817", "157209320",
  "176800009", "191222081", "191222261", "191290882", "191500146", "191500219", "191500496",
  "195850560", "195850574", "195850597", "197604814", "197606568", "197607567", "197607628",
  "197607893", "197608661", "197609098", "197609293", "197609365", "197609740", "197609847",
  "197610002", "197610054", "197610146", "197610279", "197610286", "197610311", "197610339",
  "197610346", "197610390", "197610393", "197610407", "197610473", "197610512", "197610571",
  "197610607", "197610626", "197610632", "197610637", "197610642", "197610722", "197610772",
  "197610836", "197611001", "197611014", "197611099", "197611118", "197611137", "197802543",
  "197803185", "198200202", "198202438", "198203165", "198320059", "198320080", "198320104",
  "198320247", "198320311", "198320312", "198320347", "198320441", "198320476", "198320478",
  "198320510", "198320651", "198320736", "198600142", "198600145", "198600856", "198601087",
  "198601188", "198601400", "198601662", "198602093", "198602390", "198602394", "198602546",
  "198602563", "198602630", "198602994", "198603151", "198603293", "198603338", "198603444",
  "198603445", "198603597", "198603598", "198603605", "198603652", "198603704", "198603754",
  "198603813", "198603954", "198604055", "216801686", "216803761", "216803982", "216804212",
  "216804480", "236804207", "275201815", "275202839", "277209241", "286801880", "286804316",
  "300603988", "300605448", "300606398", "300606862", "306001351", "306002685", "306002926",
  "306002984", "306002985", "306004443", "306004478", "306004560", "306004628", "306004629",
  "306004637", "306005250", "306005447", "306005618", "306005761", "306005855", "306005932",
  "306005949", "306006242", "306006282", "306006359", "306006749", "306006759", "306006799",
  "306006890", "306006928", "310303287", "315001863", "315002820", "315002883", "315920095",
  "315920110", "315920256", "315920387", "317005394", "317005563", "331880671", "331880722",
  "331880734", "331880740", "331880803", "331881280", "331881308", "331881388", "331881565",
  "331881586", "331881659", "331881693", "335530129", "335530285", "335530321", "336408879",
  "336425055", "340318075", "342700064", "342700347", "342700440", "342700441", "342700472",
  "342700587", "342700683", "342700690", "342700722", "342700925", "342701003", "342701175",
  "342701407", "342701504", "342702029", "345003017", "345920045", "345920084", "345920133",
  "345920140", "345920167", "345920178", "345920416", "347000691", "347004963", "347005580",
  "360902944", "361800089", "361800222", "361880893", "365530117", "365530118", "365530141",
  "365530234", "365530238", "365530332", "365530434", "366400567", "366401835", "366410284",
  "366412322", "366425640", "366426683", "370808625", "372008410", "374601232", "374601463",
  "374602369", "374602634", "374602825", "374603081", "374603264", "374603279", "374603510",
  "374603600", "374604054", "374604082", "374604279", "374604353", "374604374", "374604407",
  "374604459", "374604538", "374604677", "374604731", "374604804", "374604894", "374604911",
  "374605079", "385600003", "385600432", "392700885", "392701988", "397000014", "397002666",
  "397003262", "397005659", "401703699", "405802282", "405802289", "405850094", "405850667",
  "410508359", "410508648", "415600658", "415600900", "415601034", "415601101", "415601227",
  "421700369", "421700457", "425800609", "435200941", "435200964", "435201057", "435201995",
  "435202602", "435202880", "435202906", "435202922", "435202942", "435202953", "435202972",
  "435203037", "435203064", "445202914", "455002689", "455002737", "455002748", "486801381",
  "486803861", "486804068", "496803049", "496803259", "496803657", "496803691", "500301453",
  "502701255", "502701867", "515002791", "525002809", "547208809", "547209166", "547209487",
  "547209622", "547209747", "565800734", "565800841", "565800978", "565801690", "565802425",
  "565850168", "570316115", "95354",
] as const;

export const CALIFORNIA_PHASE16_PRIOR_PROBED_SET = new Set<string>(
  CALIFORNIA_PHASE16_PRIOR_PROBED_FACILITY_NUMBERS,
);

export const CALIFORNIA_PHASE16_DISCLOSURE_SAMPLE_TARGET_SIZE = 120;
export const CALIFORNIA_PHASE16_STATUS_SAMPLE_TARGET_SIZE = 36;
/** Download-only statewide scan cap for LICENSED-missing-date exceptions. */
export const CALIFORNIA_PHASE16_LICENSED_MISSING_DATE_SCAN_CAP = 500;

export type CaliforniaPhase16GeographicRegion =
  | "southern"
  | "central"
  | "bay-northern"
  | "unknown";

export type CaliforniaPhase16DisclosureSampleTarget = {
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
  geographicRegion: CaliforniaPhase16GeographicRegion;
  previouslyUnverified: true;
};

export type CaliforniaPhase16StatusSampleTarget = {
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
    | "status-conflict"
    | "licensed-missing-date";
  label: string;
  regressionControl?: boolean;
  geographicRegion: CaliforniaPhase16GeographicRegion;
  previouslyUnverified: boolean;
};

export type CaliforniaPhase16DownloadRowLike = {
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

export function classifyCaliforniaPhase16GeographicRegion(
  zip: string | null | undefined,
): CaliforniaPhase16GeographicRegion {
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

export function isCaliforniaPhase16PreviouslyUnverified(
  facilityNumber: string,
): boolean {
  return !CALIFORNIA_PHASE16_PRIOR_PROBED_SET.has(text(facilityNumber));
}

/**
 * Disclosure seed is empty for Phase 16 — the live stratified planner fills
 * quotas from previously-unverified DownloadStateData rows. Avoid hard-coded
 * IDs that may not exist in the current roster.
 */
export const CALIFORNIA_PHASE16_DISCLOSURE_SEED: readonly CaliforniaPhase16DisclosureSampleTarget[] = [] as const;

export const CALIFORNIA_PHASE16_STATUS_SEED: readonly CaliforniaPhase16StatusSampleTarget[] = [
  { facilityNumber: "306006749", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p16-withdrawn-reg-1", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "306006799", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p16-withdrawn-reg-2", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "405802282", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "application-withdrawn", label: "p16-withdrawn-reg-3", regressionControl: true, geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "374604911", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "application-withdrawn", label: "p16-withdrawn-reg-4", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "019201529", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "leading-zero-withdrawn", label: "p16-withdrawn-reg-5-lz", regressionControl: true, geographicRegion: "bay-northern", previouslyUnverified: false },
  { facilityNumber: "502701867", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "status-conflict", label: "p16-status-conflict-502701867", geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "95354", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional", label: "p16-status-invalid", geographicRegion: "unknown", previouslyUnverified: false },
] as const;

export const CALIFORNIA_PHASE16_DISCLOSURE_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase16DisclosureSampleTarget["stratum"];
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

export const CALIFORNIA_PHASE16_STATUS_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase16StatusSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "active-licensed", targetCount: 10 },
  { stratum: "licensed-missing-date", targetCount: 4 },
  { stratum: "probationary", targetCount: 3 },
  { stratum: "leading-zero-active", targetCount: 4 },
  { stratum: "closed-star", targetCount: 4 },
  { stratum: "leading-zero-closed", targetCount: 2 },
  { stratum: "application-withdrawn", targetCount: 4 },
  { stratum: "leading-zero-withdrawn", targetCount: 1 },
  { stratum: "pending", targetCount: 2 },
  { stratum: "exceptional", targetCount: 1 },
  { stratum: "status-conflict", targetCount: 1 },
] as const;

export const CALIFORNIA_PHASE16_GEOGRAPHIC_QUOTAS: readonly {
  region: CaliforniaPhase16GeographicRegion;
  minCount: number;
}[] = [
  { region: "southern", minCount: 30 },
  { region: "central", minCount: 15 },
  { region: "bay-northern", minCount: 25 },
] as const;

export function classifyCaliforniaPhase16DisclosureStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase16DownloadRowLike,
): CaliforniaPhase16DisclosureSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  if (!isCaliforniaPhase16PreviouslyUnverified(facilityNumber)) return null;
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase16GeographicRegion(row.facilityZip);

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

export function classifyCaliforniaPhase16StatusStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase16DownloadRowLike,
): CaliforniaPhase16StatusSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase16GeographicRegion(row.facilityZip);
  const isRegression = (CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS as readonly string[])
    .includes(facilityNumber);
  const isConflict = facilityNumber === CALIFORNIA_PHASE16_STATUS_CONFLICT_ID;
  if (!isRegression && !isConflict && !isCaliforniaPhase16PreviouslyUnverified(facilityNumber)) {
    return null;
  }

  if (isConflict) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type,
      stratum: "status-conflict",
      label: `p16-status-conflict-${facilityNumber}`,
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
      previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
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
        previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
    };
  }

  if (status === "LICENSED") {
    if (text(row.licenseFirstDate) === "") {
      return {
        facilityNumber,
        file,
        downloadStatus: "LICENSED",
        downloadType: type,
        stratum: "licensed-missing-date",
        label: `${file.toLowerCase()}-lic-missing-date-${facilityNumber}`,
        geographicRegion,
        previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
      };
    }
    if (typeUpper.includes("ADULT DAY PROGRAM")) {
      return {
        facilityNumber,
        file,
        downloadStatus: "LICENSED",
        downloadType: type,
        stratum: "exceptional",
        label: `${file.toLowerCase()}-adp-${facilityNumber}`,
        geographicRegion,
        previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase16PreviouslyUnverified(facilityNumber),
    };
  }

  return null;
}

export function californiaPhase16SampleStableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function balanceCaliforniaPhase16GeographicDiversity<
  T extends { facilityNumber: string; geographicRegion: CaliforniaPhase16GeographicRegion; label?: string },
>(
  selected: readonly T[],
  pool: readonly T[],
  quotas: readonly { region: CaliforniaPhase16GeographicRegion; minCount: number }[] =
    CALIFORNIA_PHASE16_GEOGRAPHIC_QUOTAS,
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
        const ha = californiaPhase16SampleStableHash(
          `${a.facilityNumber}|${a.geographicRegion}|${a.label ?? ""}`,
        );
        const hb = californiaPhase16SampleStableHash(
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

export const CALIFORNIA_PHASE16_SAMPLE_NOTES = [
  "Phase 16 disclosure batch excludes Phase 13 + Phase 14 + Phase 15 probed facility numbers (previously unverified only).",
  "Geographic region bands (southern / central / bay-northern) diversify the sample; they are not publication claims.",
  "Disclosure target N=120 incremental; cumulative = Phase 15 cumulative 347 + incremental.",
  "Automated exception detection flags unsafe ID/status/date/disclosure/source-change conditions deterministically.",
  "Do not resend CDSS clarification email.",
  "Status sample retains five CLOSED→Application Withdrawn regression controls and the 502701867 conflict case.",
  "statewideCoverageClaimed remains false until a dedicated roster-complete run is signed off.",
  "Do not invent Closed* equivalence; withdrawn remains ineligible; conflict remains unknown-ineligible.",
] as const;

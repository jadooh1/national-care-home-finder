/**
 * California Phase 19 — limited verification pilot sample planner.
 * Excludes Phase 13–16 already-probed disclosure IDs (baseline 462) so the
 * batch is previously unverified. Cap ≤250 unique facilities. Uses Phase 13
 * harness defaults. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE19_WITHDRAWN_REGRESSION_IDS = [
  "306006749",
  "306006799",
  "405802282",
  "374604911",
  "019201529",
] as const;

export const CALIFORNIA_PHASE19_STATUS_CONFLICT_ID = "502701867";

/**
 * Official facility numbers already probed in Phase 13–16 disclosure /
 * status samples (fixture-backed + Phase 16 prior set). Phase 19 pilot
 * must exclude these to avoid duplicate CDSS verification.
 */
export const CALIFORNIA_PHASE19_PRIOR_PROBED_FACILITY_NUMBERS = [
  "95354", "15601219", "011400493", "011405838", "011441026", "015600045", "015600144",
  "015600912", "015601187", "015601219", "015601400", "019200403", "019200487", "019200509",
  "019200521", "019200688", "019200734", "019200753", "019200900", "019201132", "019201144",
  "019201182", "019201183", "019201345", "019201428", "019201483", "019201518", "019201529",
  "019201537", "019201663", "030317773", "041373048", "045002168", "045002459", "045002485",
  "045003003", "045920267", "057001380", "071441088", "075600352", "075600395", "075600702",
  "075600926", "075601314", "075601349", "075601399", "075601411", "075601494", "075601509",
  "079200181", "079200335", "079200363", "079200787", "079200811", "079200856", "079200966",
  "079201014", "079201020", "079201037", "079201090", "079201194", "079201214", "079201227",
  "079201279", "079201303", "079201342", "079201595", "079201614", "079201688", "079201698",
  "092700445", "095002858", "097005553", "100400070", "100403816", "100405365", "100406684",
  "107200699", "107204175", "107206749", "107206952", "107208895", "107209588", "107209643",
  "157200526", "157203139", "157203395", "157206725", "157206821", "157208817", "157208926",
  "157209320", "176800009", "191222081", "191222261", "191290882", "191500146", "191500219",
  "191500496", "195850546", "195850560", "195850574", "195850597", "195850848", "197604814",
  "197606568", "197607106", "197607567", "197607628", "197607893", "197608379", "197608661",
  "197609009", "197609098", "197609293", "197609338", "197609365", "197609740", "197609812",
  "197609847", "197610002", "197610054", "197610146", "197610279", "197610282", "197610286",
  "197610311", "197610339", "197610346", "197610351", "197610390", "197610393", "197610407",
  "197610473", "197610512", "197610571", "197610607", "197610626", "197610632", "197610637",
  "197610642", "197610722", "197610772", "197610836", "197611001", "197611014", "197611099",
  "197611118", "197611137", "197802312", "197802543", "197803185", "198200202", "198202438",
  "198203165", "198203965", "198320059", "198320080", "198320104", "198320247", "198320311",
  "198320312", "198320318", "198320347", "198320441", "198320476", "198320478", "198320510",
  "198320651", "198320662", "198320687", "198320736", "198600142", "198600145", "198600856",
  "198601087", "198601188", "198601400", "198601662", "198601877", "198602093", "198602390",
  "198602394", "198602546", "198602563", "198602630", "198602984", "198602994", "198603151",
  "198603293", "198603338", "198603444", "198603445", "198603456", "198603597", "198603598",
  "198603605", "198603652", "198603704", "198603730", "198603754", "198603813", "198603857",
  "198603954", "198603993", "198604055", "216801686", "216803761", "216803982", "216804051",
  "216804212", "216804480", "236804207", "275200236", "275201286", "275201815", "275202839",
  "277209241", "286801070", "286801880", "286804316", "300603988", "300605448", "300606398",
  "300606862", "306000889", "306001351", "306001920", "306002685", "306002926", "306002984",
  "306002985", "306003424", "306003822", "306004443", "306004478", "306004560", "306004628",
  "306004629", "306004637", "306005173", "306005213", "306005250", "306005447", "306005618",
  "306005761", "306005855", "306005932", "306005949", "306006242", "306006282", "306006359",
  "306006421", "306006595", "306006681", "306006749", "306006759", "306006799", "306006890",
  "306006928", "310302384", "310303287", "315001863", "315002820", "315002883", "315920095",
  "315920110", "315920256", "315920387", "315920419", "317005394", "317005563", "330909355",
  "331800156", "331880671", "331880722", "331880734", "331880740", "331880803", "331881280",
  "331881308", "331881388", "331881565", "331881586", "331881659", "331881693", "331881760",
  "335530124", "335530129", "335530163", "335530285", "335530321", "335530464", "336402944",
  "336408879", "336425055", "336426125", "340318075", "342700064", "342700333", "342700347",
  "342700440", "342700441", "342700472", "342700587", "342700683", "342700690", "342700722",
  "342700925", "342701003", "342701152", "342701175", "342701407", "342701504", "342702029",
  "345003017", "345920045", "345920084", "345920102", "345920131", "345920133", "345920140",
  "345920167", "345920178", "345920416", "345920446", "347000691", "347004258", "347004963",
  "347005580", "355202603", "355202778", "360902944", "361800089", "361800222", "361880893",
  "365530084", "365530117", "365530118", "365530141", "365530183", "365530210", "365530234",
  "365530238", "365530332", "365530434", "365530518", "366400567", "366401835", "366403892",
  "366410284", "366411220", "366412322", "366425640", "366426683", "370808625", "372008410",
  "374601232", "374601463", "374602117", "374602369", "374602634", "374602825", "374603081",
  "374603264", "374603279", "374603510", "374603600", "374603721", "374604054", "374604082",
  "374604279", "374604353", "374604374", "374604407", "374604459", "374604538", "374604677",
  "374604709", "374604731", "374604757", "374604804", "374604842", "374604894", "374604898",
  "374604911", "374605079", "380540292", "385600003", "385600397", "385600432", "390314809",
  "390317879", "392700885", "392701988", "397000014", "397002666", "397003262", "397005659",
  "401703699", "405802282", "405802289", "405850094", "405850667", "410508359", "410508648",
  "415600658", "415600900", "415601034", "415601101", "415601227", "419210045", "421700369",
  "421700457", "425800283", "425800609", "425850219", "425850568", "435200308", "435200941",
  "435200964", "435201057", "435201995", "435202531", "435202535", "435202602", "435202743",
  "435202880", "435202906", "435202922", "435202942", "435202953", "435202972", "435203037",
  "435203064", "435294315", "435294340", "445202914", "455002442", "455002689", "455002737",
  "455002748", "455920406", "486801381", "486801953", "486803635", "486803861", "486804046",
  "486804068", "496802077", "496803049", "496803259", "496803657", "496803691", "496803751",
  "496803820", "500301453", "502700532", "502701255", "502701867", "507004675", "515002791",
  "515002949", "525002755", "525002809", "547208780", "547208809", "547209166", "547209252",
  "547209487", "547209622", "547209747", "561703412", "565800734", "565800841", "565800978",
  "565801690", "565802425", "565850086", "565850168", "565850400", "570316115",
] as const;

export const CALIFORNIA_PHASE19_PRIOR_PROBED_SET = new Set<string>(
  CALIFORNIA_PHASE19_PRIOR_PROBED_FACILITY_NUMBERS,
);

/** Baseline disclosure samples from Phases 13–16. */
export const CALIFORNIA_PHASE19_PHASE16_CUMULATIVE_VERIFIED_COUNT = 462;

/** Approved pilot unique-facility cap. */
export const CALIFORNIA_PHASE19_PILOT_FACILITY_CAP = 250;

export const CALIFORNIA_PHASE19_DISCLOSURE_SAMPLE_TARGET_SIZE = 250;
export const CALIFORNIA_PHASE19_STATUS_SAMPLE_TARGET_SIZE = 48;

export type CaliforniaPhase19GeographicRegion =
  | "southern"
  | "central"
  | "bay-northern"
  | "unknown";

export type CaliforniaPhase19DisclosureSampleTarget = {
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
  geographicRegion: CaliforniaPhase19GeographicRegion;
  previouslyUnverified: true;
};

export type CaliforniaPhase19StatusSampleTarget = {
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
  geographicRegion: CaliforniaPhase19GeographicRegion;
  previouslyUnverified: boolean;
};

export type CaliforniaPhase19DownloadRowLike = {
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

export function classifyCaliforniaPhase19GeographicRegion(
  zip: string | null | undefined,
): CaliforniaPhase19GeographicRegion {
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

export function isCaliforniaPhase19PreviouslyUnverified(
  facilityNumber: string,
): boolean {
  return !CALIFORNIA_PHASE19_PRIOR_PROBED_SET.has(text(facilityNumber));
}

export const CALIFORNIA_PHASE19_DISCLOSURE_SEED: readonly CaliforniaPhase19DisclosureSampleTarget[] = [] as const;

export const CALIFORNIA_PHASE19_STATUS_SEED: readonly CaliforniaPhase19StatusSampleTarget[] = [
  { facilityNumber: "306006749", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p19-withdrawn-reg-1", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "306006799", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "application-withdrawn", label: "p19-withdrawn-reg-2", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "405802282", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY", stratum: "application-withdrawn", label: "p19-withdrawn-reg-3", regressionControl: true, geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "374604911", file: "RCFE", downloadStatus: "CLOSED", downloadType: "RESIDENTIAL CARE ELDERLY", stratum: "application-withdrawn", label: "p19-withdrawn-reg-4", regressionControl: true, geographicRegion: "southern", previouslyUnverified: false },
  { facilityNumber: "019201529", file: "ARF", downloadStatus: "CLOSED", downloadType: "ADULT DAY PROGRAM", stratum: "leading-zero-withdrawn", label: "p19-withdrawn-reg-5-lz", regressionControl: true, geographicRegion: "bay-northern", previouslyUnverified: false },
  { facilityNumber: "502701867", file: "ARF", downloadStatus: "LICENSED", downloadType: "ADULT RESIDENTIAL", stratum: "status-conflict", label: "p19-status-conflict-502701867", geographicRegion: "central", previouslyUnverified: false },
  { facilityNumber: "95354", file: "ARF", downloadStatus: "PENDING", downloadType: "ADULT RESIDENTIAL", stratum: "exceptional", label: "p19-status-invalid", geographicRegion: "unknown", previouslyUnverified: false },
] as const;

/** Stratified quotas summing to the ≤250 pilot cap (publication-candidate heavy). */
export const CALIFORNIA_PHASE19_DISCLOSURE_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase19DisclosureSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "rcfe-licensed", targetCount: 90 },
  { stratum: "arf-licensed", targetCount: 55 },
  { stratum: "rcfe-ccrc", targetCount: 12 },
  { stratum: "probationary", targetCount: 10 },
  { stratum: "leading-zero-licensed", targetCount: 25 },
  { stratum: "leading-zero-probation", targetCount: 4 },
  { stratum: "closed", targetCount: 16 },
  { stratum: "leading-zero-closed", targetCount: 4 },
  { stratum: "pending", targetCount: 8 },
  { stratum: "withdrawn", targetCount: 8 },
  { stratum: "leading-zero-withdrawn", targetCount: 2 },
  { stratum: "exceptional-documented", targetCount: 4 },
] as const;

export const CALIFORNIA_PHASE19_STATUS_STRATUM_QUOTAS: readonly {
  stratum: CaliforniaPhase19StatusSampleTarget["stratum"];
  targetCount: number;
}[] = [
  { stratum: "active-licensed", targetCount: 16 },
  { stratum: "licensed-missing-date", targetCount: 4 },
  { stratum: "probationary", targetCount: 4 },
  { stratum: "leading-zero-active", targetCount: 6 },
  { stratum: "closed-star", targetCount: 4 },
  { stratum: "leading-zero-closed", targetCount: 2 },
  { stratum: "application-withdrawn", targetCount: 4 },
  { stratum: "leading-zero-withdrawn", targetCount: 1 },
  { stratum: "pending", targetCount: 2 },
  { stratum: "exceptional", targetCount: 1 },
  { stratum: "status-conflict", targetCount: 1 },
] as const;

export const CALIFORNIA_PHASE19_GEOGRAPHIC_QUOTAS: readonly {
  region: CaliforniaPhase19GeographicRegion;
  minCount: number;
}[] = [
  { region: "southern", minCount: 70 },
  { region: "central", minCount: 35 },
  { region: "bay-northern", minCount: 55 },
] as const;

export function classifyCaliforniaPhase19DisclosureStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase19DownloadRowLike,
): CaliforniaPhase19DisclosureSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  if (!isCaliforniaPhase19PreviouslyUnverified(facilityNumber)) return null;
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase19GeographicRegion(row.facilityZip);

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

export function classifyCaliforniaPhase19StatusStratum(
  file: "RCFE" | "ARF",
  row: CaliforniaPhase19DownloadRowLike,
): CaliforniaPhase19StatusSampleTarget | null {
  const facilityNumber = text(row.facilityNumber);
  const status = upper(row.facilityStatus);
  const type = text(row.facilityType);
  const typeUpper = upper(type);
  const leadingZero = facilityNumber.startsWith("0");
  const valid = FACILITY_NUMBER.test(facilityNumber);
  const geographicRegion = classifyCaliforniaPhase19GeographicRegion(row.facilityZip);
  const isRegression = (CALIFORNIA_PHASE19_WITHDRAWN_REGRESSION_IDS as readonly string[])
    .includes(facilityNumber);
  const isConflict = facilityNumber === CALIFORNIA_PHASE19_STATUS_CONFLICT_ID;
  if (!isRegression && !isConflict && !isCaliforniaPhase19PreviouslyUnverified(facilityNumber)) {
    return null;
  }

  if (isConflict) {
    return {
      facilityNumber,
      file,
      downloadStatus: status || row.facilityStatus,
      downloadType: type,
      stratum: "status-conflict",
      label: `p19-status-conflict-${facilityNumber}`,
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
      previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
        previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
        previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
        previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
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
      previouslyUnverified: isCaliforniaPhase19PreviouslyUnverified(facilityNumber),
    };
  }

  return null;
}

export function californiaPhase19SampleStableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function balanceCaliforniaPhase19GeographicDiversity<
  T extends { facilityNumber: string; geographicRegion: CaliforniaPhase19GeographicRegion; label?: string },
>(
  selected: readonly T[],
  pool: readonly T[],
  quotas: readonly { region: CaliforniaPhase19GeographicRegion; minCount: number }[] =
    CALIFORNIA_PHASE19_GEOGRAPHIC_QUOTAS,
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
        const ha = californiaPhase19SampleStableHash(
          `${a.facilityNumber}|${a.geographicRegion}|${a.label ?? ""}`,
        );
        const hb = californiaPhase19SampleStableHash(
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

export const CALIFORNIA_PHASE19_SAMPLE_NOTES = [
  "Phase 19 pilot excludes Phase 13–16 probed facility numbers (previously unverified only; baseline 462).",
  "Pilot unique-facility cap is ≤250 under Phase 13 harness (concurrency=1, minIntervalMs≥450).",
  "Geographic region bands diversify the sample; they are not publication claims.",
  "Exclusion policy is adopted for offline classification only — not activated in app/DB.",
  "Do not resend CDSS clarification email.",
  "Do not start staged statewide without separate approval.",
  "statewideCoverageClaimed remains false until a dedicated roster-complete run is signed off.",
  "Publication gate stays BLOCKED; California remains unpublished.",
] as const;

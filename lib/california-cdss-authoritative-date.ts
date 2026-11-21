/**
 * California CDSS Transparency CSV authoritative as-of date (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * CDSS confirmed that the date embedded in the official Transparency
 * DownloadStateData Content-Disposition filename/header is the dataset's
 * as-of date. This module validates that stamp strictly for RCFE and ARF
 * and adopts it only under that confirmation + concordance rules.
 *
 * Does not publish California, write Supabase, activate exclusions, or
 * accept ArcGIS clocks / CHHS file_date / FAQ cadence as substitutes.
 */

export const CALIFORNIA_CDSS_ASOF_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_CDSS_ASOF_BASE_COMMIT =
  "d10b287605c2a91116feea3c2aaa4c8b5981d755";

/** Human/CDSS confirmation that filename/header MMDDYYYY is the dataset as-of date. */
export const CALIFORNIA_CDSS_FILENAME_HEADER_IS_ASOF_CONFIRMED = true as const;

export const CALIFORNIA_CDSS_ASOF_SOURCE = {
  downloadApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
  downloadPage:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata",
  rcfeId: "ResidentialElderCareFacility",
  arfId: "AdultResidentialFacilities",
  confirmation:
    "CDSS confirmed the Transparency CSV Content-Disposition filename/header date is the dataset as-of date.",
  appliesTo: "downloadstatedata-transparency-csv" as const,
  doesNotApplyTo: [
    "arcgis-feature-server-edit-clocks",
    "chhs-open-data-file_date-text",
    "publish-data-ca-gov-catalog-clocks",
    "transparency-faq-weekly-cadence",
  ] as const,
} as const;

export const CALIFORNIA_CDSS_ASOF_FILENAME_PATTERNS = {
  RCFE: /^ResidentialElderCareFacility(\d{8})\.csv$/i,
  ARF: /^AdultResidentialFacilities(\d{8})\.csv$/i,
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CaliforniaCdssAsOfFile = "RCFE" | "ARF";

export type CaliforniaCdssFilenameHeaderParse = {
  file: CaliforniaCdssAsOfFile;
  contentDisposition: string | null;
  filename: string | null;
  rawMmddyyyy: string | null;
  month: number | null;
  day: number | null;
  year: number | null;
  isoAsOf: string | null;
  prefixMatchesExpected: boolean;
  attachmentDisposition: boolean;
  calendarValid: boolean;
  ok: boolean;
  failures: string[];
};

export type CaliforniaCdssDualFileAsOfValidation = {
  rcfe: CaliforniaCdssFilenameHeaderParse;
  arf: CaliforniaCdssFilenameHeaderParse;
  concordant: boolean;
  adoptedAsOfIso: string | null;
  authoritativeForTransparencyPathway: boolean;
  cdssConfirmationHonored: boolean;
  failures: string[];
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function extractFilename(
  contentDispositionOrFilename: string | null | undefined,
): string | null {
  const raw = (contentDispositionOrFilename ?? "").trim();
  if (!raw) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(raw);
  const filename = (match?.[1] ?? raw).trim().replace(/"/g, "");
  return filename || null;
}

/**
 * Accept either a full Content-Disposition (`attachment; filename=...`)
 * or a bare fixture filename (`ResidentialElderCareFacility11152026.csv`).
 */
function dispositionAccepted(contentDisposition: string | null, filename: string | null): boolean {
  if (!contentDisposition) return false;
  if (/^\s*attachment\b/i.test(contentDisposition) && /filename=/i.test(contentDisposition)) {
    return true;
  }
  return filename != null && /^[^;=]+\.csv$/i.test(contentDisposition.trim());
}

/**
 * Strictly validate one Transparency CSV Content-Disposition filename/header date.
 * Calendar-aware (rejects impossible days). Does not adopt by itself.
 */
export function parseCaliforniaCdssTransparencyFilenameHeaderDate(
  file: CaliforniaCdssAsOfFile,
  contentDispositionOrFilename: string | null | undefined,
): CaliforniaCdssFilenameHeaderParse {
  const contentDisposition =
    contentDispositionOrFilename == null
      ? null
      : String(contentDispositionOrFilename);
  const failures: string[] = [];
  const filename = extractFilename(contentDisposition);
  const attachmentDisposition = dispositionAccepted(contentDisposition, filename);

  if (!filename) failures.push("filename-missing");
  if (!attachmentDisposition) failures.push("content-disposition-unusable");

  const pattern = CALIFORNIA_CDSS_ASOF_FILENAME_PATTERNS[file];
  let rawMmddyyyy: string | null = null;
  let prefixMatchesExpected = false;
  if (filename) {
    const stamped = pattern.exec(filename);
    if (!stamped) {
      failures.push("filename-prefix-or-stamp-mismatch");
      const loose = /(\d{8})(?:\.csv)?$/i.exec(filename);
      rawMmddyyyy = loose?.[1] ?? null;
    } else {
      prefixMatchesExpected = true;
      rawMmddyyyy = stamped[1] ?? null;
    }
  }

  let month: number | null = null;
  let day: number | null = null;
  let year: number | null = null;
  let isoAsOf: string | null = null;
  let calendarValid = false;

  if (!rawMmddyyyy || rawMmddyyyy.length !== 8) {
    failures.push("mmddyyyy-stamp-missing");
  } else {
    month = Number(rawMmddyyyy.slice(0, 2));
    day = Number(rawMmddyyyy.slice(2, 4));
    year = Number(rawMmddyyyy.slice(4, 8));
    if (
      !Number.isInteger(month)
      || !Number.isInteger(day)
      || !Number.isInteger(year)
      || month < 1
      || month > 12
      || year < 2000
      || year > 2100
    ) {
      failures.push("mmddyyyy-out-of-range");
    } else {
      const dim = daysInMonth(year, month);
      if (day < 1 || day > dim) {
        failures.push("mmddyyyy-invalid-calendar-day");
      } else {
        calendarValid = true;
        isoAsOf = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (!ISO_DATE.test(isoAsOf)) {
          isoAsOf = null;
          calendarValid = false;
          failures.push("iso-format-failed");
        }
      }
    }
  }

  const ok =
    attachmentDisposition
    && prefixMatchesExpected
    && calendarValid
    && isoAsOf != null
    && failures.length === 0;

  return {
    file,
    contentDisposition,
    filename,
    rawMmddyyyy,
    month: calendarValid ? month : null,
    day: calendarValid ? day : null,
    year: calendarValid ? year : null,
    isoAsOf: calendarValid ? isoAsOf : null,
    prefixMatchesExpected,
    attachmentDisposition,
    calendarValid,
    ok,
    failures,
  };
}

/**
 * Adopt Transparency pathway as-of ISO only when CDSS confirmation is honored
 * and RCFE+ARF filename/header dates validate and match.
 */
export function validateCaliforniaCdssDualFileAsOfDates(input: {
  rcfeContentDisposition: string | null | undefined;
  arfContentDisposition: string | null | undefined;
  cdssFilenameHeaderIsAsOfConfirmed?: boolean;
}): CaliforniaCdssDualFileAsOfValidation {
  const confirmed =
    input.cdssFilenameHeaderIsAsOfConfirmed
    ?? CALIFORNIA_CDSS_FILENAME_HEADER_IS_ASOF_CONFIRMED;
  const rcfe = parseCaliforniaCdssTransparencyFilenameHeaderDate(
    "RCFE",
    input.rcfeContentDisposition,
  );
  const arf = parseCaliforniaCdssTransparencyFilenameHeaderDate(
    "ARF",
    input.arfContentDisposition,
  );
  const failures: string[] = [];
  if (!confirmed) failures.push("cdss-confirmation-false");
  if (!rcfe.ok) failures.push("rcfe-filename-header-invalid");
  if (!arf.ok) failures.push("arf-filename-header-invalid");
  const concordant =
    rcfe.isoAsOf != null && arf.isoAsOf != null && rcfe.isoAsOf === arf.isoAsOf;
  if (!concordant) failures.push("rcfe-arf-asof-not-concordant");

  const adoptedAsOfIso =
    confirmed && rcfe.ok && arf.ok && concordant ? rcfe.isoAsOf : null;

  return {
    rcfe,
    arf,
    concordant,
    adoptedAsOfIso,
    authoritativeForTransparencyPathway: adoptedAsOfIso != null,
    cdssConfirmationHonored: confirmed,
    failures,
  };
}

/** Live dual-file observation from 2026-11-21 independent re-download. */
export const CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION = {
  observedOn: CALIFORNIA_CDSS_ASOF_OBSERVED_ON,
  rcfe: {
    contentDisposition:
      "attachment; filename=ResidentialElderCareFacility11152026.csv",
    bytes: 8635782,
    rowCount: 13337,
    sha256:
      "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  },
  arf: {
    contentDisposition:
      "attachment; filename=AdultResidentialFacilities11152026.csv",
    bytes: 5434124,
    rowCount: 11040,
    sha256:
      "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  },
  expectedAsOfIso: "2026-11-15",
} as const;

export function buildCaliforniaCdssAuthoritativeDateReport(
  dual: CaliforniaCdssDualFileAsOfValidation = validateCaliforniaCdssDualFileAsOfDates({
    rcfeContentDisposition:
      CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.rcfe.contentDisposition,
    arfContentDisposition:
      CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.arf.contentDisposition,
  }),
) {
  return {
    observedOn: CALIFORNIA_CDSS_ASOF_OBSERVED_ON,
    baseCommit: CALIFORNIA_CDSS_ASOF_BASE_COMMIT,
    source: CALIFORNIA_CDSS_ASOF_SOURCE,
    confirmation: CALIFORNIA_CDSS_FILENAME_HEADER_IS_ASOF_CONFIRMED,
    live: CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION,
    validation: dual,
    adoptedAsOfIso: dual.adoptedAsOfIso,
    freshnessBlockerResolvedForTransparencyPathway:
      dual.authoritativeForTransparencyPathway,
    arcgisFreshnessStillRejected: true as const,
    chhsFileDateStillRejected: true as const,
    californiaPublication: "unpublished" as const,
    allowsPublication: false as const,
    agencyEmailSent: false as const,
  };
}

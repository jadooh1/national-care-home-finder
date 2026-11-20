/**
 * Michigan LARA source verification (development-only).
 * Prior recorded baseline preserved; current read-only capture documented separately.
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const MICHIGAN_SOURCE_URL = "https://documents.apps.lara.state.mi.us/bchs/afc_sw.txt";
export const MICHIGAN_RECORD_DESCRIPTION_URL =
  "https://www.michigan.gov/lara/bureau-list/bchs/adult/online-lookups/adult-foster-care-record-description";
export const MICHIGAN_PROFILE_PREFIX =
  "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/";

/** Prior recorded observation (Nov 9, 2026 capture; still the licensing.ts baseline). */
export const MICHIGAN_PRIOR_RECORDED_BASELINE = {
  rows: 4480,
  describedRows: 4246,
  undescribedXhRows: 234,
  streetBlank: 4423,
  streetLetterAndDigit: 57,
  statusesExempt: 234,
  fileServerClock: "Mon, 09 Nov 2026 03:38:41 GMT",
  recordedExportDate: null,
  bytes: 1030479,
} as const;

/** Current read-only capture (this investigation). Server clock ≠ export date. */
export const MICHIGAN_CURRENT_CAPTURE = {
  observedOn: MICHIGAN_SOURCE_VERIFICATION_OBSERVED_ON,
  sourceUrl: MICHIGAN_SOURCE_URL,
  httpStatus: 200,
  contentType: "text/plain",
  lastModified: "Fri, 20 Nov 2026 03:38:59 GMT",
  bytes: 1029494,
  sha256: "32cfa06c8f55fc6aee626b114069095f5a99c6583d043a2c9fe95292e1de042b",
  rows: 4476,
  positionalFields: 31,
  describedRows: 4242,
  undescribedXhRows: 234,
  types: { AF: 419, AS: 2486, AM: 425, AL: 555, AG: 4, AI: 2, AH: 351, XH: 234 },
  statuses: { REGULAR: 4007, TEMPORARY: 177, "1ST PROVISIONAL": 56, EXEMPT: 234, NONE: 2 },
  stateMi: 4476,
  fiveDigitZips: 4369,
  nineDigitZips: 107,
  streetBlank: 4419,
  streetLetterAndDigit: 57,
  supplementalLetterAndDigit: 4456,
  supplementalLetterOnly: 19,
  supplementalDigitOnly: 1,
  blankNames: 0,
  blankCities: 0,
  blankLicenses: 0,
  duplicateLicenses: 0,
  profileShapeMatches: 4476,
  phoneBlank: 8,
  eightDigitDatePairs: 4242,
  blankDatePairs: 234,
  recordedExportDate: null,
  lastModifiedIsExportDate: false,
  dailyUpdateNoticeIsExportDate: false,
  publicationEligibleRows: 0,
} as const;

export function compareMichiganBaselineToCurrent(
  prior = MICHIGAN_PRIOR_RECORDED_BASELINE,
  current = MICHIGAN_CURRENT_CAPTURE,
) {
  return {
    rowDelta: current.rows - prior.rows,
    streetBlankDelta: current.streetBlank - prior.streetBlank,
    streetTextUnchanged: current.streetLetterAndDigit === prior.streetLetterAndDigit,
    xhUnchanged: current.undescribedXhRows === prior.undescribedXhRows,
    exemptUnchanged: current.statuses.EXEMPT === prior.statusesExempt,
    exportDateStillAbsent: current.recordedExportDate === null && prior.recordedExportDate === null,
    note:
      "Row count moved from 4480 → 4476 between captures. File server Last-Modified changed and remains rejected as an export date.",
  };
}

export function evaluateMichiganSourceVerification() {
  const comparison = compareMichiganBaselineToCurrent();
  const integrityOk =
    MICHIGAN_CURRENT_CAPTURE.rows === 4476
    && MICHIGAN_CURRENT_CAPTURE.streetBlank + MICHIGAN_CURRENT_CAPTURE.streetLetterAndDigit === 4476
    && MICHIGAN_CURRENT_CAPTURE.undescribedXhRows === 234
    && MICHIGAN_CURRENT_CAPTURE.statuses.EXEMPT === 234
    && MICHIGAN_CURRENT_CAPTURE.recordedExportDate === null
    && MICHIGAN_CURRENT_CAPTURE.publicationEligibleRows === 0;
  return {
    observedOn: MICHIGAN_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: MICHIGAN_PRIOR_RECORDED_BASELINE,
    current: MICHIGAN_CURRENT_CAPTURE,
    comparison,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

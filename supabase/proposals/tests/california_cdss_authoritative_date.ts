import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION,
  CALIFORNIA_CDSS_FILENAME_HEADER_IS_ASOF_CONFIRMED,
  buildCaliforniaCdssAuthoritativeDateReport,
  parseCaliforniaCdssTransparencyFilenameHeaderDate,
  validateCaliforniaCdssDualFileAsOfDates,
} from "../../../lib/california-cdss-authoritative-date.ts";

test("strict filename/header parse accepts live RCFE and ARF stamps", () => {
  const rcfe = parseCaliforniaCdssTransparencyFilenameHeaderDate(
    "RCFE",
    CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.rcfe.contentDisposition,
  );
  const arf = parseCaliforniaCdssTransparencyFilenameHeaderDate(
    "ARF",
    CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.arf.contentDisposition,
  );
  assert.equal(rcfe.ok, true);
  assert.equal(arf.ok, true);
  assert.equal(rcfe.isoAsOf, "2026-11-15");
  assert.equal(arf.isoAsOf, "2026-11-15");
  assert.equal(rcfe.rawMmddyyyy, "11152026");
  assert.equal(rcfe.prefixMatchesExpected, true);
  assert.equal(rcfe.calendarValid, true);
  assert.equal(rcfe.attachmentDisposition, true);
});

test("strict validation rejects bad calendars, prefixes, and mismatched dual files", () => {
  const badDay = parseCaliforniaCdssTransparencyFilenameHeaderDate(
    "RCFE",
    "attachment; filename=ResidentialElderCareFacility02302026.csv",
  );
  assert.equal(badDay.ok, false);
  assert.ok(badDay.failures.includes("mmddyyyy-invalid-calendar-day"));

  const badPrefix = parseCaliforniaCdssTransparencyFilenameHeaderDate(
    "RCFE",
    "attachment; filename=AdultResidentialFacilities11152026.csv",
  );
  assert.equal(badPrefix.ok, false);
  assert.ok(badPrefix.failures.includes("filename-prefix-or-stamp-mismatch"));

  const mismatched = validateCaliforniaCdssDualFileAsOfDates({
    rcfeContentDisposition:
      "attachment; filename=ResidentialElderCareFacility11152026.csv",
    arfContentDisposition:
      "attachment; filename=AdultResidentialFacilities11162026.csv",
  });
  assert.equal(mismatched.adoptedAsOfIso, null);
  assert.ok(mismatched.failures.includes("rcfe-arf-asof-not-concordant"));

  const unconfirmed = validateCaliforniaCdssDualFileAsOfDates({
    rcfeContentDisposition:
      CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.rcfe.contentDisposition,
    arfContentDisposition:
      CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.arf.contentDisposition,
    cdssFilenameHeaderIsAsOfConfirmed: false,
  });
  assert.equal(unconfirmed.adoptedAsOfIso, null);
  assert.ok(unconfirmed.failures.includes("cdss-confirmation-false"));
});

test("CDSS confirmation + concordant live stamps adopt Transparency as-of ISO", () => {
  assert.equal(CALIFORNIA_CDSS_FILENAME_HEADER_IS_ASOF_CONFIRMED, true);
  const dual = validateCaliforniaCdssDualFileAsOfDates({
    rcfeContentDisposition:
      CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.rcfe.contentDisposition,
    arfContentDisposition:
      CALIFORNIA_CDSS_ASOF_LIVE_OBSERVATION.arf.contentDisposition,
  });
  assert.equal(dual.adoptedAsOfIso, "2026-11-15");
  assert.equal(dual.authoritativeForTransparencyPathway, true);
  assert.equal(dual.concordant, true);

  const report = buildCaliforniaCdssAuthoritativeDateReport(dual);
  assert.equal(report.adoptedAsOfIso, "2026-11-15");
  assert.equal(report.freshnessBlockerResolvedForTransparencyPathway, true);
  assert.equal(report.arcgisFreshnessStillRejected, true);
  assert.equal(report.chhsFileDateStillRejected, true);
  assert.equal(report.allowsPublication, false);
  assert.equal(report.californiaPublication, "unpublished");
  assert.equal(report.agencyEmailSent, false);
  assert.equal(
    report.live.rcfe.sha256,
    "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  );
  assert.equal(
    report.live.arf.sha256,
    "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  );
});

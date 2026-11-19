import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE } from "../../../lib/california-transparency-download-sample.ts";
import {
  adoptCaliforniaTransparencyDownloadExportDate,
  buildCaliforniaTransparencyDownloadEvidence,
  californiaTransparencyConfigHeader,
  californiaTransparencyDownloadUrl,
  compareCaliforniaHistoricalToTransparencyDownload,
  isCaliforniaTransparencyFacilityNumber,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
  relateCaliforniaDownloadStatusToFacilityDetail,
  relateCaliforniaHistoricalIdToDownload,
  summarizeCaliforniaTransparencyDownloadRoster,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_API,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE,
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE,
} from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-transparency-download",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

test("DownloadStateData provenance documents endpoint, status domain, and limitations", () => {
  assert.equal(
    CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE.endpoint,
    CALIFORNIA_TRANSPARENCY_DOWNLOAD_API,
  );
  assert.equal(
    CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE.downloadIds.rcfe,
    "ResidentialElderCareFacility",
  );
  assert.equal(
    CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE.downloadIds.arf,
    "AdultResidentialFacilities",
  );
  assert.deepEqual(CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE.statusDomain, [
    "LICENSED",
    "CLOSED",
    "PENDING",
    "ON PROBATION",
  ]);
  assert.ok(CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE.limitations.length >= 6);
  assert.equal(CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE.publication, "unpublished");
  assert.equal(CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE.authoritativeIsoExportDate, false);
  assert.equal(californiaDirectoryReady(), false);
});

test("builds DownloadStateData URLs and DSS-Transparency-Config headers", () => {
  const url = californiaTransparencyDownloadUrl("ResidentialElderCareFacility", "abc-guid");
  assert.equal(
    url,
    "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData?id=ResidentialElderCareFacility&GUID=abc-guid",
  );
  const header = californiaTransparencyConfigHeader({ guid: "abc-guid" });
  const parsed = JSON.parse(header);
  assert.equal(parsed.GUID, "abc-guid");
  assert.equal(parsed.Version, "11.18.0R");
  assert.equal(parsed.DocProtocol, "https:");
});

test("filename MMDDYYYY stamps are parsed but never adopted as ISO export dates", () => {
  const parsed = parseCaliforniaTransparencyDownloadFilenameDate(
    "attachment; filename=ResidentialElderCareFacility11152026.csv",
  );
  assert.equal(parsed.raw, "11152026");
  assert.equal(parsed.isoCandidate, "2026-11-15");
  assert.equal(parsed.authoritativeIsoExportDate, null);
  assert.equal(adoptCaliforniaTransparencyDownloadExportDate(parsed), null);

  const arf = parseCaliforniaTransparencyDownloadFilenameDate(
    "AdultResidentialFacilities11152026.csv",
  );
  assert.equal(arf.isoCandidate, "2026-11-15");
  assert.equal(arf.authoritativeIsoExportDate, null);

  const missing = parseCaliforniaTransparencyDownloadFilenameDate(null);
  assert.equal(missing.raw, null);
  assert.equal(missing.isoCandidate, null);
});

test("parses DownloadStateData CSV fixtures and preserves leading-zero facility numbers", () => {
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-sample.csv"));
  assert.equal(rcfe.length, 5);
  const leading = rcfe.find(row => row.facilityNumber === "015601302");
  assert.ok(leading);
  assert.equal(leading?.facilityStatus, "LICENSED");
  assert.equal(leading?.facilityType, "RCFE-CONTINUING CARE RETIREMENT COMMUNITY");
  // Fixtures without Facility Capacity still parse; capacity is blank, never invented.
  assert.equal(leading?.facilityCapacity, "");
  assert.equal(isCaliforniaTransparencyFacilityNumber("015601302"), true);
  assert.equal(isCaliforniaTransparencyFacilityNumber("15601302"), true);
  assert.equal(isCaliforniaTransparencyFacilityNumber("95354"), false);

  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-sample.csv"));
  const conflict = arf.find(row => row.facilityNumber === "011400493");
  assert.equal(conflict?.facilityStatus, "CLOSED");
  assert.equal(conflict?.closedDate, "4/28/2025");
  assert.equal(conflict?.facilityCapacity, "");
  const invalid = arf.find(row => row.facilityNumber === "95354");
  assert.equal(invalid?.facilityZip, "95354");
});

test("roster summary counts statuses, leading zeros, and invalid identifiers", () => {
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-sample.csv"));
  const summary = summarizeCaliforniaTransparencyDownloadRoster("RCFE", rcfe);
  assert.equal(summary.rowCount, 5);
  assert.equal(summary.distinctFacilityNumbers, 5);
  assert.equal(summary.duplicateFacilityNumbers.length, 0);
  assert.ok((summary.leadingZeroFacilityNumbers ?? 0) >= 3);
  assert.equal(summary.invalidFacilityNumbers.length, 0);
  assert.equal(summary.statusCounts.LICENSED, 2);
  assert.equal(summary.statusCounts.CLOSED, 2);
  assert.equal(summary.statusCounts["ON PROBATION"], 1);

  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-sample.csv"));
  const arfSummary = summarizeCaliforniaTransparencyDownloadRoster("ARF", arf);
  assert.deepEqual(arfSummary.invalidFacilityNumbers, ["95354"]);
  assert.equal(arfSummary.statusCounts.CLOSED, 2);
});

test("download vs FacilityDetail status relation matches Closed* and flags Application Withdrawn", () => {
  assert.equal(
    relateCaliforniaDownloadStatusToFacilityDetail("LICENSED", "Licensed"),
    "match",
  );
  assert.equal(
    relateCaliforniaDownloadStatusToFacilityDetail(
      "CLOSED",
      "Closed, Licensee Initiated",
      { downloadFacilityNumber: "011400493", liveFacilityNumber: "011400493" },
    ),
    "match",
  );
  assert.equal(
    relateCaliforniaDownloadStatusToFacilityDetail("CLOSED", "Application Withdrawn"),
    "conflict",
  );
  assert.equal(
    relateCaliforniaDownloadStatusToFacilityDetail("ON PROBATION", "Probationary License"),
    "match",
  );
  assert.equal(
    relateCaliforniaDownloadStatusToFacilityDetail("PENDING", null, {
      downloadFacilityNumber: "95354",
    }),
    "invalid-download-id",
  );
  assert.equal(
    relateCaliforniaDownloadStatusToFacilityDetail("PENDING", null, {
      downloadFacilityNumber: "019201567",
    }),
    "missing-live",
  );
});

test("historical vs download identifier relations keep leading-zero mismatches distinct", () => {
  const downloadIds = new Set(["015601302", "011400493", "100400070"]);
  assert.equal(relateCaliforniaHistoricalIdToDownload("015601302", downloadIds), "exact");
  assert.equal(
    relateCaliforniaHistoricalIdToDownload("15601302", downloadIds),
    "leading-zero-representation",
  );
  assert.equal(relateCaliforniaHistoricalIdToDownload("999999999", downloadIds), "historical-only");

  const comparison = compareCaliforniaHistoricalToTransparencyDownload(
    [
      { facilityNumber: "15601302", facilityStatus: "LICENSED" },
      { facilityNumber: "011400493", facilityStatus: "LICENSED" },
      { facilityNumber: "100400070", facilityStatus: "LICENSED" },
      { facilityNumber: "374600236", facilityStatus: "CLOSED" },
    ],
    parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-sample.csv")).concat(
      parseCaliforniaTransparencyDownloadCsv(loadText("arf-sample.csv")),
    ),
  );
  assert.equal(comparison.exactMatches, 2);
  assert.equal(comparison.leadingZeroRepresentationMatches, 1);
  assert.equal(comparison.historicalOnly, 1);
  assert.equal(comparison.licensedToNonLicensedOnExactMatches, 1);
});

test("evidence builder keeps California unpublished and records observed header fixtures", () => {
  const headers = JSON.parse(loadText("download-headers.json"));
  const evidence = buildCaliforniaTransparencyDownloadEvidence({
    file: "RCFE",
    contentDispositionOrFilename: headers.rcfe.contentDisposition,
    rows: parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-sample.csv")),
  });
  assert.equal(evidence.filenameDate.isoCandidate, "2026-11-15");
  assert.equal(evidence.adoptedExportDate, null);
  assert.equal(evidence.publication, "unpublished");
  assert.equal(evidence.ownerClaimEligible, false);
  assert.equal(evidence.gate.providesBulkRcfeArfRoster, true);
  assert.equal(evidence.gate.preservesLeadingZeroFacilityNumbers, true);
  assert.equal(headers.rcfe.observedRowCount, 13337);
  assert.equal(headers.arf.observedRowCount, 11040);
});

test("stratified sample includes known conflict 011400493 and invalid id 95354", () => {
  assert.ok(CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE.length >= 8);
  const known = CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE.find(
    row => row.facilityNumber === "011400493",
  );
  assert.equal(known?.downloadStatus, "CLOSED");
  assert.equal(known?.stratum, "known-conflict");
  const invalid = CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE.find(
    row => row.facilityNumber === "95354",
  );
  assert.equal(invalid?.stratum, "invalid-id");
});

test("California remains absent from the public directory contract", () => {
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
});

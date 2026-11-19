import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE5_CONFLICT_OBSERVED,
  CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED,
  CALIFORNIA_PHASE5_PUBLICATION_GATE,
  CALIFORNIA_PHASE5_PUBLICATION_BLOCKERS,
  buildCaliforniaPhase5Evidence,
  californiaPhase5AllowsPublication,
  classifyCaliforniaPhase5Category,
  classifyCaliforniaPhase5FacilityDetailStatus,
  classifyCaliforniaPhase5HistoricalStatusConflict,
  evaluateCaliforniaPhase5RowEligibility,
  relateCaliforniaPhase5DownloadToFacilityDetail,
  summarizeCaliforniaPhase5Categories,
  summarizeCaliforniaPhase5FacilityDetailSample,
  summarizeCaliforniaPhase5HistoricalConflicts,
} from "../../../lib/california-phase5-status-eligibility.ts";
import { CALIFORNIA_PHASE5_FACILITY_DETAIL_SAMPLE } from "../../../lib/california-phase5-sample.ts";
import { parseCaliforniaTransparencyDownloadCsv } from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase5-status-eligibility",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

test("Phase 5 publication gate stays unpublished with documented blockers", () => {
  assert.equal(CALIFORNIA_PHASE5_PUBLICATION_GATE.publication, "unpublished");
  assert.equal(CALIFORNIA_PHASE5_PUBLICATION_GATE.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_PHASE5_PUBLICATION_GATE.sampleVerificationSufficient, false);
  assert.equal(CALIFORNIA_PHASE5_PUBLICATION_GATE.reliableSourceAndDate, false);
  assert.ok(CALIFORNIA_PHASE5_PUBLICATION_BLOCKERS.some(
    blocker => blocker.id === "closed-application-withdrawn-mapping-gap",
  ));
  assert.ok(CALIFORNIA_PHASE5_PUBLICATION_BLOCKERS.some(
    blocker => blocker.id === "no-authoritative-iso-export-date",
  ));
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development");
});

test("observed download hashes remain non-ISO and freshness timestamp absent", () => {
  const observed = loadJson<{
    download: {
      rcfeRows: number;
      arfRows: number;
      rcfeSha256: string;
      arfSha256: string;
      authoritativeIsoExportDate: null;
      freshness: {
        httpLastModifiedPresent: boolean;
        csvBodyFileDateColumnPresent: boolean;
        facilityDetailExportTimestampPresent: boolean;
        chhsRawFileDateText: string;
      };
    };
    historicalConflicts: { total: number; classification: Record<string, number> };
  }>("observed-live-counts.json");
  assert.equal(observed.download.rcfeRows, 13337);
  assert.equal(observed.download.arfRows, 11040);
  assert.equal(observed.download.rcfeSha256, CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED.rcfe.sha256);
  assert.equal(observed.download.arfSha256, CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED.arf.sha256);
  assert.equal(observed.download.authoritativeIsoExportDate, null);
  assert.equal(CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED.authoritativeIsoExportDate, null);
  assert.equal(observed.download.freshness.httpLastModifiedPresent, false);
  assert.equal(observed.download.freshness.csvBodyFileDateColumnPresent, false);
  assert.equal(observed.download.freshness.facilityDetailExportTimestampPresent, false);
  assert.equal(observed.download.freshness.chhsRawFileDateText, "05252025");
  assert.equal(observed.historicalConflicts.total, CALIFORNIA_PHASE5_CONFLICT_OBSERVED.totalExactIdStatusConflicts);
  assert.equal(observed.historicalConflicts.classification["expected-time-drift"], 2517);
  assert.equal(observed.historicalConflicts.classification["historical-data-defect"], 1);
  assert.equal(observed.historicalConflicts.classification["possible-relicense"], 1);
  assert.equal(observed.historicalConflicts.classification["unusual-transition"], 1);
});

test("historical conflict classifier separates drift from defects and anomalies", () => {
  assert.equal(
    classifyCaliforniaPhase5HistoricalStatusConflict("LICENSED", "CLOSED"),
    "expected-time-drift",
  );
  assert.equal(
    classifyCaliforniaPhase5HistoricalStatusConflict("PENDING", "LICENSED"),
    "expected-time-drift",
  );
  assert.equal(
    classifyCaliforniaPhase5HistoricalStatusConflict("9/2/1997", "LICENSED"),
    "historical-data-defect",
  );
  assert.equal(
    classifyCaliforniaPhase5HistoricalStatusConflict("LICENSED", "PENDING"),
    "unusual-transition",
  );
  assert.equal(
    classifyCaliforniaPhase5HistoricalStatusConflict("CLOSED", "LICENSED", {
      historicalClosedDate: "10/7/2024",
      downloadLicenseFirstDate: "9/25/2025",
    }),
    "possible-relicense",
  );
  const examples = loadJson<{
    historicalStatus: string;
    downloadStatus: string;
    historicalClosedDate?: string;
    downloadLicenseFirstDate?: string;
  }[]>("historical-conflict-examples.json");
  const summary = summarizeCaliforniaPhase5HistoricalConflicts(examples);
  assert.ok(summary.total >= 8);
  assert.ok(summary["expected-time-drift"] >= 1);
});

test("FacilityDetail mapping treats Application Withdrawn as CLOSED mapping-gap", () => {
  assert.equal(
    relateCaliforniaPhase5DownloadToFacilityDetail("CLOSED", "Closed, Licensee Initiated"),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase5DownloadToFacilityDetail("CLOSED", "Closed, Agency Initiated"),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase5DownloadToFacilityDetail("CLOSED", "Application Withdrawn"),
    "mapping-gap",
  );
  assert.equal(
    relateCaliforniaPhase5DownloadToFacilityDetail("ON PROBATION", "Probationary License"),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase5DownloadToFacilityDetail("LICENSED", "Licensed"),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase5DownloadToFacilityDetail("PENDING", null, {
      downloadFacilityNumber: "95354",
    }),
    "invalid-download-id",
  );
  assert.equal(
    classifyCaliforniaPhase5FacilityDetailStatus("Application Withdrawn"),
    "withdrawn-ineligible",
  );
  assert.equal(
    classifyCaliforniaPhase5FacilityDetailStatus("Probationary License"),
    "active-restricted",
  );
});

test("RCFE/ARF category eligibility gates ADP/SRF/RCFCI/MFHV and blanks", () => {
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-category-sample.csv"));
  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-category-sample.csv"));
  const rcfeSummary = summarizeCaliforniaPhase5Categories("RCFE", rcfe);
  const arfSummary = summarizeCaliforniaPhase5Categories("ARF", arf);
  assert.equal(rcfeSummary.eligibleTypeRows, 2);
  assert.equal(rcfeSummary.blankTypeRows, 1);
  assert.equal(arfSummary.eligibleTypeRows, 6);
  assert.equal(arfSummary.outOfScopeRows, 4);
  assert.equal(arfSummary.blankTypeRows, 1);
  assert.equal(classifyCaliforniaPhase5Category("ARF", "ADULT DAY PROGRAM").eligibility, "out-of-scope");
  assert.equal(
    classifyCaliforniaPhase5Category("ARF", "SOCIAL REHABILITATION FACILITY").eligibility,
    "out-of-scope",
  );
  assert.equal(
    classifyCaliforniaPhase5Category("ARF", "RESIDENTIAL FACILITY CHRONICALLY ILL").eligibility,
    "out-of-scope",
  );
  assert.equal(
    classifyCaliforniaPhase5Category("ARF", "MEDICAL FOSTER HOMES FOR VETERANS").eligibility,
    "out-of-scope",
  );
  assert.equal(classifyCaliforniaPhase5Category("RCFE", "").eligibility, "blank-type-ineligible");
});

test("row eligibility requires valid id, eligible type, and active status", () => {
  assert.equal(
    evaluateCaliforniaPhase5RowEligibility({
      file: "ARF",
      facilityNumber: "100403816",
      facilityType: "ADULT RESIDENTIAL",
      downloadStatus: "LICENSED",
      liveStatus: "Licensed",
    }).rowEligibility,
    "eligible-active-candidate",
  );
  assert.equal(
    evaluateCaliforniaPhase5RowEligibility({
      file: "RCFE",
      facilityNumber: "015601219",
      facilityType: "RESIDENTIAL CARE ELDERLY",
      downloadStatus: "ON PROBATION",
      liveStatus: "Probationary License",
    }).rowEligibility,
    "eligible-active-restricted",
  );
  assert.equal(
    evaluateCaliforniaPhase5RowEligibility({
      file: "ARF",
      facilityNumber: "286803618",
      facilityType: "ADULT DAY PROGRAM",
      downloadStatus: "LICENSED",
      liveStatus: "Licensed",
    }).rowEligibility,
    "ineligible",
  );
  assert.equal(
    evaluateCaliforniaPhase5RowEligibility({
      file: "ARF",
      facilityNumber: "306006749",
      facilityType: "ADULT DAY PROGRAM",
      downloadStatus: "CLOSED",
      liveStatus: "Application Withdrawn",
    }).rowEligibility,
    "ineligible",
  );
  assert.equal(
    evaluateCaliforniaPhase5RowEligibility({
      file: "RCFE",
      facilityNumber: "486804477",
      facilityType: "",
      downloadStatus: "LICENSED",
      liveStatus: "Licensed",
    }).rowEligibility,
    "ineligible",
  );
  assert.equal(
    evaluateCaliforniaPhase5RowEligibility({
      file: "ARF",
      facilityNumber: "95354",
      facilityType: "ADULT RESIDENTIAL",
      downloadStatus: "PENDING",
      liveStatus: null,
    }).rowEligibility,
    "ineligible",
  );
});

test("coded FacilityDetail sample summary records mapping-gaps and stays unpublished", () => {
  const sample = loadJson<{
    results: {
      facilityNumber: string;
      file: "RCFE" | "ARF";
      downloadStatus: string;
      downloadType?: string;
      liveStatus: string | null;
      liveFacilityType?: string | null;
    }[];
  }>("facilitydetail-sample.json");
  assert.ok(CALIFORNIA_PHASE5_FACILITY_DETAIL_SAMPLE.length >= 20);
  const rows = sample.results.map(row => ({
    facilityNumber: row.facilityNumber,
    file: row.file,
    downloadStatus: row.downloadStatus,
    downloadType: row.downloadType,
    liveStatus: row.liveStatus,
    liveFacilityType: row.liveFacilityType,
    relation: relateCaliforniaPhase5DownloadToFacilityDetail(
      row.downloadStatus,
      row.liveStatus,
      { downloadFacilityNumber: row.facilityNumber },
    ),
  }));
  const summary = summarizeCaliforniaPhase5FacilityDetailSample(rows);
  assert.ok(summary.sampleSize >= 20);
  assert.ok(summary["mapping-gap"] >= 4);
  assert.ok(summary.match >= 10);
  assert.equal(summary["invalid-download-id"], 1);
  assert.equal(summary.sampleIsStatewideConclusion, false);
  assert.equal(summary.publication, "unpublished");

  const evidence = buildCaliforniaPhase5Evidence({
    historicalConflicts: loadJson("historical-conflict-examples.json"),
    rcfeRows: parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-category-sample.csv")),
    arfRows: parseCaliforniaTransparencyDownloadCsv(loadText("arf-category-sample.csv")),
    facilityDetailSample: rows,
  });
  assert.equal(evidence.publication, "unpublished");
  assert.equal(evidence.ownerClaimEligible, false);
  assert.equal(californiaPhase5AllowsPublication(evidence), false);
  assert.equal(evidence.downloadObserved.authoritativeIsoExportDate, null);
});

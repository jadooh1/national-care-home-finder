import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED,
  CALIFORNIA_PHASE4_PUBLICATION_GATE,
  CALIFORNIA_PHASE4_PUBLICATION_BLOCKERS,
  buildCaliforniaPhase4Evidence,
  californiaPhase4AllowsPublication,
  compareCaliforniaPhase4DownloadToGis,
  reconcileCaliforniaPhase4File,
  summarizeCaliforniaPhase4Category,
  summarizeCaliforniaPhase4DownloadIntegrity,
  summarizeCaliforniaPhase4FacilityDetailSample,
} from "../../../lib/california-phase4-reconciliation.ts";
import { CALIFORNIA_PHASE4_FACILITY_DETAIL_SAMPLE } from "../../../lib/california-phase4-sample.ts";
import { parseCaliforniaTransparencyDownloadCsv } from "../../../lib/california-transparency-download.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase4-reconciliation",
);

function loadText(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

function loadJson<T>(name: string): T {
  return JSON.parse(loadText(name)) as T;
}

function loadHistorical(name: string) {
  const lines = loadText(name).split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",") ?? [];
  return lines.slice(1).map(line => {
    const cells = line.split(",");
    const row = Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""]));
    return {
      facilityNumber: row.facility_number ?? "",
      facilityStatus: row.facility_status ?? "",
      facilityType: row.facility_type ?? "",
      facilityAddress: row.facility_address ?? "",
      facilityCity: row.facility_city ?? "",
      facilityZip: row.facility_zip ?? "",
      facilityCapacity: row.facility_capacity ?? "",
    };
  });
}

test("Phase 4 provenance and publication gate stay unpublished with documented blockers", () => {
  assert.equal(CALIFORNIA_PHASE4_PUBLICATION_GATE.publication, "unpublished");
  assert.equal(CALIFORNIA_PHASE4_PUBLICATION_GATE.ownerClaimEligible, false);
  assert.equal(CALIFORNIA_PHASE4_PUBLICATION_GATE.sampleVerificationSufficient, false);
  assert.equal(CALIFORNIA_PHASE4_PUBLICATION_GATE.reliableSourceAndDate, false);
  assert.ok(CALIFORNIA_PHASE4_PUBLICATION_BLOCKERS.length >= 7);
  assert.ok(
    CALIFORNIA_PHASE4_PUBLICATION_BLOCKERS.some(blocker => blocker.id === "no-authoritative-iso-export-date"),
  );
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development");
});

test("observed DownloadStateData hashes and row counts are recorded and not adopted as ISO dates", () => {
  const observed = loadJson<{
    download: {
      rcfeRows: number;
      arfRows: number;
      rcfeSha256: string;
      arfSha256: string;
      authoritativeIsoExportDate: null;
    };
  }>("observed-live-counts.json");
  assert.equal(observed.download.rcfeRows, 13337);
  assert.equal(observed.download.arfRows, 11040);
  assert.equal(observed.download.rcfeSha256, CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED.rcfe.sha256);
  assert.equal(observed.download.arfSha256, CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED.arf.sha256);
  assert.equal(observed.download.authoritativeIsoExportDate, null);
  assert.equal(CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED.authoritativeIsoExportDate, null);
  assert.equal(CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED.rcfe.filenameIsoCandidate, "2026-11-15");
});

test("download integrity preserves leading zeros and flags invalid 95354", () => {
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-download-sample.csv"));
  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-download-sample.csv"));
  const rcfeIntegrity = summarizeCaliforniaPhase4DownloadIntegrity("RCFE", rcfe);
  const arfIntegrity = summarizeCaliforniaPhase4DownloadIntegrity("ARF", arf);
  assert.ok(rcfe.some(row => row.facilityNumber === "015601302"));
  assert.ok(rcfeIntegrity.leadingZeroFacilityNumbers >= 1);
  assert.deepEqual(arfIntegrity.invalidFacilityNumbers, ["95354"]);
  assert.equal(arfIntegrity.zipEqualsFacilityNumberRows, 1);
  assert.equal(rcfeIntegrity.duplicateFacilityNumbers.length, 0);
  assert.equal(arfIntegrity.duplicateFacilityNumbers.length, 0);
});

test("category gating counts publishable vs other types", () => {
  const rcfe = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-download-sample.csv"));
  const arf = parseCaliforniaTransparencyDownloadCsv(loadText("arf-download-sample.csv"));
  const rcfeCategory = summarizeCaliforniaPhase4Category("RCFE", rcfe);
  const arfCategory = summarizeCaliforniaPhase4Category("ARF", arf);
  assert.ok(rcfeCategory.publishableTypeRows >= 1);
  assert.ok(rcfeCategory.blankTypeRows >= 1);
  assert.ok((arfCategory.otherTypeCounts["ADULT DAY PROGRAM"] ?? 0) >= 1);
  assert.ok(arfCategory.otherTypeRows >= 1);
});

test("full file reconciliation separates historical, GIS, address, and capacity denominators", () => {
  const download = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-download-sample.csv"));
  const historical = loadHistorical("rcfe-historical-sample.csv");
  const gis = loadJson<Array<{
    FAC_NBR: string | number | null;
    STATUS: number | null;
    FAC_TYPE_DESC: string | null;
    FAC_LATITUDE: string | null;
    FAC_LONGITUDE: string | null;
    CAPACITY?: number | null;
    RES_STREET_ADDR?: string | null;
  }>>("gis-sample.json");
  const reconciled = reconcileCaliforniaPhase4File({
    file: "RCFE",
    download,
    historical,
    gis,
  });
  assert.equal(reconciled.file, "RCFE");
  assert.ok(reconciled.historicalComparison.historicalRows >= 1);
  assert.ok(reconciled.historicalComparison.leadingZeroRepresentationMatches >= 1);
  assert.ok(reconciled.addressAnomalies.exactIdDenominator >= 1);
  assert.equal(reconciled.capacityAnomalies.downloadHasCapacityColumn, false);
  assert.ok(reconciled.vsGis.leadingZeroRepresentationMismatches >= 1);
  assert.ok(reconciled.vsGis.invalidCoordinates >= 1);

  const vsGis = compareCaliforniaPhase4DownloadToGis("RCFE", download, gis);
  assert.equal(vsGis.file, "RCFE");
  assert.ok(vsGis.downloadDistinctIds >= download.length - 1);
});

test("FacilityDetail sample requires 011400493, 306006749, and 95354 and never approves publication", () => {
  const required = ["011400493", "306006749", "95354"];
  for (const id of required) {
    assert.ok(
      CALIFORNIA_PHASE4_FACILITY_DETAIL_SAMPLE.some(row => row.facilityNumber === id),
      `missing required sample id ${id}`,
    );
  }
  const summary = summarizeCaliforniaPhase4FacilityDetailSample([
    {
      facilityNumber: "011400493",
      file: "ARF",
      downloadStatus: "CLOSED",
      stratum: "known-conflict",
      relation: "match",
      liveStatus: "Closed, Licensee Initiated",
    },
    {
      facilityNumber: "306006749",
      file: "ARF",
      downloadStatus: "CLOSED",
      stratum: "application-withdrawn-risk",
      relation: "conflict",
      liveStatus: "Application Withdrawn",
    },
    {
      facilityNumber: "95354",
      file: "ARF",
      downloadStatus: "PENDING",
      stratum: "invalid-id",
      relation: "invalid-download-id",
      liveStatus: null,
    },
  ]);
  assert.equal(summary.sampleSize, 3);
  assert.equal(summary.match, 1);
  assert.equal(summary.conflict, 1);
  assert.equal(summary["invalid-download-id"], 1);
  assert.equal(summary.sampleIsStatewideConclusion, false);
  assert.equal(summary.publication, "unpublished");
});

test("evidence builder keeps WA/OR public and California unpublished", () => {
  const rcfeDownload = parseCaliforniaTransparencyDownloadCsv(loadText("rcfe-download-sample.csv"));
  const arfDownload = parseCaliforniaTransparencyDownloadCsv(loadText("arf-download-sample.csv"));
  const evidence = buildCaliforniaPhase4Evidence({
    rcfeDownload,
    arfDownload,
    rcfeHistorical: loadHistorical("rcfe-historical-sample.csv"),
    arfHistorical: loadHistorical("arf-historical-sample.csv"),
    gis: loadJson("gis-sample.json"),
    facilityDetailSample: CALIFORNIA_PHASE4_FACILITY_DETAIL_SAMPLE.map(target => ({
      ...target,
      relation: target.facilityNumber === "95354"
        ? "invalid-download-id"
        : target.facilityNumber === "306006749" || target.facilityNumber === "306006799"
          ? "conflict"
          : "match",
      liveStatus: null,
    })),
  });
  assert.equal(evidence.publication, "unpublished");
  assert.equal(evidence.ownerClaimEligible, false);
  assert.equal(evidence.filenameDatesAdopted, null);
  assert.deepEqual(evidence.crossFile.arfInvalidFacilityNumbers, ["95354"]);
  assert.equal(californiaPhase4AllowsPublication(evidence), false);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development");
});

test("observed live count fixture matches Phase 4 denominators for RCFE and ARF", () => {
  const observed = loadJson<{
    historicalCompare: {
      rcfe: { historicalRows: number; exact: number; historicalOnly: number; downloadOnly: number };
      arf: { historicalRows: number; exact: number; historicalOnly: number; downloadOnly: number };
    };
    facilityDetailSample: { match: number; conflict: number; "invalid-download-id": number };
  }>("observed-live-counts.json");
  assert.equal(observed.historicalCompare.rcfe.historicalRows, 12522);
  assert.equal(observed.historicalCompare.rcfe.exact, 11292);
  assert.equal(observed.historicalCompare.rcfe.historicalOnly, 1230);
  assert.equal(observed.historicalCompare.rcfe.downloadOnly, 2045);
  assert.equal(observed.historicalCompare.arf.historicalRows, 10498);
  assert.equal(observed.historicalCompare.arf.exact, 9754);
  assert.equal(observed.historicalCompare.arf.historicalOnly, 744);
  assert.equal(observed.historicalCompare.arf.downloadOnly, 1286);
  assert.equal(observed.facilityDetailSample.sampleSize, 16);
  assert.equal(observed.facilityDetailSample.match, 13);
  assert.equal(observed.facilityDetailSample.conflict, 2);
  assert.equal(observed.facilityDetailSample["invalid-download-id"], 1);
});

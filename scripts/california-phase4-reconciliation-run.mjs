#!/usr/bin/env node
/**
 * Read-only California Phase 4 full reconciliation runner.
 * Usage: node --experimental-strip-types scripts/california-phase4-reconciliation-run.mjs [out.json]
 * Downloads Transparency DownloadStateData, historical CHHS CSVs, and ArcGIS pages;
 * verifies a bounded FacilityDetail sample. Does not write database records or publish California.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fetchCaliforniaCclGisPages } from "../lib/california-ccl-arcgis-probe.ts";
import {
  CALIFORNIA_PHASE4_CHHS,
  CALIFORNIA_PHASE4_DOWNLOAD_API,
  CALIFORNIA_PHASE4_DOWNLOAD_IDS,
  CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED,
  buildCaliforniaPhase4Evidence,
  relateCaliforniaPhase4DownloadToFacilityDetail,
} from "../lib/california-phase4-reconciliation.ts";
import { CALIFORNIA_PHASE4_FACILITY_DETAIL_SAMPLE } from "../lib/california-phase4-sample.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCsvLine,
} from "../lib/california-transparency-download.ts";
import {
  fetchCaliforniaFacilityDetail,
  parseCaliforniaFacilityDetail,
} from "../lib/california-status-verification.ts";

function californiaPhase4DownloadUrl(downloadId, guid) {
  const params = new URLSearchParams({ id: downloadId, GUID: guid });
  return `${CALIFORNIA_PHASE4_DOWNLOAD_API}?${params.toString()}`;
}

const outPath = process.argv[2] ?? "california-phase4-reconciliation-live.json";
const observedOn = new Date().toISOString().slice(0, 10);
const guid = randomUUID();
const configHeader = californiaTransparencyConfigHeader({ guid });

async function downloadTransparency(file, downloadId) {
  const url = californiaPhase4DownloadUrl(downloadId, guid);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,*/*",
      "DSS-Transparency-Config": configHeader,
    },
  });
  const csvText = await response.text();
  const contentDisposition = response.headers.get("content-disposition");
  const sha256 = createHash("sha256").update(csvText).digest("hex");
  return {
    file,
    httpStatus: response.status,
    contentDisposition,
    bytes: Buffer.byteLength(csvText),
    sha256,
    rows: parseCaliforniaTransparencyDownloadCsv(csvText),
  };
}

function parseHistoricalCsv(csvText) {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0] ?? "").map(header => header.trim());
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const get = name => (cells[index[name] ?? -1] ?? "").trim();
    rows.push({
      facilityNumber: get("facility_number"),
      facilityStatus: get("facility_status"),
      facilityType: get("facility_type"),
      facilityAddress: get("facility_address"),
      facilityCity: get("facility_city"),
      facilityZip: get("facility_zip"),
      facilityCapacity: get("facility_capacity"),
    });
  }
  return rows;
}

async function downloadHistorical(resourceId) {
  const metaUrl = `https://data.chhs.ca.gov/api/3/action/resource_show?id=${resourceId}`;
  const meta = await (await fetch(metaUrl)).json();
  const url = meta?.result?.url;
  if (!url) throw new Error(`CHHS resource ${resourceId} missing url`);
  const response = await fetch(url);
  const csvText = await response.text();
  return {
    resourceId,
    httpStatus: response.status,
    bytes: Buffer.byteLength(csvText),
    rows: parseHistoricalCsv(csvText),
  };
}

const [rcfeDownload, arfDownload, rcfeHistorical, arfHistorical, gisPages] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE4_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE4_DOWNLOAD_IDS.arf),
  downloadHistorical(CALIFORNIA_PHASE4_CHHS.rcfeResourceId),
  downloadHistorical(CALIFORNIA_PHASE4_CHHS.arfResourceId),
  fetchCaliforniaCclGisPages({ pageSize: 1000 }),
]);

const lastRequestAt = { value: 0 };
const facilityDetailSample = [];
for (const target of CALIFORNIA_PHASE4_FACILITY_DETAIL_SAMPLE) {
  const fetched = await fetchCaliforniaFacilityDetail(target.facilityNumber, {
    minIntervalMs: 450,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const relation = relateCaliforniaPhase4DownloadToFacilityDetail(
    target.downloadStatus,
    parse?.status ?? null,
    { downloadFacilityNumber: target.facilityNumber },
  );
  facilityDetailSample.push({
    ...target,
    httpStatus: fetched.httpStatus,
    attempts: fetched.attempts,
    timedOut: fetched.timedOut,
    liveFacilityNumber: parse?.facilityNumber ?? null,
    liveStatus: parse?.status ?? null,
    liveFacilityType: parse?.facilityType ?? null,
    relation,
  });
}

const evidence = buildCaliforniaPhase4Evidence({
  observedOn,
  rcfeDownload: rcfeDownload.rows,
  arfDownload: arfDownload.rows,
  rcfeHistorical: rcfeHistorical.rows,
  arfHistorical: arfHistorical.rows,
  gis: gisPages.rows,
  facilityDetailSample,
  contentDispositionRcfe: rcfeDownload.contentDisposition,
  contentDispositionArf: arfDownload.contentDisposition,
});

const report = {
  observedOn,
  publication: evidence.publication,
  ownerClaimEligible: evidence.ownerClaimEligible,
  downloads: {
    RCFE: {
      httpStatus: rcfeDownload.httpStatus,
      contentDisposition: rcfeDownload.contentDisposition,
      bytes: rcfeDownload.bytes,
      sha256: rcfeDownload.sha256,
      expectedSha256: CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED.rcfe.sha256,
      rowCount: rcfeDownload.rows.length,
    },
    ARF: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      expectedSha256: CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED.arf.sha256,
      rowCount: arfDownload.rows.length,
    },
  },
  historical: {
    RCFE: { resourceId: rcfeHistorical.resourceId, rows: rcfeHistorical.rows.length },
    ARF: { resourceId: arfHistorical.resourceId, rows: arfHistorical.rows.length },
  },
  gis: {
    rows: gisPages.rows.length,
    pages: gisPages.pages,
    complete: gisPages.complete,
  },
  evidence: {
    crossFile: evidence.crossFile,
    rcfe: {
      download: evidence.rcfe.download,
      historicalComparison: evidence.rcfe.historicalComparison,
      addressAnomalies: evidence.rcfe.addressAnomalies,
      capacityAnomalies: evidence.rcfe.capacityAnomalies,
      category: evidence.rcfe.category,
      vsGis: evidence.rcfe.vsGis,
    },
    arf: {
      download: evidence.arf.download,
      historicalComparison: evidence.arf.historicalComparison,
      addressAnomalies: evidence.arf.addressAnomalies,
      capacityAnomalies: evidence.arf.capacityAnomalies,
      category: evidence.arf.category,
      vsGis: evidence.arf.vsGis,
    },
    facilityDetailSample: evidence.facilityDetailSample,
    gate: evidence.gate,
  },
  facilityDetailSample,
};

writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  outPath,
  observedOn,
  rcfeRows: rcfeDownload.rows.length,
  arfRows: arfDownload.rows.length,
  rcfeSha256: rcfeDownload.sha256,
  arfSha256: arfDownload.sha256,
  historicalRcfe: rcfeHistorical.rows.length,
  historicalArf: arfHistorical.rows.length,
  gisRows: gisPages.rows.length,
  facilityDetailSample: evidence.facilityDetailSample,
  publication: evidence.publication,
  blockers: evidence.gate.blockers.map(blocker => blocker.id),
}, null, 2));

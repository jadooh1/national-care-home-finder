#!/usr/bin/env node
/**
 * Read-only California Phase 5 status/eligibility runner.
 * Usage: node --experimental-strip-types scripts/california-phase5-status-eligibility-run.mjs [out.json]
 * Downloads Transparency + historical CHHS CSVs, classifies status conflicts,
 * and verifies a bounded FacilityDetail sample. Does not publish California.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  CALIFORNIA_PHASE5_DOWNLOAD_API,
  buildCaliforniaPhase5Evidence,
  classifyCaliforniaPhase5HistoricalStatusConflict,
  relateCaliforniaPhase5DownloadToFacilityDetail,
  summarizeCaliforniaPhase5HistoricalConflicts,
} from "../lib/california-phase5-status-eligibility.ts";
import { CALIFORNIA_PHASE5_FACILITY_DETAIL_SAMPLE } from "../lib/california-phase5-sample.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCsvLine,
} from "../lib/california-transparency-download.ts";
import {
  fetchCaliforniaFacilityDetail,
  parseCaliforniaFacilityDetail,
} from "../lib/california-status-verification.ts";

const CHHS = {
  rcfeResourceId: "744d1583-f9eb-45b6-b0f8-b9a9dab936a6",
  arfResourceId: "9f5d1d00-6b24-4f44-a158-9cbe4b43f117",
};

const DOWNLOAD_IDS = {
  rcfe: "ResidentialElderCareFacility",
  arf: "AdultResidentialFacilities",
};

const outPath = process.argv[2] ?? "california-phase5-status-eligibility-live.json";
const observedOn = new Date().toISOString().slice(0, 10);
const guid = randomUUID();
const configHeader = californiaTransparencyConfigHeader({ guid });

async function downloadTransparency(file, downloadId) {
  const url = `${CALIFORNIA_PHASE5_DOWNLOAD_API}?${new URLSearchParams({ id: downloadId, GUID: guid })}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,*/*",
      "DSS-Transparency-Config": configHeader,
    },
  });
  const csvText = await response.text();
  return {
    file,
    httpStatus: response.status,
    contentDisposition: response.headers.get("content-disposition"),
    lastModified: response.headers.get("last-modified"),
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
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
      closedDate: get("closed_date"),
      licenseFirstDate: get("license_first_date"),
      fileDate: get("file_date"),
    });
  }
  return rows;
}

async function downloadHistorical(resourceId) {
  const meta = await (await fetch(
    `https://data.chhs.ca.gov/api/3/action/resource_show?id=${resourceId}`,
  )).json();
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

function collectConflicts(file, historical, download) {
  const downloadById = new Map(download.map(row => [row.facilityNumber, row]));
  const conflicts = [];
  for (const row of historical) {
    const dl = downloadById.get(row.facilityNumber);
    if (!dl) continue;
    const hist = (row.facilityStatus || "").trim().toUpperCase();
    const cur = (dl.facilityStatus || "").trim().toUpperCase();
    if (hist === cur) continue;
    conflicts.push({
      file,
      facilityNumber: row.facilityNumber,
      historicalStatus: hist,
      downloadStatus: cur,
      historicalClosedDate: row.closedDate || "",
      downloadLicenseFirstDate: dl.licenseFirstDate || "",
      downloadType: dl.facilityType || "(blank)",
      classification: classifyCaliforniaPhase5HistoricalStatusConflict(hist, cur, {
        historicalClosedDate: row.closedDate,
        downloadLicenseFirstDate: dl.licenseFirstDate,
      }),
    });
  }
  return conflicts;
}

const [rcfeDownload, arfDownload, rcfeHistorical, arfHistorical] = await Promise.all([
  downloadTransparency("RCFE", DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", DOWNLOAD_IDS.arf),
  downloadHistorical(CHHS.rcfeResourceId),
  downloadHistorical(CHHS.arfResourceId),
]);

const conflicts = [
  ...collectConflicts("RCFE", rcfeHistorical.rows, rcfeDownload.rows),
  ...collectConflicts("ARF", arfHistorical.rows, arfDownload.rows),
];
const conflictSummary = summarizeCaliforniaPhase5HistoricalConflicts(conflicts);

const lastRequestAt = { value: 0 };
const facilityDetailSample = [];
const seen = new Set();
for (const target of CALIFORNIA_PHASE5_FACILITY_DETAIL_SAMPLE) {
  if (seen.has(target.facilityNumber)) continue;
  seen.add(target.facilityNumber);
  const fetched = await fetchCaliforniaFacilityDetail(target.facilityNumber, {
    minIntervalMs: 450,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  facilityDetailSample.push({
    facilityNumber: target.facilityNumber,
    file: target.file,
    downloadStatus: target.downloadStatus,
    downloadType: target.downloadType,
    stratum: target.stratum,
    httpStatus: fetched.httpStatus,
    attempts: fetched.attempts,
    timedOut: fetched.timedOut,
    liveFacilityNumber: parse?.facilityNumber ?? null,
    liveStatus: parse?.status ?? null,
    liveFacilityType: parse?.facilityType ?? null,
    found: Boolean(parse?.found),
    relation: relateCaliforniaPhase5DownloadToFacilityDetail(
      target.downloadStatus,
      parse?.status ?? null,
      { downloadFacilityNumber: target.facilityNumber },
    ),
  });
}

const evidence = buildCaliforniaPhase5Evidence({
  observedOn,
  historicalConflicts: conflicts,
  rcfeRows: rcfeDownload.rows,
  arfRows: arfDownload.rows,
  facilityDetailSample,
});

const output = {
  observedOn,
  download: {
    rcfe: {
      httpStatus: rcfeDownload.httpStatus,
      contentDisposition: rcfeDownload.contentDisposition,
      lastModified: rcfeDownload.lastModified,
      bytes: rcfeDownload.bytes,
      sha256: rcfeDownload.sha256,
      rows: rcfeDownload.rows.length,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      lastModified: arfDownload.lastModified,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
    },
  },
  conflictSummary,
  conflictTransitionCounts: conflicts.reduce((acc, row) => {
    const key = `${row.historicalStatus} -> ${row.downloadStatus}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}),
  facilityDetailSample,
  evidence,
};

writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({
  observedOn,
  conflicts: conflictSummary,
  sample: evidence.facilityDetailSample,
  publication: evidence.publication,
  outPath,
}, null, 2));

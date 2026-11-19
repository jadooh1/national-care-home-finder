#!/usr/bin/env node
/**
 * Read-only live DownloadStateData runner for California Phase 3.
 * Usage: node --experimental-strip-types scripts/california-transparency-download-run.mjs [out.json]
 * Does not write database records or publish California.
 */
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import {
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS,
  buildCaliforniaTransparencyDownloadEvidence,
  californiaTransparencyConfigHeader,
  californiaTransparencyDownloadUrl,
  parseCaliforniaTransparencyDownloadCsv,
  relateCaliforniaDownloadStatusToFacilityDetail,
} from "../lib/california-transparency-download.ts";
import { CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE } from "../lib/california-transparency-download-sample.ts";
import {
  fetchCaliforniaFacilityDetail,
  parseCaliforniaFacilityDetail,
} from "../lib/california-status-verification.ts";

const outPath = process.argv[2] ?? "california-transparency-download-live.json";
const observedOn = new Date().toISOString().slice(0, 10);
const guid = randomUUID();
const configHeader = californiaTransparencyConfigHeader({ guid });

const downloads = {};
for (const [file, downloadId] of [
  ["RCFE", CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS.rcfe],
  ["ARF", CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS.arf],
]) {
  const url = californiaTransparencyDownloadUrl(downloadId, guid);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,*/*",
      "DSS-Transparency-Config": configHeader,
    },
  });
  const csvText = await response.text();
  const contentDisposition = response.headers.get("content-disposition");
  const rows = parseCaliforniaTransparencyDownloadCsv(csvText);
  const evidence = buildCaliforniaTransparencyDownloadEvidence({
    file,
    contentDispositionOrFilename: contentDisposition,
    rows,
  });
  downloads[file] = {
    httpStatus: response.status,
    contentType: response.headers.get("content-type"),
    contentDisposition,
    bytes: Buffer.byteLength(csvText),
    evidence: {
      filenameDate: evidence.filenameDate,
      adoptedExportDate: evidence.adoptedExportDate,
      roster: evidence.roster,
      publication: evidence.publication,
      ownerClaimEligible: evidence.ownerClaimEligible,
    },
  };
}

const lastRequestAt = { value: 0 };
const stratified = [];
for (const target of CALIFORNIA_TRANSPARENCY_DOWNLOAD_SAMPLE) {
  const fetched = await fetchCaliforniaFacilityDetail(target.facilityNumber, {
    minIntervalMs: 450,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const relation = relateCaliforniaDownloadStatusToFacilityDetail(
    target.downloadStatus,
    parse?.status ?? null,
    {
      downloadFacilityNumber: target.facilityNumber,
      liveFacilityNumber: parse?.facilityNumber ?? null,
    },
  );
  stratified.push({
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

const report = {
  observedOn,
  publication: "unpublished",
  ownerClaimEligible: false,
  downloads,
  stratified,
  stratifiedSummary: Object.fromEntries(
    ["match", "conflict", "missing-live", "invalid-download-id"].map(key => [
      key,
      stratified.filter(row => row.relation === key).length,
    ]),
  ),
};

writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  outPath,
  observedOn,
  rcfeRows: downloads.RCFE?.evidence?.roster?.rowCount ?? null,
  arfRows: downloads.ARF?.evidence?.roster?.rowCount ?? null,
  rcfeFilenameDate: downloads.RCFE?.evidence?.filenameDate ?? null,
  arfFilenameDate: downloads.ARF?.evidence?.filenameDate ?? null,
  stratifiedSummary: report.stratifiedSummary,
  publication: report.publication,
}, null, 2));

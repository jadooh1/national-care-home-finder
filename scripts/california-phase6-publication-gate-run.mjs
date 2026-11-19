#!/usr/bin/env node
/**
 * Read-only California Phase 6 publication-gate runner.
 * Usage: node --experimental-strip-types scripts/california-phase6-publication-gate-run.mjs [out.json]
 * Downloads official CDSS DownloadStateData CSVs, evaluates the publication gate,
 * and writes deterministic counts. Does not publish California.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
  evaluateCaliforniaPhase6PublicationGate,
  californiaPhase6AllowsPublication,
} from "../lib/california-phase6-publication-gate.ts";
import { CALIFORNIA_PHASE6_EXCEPTIONS } from "../lib/california-phase6-exceptions.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
  adoptCaliforniaTransparencyDownloadExportDate,
} from "../lib/california-transparency-download.ts";

const outPath = process.argv[2] ?? "california-phase6-publication-gate-live.json";
const observedOn = new Date().toISOString().slice(0, 10);
const guid = randomUUID();
const configHeader = californiaTransparencyConfigHeader({ guid });

async function downloadTransparency(file, downloadId) {
  const url = `${CALIFORNIA_PHASE6_DOWNLOAD_API}?${new URLSearchParams({
    id: downloadId,
    GUID: guid,
  })}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,*/*",
      "DSS-Transparency-Config": configHeader,
    },
  });
  const csvText = await response.text();
  const filenameDate = parseCaliforniaTransparencyDownloadFilenameDate(
    response.headers.get("content-disposition"),
  );
  return {
    file,
    httpStatus: response.status,
    contentDisposition: response.headers.get("content-disposition"),
    lastModified: response.headers.get("last-modified"),
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
    filenameDate,
    adoptedExportDate: adoptCaliforniaTransparencyDownloadExportDate(filenameDate),
    csvHasFileDateColumn: /\bfile_date\b/i.test((csvText.split(/\r?\n/, 1)[0] ?? "")),
    rows: parseCaliforniaTransparencyDownloadCsv(csvText),
  };
}

const [rcfeDownload, arfDownload] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
]);

const evaluation = evaluateCaliforniaPhase6PublicationGate({
  observedOn,
  rcfeRows: rcfeDownload.rows,
  arfRows: arfDownload.rows,
  exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
  // Filename date is never authoritative; leave null so the gate stays blocked.
  authoritativeIsoExportDate: null,
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
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
      adoptedExportDate: rcfeDownload.adoptedExportDate,
      csvHasFileDateColumn: rcfeDownload.csvHasFileDateColumn,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      lastModified: arfDownload.lastModified,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
      filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
      adoptedExportDate: arfDownload.adoptedExportDate,
      csvHasFileDateColumn: arfDownload.csvHasFileDateColumn,
    },
    authoritativeIsoExportDate: null,
    freshness: {
      httpLastModifiedPresent: Boolean(
        rcfeDownload.lastModified || arfDownload.lastModified,
      ),
      csvBodyFileDateColumnPresent:
        rcfeDownload.csvHasFileDateColumn || arfDownload.csvHasFileDateColumn,
      facilityDetailExportTimestampPresent: false,
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
      chhsRawFileDateText: "05252025",
    },
  },
  exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
  evaluation,
  allowsPublication: californiaPhase6AllowsPublication(evaluation),
};

writeFileSync(outPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  gate: evaluation.gate.publication,
  freshnessSatisfied: evaluation.freshness.satisfied,
  allowsPublication: false,
  totals: evaluation.totals,
  rcfe: {
    rows: evaluation.rcfe.rowCount,
    active: evaluation.rcfe.activeCandidates,
    restricted: evaluation.rcfe.restrictedCandidates,
    excluded: evaluation.rcfe.excluded,
    exceptions: evaluation.rcfe.exceptions,
    invalidIds: evaluation.rcfe.invalidIdentifiers,
    duplicates: evaluation.rcfe.duplicateFacilityNumbers,
    missingAddresses: evaluation.rcfe.missingAddressCount,
    byTypeEligible: {
      "RESIDENTIAL CARE ELDERLY": evaluation.rcfe.byType["RESIDENTIAL CARE ELDERLY"] ?? 0,
      "RCFE-CONTINUING CARE RETIREMENT COMMUNITY":
        evaluation.rcfe.byType["RCFE-CONTINUING CARE RETIREMENT COMMUNITY"] ?? 0,
    },
    byStatus: evaluation.rcfe.byStatus,
    exclusionReasons: evaluation.rcfe.exclusionReasons,
  },
  arf: {
    rows: evaluation.arf.rowCount,
    active: evaluation.arf.activeCandidates,
    restricted: evaluation.arf.restrictedCandidates,
    excluded: evaluation.arf.excluded,
    exceptions: evaluation.arf.exceptions,
    invalidIds: evaluation.arf.invalidIdentifiers,
    duplicates: evaluation.arf.duplicateFacilityNumbers,
    missingAddresses: evaluation.arf.missingAddressCount,
    byType: evaluation.arf.byType,
    byStatus: evaluation.arf.byStatus,
    exclusionReasons: evaluation.arf.exclusionReasons,
  },
  outPath,
};

console.log(JSON.stringify(summary, null, 2));

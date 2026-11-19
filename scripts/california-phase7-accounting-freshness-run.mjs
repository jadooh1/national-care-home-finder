#!/usr/bin/env node
/**
 * Read-only California Phase 7 accounting + freshness runner.
 * Usage: node --experimental-strip-types scripts/california-phase7-accounting-freshness-run.mjs [out.json]
 * Downloads official CDSS DownloadStateData CSVs, reconciles exclusive buckets,
 * audits capacity/coordinate columns, evaluates freshness channels, and writes a
 * reproducible report. Does not publish California.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
  evaluateCaliforniaPhase6PublicationGate,
  evaluateCaliforniaPhase6Row,
} from "../lib/california-phase6-publication-gate.ts";
import { CALIFORNIA_PHASE6_EXCEPTIONS } from "../lib/california-phase6-exceptions.ts";
import {
  CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS,
  CALIFORNIA_PHASE7_READINESS_MATRIX,
  auditCaliforniaPhase7DownloadCsvFields,
  californiaPhase7AllowsPublication,
  evaluateCaliforniaPhase7Accounting,
} from "../lib/california-phase7-accounting.ts";
import {
  evaluateCaliforniaPhase7Freshness,
  adoptCaliforniaPhase7AuthoritativeExportDate,
} from "../lib/california-phase7-freshness.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
  adoptCaliforniaTransparencyDownloadExportDate,
} from "../lib/california-transparency-download.ts";

const outPath = process.argv[2] ?? "california-phase7-accounting-freshness-live.json";
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
    httpDate: response.headers.get("date"),
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
    filenameDate,
    adoptedExportDate: adoptCaliforniaTransparencyDownloadExportDate(filenameDate),
    fieldAudit: auditCaliforniaPhase7DownloadCsvFields(csvText),
    rows: parseCaliforniaTransparencyDownloadCsv(csvText),
  };
}

function evaluateFileRows(file, rows, exceptionsById) {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    const id = String(row.facilityNumber ?? "").trim();
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  }
  return rows.map(row =>
    evaluateCaliforniaPhase6Row(file, row, {
      duplicateFacilityNumbers: duplicates,
      exceptionsById,
    })
  );
}

const [rcfeDownload, arfDownload] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
]);

const exceptionsById = new Map(
  CALIFORNIA_PHASE6_EXCEPTIONS.map(row => [row.facilityNumber, row]),
);
const phase6 = evaluateCaliforniaPhase6PublicationGate({
  observedOn,
  rcfeRows: rcfeDownload.rows,
  arfRows: arfDownload.rows,
  exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
  authoritativeIsoExportDate: null,
});
const accounting = evaluateCaliforniaPhase7Accounting({
  observedOn,
  phase6,
  rcfePhase6Rows: evaluateFileRows("RCFE", rcfeDownload.rows, exceptionsById),
  arfPhase6Rows: evaluateFileRows("ARF", arfDownload.rows, exceptionsById),
  exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
});

const freshness = evaluateCaliforniaPhase7Freshness({ observedOn });

const filenameIsoRejected = adoptCaliforniaPhase7AuthoritativeExportDate(
  rcfeDownload.filenameDate.isoCandidate,
  { source: "download-filename-mmddyyyy" },
);
const downloadTimestampRejected = adoptCaliforniaPhase7AuthoritativeExportDate(
  observedOn,
  { source: "download-timestamp" },
);

const output = {
  observedOn,
  download: {
    rcfe: {
      httpStatus: rcfeDownload.httpStatus,
      contentDisposition: rcfeDownload.contentDisposition,
      lastModified: rcfeDownload.lastModified,
      httpDate: rcfeDownload.httpDate,
      bytes: rcfeDownload.bytes,
      sha256: rcfeDownload.sha256,
      rows: rcfeDownload.rows.length,
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
      adoptedExportDate: rcfeDownload.adoptedExportDate,
      fieldAudit: rcfeDownload.fieldAudit,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      lastModified: arfDownload.lastModified,
      httpDate: arfDownload.httpDate,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
      filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
      adoptedExportDate: arfDownload.adoptedExportDate,
      fieldAudit: arfDownload.fieldAudit,
    },
    authoritativeIsoExportDate: null,
    filenameIsoAdoption: filenameIsoRejected,
    downloadTimestampAdoption: downloadTimestampRejected,
  },
  phase6FiveRecordGap: accounting.phase6FiveRecordGap,
  exceptionDocumentedExcludeIds: accounting.totals.exceptionDocumentedExcludeIds,
  expectedExceptionOutcomeIds: [...CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS],
  accounting: {
    totals: accounting.totals,
    rcfe: {
      rowCount: accounting.rcfe.rowCount,
      buckets: accounting.rcfe.buckets,
      invariant: accounting.rcfe.invariant,
      exceptionDocumentedExcludeIds: accounting.rcfe.exceptionDocumentedExcludeIds,
      invalidIdentifiers: accounting.rcfe.invalidIdentifiers,
      unknownStatuses: accounting.rcfe.unknownStatuses,
      unknownTypes: accounting.rcfe.unknownTypes,
      missingAddresses: accounting.rcfe.missingAddresses,
      unsupportedStatusMappings: accounting.rcfe.unsupportedStatusMappings,
    },
    arf: {
      rowCount: accounting.arf.rowCount,
      buckets: accounting.arf.buckets,
      invariant: accounting.arf.invariant,
      exceptionDocumentedExcludeIds: accounting.arf.exceptionDocumentedExcludeIds,
      invalidIdentifiers: accounting.arf.invalidIdentifiers,
      unknownStatuses: accounting.arf.unknownStatuses,
      unknownTypes: accounting.arf.unknownTypes,
      missingAddresses: accounting.arf.missingAddresses,
      unsupportedStatusMappings: accounting.arf.unsupportedStatusMappings,
    },
  },
  freshness,
  readiness: CALIFORNIA_PHASE7_READINESS_MATRIX,
  publication: accounting.publication,
  ownerClaimEligible: accounting.ownerClaimEligible,
  allowsPublication: californiaPhase7AllowsPublication(accounting),
  gateBlocked: true,
};

writeFileSync(outPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  rowCount: accounting.totals.rowCount,
  buckets: accounting.totals.buckets,
  invariantHolds: accounting.totals.invariant.holds,
  phase6GapResolved: accounting.phase6FiveRecordGap.resolved,
  exceptionIds: accounting.totals.exceptionDocumentedExcludeIds,
  freshnessSatisfied: freshness.satisfied,
  authoritativeIsoExportDate: null,
  allowsPublication: false,
  capacityColumnPresent:
    rcfeDownload.fieldAudit.facilityCapacityColumnPresent
    && arfDownload.fieldAudit.facilityCapacityColumnPresent,
  coordinatesAbsent:
    rcfeDownload.fieldAudit.coordinatesStillAbsent
    && arfDownload.fieldAudit.coordinatesStillAbsent,
  outPath,
};

console.log(JSON.stringify(summary, null, 2));

#!/usr/bin/env node
/**
 * Read-only California Phase 10 freshness / readiness runner.
 * Usage: node --experimental-strip-types scripts/california-phase10-freshness-readiness-run.mjs [out.json]
 *
 * Revalidates DownloadStateData accounting + Phase 9 coordinate coverage,
 * probes freshness channels (including Transparency FAQ weekly cadence), and
 * emits a publication-readiness decision. Does not publish California. Does
 * not send the CDSS clarification draft.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fetchCaliforniaCclGisPages } from "../lib/california-ccl-arcgis-probe.ts";
import { CALIFORNIA_PHASE6_EXCEPTIONS } from "../lib/california-phase6-exceptions.ts";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
  evaluateCaliforniaPhase6PublicationGate,
  evaluateCaliforniaPhase6Row,
} from "../lib/california-phase6-publication-gate.ts";
import {
  CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS,
  evaluateCaliforniaPhase7Accounting,
} from "../lib/california-phase7-accounting.ts";
import { auditCaliforniaPhase9MissingCapacity } from "../lib/california-phase9-capacity.ts";
import {
  reconcileCaliforniaPhase8Coordinates,
  splitCaliforniaPhase8CoordinateCoverage,
} from "../lib/california-phase8-coordinates.ts";
import {
  reconcileCaliforniaPhase9Coordinates,
  splitCaliforniaPhase9CoordinateCoverage,
} from "../lib/california-phase9-coordinates.ts";
import { transparencyRowToPhase6CapacityFields } from "../lib/california-phase8-quality.ts";
import {
  adoptCaliforniaPhase10AuthoritativeExportDate,
  evaluateCaliforniaPhase10Freshness,
} from "../lib/california-phase10-freshness.ts";
import {
  evaluateCaliforniaPhase10Quality,
} from "../lib/california-phase10-quality.ts";
import {
  CALIFORNIA_PHASE10_READINESS_DECISION,
  californiaPhase10AllowsPublication,
} from "../lib/california-phase10-readiness.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
  adoptCaliforniaTransparencyDownloadExportDate,
} from "../lib/california-transparency-download.ts";

const outPath = process.argv[2] ?? "california-phase10-freshness-readiness-live.json";
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
  const rows = parseCaliforniaTransparencyDownloadCsv(csvText);
  const header = (csvText.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "");
  return {
    file,
    httpStatus: response.status,
    contentDisposition: response.headers.get("content-disposition"),
    lastModified: response.headers.get("last-modified"),
    etag: response.headers.get("etag"),
    cacheControl: response.headers.get("cache-control"),
    httpDate: response.headers.get("date"),
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
    filenameDate,
    adoptedExportDate: adoptCaliforniaTransparencyDownloadExportDate(filenameDate),
    capacityColumnPresent: /facility capacity/i.test(header),
    fileDateColumnPresent: /\bfile_date\b/i.test(header),
    latitudeColumnPresent: /latitude/i.test(header),
    longitudeColumnPresent: /longitude/i.test(header),
    rows,
  };
}

function toPhase6Rows(rows) {
  return rows.map(row => ({
    ...row,
    ...transparencyRowToPhase6CapacityFields(row),
  }));
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

const [rcfeDownload, arfDownload, gisPages] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
  fetchCaliforniaCclGisPages({ pageSize: 1000 }),
]);

const exceptionsById = new Map(
  CALIFORNIA_PHASE6_EXCEPTIONS.map(row => [row.facilityNumber, row]),
);
const rcfePhase6Rows = evaluateFileRows(
  "RCFE",
  toPhase6Rows(rcfeDownload.rows),
  exceptionsById,
);
const arfPhase6Rows = evaluateFileRows(
  "ARF",
  toPhase6Rows(arfDownload.rows),
  exceptionsById,
);

const phase6 = evaluateCaliforniaPhase6PublicationGate({
  observedOn,
  rcfeRows: toPhase6Rows(rcfeDownload.rows),
  arfRows: toPhase6Rows(arfDownload.rows),
  exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
  authoritativeIsoExportDate: null,
});

const accounting = evaluateCaliforniaPhase7Accounting({
  observedOn,
  phase6,
  rcfePhase6Rows,
  arfPhase6Rows,
  exceptions: CALIFORNIA_PHASE6_EXCEPTIONS,
});

const downloadById = new Map(
  [...rcfeDownload.rows, ...arfDownload.rows].map(row => [
    String(row.facilityNumber).trim(),
    row,
  ]),
);

const candidates = [...rcfePhase6Rows, ...arfPhase6Rows]
  .filter(row =>
    row.outcome === "active-candidate" || row.outcome === "restricted-candidate"
  )
  .map(row => ({
    facilityNumber: row.facilityNumber,
    outcome: row.outcome,
    file: row.file,
  }));

const phase8Coords = reconcileCaliforniaPhase8Coordinates({
  candidates,
  gis: gisPages.rows,
});
const phase8Split = splitCaliforniaPhase8CoordinateCoverage(phase8Coords.matches);
const coordinated = reconcileCaliforniaPhase9Coordinates({
  phase8Matches: phase8Coords.matches,
  phase8Coverage: phase8Coords.coverage,
  gis: gisPages.rows,
  downloadById,
});
const split = splitCaliforniaPhase9CoordinateCoverage(
  coordinated.matches,
  phase8Split.active,
  phase8Split.restricted,
);

const missingCapacity = auditCaliforniaPhase9MissingCapacity({
  observedOn,
  rows: [...rcfePhase6Rows, ...arfPhase6Rows].map(row => {
    const dl = downloadById.get(row.facilityNumber);
    return {
      facilityNumber: row.facilityNumber,
      file: row.file,
      facilityType: dl?.facilityType,
      facilityName: dl?.facilityName,
      facilityStatus: dl?.facilityStatus,
      facilityCapacity: dl?.facilityCapacity,
      outcome: row.outcome,
    };
  }),
});

const freshness = evaluateCaliforniaPhase10Freshness({ observedOn });
const verifiedOfficialCoords =
  coordinated.coverage.exactMatchWithValidCoords
  + coordinated.coverage.newlyVerifiedIdentityCorroborated;
const unresolved =
  coordinated.coverage.unmatched
  + coordinated.coverage.leadingZeroIdentityRejected;

const quality = evaluateCaliforniaPhase10Quality({
  observedOn,
  buckets: accounting.totals.buckets,
  rowCount: accounting.totals.rowCount,
  publicationCandidatesIfGateOpened:
    accounting.totals.publicationCandidatesIfGateOpened,
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
  capacity: {
    totalMissing: missingCapacity.totalMissing,
    rcfeMissing: missingCapacity.rcfeMissing,
    arfMissing: missingCapacity.arfMissing,
    publicationCandidateMissing: missingCapacity.publicationCandidateMissing,
  },
  coordinates: {
    verifiedOfficialCoords,
    unresolved,
  },
});

const filenameIsoRejected = adoptCaliforniaPhase10AuthoritativeExportDate(
  rcfeDownload.filenameDate.isoCandidate,
  { source: "download-filename-mmddyyyy" },
);
const weeklyCadenceRejected = adoptCaliforniaPhase10AuthoritativeExportDate(
  "2026-11-15",
  { source: "transparency-faq-weekly-update" },
);

const output = {
  observedOn,
  download: {
    rcfe: {
      httpStatus: rcfeDownload.httpStatus,
      contentDisposition: rcfeDownload.contentDisposition,
      lastModified: rcfeDownload.lastModified,
      etag: rcfeDownload.etag,
      cacheControl: rcfeDownload.cacheControl,
      httpDate: rcfeDownload.httpDate,
      bytes: rcfeDownload.bytes,
      sha256: rcfeDownload.sha256,
      rows: rcfeDownload.rows.length,
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
      adoptedExportDate: rcfeDownload.adoptedExportDate,
      capacityColumnPresent: rcfeDownload.capacityColumnPresent,
      fileDateColumnPresent: rcfeDownload.fileDateColumnPresent,
      latitudeColumnPresent: rcfeDownload.latitudeColumnPresent,
      longitudeColumnPresent: rcfeDownload.longitudeColumnPresent,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      lastModified: arfDownload.lastModified,
      etag: arfDownload.etag,
      cacheControl: arfDownload.cacheControl,
      httpDate: arfDownload.httpDate,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
      filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
      adoptedExportDate: arfDownload.adoptedExportDate,
      capacityColumnPresent: arfDownload.capacityColumnPresent,
      fileDateColumnPresent: arfDownload.fileDateColumnPresent,
      latitudeColumnPresent: arfDownload.latitudeColumnPresent,
      longitudeColumnPresent: arfDownload.longitudeColumnPresent,
    },
    authoritativeIsoExportDate: null,
    filenameIsoAdoption: filenameIsoRejected,
    weeklyCadenceAdoption: weeklyCadenceRejected,
  },
  gis: {
    rows: gisPages.rows.length,
    pages: gisPages.pages,
    complete: gisPages.complete,
  },
  accounting: {
    totals: accounting.totals,
    phase6FiveRecordGap: accounting.phase6FiveRecordGap,
    exceptionDocumentedExcludeIds: accounting.totals.exceptionDocumentedExcludeIds,
    expectedExceptionOutcomeIds: [...CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS],
  },
  missingCapacity,
  coordinates: {
    allCandidates: coordinated.coverage,
    active: split.active,
    restricted: split.restricted,
    verifiedOfficialCoords,
    unresolved,
  },
  freshness,
  readiness: CALIFORNIA_PHASE10_READINESS_DECISION,
  quality,
  publication: quality.publication,
  ownerClaimEligible: quality.ownerClaimEligible,
  allowsPublication: californiaPhase10AllowsPublication(),
  gateBlocked: true,
  gate: quality.gate,
  cdssClarificationRequest: {
    status: freshness.cdssClarificationRequest.status,
    toSuggested: freshness.cdssClarificationRequest.toSuggested,
    subject: freshness.cdssClarificationRequest.subject,
  },
};

writeFileSync(outPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  rowCount: accounting.totals.rowCount,
  buckets: accounting.totals.buckets,
  invariantHolds: accounting.totals.invariant.holds,
  missingCapacity: {
    total: missingCapacity.totalMissing,
    publicationCandidates: missingCapacity.publicationCandidateMissing,
  },
  coordinates: {
    verifiedOfficialCoords,
    unresolved,
    fabricated: coordinated.coverage.fabricatedCoordinates,
  },
  freshnessSatisfied: freshness.satisfied,
  authoritativeIsoExportDate: null,
  officialWeeklyCadenceDocumented:
    freshness.recommendation.officialWeeklyCadenceDocumented,
  recommendation: freshness.recommendation.policy,
  publicationReady: CALIFORNIA_PHASE10_READINESS_DECISION.publicationReady,
  allowsPublication: false,
  gate: "blocked",
  cdssRequestDraft: freshness.cdssClarificationRequest.status,
  sourceDataChanged: quality.revalidation.sourceDataChanged,
  outPath,
};

console.log(JSON.stringify(summary, null, 2));

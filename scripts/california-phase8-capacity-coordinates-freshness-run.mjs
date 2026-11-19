#!/usr/bin/env node
/**
 * Read-only California Phase 8 capacity / coordinates / freshness runner.
 * Usage: node --experimental-strip-types scripts/california-phase8-capacity-coordinates-freshness-run.mjs [out.json]
 *
 * Downloads official CDSS DownloadStateData + historical CHHS + ArcGIS pages,
 * preserves Facility Capacity through the Transparency parser, quantifies
 * capacity quality, matches coordinates by exact licensing ID, reassesses
 * freshness channels, and writes a reproducible report. Does not publish California.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fetchCaliforniaCclGisPages } from "../lib/california-ccl-arcgis-probe.ts";
import { CALIFORNIA_PHASE4_CHHS } from "../lib/california-phase4-reconciliation.ts";
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
import {
  auditCaliforniaPhase8Capacity,
  mergeCaliforniaPhase8CapacityAudits,
} from "../lib/california-phase8-capacity.ts";
import {
  reconcileCaliforniaPhase8Coordinates,
  splitCaliforniaPhase8CoordinateCoverage,
} from "../lib/california-phase8-coordinates.ts";
import {
  adoptCaliforniaPhase8AuthoritativeExportDate,
  evaluateCaliforniaPhase8Freshness,
} from "../lib/california-phase8-freshness.ts";
import {
  CALIFORNIA_PHASE8_OBSERVED_COUNTS,
  CALIFORNIA_PHASE8_READINESS_MATRIX,
  californiaPhase8AllowsPublication,
  evaluateCaliforniaPhase8Quality,
  transparencyRowToPhase6CapacityFields,
} from "../lib/california-phase8-quality.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
  parseCsvLine,
  adoptCaliforniaTransparencyDownloadExportDate,
} from "../lib/california-transparency-download.ts";

const outPath = process.argv[2] ?? "california-phase8-capacity-coordinates-freshness-live.json";
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
      facilityCapacity: get("facility_capacity"),
      facilityStatus: get("facility_status"),
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

const [rcfeDownload, arfDownload, rcfeHistorical, arfHistorical, gisPages] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
  downloadHistorical(CALIFORNIA_PHASE4_CHHS.rcfeResourceId),
  downloadHistorical(CALIFORNIA_PHASE4_CHHS.arfResourceId),
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

const candidates = [...rcfePhase6Rows, ...arfPhase6Rows]
  .filter(row =>
    row.outcome === "active-candidate" || row.outcome === "restricted-candidate"
  )
  .map(row => ({
    facilityNumber: row.facilityNumber,
    outcome: row.outcome,
    file: row.file,
  }));

const rcfeCapacity = auditCaliforniaPhase8Capacity({
  file: "RCFE",
  download: rcfeDownload.rows.map(row => ({
    facilityNumber: row.facilityNumber,
    facilityCapacity: row.facilityCapacity,
  })),
  historical: rcfeHistorical.rows,
  gis: gisPages.rows,
});
const arfCapacity = auditCaliforniaPhase8Capacity({
  file: "ARF",
  download: arfDownload.rows.map(row => ({
    facilityNumber: row.facilityNumber,
    facilityCapacity: row.facilityCapacity,
  })),
  historical: arfHistorical.rows,
  gis: gisPages.rows,
});
const capacity = mergeCaliforniaPhase8CapacityAudits(rcfeCapacity, arfCapacity);
const coordinated = reconcileCaliforniaPhase8Coordinates({
  candidates,
  gis: gisPages.rows,
});
const split = splitCaliforniaPhase8CoordinateCoverage(coordinated.matches);
const freshness = evaluateCaliforniaPhase8Freshness({ observedOn });

const quality = evaluateCaliforniaPhase8Quality({
  observedOn,
  buckets: accounting.totals.buckets,
  rowCount: accounting.totals.rowCount,
  publicationCandidatesIfGateOpened:
    accounting.totals.publicationCandidatesIfGateOpened,
  capacity,
  coordinates: {
    allCandidates: coordinated.coverage,
    active: split.active,
    restricted: split.restricted,
  },
  freshness,
});

const filenameIsoRejected = adoptCaliforniaPhase8AuthoritativeExportDate(
  rcfeDownload.filenameDate.isoCandidate,
  { source: "download-filename-mmddyyyy" },
);
const retrievalTimestampRejected = adoptCaliforniaPhase8AuthoritativeExportDate(
  observedOn,
  { source: "download-retrieval-timestamp" },
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
      capacityColumnPresent: rcfeDownload.capacityColumnPresent,
      fileDateColumnPresent: rcfeDownload.fileDateColumnPresent,
      latitudeColumnPresent: rcfeDownload.latitudeColumnPresent,
      longitudeColumnPresent: rcfeDownload.longitudeColumnPresent,
      capacityPreservedByParser: rcfeDownload.rows.some(r => r.facilityCapacity !== ""),
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
      capacityColumnPresent: arfDownload.capacityColumnPresent,
      fileDateColumnPresent: arfDownload.fileDateColumnPresent,
      latitudeColumnPresent: arfDownload.latitudeColumnPresent,
      longitudeColumnPresent: arfDownload.longitudeColumnPresent,
      capacityPreservedByParser: arfDownload.rows.some(r => r.facilityCapacity !== ""),
    },
    authoritativeIsoExportDate: null,
    filenameIsoAdoption: filenameIsoRejected,
    retrievalTimestampAdoption: retrievalTimestampRejected,
  },
  historical: {
    rcfeRows: rcfeHistorical.rows.length,
    arfRows: arfHistorical.rows.length,
    chhsRawFileDate: CALIFORNIA_PHASE4_CHHS.rawFileDate,
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
  capacity: quality.capacity,
  coordinates: quality.coordinates,
  freshness,
  readiness: CALIFORNIA_PHASE8_READINESS_MATRIX,
  baseline: CALIFORNIA_PHASE8_OBSERVED_COUNTS,
  publication: quality.publication,
  ownerClaimEligible: quality.ownerClaimEligible,
  allowsPublication: californiaPhase8AllowsPublication(quality),
  gateBlocked: true,
  gate: quality.gate,
};

writeFileSync(outPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  rowCount: accounting.totals.rowCount,
  buckets: accounting.totals.buckets,
  invariantHolds: accounting.totals.invariant.holds,
  capacity: {
    rcfe: quality.capacity.rcfe.quality,
    arf: quality.capacity.arf.quality,
    totals: quality.capacity.quality,
    officialValuesOverwritten: quality.capacity.crossSource.officialValuesOverwritten,
  },
  coordinates: {
    candidates: quality.coordinates.allCandidates.candidateCount,
    exactValid: quality.coordinates.allCandidates.exactMatchWithValidCoords,
    leadingZeroCollapsedValid:
      quality.coordinates.allCandidates.leadingZeroCollapsedUniqueWithValidCoords,
    ambiguousRejected: quality.coordinates.allCandidates.ambiguousRejected,
    exactValidCoverageRate: quality.coordinates.allCandidates.exactValidCoverageRate,
    usableOfficialCoordsRate: quality.coordinates.allCandidates.usableOfficialCoordsRate,
    fabricated: quality.coordinates.allCandidates.fabricatedCoordinates,
  },
  freshnessSatisfied: freshness.satisfied,
  authoritativeIsoExportDate: null,
  allowsPublication: false,
  gate: "blocked",
  outPath,
};

console.log(JSON.stringify(summary, null, 2));

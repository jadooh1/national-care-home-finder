#!/usr/bin/env node
/**
 * Read-only California Phase 11 disclosure-link + licensing-status runner.
 * Usage: node --experimental-strip-types scripts/california-phase11-disclosure-status-run.mjs [out.json]
 *
 * Verifies canonical CDSS FacDetail / disclosure URL patterns on a bounded
 * stratified sample and compares DownloadStateData statuses to live
 * FacilityDetail. Does not publish California. Does not send CDSS email.
 */
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  CALIFORNIA_PHASE11_DISCLOSURE_LINK_SAMPLE,
  CALIFORNIA_PHASE11_STATUS_SAMPLE,
} from "../lib/california-phase11-sample.ts";
import {
  classifyCaliforniaPhase11DisclosureLink,
  generateCaliforniaPhase11DisclosureLinks,
  summarizeCaliforniaPhase11DisclosureLinks,
  CALIFORNIA_PHASE11_DISCLOSURE_URL_PATTERNS,
} from "../lib/california-phase11-disclosure-links.ts";
import {
  observeCaliforniaPhase11Status,
  summarizeCaliforniaPhase11StatusVerification,
} from "../lib/california-phase11-status-verification.ts";
import {
  CALIFORNIA_PHASE11_READINESS_DECISION,
  californiaPhase11AllowsPublication,
} from "../lib/california-phase11-readiness.ts";
import {
  CALIFORNIA_PHASE11_OBSERVED_COUNTS,
  evaluateCaliforniaPhase11Quality,
} from "../lib/california-phase11-quality.ts";
import {
  CALIFORNIA_PHASE6_DOWNLOAD_API,
  CALIFORNIA_PHASE6_DOWNLOAD_IDS,
} from "../lib/california-phase6-publication-gate.ts";
import {
  californiaTransparencyConfigHeader,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
} from "../lib/california-transparency-download.ts";
import {
  fetchCaliforniaFacilityDetail,
  parseCaliforniaFacilityDetail,
} from "../lib/california-status-verification.ts";

const outPath = process.argv[2] ?? "california-phase11-disclosure-status-live.json";
const observedOn = new Date().toISOString().slice(0, 10);
const guid = randomUUID();
const configHeader = californiaTransparencyConfigHeader({ guid });
const lastRequestAt = { value: 0 };

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
  return {
    file,
    httpStatus: response.status,
    contentDisposition: response.headers.get("content-disposition"),
    lastModified: response.headers.get("last-modified"),
    bytes: Buffer.byteLength(csvText),
    sha256: createHash("sha256").update(csvText).digest("hex"),
    filenameDate: parseCaliforniaTransparencyDownloadFilenameDate(
      response.headers.get("content-disposition"),
    ),
    rows: parseCaliforniaTransparencyDownloadCsv(csvText),
  };
}

async function probePage(url) {
  if (!url) return { httpStatus: null };
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow" });
    return { httpStatus: response.status };
  } catch {
    return { httpStatus: 0 };
  }
}

console.log("Phase 11: downloading DownloadStateData for sha256 revalidation...");
const [rcfeDownload, arfDownload] = await Promise.all([
  downloadTransparency("RCFE", CALIFORNIA_PHASE6_DOWNLOAD_IDS.rcfe),
  downloadTransparency("ARF", CALIFORNIA_PHASE6_DOWNLOAD_IDS.arf),
]);

const downloadById = new Map(
  [...rcfeDownload.rows, ...arfDownload.rows].map(row => [
    String(row.facilityNumber).trim(),
    row,
  ]),
);

console.log(
  `Phase 11: validating ${CALIFORNIA_PHASE11_DISCLOSURE_LINK_SAMPLE.length} disclosure links...`,
);
const disclosureResults = [];
for (const target of CALIFORNIA_PHASE11_DISCLOSURE_LINK_SAMPLE) {
  const requestId = target.requestFacilityNumber ?? target.facilityNumber;
  const generatedForOfficial = generateCaliforniaPhase11DisclosureLinks(target.facilityNumber);
  const pageProbe = await probePage(generatedForOfficial.pageUrl);
  // Rate-limit API after page probe.
  const fetched = await fetchCaliforniaFacilityDetail(requestId, {
    minIntervalMs: 450,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  const classified = classifyCaliforniaPhase11DisclosureLink({
    facilityNumber: requestId,
    file: target.file,
    stratum: target.stratum,
    downloadStatus: target.downloadStatus,
    downloadType: target.downloadType,
    apiHttpStatus: fetched.httpStatus,
    liveFacilityNumber: parse?.facilityNumber ?? null,
    apiFound: parse?.found ?? false,
    pageHttpStatus: pageProbe.httpStatus,
    timedOut: fetched.timedOut,
  });
  disclosureResults.push({
    ...classified,
    officialFacilityNumber: target.facilityNumber,
    requestFacilityNumber: requestId,
    label: target.label,
    downloadRowPresent: downloadById.has(target.facilityNumber),
    downloadStatusObserved: downloadById.get(target.facilityNumber)?.facilityStatus ?? null,
    liveStatus: parse?.status ?? null,
    attempts: fetched.attempts,
  });
}
const disclosureSummary = summarizeCaliforniaPhase11DisclosureLinks(
  disclosureResults,
  observedOn,
);

console.log(
  `Phase 11: verifying ${CALIFORNIA_PHASE11_STATUS_SAMPLE.length} licensing statuses...`,
);
const statusObservations = [];
for (const target of CALIFORNIA_PHASE11_STATUS_SAMPLE) {
  const downloadRow = downloadById.get(target.facilityNumber);
  const downloadStatus = downloadRow?.facilityStatus ?? target.downloadStatus;
  const downloadType = downloadRow?.facilityType ?? target.downloadType;
  const fetched = await fetchCaliforniaFacilityDetail(target.facilityNumber, {
    minIntervalMs: 450,
    lastRequestAt,
  });
  const parse = fetched.payload == null ? null : parseCaliforniaFacilityDetail(fetched.payload);
  statusObservations.push(
    observeCaliforniaPhase11Status(
      {
        ...target,
        downloadStatus,
        downloadType: downloadType || target.downloadType,
      },
      {
        httpStatus: fetched.httpStatus,
        attempts: fetched.attempts,
        timedOut: fetched.timedOut,
        liveFacilityNumber: parse?.facilityNumber ?? null,
        liveStatus: parse?.status ?? null,
        liveFacilityType: parse?.facilityType ?? null,
        found: Boolean(parse?.found),
      },
    ),
  );
}
const statusSummary = summarizeCaliforniaPhase11StatusVerification(
  statusObservations,
  observedOn,
);

const quality = evaluateCaliforniaPhase11Quality({
  observedOn,
  disclosure: {
    sampleSize: disclosureSummary.sampleSize,
    working: disclosureSummary.working,
    missing: disclosureSummary.missing,
    ambiguous: disclosureSummary.ambiguous,
    invalid: disclosureSummary.invalid,
  },
  status: {
    sampleSize: statusSummary.sampleSize,
    match: statusSummary.match,
    mappingGap: statusSummary["mapping-gap"],
    conflict: statusSummary.conflict,
    missing: statusSummary.missing,
    inconclusive: statusSummary.inconclusive,
    invalidId: statusSummary["invalid-id"],
  },
  downloadSha256: {
    rcfe: rcfeDownload.sha256,
    arf: arfDownload.sha256,
  },
});

const output = {
  observedOn,
  urlPatterns: CALIFORNIA_PHASE11_DISCLOSURE_URL_PATTERNS,
  download: {
    rcfe: {
      httpStatus: rcfeDownload.httpStatus,
      contentDisposition: rcfeDownload.contentDisposition,
      bytes: rcfeDownload.bytes,
      sha256: rcfeDownload.sha256,
      rows: rcfeDownload.rows.length,
      filenameIsoCandidate: rcfeDownload.filenameDate.isoCandidate,
    },
    arf: {
      httpStatus: arfDownload.httpStatus,
      contentDisposition: arfDownload.contentDisposition,
      bytes: arfDownload.bytes,
      sha256: arfDownload.sha256,
      rows: arfDownload.rows.length,
      filenameIsoCandidate: arfDownload.filenameDate.isoCandidate,
    },
    authoritativeIsoExportDate: null,
    sha256MatchesPhase10Baseline: quality.downloadSha256MatchesBaseline,
    baselineSha256: CALIFORNIA_PHASE11_OBSERVED_COUNTS.downloadSha256,
  },
  disclosureLinks: disclosureSummary,
  licensingStatus: statusSummary,
  readiness: CALIFORNIA_PHASE11_READINESS_DECISION,
  quality,
  publication: "unpublished",
  ownerClaimEligible: false,
  allowsPublication: californiaPhase11AllowsPublication(),
  gate: "blocked",
  cdssClarification: {
    status: "sent-awaiting-response",
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: CALIFORNIA_PHASE11_READINESS_DECISION.baselinePreserved,
};

writeFileSync(outPath, JSON.stringify(output, null, 2));

const summary = {
  observedOn,
  disclosure: {
    sampleSize: disclosureSummary.sampleSize,
    working: disclosureSummary.working,
    missing: disclosureSummary.missing,
    ambiguous: disclosureSummary.ambiguous,
    invalid: disclosureSummary.invalid,
    leadingZeroPreservedWorking: disclosureSummary.leadingZeroPreservedWorking,
    statewideCoverageClaimed: false,
  },
  status: {
    sampleSize: statusSummary.sampleSize,
    match: statusSummary.match,
    mappingGap: statusSummary["mapping-gap"],
    conflict: statusSummary.conflict,
    missing: statusSummary.missing,
    inconclusive: statusSummary.inconclusive,
    invalidId: statusSummary["invalid-id"],
    applicationWithdrawnGaps: statusSummary.applicationWithdrawnGaps,
    sampleIsStatewideConclusion: false,
  },
  downloadSha256MatchesBaseline: quality.downloadSha256MatchesBaseline,
  baseline: CALIFORNIA_PHASE11_READINESS_DECISION.baselinePreserved,
  gate: "blocked",
  publicationReady: false,
  allowsPublication: false,
  cdssClarification: "sent-awaiting-response",
  outPath,
};

console.log(JSON.stringify(summary, null, 2));

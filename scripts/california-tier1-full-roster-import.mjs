#!/usr/bin/env node
/**
 * Reproducible California Tier 1 full-roster import (development fixtures only).
 *
 * Downloads official CDSS DownloadStateData RCFE + ARF CSVs, preserves exact
 * Facility Numbers, and writes a filtered listable roster JSON + manifest.
 *
 * Usage:
 *   node --experimental-strip-types scripts/california-tier1-full-roster-import.mjs
 *
 * Does not write Supabase, publish California, or activate exclusions/mapping.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS,
  californiaTransparencyConfigHeader,
  californiaTransparencyDownloadUrl,
  parseCaliforniaTransparencyDownloadCsv,
  parseCaliforniaTransparencyDownloadFilenameDate,
} from "../lib/california-transparency-download.ts";
import { CALIFORNIA_PENDING_INCREASE_IDS } from "../lib/california-pending-increase-missing-date.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(
  ROOT,
  "supabase/proposals/fixtures/california-tier1-full-roster",
);

const RCFE_TYPES = new Set([
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
]);
const ARF_TYPES = new Set([
  "ADULT RESIDENTIAL",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
]);
const RESIDUAL = new Set([
  "079201725",
  "502701889",
  "374605020",
  "342701856",
  "197610992",
  "342701894",
  "502701880",
  "198604006",
  "195850781",
  "107209715",
  "195850785",
  "197611051",
  "360951409",
  "198320716",
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
  "502701867",
  "019201167",
  "019201133",
]);
const PENDING = new Set(CALIFORNIA_PENDING_INCREASE_IDS);
const FACILITY_NUMBER = /^\d{8,9}$/;

async function download(file, downloadId, guid, header) {
  const url = californiaTransparencyDownloadUrl(downloadId, guid);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv,*/*",
      "DSS-Transparency-Config": header,
    },
  });
  const csvText = await response.text();
  const contentDisposition = response.headers.get("content-disposition");
  const filenameDate = parseCaliforniaTransparencyDownloadFilenameDate(
    contentDisposition,
  );
  const sha256 = createHash("sha256").update(csvText).digest("hex");
  const rows = parseCaliforniaTransparencyDownloadCsv(csvText);
  return {
    file,
    downloadId,
    httpStatus: response.status,
    contentDisposition,
    filenameDate,
    sha256,
    bytes: Buffer.byteLength(csvText),
    rawRows: rows.length,
    rows,
  };
}

function toListable(rows, category, types) {
  const out = [];
  for (const row of rows) {
    const id = String(row.facilityNumber ?? "").trim();
    const type = String(row.facilityType ?? "").trim();
    const status = String(row.facilityStatus ?? "").trim();
    const first = String(row.licenseFirstDate ?? "").trim();
    if (!FACILITY_NUMBER.test(id)) continue;
    if (!types.has(type)) continue;
    if (status !== "LICENSED" && status !== "ON PROBATION") continue;
    if (RESIDUAL.has(id)) continue;
    if (!first) continue;
    const cap = String(row.facilityCapacity ?? "").trim();
    out.push({
      n: id,
      name: String(row.facilityName ?? "").trim(),
      cat: category,
      type,
      status,
      first,
      cap: cap || null,
      city: String(row.facilityCity ?? "").trim() || null,
      zip: String(row.facilityZip ?? "").trim() || null,
      addr: String(row.facilityAddress ?? "").trim() || null,
      pi: PENDING.has(id),
      lz: id.startsWith("0"),
    });
  }
  return out;
}

const guid = randomUUID();
const header = californiaTransparencyConfigHeader({ guid });
const rcfe = await download(
  "RCFE",
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS.rcfe,
  guid,
  header,
);
const arf = await download(
  "ARF",
  CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS.arf,
  guid,
  header,
);

if (rcfe.httpStatus !== 200 || arf.httpStatus !== 200) {
  console.error("Download failed", {
    rcfe: rcfe.httpStatus,
    arf: arf.httpStatus,
  });
  process.exit(1);
}

const asOfRcfe = rcfe.filenameDate.isoCandidate;
const asOfArf = arf.filenameDate.isoCandidate;
if (!asOfRcfe || asOfRcfe !== asOfArf) {
  console.error("As-of mismatch or missing", { asOfRcfe, asOfArf });
  process.exit(1);
}

const facilities = [
  ...toListable(rcfe.rows, "RCFE", RCFE_TYPES),
  ...toListable(arf.rows, "ARF", ARF_TYPES),
].sort((a, b) => a.name.localeCompare(b.name) || a.n.localeCompare(b.n));

const residualPresent = [...RESIDUAL].filter((id) =>
  [...rcfe.rows, ...arf.rows].some(
    (row) => String(row.facilityNumber ?? "").trim() === id,
  ),
).length;

const pendingInRoster = facilities.filter((f) => f.pi).length;
const pendingPresent = [...PENDING].filter((id) =>
  [...rcfe.rows, ...arf.rows].some(
    (row) => String(row.facilityNumber ?? "").trim() === id,
  ),
).length;

const manifest = {
  observedOn: new Date().toISOString().slice(0, 10),
  sourceAsOfIso: asOfRcfe,
  pathway: "downloadstatedata-transparency-csv",
  californiaPublished: false,
  publicationEligible: 0,
  exclusionsActivated: false,
  eligibilityMappingActivated: false,
  statewideRosterForDevelopment: true,
  priorOfflineTier1: 15429,
  residualExclusions: 22,
  residualPresentInDownload: residualPresent,
  listableCount: facilities.length,
  pendingIncreaseIdsHistorical: 66,
  pendingIncreasePresentInDownload: pendingPresent,
  pendingIncreaseFlaggedInRoster: pendingInRoster,
  deltaVsPrior15429: facilities.length - 15429,
  rcfe: {
    contentDisposition: rcfe.contentDisposition,
    sha256: rcfe.sha256,
    bytes: rcfe.bytes,
    rawRows: rcfe.rawRows,
  },
  arf: {
    contentDisposition: arf.contentDisposition,
    sha256: arf.sha256,
    bytes: arf.bytes,
    rawRows: arf.rawRows,
  },
  listableRule:
    "eligible RCFE/ARF types + LICENSED|ON PROBATION + non-empty License First Date + not residual-22",
  notes: [
    "Development-only statewide roster fixture. publicationEligible=0.",
    "Pending Increase flags are informational; eligibility mapping remains inactive.",
    "8 historical Pending Increase IDs may be out-of-scope types in current download and are correctly omitted from listable roster.",
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(OUT_DIR, "roster.json"), `${JSON.stringify(facilities)}\n`);

console.log(JSON.stringify({
  outDir: OUT_DIR,
  listableCount: facilities.length,
  sourceAsOfIso: asOfRcfe,
  residualPresent,
  pendingIncreaseFlaggedInRoster: pendingInRoster,
}, null, 2));

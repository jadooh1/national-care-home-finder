import { inflateRawSync } from "node:zlib";

export const ODHS_PROVIDER_SEARCH_URL = "https://ltclicensing.oregon.gov/Providers";

export const ODHS_EXPORT_HEADER = [
  "ID",
  "Name",
  "Type",
  "Address",
  "City",
  "Zip",
  "County",
  "Phone",
  "Email",
  "Licensed beds",
  "Accepts Medicaid",
  "Memory Care",
  "Status",
] as const;

export const OREGON_ADULT_FOSTER_HOME = "Oregon adult foster home";

const PROFILE_PREFIX = "https://ltclicensing.oregon.gov/Providers/Details/";
const SOURCE_ID_PATTERN = /^[A-Za-z0-9]{1,32}$/;
const TEXT_LIMIT = 200;

export type OregonPublicFacility = {
  source_id: string;
  facility_name: string;
  city: string;
  county: string;
  license_type: typeof OREGON_ADULT_FOSTER_HOME;
  status: "Open";
  licensed_beds: number;
  official_profile_url: string;
};

export type RejectionReason =
  | "duplicate_source_id"
  | "other_license"
  | "not_open"
  | "unsafe_source_id"
  | "missing_name"
  | "missing_city"
  | "missing_county"
  | "invalid_capacity";

export type DryRunReport = {
  acceptable: boolean;
  persists_records: false;
  header_ok: boolean;
  header_error: string;
  source_url: typeof ODHS_PROVIDER_SEARCH_URL;
  rows_read: number;
  accepted: OregonPublicFacility[];
  rejected: { source_id: string; reason: RejectionReason }[];
  duplicate_source_ids: string[];
  refresh_activated: false;
  audit_activated: false;
  rollback_activated: false;
};

export const INACTIVE_PROCEDURES = {
  refresh: "A later authorized run may replace only the Oregon adult-foster-home public set from a new acceptable dry run. This module does not download or replace records.",
  audit: "A later authorized run may record the export time, byte count, and SHA-256 before any load. This module does not write an audit row.",
  rollback: "A later authorized load must keep the previous Oregon public set until the new set is committed. This module does not change a database, so there is nothing to roll back.",
} as const;

export function validateOdhsHeader(header: readonly string[]): string {
  if (header.length !== ODHS_EXPORT_HEADER.length) {
    return "ODHS export header has the wrong number of columns";
  }
  for (let index = 0; index < ODHS_EXPORT_HEADER.length; index += 1) {
    if (header[index] !== ODHS_EXPORT_HEADER[index]) {
      return `ODHS export column ${index + 1} must be ${ODHS_EXPORT_HEADER[index]}`;
    }
  }
  return "";
}

export function dryRunOdhsCsv(csv: string): DryRunReport {
  const table = parseCsv(csv);
  return dryRunTable(table);
}

export function dryRunOdhsXlsx(bytes: Uint8Array): DryRunReport {
  try {
    return dryRunTable(readXlsxTable(bytes));
  } catch {
    return emptyReport("ODHS Excel export could not be read");
  }
}

function dryRunTable(table: string[][]): DryRunReport {
  if (table.length === 0) return emptyReport("ODHS export header is missing");
  const headerError = validateOdhsHeader(table[0]);
  if (headerError) return emptyReport(headerError);

  const data = table.slice(1).filter(row => row.some(cell => cell.trim() !== ""));
  const seen = new Map<string, number>();
  for (const row of data) {
    const sourceId = cell(row, 0);
    seen.set(sourceId, (seen.get(sourceId) ?? 0) + 1);
  }
  const duplicateSourceIds = [...seen.entries()].filter(([, count]) => count > 1).map(([sourceId]) => sourceId);

  const accepted: OregonPublicFacility[] = [];
  const rejected: DryRunReport["rejected"] = [];
  for (const row of data) {
    const sourceId = cell(row, 0);
    if (duplicateSourceIds.includes(sourceId)) {
      rejected.push({ source_id: sourceId, reason: "duplicate_source_id" });
      continue;
    }
    const decision = classifyRow(row);
    if (decision.facility) accepted.push(decision.facility);
    else rejected.push({ source_id: sourceId, reason: decision.reason });
  }

  return {
    acceptable: duplicateSourceIds.length === 0,
    persists_records: false,
    header_ok: true,
    header_error: "",
    source_url: ODHS_PROVIDER_SEARCH_URL,
    rows_read: data.length,
    accepted,
    rejected,
    duplicate_source_ids: duplicateSourceIds,
    refresh_activated: false,
    audit_activated: false,
    rollback_activated: false,
  };
}

function classifyRow(row: string[]): { facility: OregonPublicFacility; reason?: undefined } | { facility?: undefined; reason: RejectionReason } {
  const sourceId = cell(row, 0);
  const licenseType = cell(row, 2);
  const status = cell(row, 12);
  if (licenseType !== "AFH") return { reason: "other_license" };
  if (status !== "Open") return { reason: "not_open" };
  if (!SOURCE_ID_PATTERN.test(sourceId)) return { reason: "unsafe_source_id" };
  const facilityName = publicText(cell(row, 1));
  const city = publicText(cell(row, 4));
  const county = publicText(cell(row, 6));
  if (!facilityName) return { reason: "missing_name" };
  if (!city) return { reason: "missing_city" };
  if (!county) return { reason: "missing_county" };
  const beds = cell(row, 9);
  if (!/^[1-5]$/.test(beds)) return { reason: "invalid_capacity" };
  return {
    facility: {
      source_id: sourceId,
      facility_name: facilityName,
      city,
      county,
      license_type: OREGON_ADULT_FOSTER_HOME,
      status: "Open",
      licensed_beds: Number(beds),
      official_profile_url: `${PROFILE_PREFIX}${sourceId}`,
    },
  };
}

function publicText(value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > TEXT_LIMIT || /[\u0000-\u001f\u007f]/.test(text)) return "";
  return text;
}

function cell(row: string[], index: number): string {
  return (row[index] ?? "").trim();
}

function emptyReport(headerError: string): DryRunReport {
  return {
    acceptable: false,
    persists_records: false,
    header_ok: false,
    header_error: headerError,
    source_url: ODHS_PROVIDER_SEARCH_URL,
    rows_read: 0,
    accepted: [],
    rejected: [],
    duplicate_source_ids: [],
    refresh_activated: false,
    audit_activated: false,
    rollback_activated: false,
  };
}

export function parseCsv(csv: string): string[][] {
  const text = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("ODHS CSV quotation is unfinished");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readXlsxTable(bytes: Uint8Array): string[][] {
  const files = unzip(bytes);
  const sheetName = [...files.keys()].find(name => /^xl\/worksheets\/sheet1\.xml$/i.test(name));
  if (!sheetName) throw new Error("sheet missing");
  const shared = readSharedStrings(files.get("xl/sharedStrings.xml"));
  const sheet = new TextDecoder("utf-8").decode(files.get(sheetName));
  const rows: string[][] = [];
  for (const rowMatch of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values = new Map<number, string>();
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = /r="([A-Z]+)\d+"/i.exec(cellMatch[1]);
      if (!ref) continue;
      values.set(columnIndex(ref[1]), cellText(cellMatch[1], cellMatch[2], shared));
    }
    if (values.size === 0) continue;
    const width = Math.max(...values.keys()) + 1;
    rows.push(Array.from({ length: width }, (_, index) => values.get(index) ?? ""));
  }
  return rows;
}

function readSharedStrings(bytes: Uint8Array | undefined): string[] {
  if (!bytes) return [];
  const xml = new TextDecoder("utf-8").decode(bytes);
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(match =>
    [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join("")
  );
}

function cellText(attributes: string, body: string, shared: string[]): string {
  const type = /t="([^"]+)"/.exec(attributes)?.[1] ?? "";
  if (type === "inlineStr") {
    return [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join("");
  }
  const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
  if (type === "s") return shared[Number(raw)] ?? "";
  return decodeXml(raw);
}

function columnIndex(letters: string): number {
  return [...letters.toUpperCase()].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function unzip(bytes: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break;
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = new TextDecoder("utf-8").decode(bytes.subarray(nameStart, nameStart + nameLength));
    const dataStart = nameStart + nameLength + extraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : undefined;
    if (!data) throw new Error("unsupported zip compression");
    files.set(name, data);
    offset = dataStart + compressedSize;
  }
  if (files.size === 0) throw new Error("xlsx archive is empty");
  return files;
}

import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import test from "node:test";
import {
  INACTIVE_PROCEDURES,
  ODHS_EXPORT_HEADER,
  ODHS_PROVIDER_SEARCH_URL,
  OREGON_ADULT_FOSTER_HOME,
  dryRunOdhsCsv,
  dryRunOdhsXlsx,
  validateOdhsHeader,
} from "../../../lib/oregon-odhs-roster.ts";

const header = ODHS_EXPORT_HEADER.join(",");

function row(values: Record<string, string>): string {
  const cells = ODHS_EXPORT_HEADER.map(column => {
    const value = values[column] ?? "";
    return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  });
  return cells.join(",");
}

function openHome(id: string, overrides: Record<string, string> = {}): string {
  return row({
    ID: id,
    Name: "VALIDATION FIXTURE - NOT REAL",
    Type: "AFH",
    Address: "1 Hidden Street",
    City: "Salem",
    Zip: "97301",
    County: "Marion",
    Phone: "555-0100",
    Email: "hidden@example.invalid",
    "Licensed beds": "5",
    "Accepts Medicaid": "Yes",
    "Memory Care": "No",
    Status: "Open",
    ...overrides,
  });
}

test("the official header is accepted only in full and in order", () => {
  assert.equal(validateOdhsHeader([...ODHS_EXPORT_HEADER]), "");
  assert.match(validateOdhsHeader(["ID", "Name"]), /wrong number of columns/);
  const swapped = [...ODHS_EXPORT_HEADER];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  assert.match(validateOdhsHeader(swapped), /column 1 must be ID/);
});

test("an open adult foster home keeps its source ID and drops private columns", () => {
  const report = dryRunOdhsCsv(`${header}\n${openHome("0000000183", { Name: 'Fixture "North", Home' })}`);
  assert.equal(report.acceptable, true);
  assert.equal(report.persists_records, false);
  assert.equal(report.accepted.length, 1);
  assert.deepEqual(report.accepted[0], {
    source_id: "0000000183",
    facility_name: 'Fixture "North", Home',
    city: "Salem",
    county: "Marion",
    license_type: OREGON_ADULT_FOSTER_HOME,
    status: "Open",
    licensed_beds: 5,
    official_profile_url: "https://ltclicensing.oregon.gov/Providers/Details/0000000183",
  });
  const published = JSON.stringify(report.accepted[0]);
  for (const hidden of ["Hidden Street", "555-0100", "hidden@example.invalid", "97301", "Washington", "adult family home"]) {
    assert.equal(published.includes(hidden), false);
  }
  assert.equal(report.source_url, ODHS_PROVIDER_SEARCH_URL);
});

test("other licenses, closed homes, bad capacity, and duplicate IDs stay out", () => {
  const csv = [
    header,
    openHome("1001"),
    openHome("1002", { Type: "RCF", "Licensed beds": "14" }),
    openHome("1003", { Status: "Closed", "Licensed beds": "0" }),
    openHome("1004", { "Licensed beds": "6" }),
    openHome("1005", { "Licensed beds": "0" }),
    openHome("1006", { City: "" }),
    openHome("1001", { Name: "SECOND FIXTURE - NOT REAL" }),
  ].join("\n");
  const report = dryRunOdhsCsv(csv);
  assert.equal(report.acceptable, false);
  assert.deepEqual(report.accepted.map(facility => facility.source_id), []);
  assert.deepEqual(report.duplicate_source_ids, ["1001"]);
  assert.deepEqual(report.rejected.map(item => `${item.source_id}:${item.reason}`), [
    "1001:duplicate_source_id",
    "1002:other_license",
    "1003:not_open",
    "1004:invalid_capacity",
    "1005:invalid_capacity",
    "1006:missing_city",
    "1001:duplicate_source_id",
  ]);
});

test("a valid mixed file accepts only open Oregon adult foster homes", () => {
  const csv = [
    `\uFEFF${header}`,
    openHome("2001", { "Licensed beds": "1" }),
    openHome("2002", { Type: "ALF" }),
    openHome("2003", { Type: "NF", Status: "Closed" }),
    openHome("2004", { Status: "closed" }),
  ].join("\r\n");
  const report = dryRunOdhsCsv(csv);
  assert.equal(report.acceptable, true);
  assert.equal(report.rows_read, 4);
  assert.deepEqual(report.accepted.map(facility => [facility.source_id, facility.licensed_beds, facility.license_type]), [
    ["2001", 1, "Oregon adult foster home"],
  ]);
  assert.equal(report.accepted[0].license_type === "Oregon adult foster home", true);
});

test("a bad header accepts nothing and does not activate refresh, audit, or rollback", () => {
  const report = dryRunOdhsCsv("ID,Name\n1,Home");
  assert.equal(report.acceptable, false);
  assert.equal(report.header_ok, false);
  assert.equal(report.accepted.length, 0);
  assert.equal(report.refresh_activated, false);
  assert.equal(report.audit_activated, false);
  assert.equal(report.rollback_activated, false);
  assert.match(INACTIVE_PROCEDURES.refresh, /does not download/);
  assert.match(INACTIVE_PROCEDURES.audit, /does not write/);
  assert.match(INACTIVE_PROCEDURES.rollback, /nothing to roll back/);
});

test("the Excel export uses the same header and public field contract", () => {
  const report = dryRunOdhsXlsx(fixtureWorkbook([
    [...ODHS_EXPORT_HEADER],
    ["3001", "EXCEL FIXTURE - NOT REAL", "AFH", "9 Hidden Street", "Bend", "97701", "Deschutes", "555-0199", "excel@example.invalid", "4", "No", "No", "Open"],
    ["3002", "CLOSED FIXTURE - NOT REAL", "AFH", "9 Hidden Street", "Bend", "97701", "Deschutes", "555-0199", "excel@example.invalid", "4", "No", "No", "Closed"],
  ]));
  assert.equal(report.acceptable, true);
  assert.equal(report.accepted.length, 1);
  assert.equal(report.accepted[0].source_id, "3001");
  assert.equal(report.accepted[0].licensed_beds, 4);
  assert.equal(JSON.stringify(report).includes("Hidden Street"), false);
  assert.equal(JSON.stringify(report).includes("excel@example.invalid"), false);
  const bad = dryRunOdhsXlsx(fixtureWorkbook([["ID", "Name"], ["1", "Home"]]));
  assert.equal(bad.header_ok, false);
  assert.equal(bad.accepted.length, 0);
});

function fixtureWorkbook(rows: string[][]): Uint8Array {
  const sheetRows = rows.map((values, rowIndex) => {
    const cells = values.map((value, columnIndex) => {
      const ref = `${columnLetters(columnIndex)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  return storedZip([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>`],
    ["xl/worksheets/sheet1.xml", sheet],
  ]);
}

function columnLetters(index: number): string {
  let current = index + 1;
  let letters = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    current = Math.floor((current - 1) / 26);
  }
  return letters;
}

function storedZip(entries: Array<[string, string]>): Uint8Array {
  const parts: Buffer[] = [];
  for (const [name, contents] of entries) {
    const fileName = Buffer.from(name);
    const stored = Buffer.from(contents);
    const compressed = deflateRawSync(stored);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(stored.length, 22);
    header.writeUInt16LE(fileName.length, 26);
    parts.push(header, fileName, compressed);
  }
  return Buffer.concat(parts);
}

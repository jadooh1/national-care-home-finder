import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { washingtonShortlistItem, addWashingtonShortlist } from "../../../lib/washington-shortlist.ts";

const component = readFileSync(new URL("../../../components/washington-print-comparison.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("../../../app/washington/page.tsx", import.meta.url), "utf8");

test("print comparison is wired to the existing shortlist, with no separate database access", () => {
  assert.match(directory, /<WashingtonPrintComparison items=\{shortlist\} locale=\{locale\}/);
  assert.match(component, /if \(!items\.length\) return null/);
  assert.doesNotMatch(component, /supabase|localStorage|sessionStorage|fetch\(/);
  assert.match(component, /window\.print\(\)/);
});

test("print summary has bilingual labels and official record disclaimers", () => {
  for (const term of ["Print comparison summary", "Imprimir resumen comparativo", "Washington DSHS", "DSHS de Washington", "licensedCapacity", "recordStatus", "license"]) {
    assert.ok(component.includes(term), `missing ${term}`);
  }
  assert.match(component, /@media print/);
  assert.match(component, /visibility: hidden !important/);
  assert.match(component, /break-inside: avoid/);
});

test("shortlist stays limited to three sanitized homes", () => {
  let items: ReturnType<typeof washingtonShortlistItem>[] = [];
  for (let i = 1; i <= 4; i++) {
    const item = washingtonShortlistItem({ license: String(i), name: `Home ${i}`, licensedCapacity: 6, recordStatus: "verified" });
    assert.ok(item);
    const result = addWashingtonShortlist(items.filter((x): x is NonNullable<typeof x> => x !== null), item);
    if (i === 4) assert.equal(result.status, "full");
    items = result.items;
  }
  assert.equal(items.length, 3);
});

test("print labels handle missing fields without claiming vacancy or current licensing", () => {
  const item = washingtonShortlistItem({
    license: "123456",
    name: "Example Home",
    addressLine: null,
    city: null,
    postalCode: null,
    licensedCapacity: null,
    recordStatus: "unverified",
  });
  assert.ok(item);
  assert.equal(item.licensedCapacity, null);
  assert.equal(item.recordStatus, "unverified");
  assert.match(component, /item\.licensedCapacity \?\? t\.missing/);
  assert.match(component, /comparisonAddress\(item, t\)/);
  assert.match(component, /item\.recordStatus === "verified" \? t\.verified : t\.unverified/);
  assert.match(component, /capacity is not vacancy availability/);
  assert.match(component, /capacidad registrada no indica vacantes disponibles/);
});

test("print view keeps the shortlist and navigation outside the printable sheet", () => {
  assert.match(component, /<button type="button" className="nchf-print-trigger"/);
  assert.match(component, /<section className="nchf-print-sheet"/);
  assert.match(component, /\.nchf-print-sheet \{ display: none; \}/);
  assert.match(component, /body \* \{ visibility: hidden !important; \}/);
  assert.match(component, /\.nchf-print-sheet, \.nchf-print-sheet \* \{ visibility: visible !important; \}/);
  assert.match(component, /@page \{ size: landscape; margin: 12mm; \}/);
  assert.doesNotMatch(component, /writeWashingtonShortlist|persistShortlist|removeWashingtonShortlist/);
});

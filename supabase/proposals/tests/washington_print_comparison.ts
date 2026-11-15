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

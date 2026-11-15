import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  washingtonSearchText,
  washingtonCountySearchText,
  washingtonDirectoryPage,
  washingtonDirectorySearchPath,
  washingtonDirectoryReturnPath,
  washingtonLocationMatches,
} from "../../../lib/family-journey.ts";

const directory = readFileSync(new URL("../../../app/washington/page.tsx", import.meta.url), "utf8");

test("search terms strip query syntax before reaching the PostgREST or filter", () => {
  assert.equal(washingtonSearchText("  Seattle, (WA)%_*'  "), "Seattle WA");
  assert.equal(washingtonSearchText("  North-West  "), "North-West");
  assert.equal(washingtonSearchText("!?*%_"), "");
  assert.equal(washingtonSearchText("a".repeat(200)).length, 80);
  assert.equal(washingtonCountySearchText("Condado de King County"), "King");
});

test("empty, invalid, and oversized page parameters fall back to first page", () => {
  for (const value of [null, "", "0", "-1", "1.5", "501", "999999", "NaN", "2%"]) {
    assert.equal(washingtonDirectoryPage(value), 0, String(value));
  }
  assert.equal(washingtonDirectoryPage("2"), 1);
  assert.equal(washingtonDirectoryPage("500"), 499);
});

test("directory URL preserves safe filters and omits first-page parameter", () => {
  assert.equal(washingtonDirectorySearchPath({ q: "  Seattle% ", city: "  Tacoma ", county: "Pierce County", page: 0 }),
    "/washington?q=Seattle&city=Tacoma&county=Pierce");
  assert.equal(washingtonDirectorySearchPath({ page: 1 }), "/washington?page=2");
  assert.equal(washingtonDirectorySearchPath({ page: -1 }), "/washington");
  assert.equal(washingtonDirectorySearchPath({ page: 500 }), "/washington");
});

test("return links cannot escape Washington directory or retain query syntax", () => {
  for (const value of ["https://attacker.test/washington", "//attacker.test/washington", "/washington/map", "/washington\\bad"]) {
    assert.equal(washingtonDirectoryReturnPath(value), null, value);
  }
  assert.equal(washingtonDirectoryReturnPath("/washington?q=Seattle%25&page=2"), "/washington?q=Seattle&page=2");
  assert.equal(washingtonLocationMatches("/washington?q=Seattle", "/washington?q=Seattle"), true);
});

test("filter edits reset pagination and in-flight directory requests cannot overwrite newer results", () => {
  for (const setter of ["setSearch", "setCity", "setCounty"]) {
    assert.ok(directory.includes(`${setter}(e.target.value); setPage(0)`));
  }
  assert.match(directory, /function resetFilters\(\)/);
  assert.match(directory, /let cancelled = false/);
  assert.match(directory, /if \(cancelled\) return/);
  assert.match(directory, /return \(\) => \{ cancelled = true; clearTimeout\(timer\); \}/);
  assert.match(directory, /if \(queryError\)/);
  assert.match(directory, /setFacilities\(\[\]\); setTotal\(0\)/);
});

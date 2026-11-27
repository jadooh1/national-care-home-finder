import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  washingtonDirectoryHistoryMode,
  washingtonDirectoryQueryFromLocation,
  washingtonDirectorySearchPath,
} from "../../../lib/family-journey.ts";

const directory = readFileSync(
  new URL("../../../app/washington/washington-directory-client.tsx", import.meta.url),
  "utf8",
);

test("directory query parsing keeps filters and zero-based page index", () => {
  assert.deepEqual(washingtonDirectoryQueryFromLocation("/washington"), {
    q: "",
    city: "",
    county: "",
    page: 0,
  });
  assert.deepEqual(
    washingtonDirectoryQueryFromLocation("/washington?page=2&city=Seattle&county=King&q=Harmony"),
    { q: "Harmony", city: "Seattle", county: "King", page: 1 },
  );
  assert.deepEqual(
    washingtonDirectoryQueryFromLocation("/washington?city=Tacoma"),
    { q: "", city: "Tacoma", county: "", page: 0 },
  );
});

test("page-only navigation pushes history; filter edits replace", () => {
  const base = { q: "", city: "Seattle", county: "King", page: 0 };
  assert.equal(
    washingtonDirectoryHistoryMode(base, { ...base, page: 1 }),
    "push",
  );
  assert.equal(
    washingtonDirectoryHistoryMode({ ...base, page: 2 }, { ...base, page: 1 }),
    "push",
  );
  assert.equal(
    washingtonDirectoryHistoryMode(base, { ...base, city: "Tacoma" }),
    "replace",
  );
  assert.equal(
    washingtonDirectoryHistoryMode(base, { q: "AFH", city: "Seattle", county: "King", page: 0 }),
    "replace",
  );
  assert.equal(
    washingtonDirectoryHistoryMode(base, { q: "AFH", city: "Seattle", county: "King", page: 1 }),
    "replace",
  );
});

test("Prev/Next keep crawlable hrefs but update local page instead of App Router soft-nav", () => {
  assert.match(directory, /function goToDirectoryPage\(/);
  assert.match(directory, /event\.preventDefault\(\)/);
  assert.match(directory, /setPage\(nextPage\)/);
  assert.match(
    directory,
    /onClick=\{event => goToDirectoryPage\(page - 1, event\)\}/,
  );
  assert.match(
    directory,
    /onClick=\{event => goToDirectoryPage\(page \+ 1, event\)\}/,
  );
  assert.match(
    directory,
    /href=\{washingtonDirectorySearchPath\(\{ q: search, city, county, page: page - 1 \}\)\}/,
  );
  assert.match(
    directory,
    /href=\{washingtonDirectorySearchPath\(\{ q: search, city, county, page: page \+ 1 \}\)\}/,
  );
  // Must not leave loading=true without updating page (the #244/#245 residual).
  assert.equal(directory.includes("onClick={() => setLoading(true)}"), false);
});

test("directory syncs browser history for page push and filter replace, and listens for popstate", () => {
  assert.match(directory, /washingtonDirectoryHistoryMode/);
  assert.match(directory, /history\.pushState/);
  assert.match(directory, /history\.replaceState/);
  assert.match(directory, /addEventListener\("popstate"/);
  assert.match(directory, /washingtonDirectoryQueryFromLocation/);
  assert.equal(
    washingtonDirectorySearchPath({ city: "Seattle", page: 1 }),
    "/washington?city=Seattle&page=2",
  );
});

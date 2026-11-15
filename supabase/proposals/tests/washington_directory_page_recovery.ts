import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  washingtonDirectoryReturnPath,
  washingtonDirectorySearchPath,
  washingtonFacilityLink,
  washingtonResultsPage,
} from "../../../lib/family-journey.ts";

const directory = readFileSync(new URL("../../../app/washington/page.tsx", import.meta.url), "utf8");
const facility = readFileSync(new URL("../../../app/washington/[license]/page.tsx", import.meta.url), "utf8");
const copy = readFileSync(new URL("../../../lib/copy/washington-directory.ts", import.meta.url), "utf8");

test("a page past the last result page keeps the filters and moves to the last real page", () => {
  assert.equal(washingtonResultsPage(9, 25, 20), 1);
  assert.equal(washingtonResultsPage(1, 40, 20), 1);
  assert.equal(washingtonResultsPage(4, 0, 20), 0);
  assert.equal(
    washingtonDirectorySearchPath({ q: "North-West", city: "Seattle", page: washingtonResultsPage(9, 25, 20) }),
    "/washington?q=North-West&city=Seattle&page=2",
  );
  assert.equal(
    washingtonDirectorySearchPath({ city: "Seattle", page: washingtonResultsPage(4, 0, 20) }),
    "/washington?city=Seattle",
  );
  const recovery = directory.slice(directory.indexOf("const nextTotal"), directory.indexOf("setFacilities((data"));
  assert.match(recovery, /washingtonResultsPage\(page, nextTotal, PAGE_SIZE\)/);
  assert.match(recovery, /if \(nextPage !== page\) \{\s*setPage\(nextPage\);\s*return;\s*\}/);
});

test("a loading failure stays separate from a search with no matches", () => {
  const failure = directory.slice(directory.indexOf("if (queryError)"), directory.indexOf("const nextTotal"));
  assert.match(failure, /setError\("Unable to load listings\. Please try again later\."\)/);
  assert.doesNotMatch(failure, /washingtonResultsPage/);
  const status = directory.slice(directory.indexOf("aria-live"), directory.indexOf("t.tryAnother"));
  assert.match(status, /error \? t\.unableToDisplay : total === 0 \? t\.noMatches/);
  assert.match(copy, /unableToDisplay: "Unable to display listings"/);
  assert.match(copy, /noMatches: "No matches found"/);
  assert.match(copy, /unableToDisplay: "No se pueden mostrar los listados"/);
  assert.match(copy, /noMatches: "No se encontraron coincidencias"/);
});

test("returning from a facility keeps the directory filters and page", () => {
  const origin = washingtonDirectorySearchPath({ city: "Seattle", county: "King", page: 1 });
  assert.equal(origin, "/washington?city=Seattle&county=King&page=2");
  assert.equal(washingtonFacilityLink("/washington/100001", origin), "/washington/100001?from=%2Fwashington%3Fcity%3DSeattle%26county%3DKing%26page%3D2");
  assert.equal(washingtonDirectoryReturnPath("/washington?city=Seattle&county=King&page=2"), origin);
  assert.match(facility, /washingtonDirectoryReturnPath\(from\) \?\? "\/washington"/);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE,
  californiaTier2FinalPublicationReadiness,
  loadCaliforniaTier2FinalValidationReport,
  loadCaliforniaTier2UnmatchedFacilities,
} from "../../../lib/california-tier2-final-validation.ts";
import { loadCaliforniaTier2MapCoverage } from "../../../lib/california-tier2-map.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";

test("final validation evidence: 1360 LZ verified, 1 rejected, 16 unmatched", () => {
  const report = loadCaliforniaTier2FinalValidationReport();
  assert.equal(report.leadingZero.verified, 1360);
  assert.equal(report.leadingZero.rejected, 1);
  assert.equal(report.unmatched.count, 16);
  assert.equal(report.coverageAfterValidation.verifiedOfficialCoords, 15418);
  assert.equal(report.coverageAfterValidation.publicMapEnabled, false);
  assert.equal(
    CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.leadingZeroRejectedId,
    "011405838",
  );
  assert.equal(loadCaliforniaTier2MapCoverage().mapPoints.count, 15418);
});

test("16 unmatched facilities documented without invented coordinates", () => {
  const unmatched = loadCaliforniaTier2UnmatchedFacilities();
  assert.equal(unmatched.length, 16);
  assert.ok(unmatched.every((row) => /^\d{8,9}$/.test(row.facilityNumber)));
  assert.ok(
    unmatched.every(
      (row) =>
        row.note.includes("not invented")
        || row.note.includes("not accepted")
        || row.note.includes("coordinates not"),
    ),
  );
  const ids = JSON.parse(
    readFileSync(
      "supabase/proposals/fixtures/california-tier2-map/unmatched-ids.json",
      "utf8",
    ),
  ) as string[];
  assert.deepEqual(
    unmatched.map((r) => r.facilityNumber).sort(),
    [...ids].sort(),
  );
});

test("publication readiness STOP for public map; Tier 1 live; WA owner only", () => {
  const ready = californiaTier2FinalPublicationReadiness();
  assert.equal(ready.publicCaliforniaMap, "STOP");
  assert.equal(ready.verifiedOfficialCoords, 15418);
  assert.equal(ready.publicMapEnabled, false);
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(mapHref("California"), null);
  assert.equal(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(existsSync("app/california/map/page.tsx"), true);
  assert.ok(readFileSync("app/california/map/page.tsx", "utf8").includes("notFound()"));
  assert.equal(existsSync("app/development/california/map/page.tsx"), true);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_TIER2_FINAL_VALIDATION_BASELINE,
  CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE,
  californiaTier2FinalPublicationReadiness,
  loadCaliforniaTier2FinalValidationReport,
  loadCaliforniaTier2UnmatchedFacilities,
} from "../../../lib/california-tier2-final-validation.ts";
import { loadCaliforniaTier2MapCoverage } from "../../../lib/california-tier2-map.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { ENABLED_OWNER_FACILITY_STATES } from "../../../lib/owner-facility-read.ts";

test("final validation baseline is deployed development 6a04300", () => {
  assert.equal(CALIFORNIA_TIER2_FINAL_VALIDATION_BASELINE, "6a04300");
  assert.equal(
    CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.baselineCommit,
    "6a04300",
  );
  assert.equal(CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.publicMapEnabled, false);
  assert.equal(CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.fabricatedCoordinates, 0);
  assert.equal(CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.geocoded, false);
});

test("Phase 9 identity filter: 1360 verified LZ, 1 rejected, exact 14058", () => {
  const report = loadCaliforniaTier2FinalValidationReport();
  assert.equal(report.baselineCommit, "6a04300");
  assert.equal(report.leadingZero.input, 1361);
  assert.equal(report.leadingZero.verified, 1360);
  assert.equal(report.leadingZero.rejected, 1);
  assert.equal(report.leadingZero.rejectReasons["identity-not-corroborated"], 1);
  assert.equal(report.stratifiedExactSample.sampleSize, 150);
  assert.equal(report.stratifiedExactSample.pass, 150);
  assert.equal(report.stratifiedExactSample.fail, 0);
  assert.equal(report.unmatched.count, 16);
  assert.equal(report.coverageAfterValidation.verifiedOfficialCoords, 15418);
  assert.equal(report.coverageAfterValidation.publicMapEnabled, false);
  assert.equal(report.publicationReadiness.publicCaliforniaMap, "STOP");
  assert.equal(
    report.publicationReadiness.developmentMap,
    "GO-with-verified-subset",
  );

  const coverage = loadCaliforniaTier2MapCoverage();
  assert.equal(coverage.mapPoints.count, 15418);
  assert.equal(coverage.matching.leadingZeroIdentityRejected, 1);
  assert.deepEqual(coverage.validation?.rejectedIds, ["011405838"]);
  assert.equal(
    CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.leadingZeroRejectedId,
    "011405838",
  );

  const rejected = JSON.parse(
    readFileSync(
      "supabase/proposals/fixtures/california-tier2-map/leading-zero-identity-rejected.json",
      "utf8",
    ),
  ) as Array<{ facilityNumber: string; reason: string }>;
  assert.equal(rejected[0]?.facilityNumber, "011405838");
  assert.equal(rejected[0]?.reason, "identity-not-corroborated");
});

test("16 unmatched facilities documented without invented coordinates", () => {
  const unmatched = loadCaliforniaTier2UnmatchedFacilities();
  assert.equal(unmatched.length, 16);
  assert.ok(unmatched.every((row) => /^\d{8,9}$/.test(row.facilityNumber)));
  assert.ok(unmatched.every((row) => row.name && row.category && row.status));
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

test("publication readiness STOP for public map; WA/owner preserved", () => {
  const ready = californiaTier2FinalPublicationReadiness();
  assert.equal(ready.publicCaliforniaMap, "STOP");
  assert.equal(ready.developmentMap, "GO-with-verified-subset");
  assert.equal(ready.verifiedOfficialCoords, 15418);
  assert.equal(ready.publicMapEnabled, false);
  assert.equal(directoryContract("California")?.mapPath, null);
  assert.equal(mapHref("California"), null);
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.deepEqual([...ENABLED_OWNER_FACILITY_STATES], ["WA"]);
  assert.equal(existsSync("app/california"), false);
  assert.equal(existsSync("app/development/california/map/page.tsx"), true);
});

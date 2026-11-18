import assert from "node:assert/strict";
import test from "node:test";
import { ODHS_EXPORT_HEADER, dryRunOdhsCsv } from "../../../lib/oregon-odhs-roster.ts";
import { OREGON_RECORDED_EXPORT_DATE, oregonExportDateReady } from "../../../lib/oregon-export-date.ts";
import {
  OREGON_RECONCILIATION_BOTH,
  OREGON_RECONCILIATION_CAPACITY_CHANGES,
  OREGON_RECONCILIATION_DIRECTORY_ROWS,
  OREGON_RECONCILIATION_DUPLICATE_IDS,
  OREGON_RECONCILIATION_EXPORT_DATE,
  OREGON_RECONCILIATION_INCONSISTENT_IDS,
  OREGON_RECONCILIATION_LATEST_QUALIFYING,
  OREGON_RECONCILIATION_MISSING,
  OREGON_RECONCILIATION_NEWLY_QUALIFYING,
  OREGON_RECONCILIATION_OPEN_ZERO_ABSENT,
  OREGON_RECONCILIATION_OPEN_ZERO_FROM_ACCEPTED,
  OREGON_RECONCILIATION_PATTERN_MISMATCHES,
  OREGON_RECONCILIATION_STATUS_CHANGES,
  OREGON_RECONCILIATION_STILL_QUALIFYING,
  reconcileOregonProviders,
} from "../../../lib/oregon-roster-reconciliation.ts";
import { directoryContract } from "../../../lib/state-directory.ts";
import { onboardingDecision } from "../../../lib/state-onboarding.ts";

test("reconciliation uses the existing acceptance rule and changes nothing", () => {
  const stored = [
    { sourceId: "1001", status: "Open", licensedBeds: 5 },
    { sourceId: "1002", status: "Open", licensedBeds: 4 },
    { sourceId: "1003", status: "Open", licensedBeds: 3 },
  ];
  const latest = [
    { sourceId: "1001", licenseType: "AFH", status: "Open", licensedBeds: "5" },
    { sourceId: "1002", licenseType: "AFH", status: "Open", licensedBeds: "0" },
    { sourceId: "1004", licenseType: "AFH", status: "Open", licensedBeds: "2" },
    { sourceId: "1005", licenseType: "AFH", status: "Open", licensedBeds: "0" },
    { sourceId: "1006", licenseType: "AFH", status: "Closed", licensedBeds: "4" },
    { sourceId: "1007", licenseType: "AFH", status: "Open", licensedBeds: "1" },
    { sourceId: "1007", licenseType: "RCF", status: "Closed", licensedBeds: "3" },
  ];
  const report = reconcileOregonProviders(stored, latest);
  assert.equal(report.recordsChanged, false);
  assert.equal(report.exportDateAdopted, false);
  assert.equal(report.both, 2);
  assert.deepEqual(report.missingFromLatest, ["1003"]);
  assert.deepEqual(report.newlyQualifying, ["1004"]);
  assert.deepEqual(report.acceptedNowOpenZeroBed, ["1002"]);
  assert.deepEqual(report.openZeroBedAbsent, ["1005"]);
  assert.deepEqual(report.duplicateSourceIds, ["1007"]);
  assert.deepEqual(report.inconsistentSourceIds, ["1007"]);

  const header = ODHS_EXPORT_HEADER.join(",");
  const csv = [
    header,
    ["1001", "Home", "AFH", "", "City", "", "County", "", "", "5", "", "", "Open"].join(","),
    ["1002", "Home", "AFH", "", "City", "", "County", "", "", "0", "", "", "Open"].join(","),
    ["1004", "Home", "AFH", "", "City", "", "County", "", "", "2", "", "", "Open"].join(","),
  ].join("\n");
  const dryRun = dryRunOdhsCsv(csv);
  assert.deepEqual(dryRun.accepted.map(facility => facility.source_id), ["1001", "1004"]);
  assert.equal(dryRun.persists_records, false);
});

test("the November 13 count difference leaves the directory unchanged", () => {
  const noLongerQualifying = new Set([
    ...OREGON_RECONCILIATION_OPEN_ZERO_FROM_ACCEPTED,
    ...OREGON_RECONCILIATION_STATUS_CHANGES.map(change => change.sourceId),
  ]);
  const stillInRange = OREGON_RECONCILIATION_CAPACITY_CHANGES.filter(change => /^[1-5]$/.test(change.toBeds));
  assert.equal(OREGON_RECONCILIATION_DIRECTORY_ROWS, 1584);
  assert.equal(OREGON_RECONCILIATION_BOTH, 1584);
  assert.deepEqual([...OREGON_RECONCILIATION_MISSING], []);
  assert.equal(OREGON_RECONCILIATION_STILL_QUALIFYING + OREGON_RECONCILIATION_NEWLY_QUALIFYING.length, OREGON_RECONCILIATION_LATEST_QUALIFYING);
  assert.equal(OREGON_RECONCILIATION_STILL_QUALIFYING + noLongerQualifying.size, OREGON_RECONCILIATION_DIRECTORY_ROWS);
  assert.equal(OREGON_RECONCILIATION_LATEST_QUALIFYING, 1582);
  assert.equal(noLongerQualifying.size, 7);
  assert.equal(OREGON_RECONCILIATION_NEWLY_QUALIFYING.length, 5);
  assert.equal(OREGON_RECONCILIATION_STATUS_CHANGES.length, 1);
  assert.equal(OREGON_RECONCILIATION_STATUS_CHANGES[0].fromStatus, "Open");
  assert.equal(OREGON_RECONCILIATION_STATUS_CHANGES[0].toStatus, "Closed");
  assert.equal(OREGON_RECONCILIATION_CAPACITY_CHANGES.length, 9);
  assert.equal(stillInRange.length, 2);
  assert.equal(OREGON_RECONCILIATION_OPEN_ZERO_FROM_ACCEPTED.length, 6);
  assert.equal(OREGON_RECONCILIATION_OPEN_ZERO_ABSENT.length, 18);
  assert.equal(OREGON_RECONCILIATION_OPEN_ZERO_FROM_ACCEPTED.length + OREGON_RECONCILIATION_OPEN_ZERO_ABSENT.length, 24);
  assert.equal(OREGON_RECONCILIATION_DUPLICATE_IDS.length, 0);
  assert.equal(OREGON_RECONCILIATION_INCONSISTENT_IDS.length, 0);
  assert.equal(OREGON_RECONCILIATION_PATTERN_MISMATCHES, 3);
  assert.equal(OREGON_RECONCILIATION_EXPORT_DATE, null);
  assert.equal(OREGON_RECORDED_EXPORT_DATE, null);
  assert.equal(oregonExportDateReady(), false);
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(onboardingDecision("Oregon").blockers.includes("provider-export-has-no-date-column"));
});

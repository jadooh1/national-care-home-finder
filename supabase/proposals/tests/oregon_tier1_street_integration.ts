import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  OREGON_CAPACITY_STATUS_DRIFT,
  OREGON_LATEST_QUALIFYING_ACCEPTED,
  OREGON_LEAVE13_DETAILS,
  OREGON_LEAVE13_SOURCE_IDS,
  OREGON_NEW13_SOURCE_IDS,
  OREGON_PRIOR_DIRECTORY_ACCEPTED,
  OREGON_RECONCILIATION_ARITHMETIC,
  OREGON_RECONCILIATION_NET_DELTA,
  oregonRosterIdReconciliationSummary,
  reconcileOregonExactSourceIds,
  reconstructPriorFromLedgers,
} from "../../../lib/oregon-roster-id-reconciliation.ts";
import {
  OREGON_TIER1_STREET_INTEGRATION_BASELINE,
  OREGON_TIER1_STREET_INTEGRATION_BLOCKERS,
  OREGON_TIER1_STREET_INTEGRATION_CAPTURE,
  OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS,
  OREGON_TIER1_STREET_INTEGRATION_DEFAULT_CONTROLS,
  OREGON_TIER1_STREET_INTEGRATION_OBSERVED_ON,
  OREGON_TIER1_STREET_INTEGRATION_PREPARED_FIELDS,
  OREGON_TIER1_STREET_INTEGRATION_ROLLBACK_CONTROLS,
  activateOregonTier1StreetIntegration,
  oregonTier1StreetFieldsForControls,
  oregonTier1StreetIntegrationReadyForActivation,
  oregonTier1StreetIntegrationVerdict,
  rollbackOregonTier1StreetIntegration,
} from "../../../lib/oregon-tier1-street-integration.ts";
import {
  OREGON_EXPORT_ACCEPTED_STREET_BLANK,
  OREGON_EXPORT_ACCEPTED_STREET_PRESENT,
  OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS,
  OREGON_EXPORT_CSV_SHA256,
  OREGON_EXPORT_XLSX_SHA256,
  OREGON_RECORDED_EXPORT_DATE,
  oregonExportDateReady,
  oregonFreshnessPolicyReady,
} from "../../../lib/oregon-export-date.ts";
import { OREGON_PUBLIC_FIELDS } from "../../../lib/oregon-public-directory.ts";
import { dryRunOdhsCsv, dryRunOdhsXlsx } from "../../../lib/oregon-odhs-roster.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";

const FIXTURE_DIR = "supabase/proposals/fixtures/oregon-tier1-street-integration";
const QUALIFYING_PATH = `${FIXTURE_DIR}/qualifying-1579.json`;
const SUMMARY_PATH = `${FIXTURE_DIR}/reconciliation-summary.json`;

type QualifyingFixture = {
  observedOn: string;
  count: number;
  streetBlank: number;
  rows: Array<{
    source_id: string;
    facility_name: string;
    street: string;
    city: string;
    county: string;
    status: string;
    licensed_beds: number;
    excel_accepted: boolean;
    official_profile_url: string;
  }>;
};

function loadQualifying(): QualifyingFixture {
  return JSON.parse(readFileSync(QUALIFYING_PATH, "utf8")) as QualifyingFixture;
}

test("street integration controls default OFF and are reversible", () => {
  const defaults = OREGON_TIER1_STREET_INTEGRATION_DEFAULT_CONTROLS;
  assert.equal(defaults.streetIntegrationPrepared, true);
  assert.equal(defaults.streetIntegrationActivated, false);
  assert.equal(defaults.directoryRowReplacementAuthorized, false);
  assert.equal(defaults.oregonPublished, false);
  assert.equal(defaults.mapEnabled, false);
  assert.equal(defaults.supabaseWrites, false);
  assert.equal(defaults.geocodingEnabled, false);

  assert.deepEqual(
    [...oregonTier1StreetFieldsForControls(defaults)],
    [...OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS],
  );
  assert.deepEqual([...OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS], [...OREGON_PUBLIC_FIELDS]);
  assert.ok(!OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS.includes("street" as never));
  assert.ok(OREGON_TIER1_STREET_INTEGRATION_PREPARED_FIELDS.includes("street"));

  const activated = activateOregonTier1StreetIntegration(defaults);
  assert.equal(activated.streetIntegrationActivated, true);
  assert.equal(activated.directoryRowReplacementAuthorized, false);
  assert.equal(activated.oregonPublished, false);
  assert.equal(activated.supabaseWrites, false);
  assert.equal(activated.geocodingEnabled, false);
  assert.deepEqual(
    [...oregonTier1StreetFieldsForControls(activated)],
    [...OREGON_TIER1_STREET_INTEGRATION_PREPARED_FIELDS],
  );

  const rolled = rollbackOregonTier1StreetIntegration();
  assert.deepEqual(rolled, OREGON_TIER1_STREET_INTEGRATION_ROLLBACK_CONTROLS);
  assert.equal(rolled.streetIntegrationActivated, false);
  assert.deepEqual(
    [...oregonTier1StreetFieldsForControls(rolled)],
    [...OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS],
  );
});

test("qualifying fixture covers all 1,579 facilities with official streets", () => {
  const fixture = loadQualifying();
  assert.equal(fixture.observedOn, OREGON_TIER1_STREET_INTEGRATION_OBSERVED_ON);
  assert.equal(fixture.count, 1579);
  assert.equal(fixture.streetBlank, 0);
  assert.equal(fixture.rows.length, 1579);
  assert.equal(OREGON_TIER1_STREET_INTEGRATION_CAPTURE.qualifyingAccepted, 1579);
  assert.equal(OREGON_TIER1_STREET_INTEGRATION_CAPTURE.streetPresent, 1579);
  assert.equal(OREGON_TIER1_STREET_INTEGRATION_CAPTURE.streetBlank, 0);
  assert.equal(OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS, 1579);
  assert.equal(OREGON_EXPORT_ACCEPTED_STREET_PRESENT, 1579);
  assert.equal(OREGON_EXPORT_ACCEPTED_STREET_BLANK, 0);

  const ids = new Set<string>();
  let blankStreet = 0;
  let excelMismatch = 0;
  for (const row of fixture.rows) {
    assert.ok(row.source_id);
    assert.equal(ids.has(row.source_id), false, `duplicate ${row.source_id}`);
    ids.add(row.source_id);
    assert.equal(row.status, "Open");
    assert.ok(row.licensed_beds >= 1 && row.licensed_beds <= 5);
    assert.ok(String(row.street).trim().length > 0);
    if (!String(row.street).trim()) blankStreet += 1;
    if (row.excel_accepted !== true) excelMismatch += 1;
    assert.ok(row.official_profile_url.includes(row.source_id));
  }
  assert.equal(blankStreet, 0);
  assert.equal(excelMismatch, 0);
  assert.equal(ids.size, 1579);
});

test("exact-ID reconciliation documents 1584→1579 deltas and residual", () => {
  const summary = oregonRosterIdReconciliationSummary();
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.baseline, OREGON_TIER1_STREET_INTEGRATION_BASELINE);
  assert.equal(summary.priorDirectoryAccepted, OREGON_PRIOR_DIRECTORY_ACCEPTED);
  assert.equal(summary.latestQualifyingAccepted, OREGON_LATEST_QUALIFYING_ACCEPTED);
  assert.equal(summary.netDelta, OREGON_RECONCILIATION_NET_DELTA);
  assert.equal(summary.netDelta, -5);
  assert.equal(summary.csvExcelAcceptedParity, true);
  assert.equal(summary.priorDirectoryIdDumpAvailable, false);
  assert.equal(summary.freshnessUnresolvedPendingOdhsConfirmation, true);
  assert.equal(summary.recordedExportDateIso, null);

  assert.equal(OREGON_LEAVE13_SOURCE_IDS.length, 7);
  assert.equal(OREGON_NEW13_SOURCE_IDS.length, 5);
  assert.equal(OREGON_LEAVE13_DETAILS.length, 7);
  assert.equal(OREGON_RECONCILIATION_ARITHMETIC.reconstructedPriorKnown, 1581);
  assert.equal(OREGON_RECONCILIATION_ARITHMETIC.unresolvedExactIdCount, 3);

  const fixture = loadQualifying();
  const latestIds = fixture.rows.map(row => row.source_id);
  for (const id of OREGON_LEAVE13_SOURCE_IDS) {
    assert.equal(latestIds.includes(id), false, `LEAVE13 ${id} must not be qualifying`);
  }
  for (const id of OREGON_NEW13_SOURCE_IDS) {
    assert.equal(latestIds.includes(id), true, `NEW13 ${id} must remain qualifying`);
  }

  const reconstructed = reconstructPriorFromLedgers(latestIds);
  assert.equal(reconstructed.reconstructedCount, 1581);
  assert.equal(reconstructed.unresolvedVsStored, 3);

  const exact = reconcileOregonExactSourceIds({
    priorSourceIds: reconstructed.reconstructedPrior,
    latestQualifyingSourceIds: latestIds,
  });
  assert.deepEqual(exact.removed, [...OREGON_LEAVE13_SOURCE_IDS].sort());
  assert.deepEqual(exact.added, [...OREGON_NEW13_SOURCE_IDS].sort());
  assert.equal(exact.netDelta, -2); // 1581→1579 on reconstructed set; stored 1584 residual is separate

  assert.equal(OREGON_CAPACITY_STATUS_DRIFT[0].source_id, "11561");
  assert.equal(OREGON_CAPACITY_STATUS_DRIFT[0].currentLicensedBeds, 4);
  assert.equal(OREGON_CAPACITY_STATUS_DRIFT[0].inLatestQualifying, true);
  assert.ok(latestIds.includes("11561"));
  assert.equal(OREGON_CAPACITY_STATUS_DRIFT[1].source_id, "523278");
  assert.equal(OREGON_CAPACITY_STATUS_DRIFT[1].inLatestQualifying, false);
  assert.equal(latestIds.includes("523278"), false);

  const diskSummary = JSON.parse(readFileSync(SUMMARY_PATH, "utf8")) as {
    priorDirectoryAccepted: number;
    captureQualifyingAccepted: number;
    netDirectoryVsCapture: number;
    priorDirectoryIdDumpAvailable: boolean;
    csvExcelAcceptedParity: boolean;
  };
  assert.equal(diskSummary.priorDirectoryAccepted, 1584);
  assert.equal(diskSummary.captureQualifyingAccepted, 1579);
  assert.equal(diskSummary.netDirectoryVsCapture, -5);
  assert.equal(diskSummary.priorDirectoryIdDumpAvailable, false);
  assert.equal(diskSummary.csvExcelAcceptedParity, true);
});

test("CSV/Excel capture hashes and optional live dual-format parity", () => {
  assert.equal(
    OREGON_TIER1_STREET_INTEGRATION_CAPTURE.csvSha256,
    OREGON_EXPORT_CSV_SHA256,
  );
  assert.equal(
    OREGON_TIER1_STREET_INTEGRATION_CAPTURE.xlsxSha256,
    OREGON_EXPORT_XLSX_SHA256,
  );
  assert.equal(OREGON_TIER1_STREET_INTEGRATION_CAPTURE.csvExcelAcceptedParity, true);

  const csvPath = "/tmp/oregon-exports/Provider_Export.csv";
  const xlsxPath = "/tmp/oregon-exports/Provider_Export.xlsx";
  if (existsSync(csvPath) && existsSync(xlsxPath)) {
    const csvBytes = readFileSync(csvPath);
    const xlsxBytes = readFileSync(xlsxPath);
    assert.equal(createHash("sha256").update(csvBytes).digest("hex"), OREGON_EXPORT_CSV_SHA256);
    assert.equal(createHash("sha256").update(xlsxBytes).digest("hex"), OREGON_EXPORT_XLSX_SHA256);
    const csvReport = dryRunOdhsCsv(csvBytes.toString("utf8"));
    const xlsxReport = dryRunOdhsXlsx(xlsxBytes);
    assert.equal(csvReport.accepted.length, 1579);
    assert.equal(xlsxReport.accepted.length, 1579);
    const csvIds = csvReport.accepted.map(row => row.source_id).sort();
    const xlsxIds = xlsxReport.accepted.map(row => row.source_id).sort();
    assert.deepEqual(csvIds, xlsxIds);
    const fixtureIds = loadQualifying().rows.map(row => row.source_id).sort();
    assert.deepEqual(csvIds, fixtureIds);
  }
});

test("STOP verdict; freshness unresolved; WA/CA/Design 2 preserved", () => {
  const verdict = oregonTier1StreetIntegrationVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.streetIntegrationPrepared, true);
  assert.equal(verdict.streetIntegrationActivated, false);
  assert.equal(verdict.directoryRowsReplaced, false);
  assert.equal(verdict.oregonPublished, false);
  assert.equal(verdict.qualifyingWithStreet, 1579);
  assert.equal(verdict.priorDirectoryAccepted, 1584);
  assert.equal(verdict.netDelta, -5);
  assert.equal(verdict.freshnessUnresolved, true);
  assert.equal(oregonTier1StreetIntegrationReadyForActivation(), false);
  assert.deepEqual([...verdict.blockers], [...OREGON_TIER1_STREET_INTEGRATION_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 3);

  assert.equal(OREGON_RECORDED_EXPORT_DATE, null);
  assert.equal(oregonExportDateReady(), false);
  assert.equal(oregonFreshnessPolicyReady(), false);

  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.notEqual(directoryContract("California")?.publication, "public");
  assert.equal(mapHref("Oregon"), null);

  const oregonLayout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(oregonLayout.includes("notFound()"));
  assert.ok(oregonLayout.includes("PUBLIC_PRODUCTION_HOSTS"));

  assert.equal(existsSync("lib/oregon-tier1-street-integration.ts"), true);
  assert.equal(existsSync("lib/oregon-roster-id-reconciliation.ts"), true);
  assert.equal(existsSync(QUALIFYING_PATH), true);
  assert.equal(existsSync(SUMMARY_PATH), true);
  assert.equal(existsSync("supabase/proposals/20261126220000_oregon_tier1_street_integration.md"), true);
});

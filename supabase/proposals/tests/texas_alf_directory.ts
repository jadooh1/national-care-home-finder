import assert from "node:assert/strict";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";
import { compatibilityAssessment } from "../../../lib/nationwide-compatibility.ts";
import {
  TEXAS_ACTIVE_AS_OF,
  TEXAS_ALZHEIMER_CERTIFICATES,
  TEXAS_CERTIFIED_NO,
  TEXAS_CERTIFIED_YES,
  TEXAS_FILE_LAST_MODIFIED,
  TEXAS_GEO_COMMA_ONLY,
  TEXAS_GEO_PAIRS,
  TEXAS_LICENSED_YES,
  TEXAS_ROWS,
  TEXAS_STATE_TEXAS,
  TEXAS_STATE_TX,
  TEXAS_TYPE_A,
  TEXAS_TYPE_B,
  TEXAS_TYPE_C,
  TEXAS_ZIP_FIVE,
  TEXAS_ZIP_NINE,
  TEXAS_CLOSURE_ACTIVE_ID_OVERLAP,
  TEXAS_CLOSURE_DATE_TOKENS,
  TEXAS_CLOSURE_FACILITY_IDS,
  TEXAS_CLOSURE_TYPE_A,
  TEXAS_CLOSURE_TYPE_B,
  TEXAS_CLOSURE_TYPE_C,
  TEXAS_CLOSURE_TYPE_E,
  adoptTexasExportDate,
  texasDisclosureUrl,
  texasPublicationReadiness,
  texasSourceDateRole,
} from "../../../lib/texas-alf-directory.ts";

test("the Texas active-license workbook stays unpublished", () => {
  const readiness = texasPublicationReadiness();
  assert.equal(readiness.rows, 2016);
  assert.equal(TEXAS_TYPE_A + TEXAS_TYPE_B + TEXAS_TYPE_C, TEXAS_ROWS);
  assert.equal(TEXAS_STATE_TX + TEXAS_STATE_TEXAS, TEXAS_ROWS);
  assert.equal(TEXAS_GEO_PAIRS + TEXAS_GEO_COMMA_ONLY, TEXAS_ROWS);
  assert.equal(TEXAS_CERTIFIED_NO + TEXAS_CERTIFIED_YES, TEXAS_ROWS);
  assert.equal(TEXAS_ZIP_FIVE + TEXAS_ZIP_NINE, TEXAS_ROWS);
  assert.equal(TEXAS_LICENSED_YES, TEXAS_ROWS);
  assert.equal(TEXAS_ALZHEIMER_CERTIFICATES, 736);
  assert.equal(readiness.activeAsOf, "11/12/2026");
  assert.equal(TEXAS_ACTIVE_AS_OF, "11/12/2026");
  assert.equal(TEXAS_FILE_LAST_MODIFIED, "Fri, 13 Nov 2026 14:07:19 GMT");
  assert.equal(readiness.authoritativeExportDate, null);
  assert.equal(texasSourceDateRole("11/12/2026"), "source-publication-label");
  assert.equal(texasSourceDateRole("2026-11-12"), "rewritten-iso-not-authoritative");
  assert.equal(texasSourceDateRole(TEXAS_FILE_LAST_MODIFIED), "file-clock");
  assert.equal(adoptTexasExportDate("11/12/2026"), null);
  assert.equal(adoptTexasExportDate("2026-11-12"), null);
  assert.equal(adoptTexasExportDate(TEXAS_FILE_LAST_MODIFIED), null);
  assert.equal(TEXAS_CLOSURE_TYPE_A + TEXAS_CLOSURE_TYPE_B + TEXAS_CLOSURE_TYPE_C + TEXAS_CLOSURE_TYPE_E, TEXAS_CLOSURE_FACILITY_IDS);
  assert.equal(TEXAS_CLOSURE_ACTIVE_ID_OVERLAP, 0);
  assert.notEqual(TEXAS_CLOSURE_DATE_TOKENS, TEXAS_CLOSURE_FACILITY_IDS);
  assert.equal(readiness.statusReady, false);
  assert.equal(readiness.disclosureReady, false);
  assert.equal(readiness.coordinateColumns, false);
  assert.equal(readiness.directoryReady, false);
  assert.equal(readiness.mapReady, false);
  assert.equal(texasDisclosureUrl("example"), null);
  assert.equal(directoryContract("Texas")?.publication, "unpublished");
  assert.equal(directoryContract("Texas")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

test("the compatibility record does not treat the workbook label as an export date", () => {
  const texas = compatibilityAssessment("Texas");
  assert.equal(texas?.compatibility, "C");
  assert.equal(texas?.publication, "unpublished");
  assert.equal(texas?.observedRows, 2016);
  assert.equal(texas?.licenseIdentifier, true);
  assert.equal(texas?.physicalAddress, true);
  assert.equal(texas?.perRowStatus, true);
  assert.equal(texas?.disclosureLink, false);
  assert.equal(texas?.isoExportDate, false);
  assert.equal(texas?.coordinateColumns, false);
  const evidence = Object.fromEntries((texas?.evidence ?? []).map(item => [item.field, item.observation]));
  assert.equal(evidence["regulatory-identifier"], "present");
  assert.equal(evidence["source-record-id"], "present");
  assert.equal(evidence["physical-address"], "present");
  assert.equal(evidence["official-export-date"], "rejected");
  assert.equal(evidence["source-publication-date"], "present");
  assert.equal(evidence["original-status"], "present");
  assert.equal(evidence["facility-disclosure"], "absent");
  assert.equal(evidence["generic-search"], "present");
  assert.equal(evidence["coordinates"], "present");
  assert.equal(evidence["coordinate-source"], "not-verified");
});

import assert from "node:assert/strict";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";
import { compatibilityAssessment } from "../../../lib/nationwide-compatibility.ts";
import {
  WYOMING_ALF_TYPE_CODE_ROWS,
  WYOMING_FILE_LAST_MODIFIED,
  adoptWyomingExportDate,
  wyomingDirectoryReady,
  wyomingDisclosureUrl,
} from "../../../lib/wyoming-facility-directory.ts";

test("the opened Wyoming workbook stays unpublished and does not adopt a file clock", () => {
  assert.equal(WYOMING_ALF_TYPE_CODE_ROWS, 31);
  assert.equal(WYOMING_FILE_LAST_MODIFIED, "Mon, 02 Nov 2026 14:45:09 GMT");
  assert.equal(adoptWyomingExportDate(WYOMING_FILE_LAST_MODIFIED), null);
  assert.equal(adoptWyomingExportDate("2026-11-02"), null);
  assert.equal(wyomingDirectoryReady(), false);
  assert.equal(wyomingDisclosureUrl("example"), null);
  assert.equal(directoryContract("Wyoming")?.publication, "unpublished");
  assert.equal(directoryContract("Wyoming")?.directoryPath, null);
  const wyoming = compatibilityAssessment("Wyoming");
  assert.equal(wyoming?.compatibility, "C");
  assert.equal(wyoming?.publication, "unpublished");
  assert.equal(wyoming?.observedRows, null);
  assert.equal(wyoming?.licenseIdentifier, true);
  assert.equal(wyoming?.physicalAddress, false);
  assert.equal(wyoming?.perRowStatus, false);
  assert.equal(wyoming?.disclosureLink, false);
  assert.equal(wyoming?.isoExportDate, false);
  const evidence = Object.fromEntries((wyoming?.evidence ?? []).map(item => [item.field, item.observation]));
  assert.equal(evidence["official-export-date"], "rejected");
  assert.equal(evidence["original-status"], "absent");
  assert.equal(evidence["facility-disclosure"], "absent");
  assert.equal(evidence["physical-address"], "absent");
});

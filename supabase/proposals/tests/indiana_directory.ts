import assert from "node:assert/strict";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";
import { compatibilityAssessment } from "../../../lib/nationwide-compatibility.ts";
import {
  INDIANA_CITY_ZIP_LINES,
  INDIANA_EXPIRE_SINGLE_DIGIT_MONTH,
  INDIANA_EXPIRE_TWO_DIGIT_MONTH,
  INDIANA_FACILITIES,
  INDIANA_POSTED_TO_WEB,
  INDIANA_STREET_LINES,
  INDIANA_UNIQUE_LICENSES,
  adoptIndianaExportDate,
  indianaDisclosureUrl,
  indianaPublicationReadiness,
} from "../../../lib/indiana-directory.ts";

test("the Indiana directory count is recorded and stays unpublished", () => {
  const readiness = indianaPublicationReadiness();
  assert.equal(readiness.facilities, 225);
  assert.equal(INDIANA_FACILITIES, INDIANA_UNIQUE_LICENSES);
  assert.equal(INDIANA_STREET_LINES, 228);
  assert.equal(INDIANA_CITY_ZIP_LINES, 225);
  assert.equal(INDIANA_EXPIRE_SINGLE_DIGIT_MONTH + INDIANA_EXPIRE_TWO_DIGIT_MONTH, 225);
  assert.equal(readiness.postedToWeb, "11/5/2026");
  assert.equal(INDIANA_POSTED_TO_WEB, "11/5/2026");
  assert.equal(readiness.authoritativeExportDate, null);
  assert.equal(adoptIndianaExportDate("11/5/2026"), null);
  assert.equal(adoptIndianaExportDate("2026-11-05"), null);
  assert.equal(readiness.statusReady, false);
  assert.equal(readiness.disclosureReady, false);
  assert.equal(readiness.coordinateColumns, false);
  assert.equal(readiness.directoryReady, false);
  assert.equal(indianaDisclosureUrl("example"), null);
  assert.equal(directoryContract("Indiana")?.publication, "unpublished");
  assert.equal(directoryContract("Indiana")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

test("the compatibility record uses the counted directory and does not adopt the posted date", () => {
  const indiana = compatibilityAssessment("Indiana");
  assert.equal(indiana?.observedRows, 225);
  assert.equal(indiana?.publication, "unpublished");
  assert.equal(indiana?.licenseIdentifier, true);
  assert.equal(indiana?.perRowStatus, false);
  assert.equal(indiana?.disclosureLink, false);
  assert.equal(indiana?.isoExportDate, false);
  assert.equal(indiana?.coordinateColumns, false);
  const evidence = Object.fromEntries((indiana?.evidence ?? []).map(item => [item.field, item.observation]));
  assert.equal(evidence["regulatory-identifier"], "present");
  assert.equal(evidence["official-export-date"], "rejected");
  assert.equal(evidence["source-publication-date"], "present");
  assert.equal(evidence["original-status"], "absent");
  assert.equal(evidence["facility-disclosure"], "absent");
  assert.equal(evidence["physical-address"], "not-verified");
  assert.equal(evidence["unverified-address"], "present");
});

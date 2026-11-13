import assert from "node:assert/strict";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";
import { compatibilityAssessment } from "../../../lib/nationwide-compatibility.ts";
import {
  MISSOURI_ADDRESS_BLANK,
  MISSOURI_CAPACITY_BLANK,
  MISSOURI_CATALOG_UPDATED_AT,
  MISSOURI_EFFECTIVE_DATE_BLANK,
  MISSOURI_EXPIRATION_BLANK,
  MISSOURI_FACILITY_NUMBERS,
  MISSOURI_LEVEL_COUNTS,
  MISSOURI_LICENSE_BLANK,
  MISSOURI_LICENSE_NUMBERS,
  MISSOURI_ROWS,
  adoptMissouriExportDate,
  missouriDisclosureUrl,
  missouriPublicationReadiness,
} from "../../../lib/missouri-ltc-directory.ts";

test("Missouri is the recorded candidate and stays unpublished", () => {
  const readiness = missouriPublicationReadiness();
  const levels = Object.values(MISSOURI_LEVEL_COUNTS).reduce((sum, count) => sum + count, 0);
  assert.equal(readiness.candidate, "Missouri");
  assert.equal(readiness.rows, 1102);
  assert.equal(MISSOURI_ROWS, levels);
  assert.equal(MISSOURI_LEVEL_COUNTS.ALF + MISSOURI_LEVEL_COUNTS["ALF**"] + MISSOURI_LEVEL_COUNTS.RCF + MISSOURI_LEVEL_COUNTS["RCF*"], 600);
  assert.equal(MISSOURI_LEVEL_COUNTS.SNF + MISSOURI_LEVEL_COUNTS.ICF, 502);
  assert.equal(MISSOURI_ROWS - MISSOURI_FACILITY_NUMBERS, 115);
  assert.equal(MISSOURI_ROWS - MISSOURI_LICENSE_NUMBERS, 6);
  assert.equal(MISSOURI_LICENSE_BLANK, 0);
  assert.equal(MISSOURI_ADDRESS_BLANK, 0);
  assert.equal(MISSOURI_CAPACITY_BLANK, 0);
  assert.equal(MISSOURI_EFFECTIVE_DATE_BLANK, 0);
  assert.equal(MISSOURI_EXPIRATION_BLANK, 0);
  assert.equal(readiness.catalogUpdatedAt, "2026-11-04T18:30:08Z");
  assert.equal(MISSOURI_CATALOG_UPDATED_AT, "2026-11-04T18:30:08Z");
  assert.equal(readiness.authoritativeExportDate, null);
  assert.equal(adoptMissouriExportDate(MISSOURI_CATALOG_UPDATED_AT), null);
  assert.equal(adoptMissouriExportDate("2026-11-04"), null);
  assert.equal(readiness.statusReady, false);
  assert.equal(readiness.disclosureReady, false);
  assert.equal(readiness.coordinateColumns, false);
  assert.equal(readiness.directoryReady, false);
  assert.equal(readiness.mapReady, false);
  assert.equal(missouriDisclosureUrl("example"), null);
  assert.equal(directoryContract("Missouri")?.publication, "unpublished");
  assert.equal(directoryContract("Missouri")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

test("the compatibility record keeps the catalog time and the inspection search out of publication", () => {
  const missouri = compatibilityAssessment("Missouri");
  assert.equal(missouri?.compatibility, "C");
  assert.equal(missouri?.publication, "unpublished");
  assert.equal(missouri?.observedRows, 1102);
  assert.equal(missouri?.licenseIdentifier, true);
  assert.equal(missouri?.perRowStatus, false);
  assert.equal(missouri?.disclosureLink, false);
  assert.equal(missouri?.isoExportDate, false);
  assert.equal(missouri?.coordinateColumns, false);
  const evidence = Object.fromEntries((missouri?.evidence ?? []).map(item => [item.field, item.observation]));
  assert.equal(evidence["regulatory-identifier"], "present");
  assert.equal(evidence["official-export-date"], "rejected");
  assert.equal(evidence["retrieval-timestamp"], "present");
  assert.equal(evidence["original-status"], "absent");
  assert.equal(evidence["original-category"], "present");
  assert.equal(evidence["facility-disclosure"], "absent");
  assert.equal(evidence["generic-search"], "present");
  assert.equal(evidence["physical-address"], "not-verified");
  assert.equal(evidence["mailing-address"], "present");
  assert.equal(evidence["unverified-address"], "present");
});

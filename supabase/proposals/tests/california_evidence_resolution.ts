import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_DETAIL_API_DOCUMENTED_AS_FILE_STATUS_SOURCE,
  CALIFORNIA_EVIDENCE_STOP,
  CALIFORNIA_EXPORT_DATE_PUBLISHED,
  CALIFORNIA_EXTERNAL_EVIDENCE_GAPS,
  CALIFORNIA_IMPLEMENTATION_EVIDENCE_GAPS,
  CALIFORNIA_NAME_EVIDENCE,
  CALIFORNIA_STREET_EVIDENCE,
  californiaEvidenceResolved,
} from "../../../lib/california-evidence-resolution.ts";
import { CALIFORNIA_AUTHORITATIVE_EXPORT_DATE } from "../../../lib/california-publication-readiness.ts";
import { CALIFORNIA_FILE_EXPORT_DATE, CALIFORNIA_MANDATORY_UNRESOLVED } from "../../../lib/california-publication-acceptance.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

test("reviewed metadata does not publish an export date or document the detail API as the file status source", () => {
  assert.equal(CALIFORNIA_EXPORT_DATE_PUBLISHED, false);
  assert.equal(CALIFORNIA_AUTHORITATIVE_EXPORT_DATE, null);
  assert.equal(CALIFORNIA_FILE_EXPORT_DATE, null);
  assert.equal(CALIFORNIA_DETAIL_API_DOCUMENTED_AS_FILE_STATUS_SOURCE, false);
  assert.equal(californiaEvidenceResolved(), false);
  assert.equal(CALIFORNIA_MANDATORY_UNRESOLVED.includes("no-authoritative-iso-export-date"), true);
});

test("names and streets stay insufficient, and the same requests stay stopped", () => {
  assert.equal(CALIFORNIA_NAME_EVIDENCE, "insufficient");
  assert.equal(CALIFORNIA_STREET_EVIDENCE, "insufficient");
  assert.deepEqual(CALIFORNIA_IMPLEMENTATION_EVIDENCE_GAPS, []);
  assert.equal(CALIFORNIA_EXTERNAL_EVIDENCE_GAPS.includes("facility-detail-api-not-documented-as-file-status-source"), true);
  assert.equal(CALIFORNIA_EXTERNAL_EVIDENCE_GAPS.includes("completed-street-response-was-not-classified-against-placeholders"), true);
  assert.equal(CALIFORNIA_EVIDENCE_STOP.repeatFacilityDetail, false);
  assert.equal(CALIFORNIA_EVIDENCE_STOP.repeatDatastoreHttp500, false);
  assert.equal(CALIFORNIA_EVIDENCE_STOP.repeatTimedOutRequests, false);
  assert.equal(CALIFORNIA_EVIDENCE_STOP.repeatOpenDataDownload, false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261114030000_california_evidence_resolution.md", import.meta.url), "utf8");
  assert.equal(home.includes("Find the right care home for your loved one."), true);
  assert.equal(proposal.includes("does not download the open-data files"), true);
  assert.equal(proposal.includes("not an official statement"), true);
});

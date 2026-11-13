import assert from "node:assert/strict";
import test from "node:test";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_STATUS_SAMPLE,
  reconcileCaliforniaStatus,
} from "../../../lib/california-status-reconciliation.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

test("historical licensed status is never treated as currently active", () => {
  const unavailable = reconcileCaliforniaStatus({
    openDataStatus: "LICENSED",
    httpStatus: null,
    liveStatus: null,
    identifierMatched: false,
  });
  const liveLicensed = reconcileCaliforniaStatus({
    openDataStatus: "LICENSED",
    httpStatus: 200,
    liveStatus: "Licensed",
    identifierMatched: true,
  });
  assert.equal(unavailable.classification, "inconclusive");
  assert.equal(unavailable.currentlyActive, false);
  assert.equal(unavailable.confirmedClosure, false);
  assert.equal(liveLicensed.classification, "match");
  assert.equal(liveLicensed.currentlyActive, false);
  assert.equal(liveLicensed.openDataStatus, "LICENSED");
  assert.equal(liveLicensed.liveStatus, "Licensed");
});

test("checked licensed rows conflict with confirmed live closure text", () => {
  for (const liveStatus of ["Closed, Change of Ownership", "Closed, Licensee Initiated"]) {
    const result = reconcileCaliforniaStatus({
      openDataStatus: "LICENSED",
      httpStatus: 200,
      liveStatus,
      identifierMatched: true,
    });
    assert.equal(result.classification, "conflict");
    assert.equal(result.confirmedClosure, true);
    assert.equal(result.liveStatus, liveStatus);
    assert.equal(result.currentlyActive, false);
  }
});

test("exact official labels can match while closure reasons stay intact", () => {
  assert.equal(reconcileCaliforniaStatus({
    openDataStatus: "CLOSED",
    httpStatus: 200,
    liveStatus: "Closed, Agency Initiated",
    identifierMatched: true,
  }).classification, "match");
  assert.equal(reconcileCaliforniaStatus({
    openDataStatus: "PENDING",
    httpStatus: 200,
    liveStatus: "Pending",
    identifierMatched: true,
  }).classification, "match");
  assert.equal(reconcileCaliforniaStatus({
    openDataStatus: "ON PROBATION",
    httpStatus: 200,
    liveStatus: "Probation",
    identifierMatched: true,
  }).classification, "match");
  const differentProbation = reconcileCaliforniaStatus({
    openDataStatus: "ON PROBATION",
    httpStatus: 200,
    liveStatus: "Probationary License",
    identifierMatched: true,
  });
  assert.equal(differentProbation.classification, "conflict");
  assert.equal(differentProbation.confirmedClosure, false);
});

test("an empty live status and a failed response are unavailable, not closed", () => {
  const empty = reconcileCaliforniaStatus({
    openDataStatus: "CLOSED",
    httpStatus: 200,
    liveStatus: "  ",
    identifierMatched: true,
  });
  const forbidden = reconcileCaliforniaStatus({
    openDataStatus: "LICENSED",
    httpStatus: 403,
    liveStatus: null,
    identifierMatched: false,
  });
  const timedOut = reconcileCaliforniaStatus({
    openDataStatus: "PENDING",
    httpStatus: 0,
    liveStatus: null,
    identifierMatched: false,
  });
  assert.equal(empty.classification, "inconclusive");
  assert.equal(empty.confirmedClosure, false);
  assert.equal(empty.liveStatus, null);
  assert.equal(forbidden.classification, "inconclusive");
  assert.equal(timedOut.classification, "inconclusive");
  assert.equal(CALIFORNIA_STATUS_SAMPLE.timedOut, 6);
  assert.equal(CALIFORNIA_STATUS_SAMPLE.forbidden, 0);
  assert.equal(CALIFORNIA_STATUS_SAMPLE.retriedAfterForbidden, false);
});

test("a response for a different identifier is missing rather than closed", () => {
  const missing = reconcileCaliforniaStatus({
    openDataStatus: "LICENSED",
    httpStatus: 200,
    liveStatus: "Closed, Unlicensed Facility",
    identifierMatched: false,
  });
  assert.equal(missing.classification, "missing");
  assert.equal(missing.confirmedClosure, false);
  assert.equal(missing.liveStatus, "Closed, Unlicensed Facility");
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

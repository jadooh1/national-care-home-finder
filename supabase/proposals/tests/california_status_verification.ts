import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { reconcileCaliforniaStatus } from "../../../lib/california-status-reconciliation.ts";
import { CALIFORNIA_STATUS_VERIFICATION_SAMPLE } from "../../../lib/california-status-verification-sample.ts";
import {
  CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD,
  CALIFORNIA_TRANSPARENCY_PROVENANCE,
  fetchCaliforniaFacilityDetail,
  observeCaliforniaStatusVerification,
  parseCaliforniaFacilityDetail,
  relateCaliforniaFacilityIdentifiers,
  summarizeCaliforniaStatusVerification,
  verifyCaliforniaStatusSample,
} from "../../../lib/california-status-verification.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-status-verification",
);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, `${name}.json`), "utf8"));
}

test("FacilityDetail provenance documents status proof fields and limitations", () => {
  assert.equal(
    CALIFORNIA_TRANSPARENCY_PROVENANCE.endpoint,
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  );
  assert.deepEqual(CALIFORNIA_TRANSPARENCY_PROVENANCE.statusProofFields, [
    "FACILITYNUMBER",
    "STATUS",
  ]);
  assert.ok(CALIFORNIA_TRANSPARENCY_PROVENANCE.limitations.length >= 4);
  assert.equal(CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD.sampleVerificationSufficient, false);
  assert.equal(CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD.requiresRosterWideCurrentStatusVerification, true);
});

test("parses wrapped FacilityDetail payloads and not-found responses", () => {
  const licensed = parseCaliforniaFacilityDetail(loadFixture("exact-licensed-rcfe"));
  assert.equal(licensed.wrapper, "facility-detail-object");
  assert.equal(licensed.found, true);
  assert.equal(licensed.facilityNumber, "100400070");
  assert.equal(licensed.status, "Licensed");

  const missing = parseCaliforniaFacilityDetail(loadFixture("not-found"));
  assert.equal(missing.found, false);
  assert.equal(missing.facilityNumber, null);
  assert.equal(missing.status, null);

  const flat = parseCaliforniaFacilityDetail({
    FACILITYNUMBER: "100403816",
    STATUS: "Licensed",
    FACILITYNAME: "Example",
  });
  assert.equal(flat.wrapper, "flat-object");
  assert.equal(flat.facilityNumber, "100403816");

  const arrayWrap = parseCaliforniaFacilityDetail([
    { FACILITYNUMBER: "011400246", STATUS: "Closed, Licensee Initiated" },
  ]);
  assert.equal(arrayWrap.wrapper, "facility-detail-array");
  assert.equal(arrayWrap.status, "Closed, Licensee Initiated");
});

test("leading-zero truncated requests canonicalize without becoming identifier matches", () => {
  assert.equal(relateCaliforniaFacilityIdentifiers("015601302", "015601302"), "exact");
  assert.equal(
    relateCaliforniaFacilityIdentifiers("15601302", "015601302"),
    "leading-zero-canonicalization",
  );
  assert.equal(relateCaliforniaFacilityIdentifiers("100400070", "100403816"), "mismatch");
  assert.equal(relateCaliforniaFacilityIdentifiers("011400493", null), "missing");

  const truncated = observeCaliforniaStatusVerification(
    {
      requestedId: "15601302",
      historicalStatus: "LICENSED",
      gisCohort: "leading-zero-truncated-request",
      label: "leading-zero-truncated-request",
    },
    { httpStatus: 200, attempts: 1, payload: loadFixture("leading-zero-truncated-request") },
    reconcileCaliforniaStatus,
  );
  assert.equal(truncated.identifierRelation, "leading-zero-canonicalization");
  assert.equal(truncated.identifierMatched, false);
  assert.equal(truncated.parse?.facilityNumber, "015601302");
  assert.equal(truncated.parse?.status, "Licensed");
  assert.equal(truncated.reconciliation.classification, "missing");
  assert.equal(truncated.reconciliation.currentlyActive, false);
});

test("confirmed historical LICENSED versus official Closed is a conflict", () => {
  const conflict = observeCaliforniaStatusVerification(
    {
      requestedId: "011400493",
      historicalStatus: "LICENSED",
      gisCohort: "gis-missing",
      file: "ARF",
      label: "confirmed-licensed-to-closed-conflict",
    },
    { httpStatus: 200, attempts: 1, payload: loadFixture("conflict-licensed-closed") },
    reconcileCaliforniaStatus,
  );
  assert.equal(conflict.reconciliation.classification, "conflict");
  assert.equal(conflict.reconciliation.confirmedClosure, true);
  assert.equal(conflict.reconciliation.liveStatus, "Closed, Licensee Initiated");
  assert.equal(conflict.reconciliation.currentlyActive, false);
});

test("sample summary stays unpublished and is not a statewide conclusion", () => {
  const observations = [
    observeCaliforniaStatusVerification(
      {
        requestedId: "100400070",
        historicalStatus: "LICENSED",
        gisCohort: "exact-match",
      },
      { httpStatus: 200, attempts: 1, payload: loadFixture("exact-licensed-rcfe") },
      reconcileCaliforniaStatus,
    ),
    observeCaliforniaStatusVerification(
      {
        requestedId: "011400493",
        historicalStatus: "LICENSED",
        gisCohort: "gis-missing",
      },
      { httpStatus: 200, attempts: 1, payload: loadFixture("conflict-licensed-closed") },
      reconcileCaliforniaStatus,
    ),
    observeCaliforniaStatusVerification(
      {
        requestedId: "15601302",
        historicalStatus: "LICENSED",
        gisCohort: "leading-zero-truncated-request",
      },
      { httpStatus: 200, attempts: 1, payload: loadFixture("leading-zero-truncated-request") },
      reconcileCaliforniaStatus,
    ),
    observeCaliforniaStatusVerification(
      {
        requestedId: "011400246",
        historicalStatus: "CLOSED",
        gisCohort: "gis-missing",
      },
      { httpStatus: 200, attempts: 1, payload: loadFixture("gis-missing-closed") },
      reconcileCaliforniaStatus,
    ),
  ];
  const report = summarizeCaliforniaStatusVerification(observations, "2026-11-19");
  assert.equal(report.sampleSize, 4);
  assert.equal(report.matches, 2);
  assert.equal(report.byClassification.conflict, 1);
  assert.equal(report.licensedToClosedConflicts, 1);
  assert.equal(report.leadingZeroCanonicalizations, 1);
  assert.equal(report.currentLicenseStatusVerified, false);
  assert.equal(report.publication, "unpublished");
  assert.equal(report.ownerClaimEligible, false);
  assert.equal(report.sampleIsStatewideConclusion, false);
  assert.equal(report.currentlyActive, false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
});

test("risk sample includes exact, leading-zero, gis-missing, and the confirmed conflict", () => {
  const cohorts = new Set(CALIFORNIA_STATUS_VERIFICATION_SAMPLE.map(row => row.gisCohort));
  assert.ok(cohorts.has("exact-match"));
  assert.ok(cohorts.has("leading-zero"));
  assert.ok(cohorts.has("gis-missing"));
  assert.ok(cohorts.has("leading-zero-truncated-request"));
  assert.ok(CALIFORNIA_STATUS_VERIFICATION_SAMPLE.some(row => row.historicalStatus === "LICENSED"));
  assert.ok(CALIFORNIA_STATUS_VERIFICATION_SAMPLE.some(row => row.historicalStatus === "CLOSED"));
  const conflict = CALIFORNIA_STATUS_VERIFICATION_SAMPLE.find(row => row.requestedId === "011400493");
  assert.equal(conflict?.historicalStatus, "LICENSED");
  assert.equal(conflict?.gisCohort, "gis-missing");
  assert.ok(CALIFORNIA_STATUS_VERIFICATION_SAMPLE.length >= 16);
});

test("fetchCaliforniaFacilityDetail rate-limits and retries bounded failures", async () => {
  const calls: string[] = [];
  let attempt = 0;
  const sleeps: number[] = [];
  const clock = { value: 1_000_000 };
  const lastRequestAt = { value: 0 };
  const fetcher = async (input: RequestInfo | URL) => {
    calls.push(String(input));
    attempt += 1;
    if (attempt === 1) {
      return new Response("busy", { status: 503 });
    }
    return new Response(JSON.stringify(loadFixture("exact-licensed-arf")), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const result = await fetchCaliforniaFacilityDetail("100403816", {
    fetcher: fetcher as typeof fetch,
    minIntervalMs: 250,
    maxAttempts: 3,
    backoffMs: [10],
    lastRequestAt,
    now: () => clock.value,
    sleepFn: async ms => {
      sleeps.push(ms);
      clock.value += ms;
    },
  });
  assert.equal(result.httpStatus, 200);
  assert.equal(result.attempts, 2);
  assert.equal(result.timedOut, false);
  assert.equal(calls.length, 2);
  // First call needs no rate-limit wait (clock starts far ahead of lastRequestAt).
  // After the 503, backoff (10) runs, then the residual rate-limit wait (~240).
  assert.deepEqual(sleeps, [10, 240]);
  assert.match(calls[0]!, /FacilityDetail\/100403816$/);

  const timedOut = await fetchCaliforniaFacilityDetail("100400070", {
    fetcher: async () => {
      throw new Error("network down");
    },
    minIntervalMs: 0,
    maxAttempts: 2,
    backoffMs: [5],
    now: () => 0,
    sleepFn: async () => undefined,
  });
  assert.equal(timedOut.timedOut, true);
  assert.equal(timedOut.httpStatus, 0);
  assert.equal(timedOut.attempts, 2);
});

test("verifyCaliforniaStatusSample uses the injected fetcher and stays unpublished", async () => {
  const payloads = new Map<string, unknown>([
    ["100400070", loadFixture("exact-licensed-rcfe")],
    ["011400493", loadFixture("conflict-licensed-closed")],
  ]);
  const report = await verifyCaliforniaStatusSample(
    [
      {
        requestedId: "100400070",
        historicalStatus: "LICENSED",
        gisCohort: "exact-match",
      },
      {
        requestedId: "011400493",
        historicalStatus: "LICENSED",
        gisCohort: "gis-missing",
      },
    ],
    {
      observedOn: "2026-11-19",
      minIntervalMs: 0,
      reconcile: reconcileCaliforniaStatus,
      fetcher: (async (input: RequestInfo | URL) => {
        const id = String(input).split("/").pop()!;
        return new Response(JSON.stringify(payloads.get(id)), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch,
      sleepFn: async () => undefined,
      now: () => 0,
    },
  );
  assert.equal(report.sampleSize, 2);
  assert.equal(report.matches, 1);
  assert.equal(report.licensedToClosedConflicts, 1);
  assert.equal(report.publication, "unpublished");
  assert.equal(report.currentLicenseStatusVerified, false);
});

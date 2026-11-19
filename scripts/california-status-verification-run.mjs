#!/usr/bin/env node
/**
 * Read-only live FacilityDetail sample runner for California Phase 2.
 * Usage: node --experimental-strip-types scripts/california-status-verification-run.mjs [out.json]
 * Does not write database records or publish California.
 */
import { writeFileSync } from "node:fs";
import { reconcileCaliforniaStatus } from "../lib/california-status-reconciliation.ts";
import { CALIFORNIA_STATUS_VERIFICATION_SAMPLE } from "../lib/california-status-verification-sample.ts";
import { verifyCaliforniaStatusSample } from "../lib/california-status-verification.ts";

const outPath = process.argv[2] ?? "california-status-verification-live.json";
const observedOn = new Date().toISOString().slice(0, 10);

const report = await verifyCaliforniaStatusSample(CALIFORNIA_STATUS_VERIFICATION_SAMPLE, {
  observedOn,
  minIntervalMs: 450,
  maxAttempts: 3,
  reconcile: reconcileCaliforniaStatus,
});

const serializable = {
  ...report,
  conflicts: report.conflicts.map(compactObservation),
  observations: report.observations.map(compactObservation),
  evidenceThreshold: report.evidenceThreshold,
  provenance: report.provenance,
};

writeFileSync(outPath, `${JSON.stringify(serializable, null, 2)}\n`);
console.log(JSON.stringify({
  outPath,
  observedOn: report.observedOn,
  sampleSize: report.sampleSize,
  byClassification: report.byClassification,
  licensedToClosedConflicts: report.licensedToClosedConflicts,
  leadingZeroCanonicalizations: report.leadingZeroCanonicalizations,
  publication: report.publication,
  currentLicenseStatusVerified: report.currentLicenseStatusVerified,
  sampleIsStatewideConclusion: report.sampleIsStatewideConclusion,
}, null, 2));

function compactObservation(observation) {
  return {
    label: observation.label ?? null,
    requestedId: observation.requestedId,
    historicalStatus: observation.historicalStatus,
    gisCohort: observation.gisCohort,
    file: observation.file ?? null,
    httpStatus: observation.httpStatus,
    attempts: observation.attempts,
    timedOut: observation.timedOut,
    identifierRelation: observation.identifierRelation,
    identifierMatched: observation.identifierMatched,
    canonicalFacilityNumber: observation.parse?.facilityNumber ?? null,
    liveStatus: observation.reconciliation.liveStatus,
    classification: observation.reconciliation.classification,
    confirmedClosure: observation.reconciliation.confirmedClosure,
    detailPageUrl: observation.detailPageUrl,
  };
}

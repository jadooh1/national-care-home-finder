import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  MINNESOTA_CURRENT_CAPTURE,
  MINNESOTA_MDH_ANNUAL_PDF_2026,
  MINNESOTA_PRIOR_DHS_LOOKUP_BASELINE,
  evaluateMinnesotaSourceVerification,
  minnesotaDirectoryReady,
} from "../../../lib/minnesota-source-verification.ts";
import { evaluateMinnesotaSampleQuality } from "../../../lib/minnesota-sample-quality.ts";
import { evaluateMinnesotaDisclosureInvestigation } from "../../../lib/minnesota-disclosure-investigation.ts";
import { buildMinnesotaEligibilityMatrix } from "../../../lib/minnesota-eligibility-matrix.ts";
import {
  MINNESOTA_INVESTIGATION_STOP_GO,
  evaluateMinnesotaInvestigationReadiness,
  minnesotaInvestigationAllowsPublication,
} from "../../../lib/minnesota-investigation-readiness.ts";
import { evaluateMinnesotaInvestigationQuality } from "../../../lib/minnesota-investigation-quality.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { pennsylvaniaDirectoryReady } from "../../../lib/pennsylvania-licensing.ts";
import { wisconsinDirectoryReady } from "../../../lib/wisconsin-source-verification.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  WASHINGTON_LISTED_COUNT,
  OREGON_LISTED_COUNT,
} from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/minnesota-care-home-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("minnesota source verification: annual PDF aggregates; no facility roster", () => {
  const source = evaluateMinnesotaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(MINNESOTA_PRIOR_DHS_LOOKUP_BASELINE.figuresReconciled, false);
  assert.equal(MINNESOTA_MDH_ANNUAL_PDF_2026.classificationsAsOf2026_03_13.assistedLivingFacilities.facilities, 1083);
  assert.equal(MINNESOTA_MDH_ANNUAL_PDF_2026.classificationsAsOf2026_03_13.assistedLivingFacilityDementiaCare.facilities, 566);
  assert.equal(MINNESOTA_MDH_ANNUAL_PDF_2026.containsFacilityLevelRows, false);
  assert.equal(MINNESOTA_MDH_ANNUAL_PDF_2026.asOfIsAuthoritativeIsoExportDate, false);
  assert.equal(MINNESOTA_CURRENT_CAPTURE.mdhInteractiveDirectory.interactiveAvailableThisRun, false);
  assert.equal(MINNESOTA_CURRENT_CAPTURE.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
  assert.equal(minnesotaDirectoryReady(), false);
});

test("minnesota sample quality: no facility sample; no statewide extrapolation", () => {
  const sample = evaluateMinnesotaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.sampleExecuted, false);
  assert.equal(sample.result.rowsSampled, 0);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.allowsPublication, false);
});

test("minnesota disclosure: no verified detail prefix this run", () => {
  const disclosure = evaluateMinnesotaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.interactiveProviderDirectoryAvailableThisRun, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("minnesota eligibility matrix + readiness STOP; category risks present", () => {
  const matrix = buildMinnesotaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.equal(MINNESOTA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(minnesotaInvestigationAllowsPublication(), false);
  const readiness = evaluateMinnesotaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.minnesotaDirectoryReady, false);
});

test("minnesota investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    mdhAnnualPdf2026: { assistedLivingFacilities: number; containsFacilityLevelRows: boolean };
    interactiveDirectory: { availableThisRun: boolean; facilityLevelSampleRows: number };
    categoryEquivalenceToWashingtonAfh: boolean;
    recordedExportDate: null;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(fixture.mdhAnnualPdf2026.assistedLivingFacilities, 1083);
  assert.equal(fixture.mdhAnnualPdf2026.containsFacilityLevelRows, false);
  const quality = evaluateMinnesotaInvestigationQuality({
    interactiveAvailable: fixture.interactiveDirectory.availableThisRun,
    facilityLevelRows: fixture.interactiveDirectory.facilityLevelSampleRows,
    sampleRows: fixture.interactiveDirectory.facilityLevelSampleRows,
    annualPdfHasFacilityRows: fixture.mdhAnnualPdf2026.containsFacilityLevelRows,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: false,
    exportDatePresent: fixture.recordedExportDate != null,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
    statewideCrawl: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("minnesota remains unpublished; WA/OR/CA/PA/MI/WI contracts unchanged", () => {
  assert.equal(directoryContract("Minnesota")?.publication, "unpublished");
  assert.equal(directoryHref("Minnesota", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Minnesota"), null);
  assert.equal(minnesotaDirectoryReady(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(michiganDirectoryReady(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
  assert.equal(wisconsinDirectoryReady(), false);
  assert.equal(WASHINGTON_LISTED_COUNT > 0, true);
  assert.equal(OREGON_LISTED_COUNT > 0, true);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

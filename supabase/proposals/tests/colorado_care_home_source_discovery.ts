import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  COLORADO_CURRENT_CAPTURE,
  COLORADO_PRIOR_MIXED_LAYER_BASELINE,
  evaluateColoradoSourceVerification,
  coloradoDirectoryReady,
} from "../../../lib/colorado-source-verification.ts";
import { evaluateColoradoSampleQuality } from "../../../lib/colorado-sample-quality.ts";
import { evaluateColoradoDisclosureInvestigation } from "../../../lib/colorado-disclosure-investigation.ts";
import { buildColoradoEligibilityMatrix } from "../../../lib/colorado-eligibility-matrix.ts";
import {
  COLORADO_INVESTIGATION_STOP_GO,
  evaluateColoradoInvestigationReadiness,
  coloradoInvestigationAllowsPublication,
} from "../../../lib/colorado-investigation-readiness.ts";
import { evaluateColoradoInvestigationQuality } from "../../../lib/colorado-investigation-quality.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
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
  "../fixtures/colorado-care-home-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("colorado source verification: ALR filter 685; export clocks rejected", () => {
  const source = evaluateColoradoSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(COLORADO_PRIOR_MIXED_LAYER_BASELINE.assistedLivingOnlyCountAdopted, false);
  assert.equal(COLORADO_CURRENT_CAPTURE.assistedLivingResidence.rows, 685);
  assert.equal(COLORADO_CURRENT_CAPTURE.assistedLivingResidence.uniqueFacilityIds, 685);
  assert.equal(COLORADO_CURRENT_CAPTURE.assistedLivingResidence.zeroBeds, 27);
  assert.equal(COLORADO_CURRENT_CAPTURE.featureServer.totalLayerRows, 5091);
  assert.equal(COLORADO_CURRENT_CAPTURE.featureServer.recordedExportDate, null);
  assert.equal(COLORADO_CURRENT_CAPTURE.featureServer.coordinatesAreLicensingCoordinates, false);
  assert.equal(COLORADO_CURRENT_CAPTURE.socrataMirror.tabularRowAccess, false);
  assert.equal(COLORADO_CURRENT_CAPTURE.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
  assert.equal(coloradoDirectoryReady(), false);
});

test("colorado sample quality: bounded ALR sample; no statewide extrapolation", () => {
  const sample = evaluateColoradoSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.sampleExecuted, true);
  assert.equal(sample.result.rowsSampled, 34);
  assert.equal(sample.population.rows, 685);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("colorado disclosure: Find and Compare search only; no detail prefix", () => {
  const disclosure = evaluateColoradoDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.findAndCompareIsSearchDashboard, true);
  assert.equal(disclosure.findings.coordinatesAreLicensingCoordinates, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("colorado eligibility matrix + readiness STOP; category risks present", () => {
  const matrix = buildColoradoEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.assistedLivingResidenceRows, 685);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.equal(COLORADO_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(coloradoInvestigationAllowsPublication(), false);
  const readiness = evaluateColoradoInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.coloradoDirectoryReady, false);
});

test("colorado investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    alr: {
      alrRows: number;
      uniqueFacilityIds: number;
      blankAddress: number;
      zeroBeds: number;
      sampleRows: number;
    };
    categoryEquivalenceToWashingtonAfh: boolean;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinatesAreLicensingCoordinates: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "alr-bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "layer-type-counts.json")), true);
  assert.equal(fixture.alr.alrRows, 685);
  assert.equal(fixture.alr.uniqueFacilityIds, 685);
  assert.equal(fixture.alr.sampleRows, 34);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinatesAreLicensingCoordinates, false);
  const sampleRows = loadJson<unknown[]>("alr-bounded-sample.json");
  assert.equal(sampleRows.length, 34);
  const typeCounts = loadJson<{ "Assisted Living Residence": number; total: number }>(
    "layer-type-counts.json",
  );
  assert.equal(typeCounts["Assisted Living Residence"], 685);
  assert.equal(typeCounts.total, 5091);
  const quality = evaluateColoradoInvestigationQuality({
    alrRows: fixture.alr.alrRows,
    uniqueFacilityIds: fixture.alr.uniqueFacilityIds,
    sampleRows: fixture.alr.sampleRows,
    blankAddress: fixture.alr.blankAddress,
    zeroBeds: fixture.alr.zeroBeds,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinatesClaimedAsLicensing: fixture.coordinatesAreLicensingCoordinates,
    statewideCrawl: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("colorado remains unpublished; WA/OR/CA/PA/MI/WI/MN contracts unchanged", () => {
  assert.equal(directoryContract("Colorado")?.publication, "unpublished");
  assert.equal(directoryHref("Colorado", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Colorado"), null);
  assert.equal(coloradoDirectoryReady(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(michiganDirectoryReady(), false);
  assert.equal(minnesotaDirectoryReady(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
  assert.equal(wisconsinDirectoryReady(), false);
  assert.equal(WASHINGTON_LISTED_COUNT > 0, true);
  assert.equal(OREGON_LISTED_COUNT > 0, true);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

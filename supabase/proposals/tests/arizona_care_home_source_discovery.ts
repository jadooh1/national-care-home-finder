import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ARIZONA_CURRENT_CAPTURE,
  ARIZONA_PRIOR_SEARCH_MAP_BASELINE,
  ARIZONA_ARS_36_401,
  evaluateArizonaSourceVerification,
  arizonaDirectoryReady,
} from "../../../lib/arizona-source-verification.ts";
import { evaluateArizonaSampleQuality } from "../../../lib/arizona-sample-quality.ts";
import { evaluateArizonaDisclosureInvestigation } from "../../../lib/arizona-disclosure-investigation.ts";
import { buildArizonaEligibilityMatrix } from "../../../lib/arizona-eligibility-matrix.ts";
import {
  ARIZONA_INVESTIGATION_STOP_GO,
  evaluateArizonaInvestigationReadiness,
  arizonaInvestigationAllowsPublication,
} from "../../../lib/arizona-investigation-readiness.ts";
import { evaluateArizonaInvestigationQuality } from "../../../lib/arizona-investigation-quality.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
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
  "../fixtures/arizona-care-home-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("arizona source verification: Home 1719 / Center 328; export clocks rejected", () => {
  const source = evaluateArizonaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(ARIZONA_PRIOR_SEARCH_MAP_BASELINE.licensingFileAdopted, false);
  assert.equal(ARIZONA_CURRENT_CAPTURE.assistedLivingHome.rows, 1719);
  assert.equal(ARIZONA_CURRENT_CAPTURE.assistedLivingCenter.rows, 328);
  assert.equal(ARIZONA_CURRENT_CAPTURE.combinedHomeCenterRows, 2047);
  assert.equal(ARIZONA_CURRENT_CAPTURE.assistedLivingHome.capacityMax, 10);
  assert.equal(ARIZONA_CURRENT_CAPTURE.assistedLivingCenter.capacityMin, 13);
  assert.equal(ARIZONA_CURRENT_CAPTURE.gis.recordedExportDate, null);
  assert.equal(ARIZONA_CURRENT_CAPTURE.gis.coordinatesAreLicensingCoordinates, false);
  assert.equal(ARIZONA_ARS_36_401.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
  assert.equal(arizonaDirectoryReady(), false);
});

test("arizona sample quality: bounded Home/Center sample; no statewide extrapolation", () => {
  const sample = evaluateArizonaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.sampleExecuted, true);
  assert.equal(sample.result.rowsSampled, 27);
  assert.equal(sample.population.combinedRows, 2047);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("arizona disclosure: AZ Care Check search only; no detail prefix", () => {
  const disclosure = evaluateArizonaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.azCareCheckIsSalesforceSearchSpa, true);
  assert.equal(disclosure.findings.guessedFacilityAspx.acceptedAsDisclosurePrefix, false);
  assert.equal(disclosure.findings.guessedFacilityAspx.facilityNamePresentInBody, false);
  assert.equal(disclosure.findings.coordinatesAreLicensingCoordinates, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("arizona eligibility matrix + readiness STOP; home/center risks present", () => {
  const matrix = buildArizonaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.assistedLivingHomeRows, 1719);
  assert.equal(matrix.counts.assistedLivingCenterRows, 328);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(matrix.categoryMappingRisks.some((r) => /Center/i.test(r)));
  assert.equal(ARIZONA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(arizonaInvestigationAllowsPublication(), false);
  const readiness = evaluateArizonaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.arizonaDirectoryReady, false);
});

test("arizona investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    home: { rows: number; capacityMax: number };
    center: { rows: number; capacityMin: number };
    combinedHomeCenterRows: number;
    facidOverlapHomeCenter: number;
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinatesAreLicensingCoordinates: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "al-bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "type-counts.json")), true);
  assert.equal(fixture.home.rows, 1719);
  assert.equal(fixture.center.rows, 328);
  assert.equal(fixture.combinedHomeCenterRows, 2047);
  assert.equal(fixture.facidOverlapHomeCenter, 0);
  assert.equal(fixture.sampleRows, 27);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  const sampleRows = loadJson<unknown[]>("al-bounded-sample.json");
  assert.equal(sampleRows.length, 27);
  const typeCounts = loadJson<{ combined: number; "ASSISTED LIVING HOME": number }>(
    "type-counts.json",
  );
  assert.equal(typeCounts.combined, 2047);
  assert.equal(typeCounts["ASSISTED LIVING HOME"], 1719);
  const quality = evaluateArizonaInvestigationQuality({
    homeRows: fixture.home.rows,
    centerRows: fixture.center.rows,
    facidOverlap: fixture.facidOverlapHomeCenter,
    sampleRows: fixture.sampleRows,
    homeCapacityMax: fixture.home.capacityMax,
    centerCapacityMin: fixture.center.capacityMin,
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

test("arizona remains unpublished; WA/OR/CA/PA/MI/WI/MN/CO contracts unchanged", () => {
  assert.equal(directoryContract("Arizona")?.publication, "unpublished");
  assert.equal(directoryHref("Arizona", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Arizona"), null);
  assert.equal(arizonaDirectoryReady(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(coloradoDirectoryReady(), false);
  assert.equal(michiganDirectoryReady(), false);
  assert.equal(minnesotaDirectoryReady(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
  assert.equal(wisconsinDirectoryReady(), false);
  assert.equal(WASHINGTON_LISTED_COUNT > 0, true);
  assert.equal(OREGON_LISTED_COUNT > 0, true);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

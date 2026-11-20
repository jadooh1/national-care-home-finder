import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  MARYLAND_CURRENT_CAPTURE,
  MARYLAND_PRIOR_BASELINE,
  MARYLAND_TYPE_DEFINITIONS,
  evaluateMarylandSourceVerification,
  marylandDirectoryReady,
} from "../../../lib/maryland-source-verification.ts";
import { evaluateMarylandSampleQuality } from "../../../lib/maryland-sample-quality.ts";
import { evaluateMarylandDisclosureInvestigation } from "../../../lib/maryland-disclosure-investigation.ts";
import { buildMarylandEligibilityMatrix } from "../../../lib/maryland-eligibility-matrix.ts";
import {
  MARYLAND_INVESTIGATION_STOP_GO,
  evaluateMarylandInvestigationReadiness,
  marylandInvestigationAllowsPublication,
} from "../../../lib/maryland-investigation-readiness.ts";
import { evaluateMarylandInvestigationQuality } from "../../../lib/maryland-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { georgiaDirectoryReady } from "../../../lib/georgia-source-verification.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
import { northCarolinaDirectoryReady } from "../../../lib/north-carolina-onboarding.ts";
import { ohioDirectoryReady } from "../../../lib/ohio-source-verification.ts";
import { pennsylvaniaDirectoryReady } from "../../../lib/pennsylvania-licensing.ts";
import { texasDirectoryReady } from "../../../lib/texas-source-verification.ts";
import { virginiaDirectoryReady } from "../../../lib/virginia-source-verification.ts";
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
  "../fixtures/maryland-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("maryland source verification: 1675 unique licenses; export date absent", () => {
  const source = evaluateMarylandSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(MARYLAND_PRIOR_BASELINE.compatibilityClass, "D");
  assert.equal(MARYLAND_CURRENT_CAPTURE.assistedLivingExcel.rows, 1676);
  assert.equal(MARYLAND_CURRENT_CAPTURE.assistedLivingExcel.uniqueLicenseNumber, 1675);
  assert.equal(MARYLAND_CURRENT_CAPTURE.assistedLivingExcel.duplicateLicenseGroups, 1);
  assert.equal(MARYLAND_CURRENT_CAPTURE.assistedLivingExcel.recordedExportDate, null);
  assert.equal(MARYLAND_CURRENT_CAPTURE.assistedLivingExcel.perRowStatusColumn, false);
  assert.equal(MARYLAND_CURRENT_CAPTURE.assistedLivingExcel.coordinateColumns, false);
  assert.equal(
    MARYLAND_CURRENT_CAPTURE.openDataImap.acceptedAsAuthoritativeLicensingRoster,
    false,
  );
  assert.equal(MARYLAND_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
});

test("maryland sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateMarylandSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.capacityLe16Sampled, 21);
  assert.equal(sample.result.capacityGt16Sampled, 11);
  assert.equal(sample.population.rows, 1676);
  assert.equal(sample.population.uniqueLicenseNumbers, 1675);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("maryland disclosure: no License Number prefix; Uniform Disclosure on-request", () => {
  const disclosure = evaluateMarylandDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsLicenseNumber, true);
  assert.equal(
    disclosure.findings.guessedMhccDetailFromLicense.acceptedAsDisclosurePrefix,
    false,
  );
  assert.equal(disclosure.findings.uniformDisclosureStatementIsOnRequestNotUrl, true);
  assert.equal(disclosure.findings.coordinatesOnOfficialExcel, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("maryland eligibility matrix + readiness STOP", () => {
  const matrix = buildMarylandEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.uniqueLicenseNumber, 1675);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(MARYLAND_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(marylandInvestigationAllowsPublication(), false);
  const readiness = evaluateMarylandInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.marylandDirectoryReady, false);
});

test("maryland investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    rows: number;
    uniqueLicenseNumber: number;
    dupLicenseGroups: number;
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    disclosurePrefixVerified: boolean;
    recordedExportDate: null;
    perRowStatusColumn: boolean;
    coordinateColumns: boolean;
    openDataAcceptedAsAuthoritativeLicensingRoster: boolean;
    openDataCoordinatesAreLicensingCoordinates: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.rows, 1676);
  assert.equal(fixture.uniqueLicenseNumber, 1675);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinateColumns, false);
  assert.equal(fixture.openDataAcceptedAsAuthoritativeLicensingRoster, false);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{ rows: number; uniqueLicenseNumber: number }>("category-counts.json");
  assert.equal(cats.rows, 1676);
  assert.equal(cats.uniqueLicenseNumber, 1675);
  const quality = evaluateMarylandInvestigationQuality({
    excelRows: fixture.rows,
    uniqueLicenseNumber: fixture.uniqueLicenseNumber,
    sampleRows: fixture.sampleRows,
    duplicateLicenseGroups: fixture.dupLicenseGroups,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    perRowStatusColumn: fixture.perRowStatusColumn,
    coordinateColumnsPresent: fixture.coordinateColumns,
    openDataAcceptedAsAuthoritativeLicensingRoster:
      fixture.openDataAcceptedAsAuthoritativeLicensingRoster,
    openDataCoordinatesAreLicensingCoordinates:
      fixture.openDataCoordinatesAreLicensingCoordinates,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("maryland remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Maryland")?.publication, "unpublished");
  assert.equal(directoryHref("Maryland", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Maryland"), null);
  assert.equal(marylandDirectoryReady(), false);
  assert.equal(virginiaDirectoryReady(), false);
  assert.equal(ohioDirectoryReady(), false);
  assert.equal(georgiaDirectoryReady(), false);
  assert.equal(northCarolinaDirectoryReady(), false);
  assert.equal(floridaDirectoryReady(), false);
  assert.equal(texasDirectoryReady(), false);
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

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  NORTH_CAROLINA_CURRENT_CAPTURE,
  NORTH_CAROLINA_PRIOR_NOV13_BASELINE,
  NORTH_CAROLINA_TYPE_DEFINITIONS,
  evaluateNorthCarolinaSourceVerification,
} from "../../../lib/north-carolina-source-verification.ts";
import { evaluateNorthCarolinaSampleQuality } from "../../../lib/north-carolina-sample-quality.ts";
import { evaluateNorthCarolinaDisclosureInvestigation } from "../../../lib/north-carolina-disclosure-investigation.ts";
import { buildNorthCarolinaEligibilityMatrix } from "../../../lib/north-carolina-eligibility-matrix.ts";
import {
  NORTH_CAROLINA_INVESTIGATION_STOP_GO,
  evaluateNorthCarolinaInvestigationReadiness,
  northCarolinaInvestigationAllowsPublication,
} from "../../../lib/north-carolina-investigation-readiness.ts";
import { evaluateNorthCarolinaInvestigationQuality } from "../../../lib/north-carolina-investigation-quality.ts";
import { northCarolinaDirectoryReady } from "../../../lib/north-carolina-onboarding.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
import { pennsylvaniaDirectoryReady } from "../../../lib/pennsylvania-licensing.ts";
import { texasDirectoryReady } from "../../../lib/texas-source-verification.ts";
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
  "../fixtures/north-carolina-care-home-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("north carolina source verification: 1086 HAL+FCL; export date rejected", () => {
  const source = evaluateNorthCarolinaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(NORTH_CAROLINA_PRIOR_NOV13_BASELINE.uniqueLicenses, 1086);
  assert.equal(NORTH_CAROLINA_CURRENT_CAPTURE.adult.licensedRows, 566);
  assert.equal(NORTH_CAROLINA_CURRENT_CAPTURE.family.licensedRows, 520);
  assert.equal(NORTH_CAROLINA_CURRENT_CAPTURE.combined.uniqueLicenses, 1086);
  assert.equal(NORTH_CAROLINA_CURRENT_CAPTURE.combined.licenseOverlap, 0);
  assert.equal(NORTH_CAROLINA_CURRENT_CAPTURE.adult.recordedExportDate, null);
  assert.equal(NORTH_CAROLINA_CURRENT_CAPTURE.staleFchTxt.rejectedAsCurrentLicensingSource, true);
  assert.equal(NORTH_CAROLINA_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.licenseDeltaVsPrior, 0);
  assert.equal(source.gate, "blocked");
});

test("north carolina sample quality: bounded HAL+FCL sample; no geocode", () => {
  const sample = evaluateNorthCarolinaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.adultSampled, 16);
  assert.equal(sample.result.familySampled, 16);
  assert.equal(sample.population.rows, 1086);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("north carolina disclosure: star search only; no license prefix", () => {
  const disclosure = evaluateNorthCarolinaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.starSearchHasLicenseField, false);
  assert.equal(disclosure.findings.siteAddressLabeledSeparatelyFromFacilityMailing, true);
  assert.equal(disclosure.findings.workbookContainsPerRowStatusColumn, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("north carolina eligibility matrix + readiness STOP", () => {
  const matrix = buildNorthCarolinaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.categoryResidualOk, true);
  assert.equal(matrix.mailingResidualOk, true);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(NORTH_CAROLINA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(northCarolinaInvestigationAllowsPublication(), false);
  const readiness = evaluateNorthCarolinaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.northCarolinaDirectoryReady, false);
});

test("north carolina investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    adultRows: number;
    familyRows: number;
    uniqueLicenses: number;
    blankRows: number;
    licenseOverlap: number;
    sampleRows: number;
    identicalMailing: number;
    distinctMailing: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinateColumns: boolean;
    perRowStatusColumn: boolean;
    fchTxtRejectedAsCurrent: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.uniqueLicenses, 1086);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{ rows: number; HAL: number; FCL: number }>("category-counts.json");
  assert.equal(cats.rows, 1086);
  assert.equal(cats.HAL, 566);
  assert.equal(cats.FCL, 520);
  const quality = evaluateNorthCarolinaInvestigationQuality({
    adultRows: fixture.adultRows,
    familyRows: fixture.familyRows,
    uniqueLicenses: fixture.uniqueLicenses,
    blankRows: fixture.blankRows,
    licenseOverlap: fixture.licenseOverlap,
    sampleRows: fixture.sampleRows,
    identicalMailing: fixture.identicalMailing,
    distinctMailing: fixture.distinctMailing,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinateColumnsPresent: fixture.coordinateColumns,
    perRowStatusPresent: fixture.perRowStatusColumn,
    staleFchTxtAcceptedAsCurrent: !fixture.fchTxtRejectedAsCurrent,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("north carolina remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("North Carolina")?.publication, "unpublished");
  assert.equal(directoryHref("North Carolina", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("North Carolina"), null);
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

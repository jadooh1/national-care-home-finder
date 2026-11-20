import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  VIRGINIA_CURRENT_CAPTURE,
  VIRGINIA_PRIOR_BASELINE,
  VIRGINIA_TYPE_DEFINITIONS,
  evaluateVirginiaSourceVerification,
  virginiaDirectoryReady,
} from "../../../lib/virginia-source-verification.ts";
import { evaluateVirginiaSampleQuality } from "../../../lib/virginia-sample-quality.ts";
import { evaluateVirginiaDisclosureInvestigation } from "../../../lib/virginia-disclosure-investigation.ts";
import { buildVirginiaEligibilityMatrix } from "../../../lib/virginia-eligibility-matrix.ts";
import {
  VIRGINIA_INVESTIGATION_STOP_GO,
  evaluateVirginiaInvestigationReadiness,
  virginiaInvestigationAllowsPublication,
} from "../../../lib/virginia-investigation-readiness.ts";
import { evaluateVirginiaInvestigationQuality } from "../../../lib/virginia-investigation-quality.ts";
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
  "../fixtures/virginia-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("virginia source verification: 575 unique licenseIds; export date absent", () => {
  const source = evaluateVirginiaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(VIRGINIA_PRIOR_BASELINE.compatibilityClass, "D");
  assert.equal(VIRGINIA_CURRENT_CAPTURE.assistedLiving.uniqueLicenseId, 575);
  assert.equal(VIRGINIA_CURRENT_CAPTURE.alfSearch.listTotalReported, 576);
  assert.equal(VIRGINIA_CURRENT_CAPTURE.alfSearch.duplicateLicenseIdRows, 1);
  assert.equal(VIRGINIA_CURRENT_CAPTURE.alfSearch.recordedExportDate, null);
  assert.equal(VIRGINIA_CURRENT_CAPTURE.disclosure.prefixVerified, true);
  assert.equal(VIRGINIA_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(VIRGINIA_CURRENT_CAPTURE.assistedLiving.coordinateColumns, false);
  assert.equal(source.gate, "blocked");
});

test("virginia sample quality: bounded detail sample; no geocode or extrapolation", () => {
  const sample = evaluateVirginiaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.detailFetchesOk, 32);
  assert.equal(sample.population.rows, 575);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.result.facilitySpecificLinksObserved, 32);
  assert.equal(sample.allowsPublication, false);
});

test("virginia disclosure: licenseId query prefix verified", () => {
  const disclosure = evaluateVirginiaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, true);
  assert.equal(disclosure.findings.rosterContainsLicenseId, true);
  assert.equal(disclosure.findings.licenseIdQueryDetail.acceptedAsDisclosurePrefix, true);
  assert.equal(disclosure.findings.licenseIdQueryDetail.capacityPresentOnDetail, true);
  assert.equal(disclosure.findings.licenseIdQueryDetail.coordinatesPresentOnDetail, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("virginia eligibility matrix + readiness STOP", () => {
  const matrix = buildVirginiaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.uniqueLicenseId, 575);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(VIRGINIA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(virginiaInvestigationAllowsPublication(), false);
  const readiness = evaluateVirginiaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.virginiaDirectoryReady, false);
});

test("virginia investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    uniqueLicenseId: number;
    listTotalReported: number;
    duplicateLicenseIdRows: number;
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    disclosurePrefixVerified: boolean;
    recordedExportDate: null;
    capacityOnList: boolean;
    coordinateColumnsOnList: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.uniqueLicenseId, 575);
  assert.equal(fixture.listTotalReported, 576);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, true);
  assert.equal(fixture.capacityOnList, false);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{ uniqueLicenseId: number }>("category-counts.json");
  assert.equal(cats.uniqueLicenseId, 575);
  const quality = evaluateVirginiaInvestigationQuality({
    uniqueLicenseId: fixture.uniqueLicenseId,
    listTotalReported: fixture.listTotalReported,
    sampleRows: fixture.sampleRows,
    duplicateLicenseIdRows: fixture.duplicateLicenseIdRows,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    capacityOnList: fixture.capacityOnList,
    coordinateColumnsPresent: fixture.coordinateColumnsOnList,
    statewideCrawl: false,
    automaticGeocoding: false,
    sampleCapacityExtrapolatedStatewide: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("virginia remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Virginia")?.publication, "unpublished");
  assert.equal(directoryHref("Virginia", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Virginia"), null);
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

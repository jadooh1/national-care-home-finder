import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  TENNESSEE_CURRENT_CAPTURE,
  TENNESSEE_PRIOR_BASELINE,
  TENNESSEE_TYPE_DEFINITIONS,
  evaluateTennesseeSourceVerification,
  tennesseeDirectoryReady,
} from "../../../lib/tennessee-source-verification.ts";
import { evaluateTennesseeSampleQuality } from "../../../lib/tennessee-sample-quality.ts";
import { evaluateTennesseeDisclosureInvestigation } from "../../../lib/tennessee-disclosure-investigation.ts";
import { buildTennesseeEligibilityMatrix } from "../../../lib/tennessee-eligibility-matrix.ts";
import {
  TENNESSEE_INVESTIGATION_STOP_GO,
  evaluateTennesseeInvestigationReadiness,
  tennesseeInvestigationAllowsPublication,
} from "../../../lib/tennessee-investigation-readiness.ts";
import { evaluateTennesseeInvestigationQuality } from "../../../lib/tennessee-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { georgiaDirectoryReady } from "../../../lib/georgia-source-verification.ts";
import { marylandDirectoryReady } from "../../../lib/maryland-source-verification.ts";
import { massachusettsDirectoryReady } from "../../../lib/massachusetts-source-verification.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
import { newJerseyDirectoryReady } from "../../../lib/new-jersey-source-verification.ts";
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
  "../fixtures/tennessee-assisted-care-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("tennessee source verification: 333 ACLF; unique lic_no; export absent", () => {
  const source = evaluateTennesseeSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(TENNESSEE_PRIOR_BASELINE.compatibilityClass, "D");
  assert.equal(TENNESSEE_CURRENT_CAPTURE.aclfFullBedsReport.rows, 333);
  assert.equal(TENNESSEE_CURRENT_CAPTURE.aclfFullBedsReport.uniqueLicNo, 333);
  assert.equal(TENNESSEE_CURRENT_CAPTURE.aclfFullBedsReport.dupLicGroups, 0);
  assert.equal(TENNESSEE_CURRENT_CAPTURE.aclfFullBedsReport.statusCounts.Licensed, 331);
  assert.equal(TENNESSEE_CURRENT_CAPTURE.aclfFullBedsReport.recordedExportDate, null);
  assert.equal(TENNESSEE_CURRENT_CAPTURE.aclfFullBedsReport.coordinateColumns, false);
  assert.equal(TENNESSEE_CURRENT_CAPTURE.facilityListings.licNoDetailPrefixVerified, false);
  assert.equal(
    TENNESSEE_CURRENT_CAPTURE.residentialHomeForAged.adoptedAsAclfRoster,
    false,
  );
  assert.equal(
    TENNESSEE_CURRENT_CAPTURE.residentialHomeForAged
      .undatedPdfAcceptedAsCurrentOctober2026Roster,
    false,
  );
  assert.equal(TENNESSEE_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
});

test("tennessee sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateTennesseeSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.licensingIdentifiersObserved, 32);
  assert.equal(sample.result.blankCitySampled, 5);
  assert.equal(sample.population.rows, 333);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("tennessee disclosure: FacilityListings search only; no lic_no prefix", () => {
  const disclosure = evaluateTennesseeDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsLicNo, true);
  assert.equal(disclosure.findings.rosterContainsFacilityUrlColumn, false);
  assert.equal(
    disclosure.findings.guessedDetailFromLicNo.acceptedAsDisclosurePrefix,
    false,
  );
  assert.equal(disclosure.findings.coordinatesOnOfficialAclfReport, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("tennessee eligibility matrix + readiness STOP", () => {
  const matrix = buildTennesseeEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.aclfRows, 333);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(TENNESSEE_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(tennesseeInvestigationAllowsPublication(), false);
  const readiness = evaluateTennesseeInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.tennesseeDirectoryReady, false);
});

test("tennessee investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    rows: number;
    uniqueLicNo: number;
    dupLicGroups: number;
    statusCounts: { Licensed: number; "On Probation": number; "LLC Licensed": number };
    blankCity: number;
    sampleRows: number;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinateColumns: boolean;
    categoryEquivalenceToWashingtonAfh: boolean;
    residentialHomeForAgedIsSeparateType: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.rows, 333);
  assert.equal(fixture.uniqueLicNo, 333);
  assert.equal(fixture.dupLicGroups, 0);
  assert.equal(fixture.statusCounts.Licensed, 331);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinateColumns, false);
  assert.equal(fixture.categoryEquivalenceToWashingtonAfh, false);
  const sampleRows = loadJson<Array<{ lic_no: string; city: string; lic_status: string }>>(
    "bounded-sample.json",
  );
  assert.equal(sampleRows.length, 32);
  assert.equal(sampleRows.filter((r) => !r.city).length, 5);
  assert.equal(new Set(sampleRows.map((r) => r.lic_no)).size, 32);
  const cats = loadJson<{ ACLF: number; Licensed: number }>("category-counts.json");
  assert.equal(cats.ACLF, 333);
  assert.equal(cats.Licensed, 331);
  const quality = evaluateTennesseeInvestigationQuality({
    aclfRows: fixture.rows,
    licensedRows: fixture.statusCounts.Licensed,
    sampleRows: fixture.sampleRows,
    dupLicGroups: fixture.dupLicGroups,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinateColumnsPresent: fixture.coordinateColumns,
    rhaAdoptedAsAclfRoster: fixture.residentialHomeForAgedIsSeparateType === false,
    rhaUndatedPdfAcceptedAsCurrent: false,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("tennessee remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Tennessee")?.publication, "unpublished");
  assert.equal(
    directoryHref("Tennessee", "https://ajjsyloyihcqdomywhik.supabase.co"),
    null,
  );
  assert.equal(mapHref("Tennessee"), null);
  assert.equal(tennesseeDirectoryReady(), false);
  assert.equal(massachusettsDirectoryReady(), false);
  assert.equal(newJerseyDirectoryReady(), false);
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

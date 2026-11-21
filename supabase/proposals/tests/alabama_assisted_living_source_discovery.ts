import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ALABAMA_CURRENT_CAPTURE,
  ALABAMA_PRIOR_BASELINE,
  ALABAMA_TYPE_DEFINITIONS,
  evaluateAlabamaSourceVerification,
  alabamaDirectoryReady,
} from "../../../lib/alabama-source-verification.ts";
import { evaluateAlabamaSampleQuality } from "../../../lib/alabama-sample-quality.ts";
import { evaluateAlabamaDisclosureInvestigation } from "../../../lib/alabama-disclosure-investigation.ts";
import { buildAlabamaEligibilityMatrix } from "../../../lib/alabama-eligibility-matrix.ts";
import {
  ALABAMA_INVESTIGATION_STOP_GO,
  evaluateAlabamaInvestigationReadiness,
  alabamaInvestigationAllowsPublication,
} from "../../../lib/alabama-investigation-readiness.ts";
import { evaluateAlabamaInvestigationQuality } from "../../../lib/alabama-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { georgiaDirectoryReady } from "../../../lib/georgia-source-verification.ts";
import { kentuckyDirectoryReady } from "../../../lib/kentucky-source-verification.ts";
import { marylandDirectoryReady } from "../../../lib/maryland-source-verification.ts";
import { massachusettsDirectoryReady } from "../../../lib/massachusetts-source-verification.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
import { newJerseyDirectoryReady } from "../../../lib/new-jersey-source-verification.ts";
import { northCarolinaDirectoryReady } from "../../../lib/north-carolina-onboarding.ts";
import { ohioDirectoryReady } from "../../../lib/ohio-source-verification.ts";
import { pennsylvaniaDirectoryReady } from "../../../lib/pennsylvania-licensing.ts";
import { southCarolinaDirectoryReady } from "../../../lib/south-carolina-source-verification.ts";
import { tennesseeDirectoryReady } from "../../../lib/tennessee-source-verification.ts";
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
  "../fixtures/alabama-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("alabama source verification: 188 ALF + 106 SCALF; Fac ID unique; export absent", () => {
  const source = evaluateAlabamaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(ALABAMA_PRIOR_BASELINE.compatibilityClass, "C");
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.alf.rows, 188);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.scalf.rows, 106);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.combinedRows, 294);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.uniqueFacIdCombined, 294);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.dupFacIdGroups, 0);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.scalf.licenseStatusCounts.Probational, 1);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.recordedExportDate, null);
  assert.equal(ALABAMA_CURRENT_CAPTURE.facilitiesDirectory.coordinateColumns, false);
  assert.equal(ALABAMA_CURRENT_CAPTURE.disclosure.facIdDetailPrefixVerified, false);
  assert.equal(ALABAMA_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
});

test("alabama sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateAlabamaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.alfSampled, 17);
  assert.equal(sample.result.scalfSampled, 15);
  assert.equal(sample.result.licensingIdentifiersObserved, 32);
  assert.equal(sample.population.combinedRows, 294);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("alabama disclosure: FacilitiesDirectory search/export only; no Fac ID prefix", () => {
  const disclosure = evaluateAlabamaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsFacId, true);
  assert.equal(
    disclosure.findings.guessedDetailFromFacId.acceptedAsDisclosurePrefix,
    false,
  );
  assert.equal(disclosure.findings.coordinatesOnOfficialExport, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("alabama eligibility matrix + readiness STOP", () => {
  const matrix = buildAlabamaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.combinedRows, 294);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(ALABAMA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(alabamaInvestigationAllowsPublication(), false);
  const readiness = evaluateAlabamaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.alabamaDirectoryReady, false);
});

test("alabama investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    alfRows: number;
    scalfRows: number;
    combinedRows: number;
    uniqueFacIdCombined: number;
    dupFacIdGroups: number;
    sampleRows: number;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinateColumns: boolean;
    categoryEquivalenceToWashingtonAfh: boolean;
    nursingHomeIsSeparateType: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.alfRows, 188);
  assert.equal(fixture.scalfRows, 106);
  assert.equal(fixture.combinedRows, 294);
  assert.equal(fixture.uniqueFacIdCombined, 294);
  assert.equal(fixture.dupFacIdGroups, 0);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinateColumns, false);
  assert.equal(fixture.categoryEquivalenceToWashingtonAfh, false);
  const sampleRows = loadJson<Array<{ "Fac ID": string; "Facility Type": string }>>(
    "bounded-sample.json",
  );
  assert.equal(sampleRows.length, 32);
  assert.equal(new Set(sampleRows.map((r) => r["Fac ID"])).size, 32);
  const cats = loadJson<{ ALF: number; SCALF: number; combined: number }>(
    "category-counts.json",
  );
  assert.equal(cats.ALF, 188);
  assert.equal(cats.SCALF, 106);
  assert.equal(cats.combined, 294);
  const quality = evaluateAlabamaInvestigationQuality({
    alfRows: fixture.alfRows,
    scalfRows: fixture.scalfRows,
    combinedRows: fixture.combinedRows,
    sampleRows: fixture.sampleRows,
    dupFacIdGroups: fixture.dupFacIdGroups,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    nursingMergedIntoAlfScalf: fixture.nursingHomeIsSeparateType === false,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinateColumnsPresent: fixture.coordinateColumns,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("alabama remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Alabama")?.publication, "unpublished");
  assert.equal(
    directoryHref("Alabama", "https://ajjsyloyihcqdomywhik.supabase.co"),
    null,
  );
  assert.equal(mapHref("Alabama"), null);
  assert.equal(alabamaDirectoryReady(), false);
  assert.equal(kentuckyDirectoryReady(), false);
  assert.equal(southCarolinaDirectoryReady(), false);
  assert.equal(tennesseeDirectoryReady(), false);
  assert.equal(massachusettsDirectoryReady(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(newJerseyDirectoryReady(), false);
  assert.equal(marylandDirectoryReady(), false);
  assert.equal(virginiaDirectoryReady(), false);
  assert.equal(ohioDirectoryReady(), false);
  assert.equal(georgiaDirectoryReady(), false);
  assert.equal(northCarolinaDirectoryReady(), false);
  assert.equal(floridaDirectoryReady(), false);
  assert.equal(texasDirectoryReady(), false);
  assert.equal(arizonaDirectoryReady(), false);
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

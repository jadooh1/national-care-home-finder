import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  KENTUCKY_CURRENT_CAPTURE,
  KENTUCKY_PRIOR_BASELINE,
  KENTUCKY_TYPE_DEFINITIONS,
  evaluateKentuckySourceVerification,
  kentuckyDirectoryReady,
} from "../../../lib/kentucky-source-verification.ts";
import { evaluateKentuckySampleQuality } from "../../../lib/kentucky-sample-quality.ts";
import { evaluateKentuckyDisclosureInvestigation } from "../../../lib/kentucky-disclosure-investigation.ts";
import { buildKentuckyEligibilityMatrix } from "../../../lib/kentucky-eligibility-matrix.ts";
import {
  KENTUCKY_INVESTIGATION_STOP_GO,
  evaluateKentuckyInvestigationReadiness,
  kentuckyInvestigationAllowsPublication,
} from "../../../lib/kentucky-investigation-readiness.ts";
import { evaluateKentuckyInvestigationQuality } from "../../../lib/kentucky-investigation-quality.ts";
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
  "../fixtures/kentucky-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("kentucky source verification: 247 TYPE rows; blank/dup licenses; export absent", () => {
  const source = evaluateKentuckySourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(KENTUCKY_PRIOR_BASELINE.compatibilityClass, "B");
  assert.equal(KENTUCKY_PRIOR_BASELINE.observedRows, null);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.directoryTypeRows, 247);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.uniqueLicenseNbr, 244);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.blankLicense, 1);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.dupLicenseGroups, 2);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.typeCounts.ALC, 88);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.pendingRenewal, 75);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.recordedExportDate, null);
  assert.equal(KENTUCKY_CURRENT_CAPTURE.alcDirectory.coordinateColumns, false);
  assert.equal(
    KENTUCKY_CURRENT_CAPTURE.disclosure.licenseNbrDetailPrefixVerified,
    false,
  );
  assert.equal(KENTUCKY_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(KENTUCKY_TYPE_DEFINITIONS.regulation, "902 KAR 20:480 Assisted living communities");
  assert.equal(source.gate, "blocked");
});

test("kentucky sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateKentuckySampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.alcSampled, 12);
  assert.equal(sample.result.licensingIdentifiersObserved, 31);
  assert.equal(sample.result.blankLicenseSampled, 1);
  assert.equal(sample.population.directoryTypeRows, 247);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("kentucky disclosure: directories only; no LICENSE # prefix", () => {
  const disclosure = evaluateKentuckyDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsLicenseNbr, true);
  assert.equal(disclosure.findings.blankLicenseRows, 1);
  assert.equal(
    disclosure.findings.guessedDetailFromLicenseNbr.acceptedAsDisclosurePrefix,
    false,
  );
  assert.equal(disclosure.findings.coordinatesOnOfficialAlcDirectory, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("kentucky eligibility matrix + readiness STOP", () => {
  const matrix = buildKentuckyEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.directoryTypeRows, 247);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(KENTUCKY_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(kentuckyInvestigationAllowsPublication(), false);
  const readiness = evaluateKentuckyInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.kentuckyDirectoryReady, false);
});

test("kentucky investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    directoryTypeRows: number;
    uniqueLicenseNbr: number;
    blankLicense: number;
    dupLicenseGroups: number;
    sampleRows: number;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinateColumns: boolean;
    pendingRenewal: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    personalCareHomeIsSeparateType: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.directoryTypeRows, 247);
  assert.equal(fixture.uniqueLicenseNbr, 244);
  assert.equal(fixture.blankLicense, 1);
  assert.equal(fixture.dupLicenseGroups, 2);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinateColumns, false);
  assert.equal(fixture.pendingRenewal, 75);
  assert.equal(fixture.categoryEquivalenceToWashingtonAfh, false);
  const sampleRows = loadJson<Array<{ "LICENSE #": string; TYPE: string; UNITS: number }>>(
    "bounded-sample.json",
  );
  assert.equal(sampleRows.length, 32);
  assert.equal(sampleRows.filter((r) => !r["LICENSE #"]).length, 1);
  const cats = loadJson<{ ALC: number; "ALC-BH": number; "ALC-DC": number }>(
    "category-counts.json",
  );
  assert.equal(cats.ALC, 88);
  assert.equal(cats["ALC-BH"], 74);
  assert.equal(cats["ALC-DC"], 85);
  const quality = evaluateKentuckyInvestigationQuality({
    directoryTypeRows: fixture.directoryTypeRows,
    uniqueLicenseNbr: fixture.uniqueLicenseNbr,
    blankLicense: fixture.blankLicense,
    dupLicenseGroups: fixture.dupLicenseGroups,
    sampleRows: fixture.sampleRows,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    peerDirectoriesMergedIntoAlc: fixture.personalCareHomeIsSeparateType === false,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinateColumnsPresent: fixture.coordinateColumns,
    pendingRenewalTreatedAsOperatingStatus: false,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("kentucky remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Kentucky")?.publication, "unpublished");
  assert.equal(
    directoryHref("Kentucky", "https://ajjsyloyihcqdomywhik.supabase.co"),
    null,
  );
  assert.equal(mapHref("Kentucky"), null);
  assert.equal(kentuckyDirectoryReady(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(massachusettsDirectoryReady(), false);
  assert.equal(tennesseeDirectoryReady(), false);
  assert.equal(southCarolinaDirectoryReady(), false);
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

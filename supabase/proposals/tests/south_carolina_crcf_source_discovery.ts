import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  SOUTH_CAROLINA_CURRENT_CAPTURE,
  SOUTH_CAROLINA_PRIOR_BASELINE,
  SOUTH_CAROLINA_TYPE_DEFINITIONS,
  evaluateSouthCarolinaSourceVerification,
  southCarolinaDirectoryReady,
} from "../../../lib/south-carolina-source-verification.ts";
import { evaluateSouthCarolinaSampleQuality } from "../../../lib/south-carolina-sample-quality.ts";
import { evaluateSouthCarolinaDisclosureInvestigation } from "../../../lib/south-carolina-disclosure-investigation.ts";
import { buildSouthCarolinaEligibilityMatrix } from "../../../lib/south-carolina-eligibility-matrix.ts";
import {
  SOUTH_CAROLINA_INVESTIGATION_STOP_GO,
  evaluateSouthCarolinaInvestigationReadiness,
  southCarolinaInvestigationAllowsPublication,
} from "../../../lib/south-carolina-investigation-readiness.ts";
import { evaluateSouthCarolinaInvestigationQuality } from "../../../lib/south-carolina-investigation-quality.ts";
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
  "../fixtures/south-carolina-crcf-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("south carolina source verification: 427 CRCF; unique LICENSE_NBR; export absent", () => {
  const source = evaluateSouthCarolinaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(SOUTH_CAROLINA_PRIOR_BASELINE.compatibilityClass, "D");
  assert.equal(SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.rows, 427);
  assert.equal(SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.uniqueLicenseNbr, 427);
  assert.equal(SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.dupLicenseGroups, 0);
  assert.equal(SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.permitOperatingCodeCounts.ACT, 427);
  assert.equal(SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.recordedExportDate, null);
  assert.equal(SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.crcConflictsWithNbr, 54);
  assert.equal(
    SOUTH_CAROLINA_CURRENT_CAPTURE.crcfLayer.coordinatesAcceptedAsLicensingCoordinates,
    false,
  );
  assert.equal(
    SOUTH_CAROLINA_CURRENT_CAPTURE.disclosure.licenseNbrDetailPrefixVerified,
    false,
  );
  assert.equal(SOUTH_CAROLINA_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
});

test("south carolina sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateSouthCarolinaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.licensingIdentifiersObserved, 32);
  assert.equal(sample.result.band1to6Sampled, 10);
  assert.equal(sample.population.rows, 427);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.result.coordinatesObserved, 32);
  assert.equal(sample.allowsPublication, false);
});

test("south carolina disclosure: Find a Facility map only; no LICENSE_NBR prefix", () => {
  const disclosure = evaluateSouthCarolinaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsLicenseNbr, true);
  assert.equal(disclosure.findings.rosterContainsFacilityUrlColumn, false);
  assert.equal(
    disclosure.findings.guessedDetailFromLicenseNbr.acceptedAsDisclosurePrefix,
    false,
  );
  assert.equal(disclosure.findings.coordinatesOnOfficialCrcfLayer, true);
  assert.equal(disclosure.findings.coordinatesAcceptedAsLicensingCoordinates, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("south carolina eligibility matrix + readiness STOP", () => {
  const matrix = buildSouthCarolinaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.crcfRows, 427);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(SOUTH_CAROLINA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(southCarolinaInvestigationAllowsPublication(), false);
  const readiness = evaluateSouthCarolinaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.southCarolinaDirectoryReady, false);
});

test("south carolina investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    rows: number;
    uniqueLicenseNbr: number;
    dupLicenseGroups: number;
    permitOperatingCodeCounts: { ACT: number };
    sampleRows: number;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinateColumns: boolean;
    coordinatesAcceptedAsLicensingCoordinates: boolean;
    crcConflictsWithNbr: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.rows, 427);
  assert.equal(fixture.uniqueLicenseNbr, 427);
  assert.equal(fixture.dupLicenseGroups, 0);
  assert.equal(fixture.permitOperatingCodeCounts.ACT, 427);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinatesAcceptedAsLicensingCoordinates, false);
  assert.equal(fixture.crcConflictsWithNbr, 54);
  assert.equal(fixture.categoryEquivalenceToWashingtonAfh, false);
  const sampleRows = loadJson<Array<{ LICENSE_NBR: string; NBR_LICENSED: number }>>(
    "bounded-sample.json",
  );
  assert.equal(sampleRows.length, 32);
  assert.equal(new Set(sampleRows.map((r) => r.LICENSE_NBR)).size, 32);
  const cats = loadJson<{ CRCF: number; ACT: number }>("category-counts.json");
  assert.equal(cats.CRCF, 427);
  assert.equal(cats.ACT, 427);
  const quality = evaluateSouthCarolinaInvestigationQuality({
    crcfRows: fixture.rows,
    actRows: fixture.permitOperatingCodeCounts.ACT,
    sampleRows: fixture.sampleRows,
    dupLicenseGroups: fixture.dupLicenseGroups,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    nursingOrIcfMergedIntoCrcf: false,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinatesAcceptedAsLicensing: fixture.coordinatesAcceptedAsLicensingCoordinates,
    crcBedsConflictIgnored: fixture.crcConflictsWithNbr === 0,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("south carolina remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("South Carolina")?.publication, "unpublished");
  assert.equal(
    directoryHref("South Carolina", "https://ajjsyloyihcqdomywhik.supabase.co"),
    null,
  );
  assert.equal(mapHref("South Carolina"), null);
  assert.equal(southCarolinaDirectoryReady(), false);
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

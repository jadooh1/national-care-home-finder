import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  MASSACHUSETTS_CURRENT_CAPTURE,
  MASSACHUSETTS_PRIOR_BASELINE,
  MASSACHUSETTS_TYPE_DEFINITIONS,
  evaluateMassachusettsSourceVerification,
  massachusettsDirectoryReady,
} from "../../../lib/massachusetts-source-verification.ts";
import { evaluateMassachusettsSampleQuality } from "../../../lib/massachusetts-sample-quality.ts";
import { evaluateMassachusettsDisclosureInvestigation } from "../../../lib/massachusetts-disclosure-investigation.ts";
import { buildMassachusettsEligibilityMatrix } from "../../../lib/massachusetts-eligibility-matrix.ts";
import {
  MASSACHUSETTS_INVESTIGATION_STOP_GO,
  evaluateMassachusettsInvestigationReadiness,
  massachusettsInvestigationAllowsPublication,
} from "../../../lib/massachusetts-investigation-readiness.ts";
import { evaluateMassachusettsInvestigationQuality } from "../../../lib/massachusetts-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { georgiaDirectoryReady } from "../../../lib/georgia-source-verification.ts";
import { marylandDirectoryReady } from "../../../lib/maryland-source-verification.ts";
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
  "../fixtures/massachusetts-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("massachusetts source verification: 271 Certified; no cert id; export absent", () => {
  const source = evaluateMassachusettsSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(MASSACHUSETTS_PRIOR_BASELINE.compatibilityClass, "C");
  assert.equal(MASSACHUSETTS_CURRENT_CAPTURE.certifiedList.certifiedUsableRows, 271);
  assert.equal(MASSACHUSETTS_CURRENT_CAPTURE.certifiedList.statusAnomalyRows, 1);
  assert.equal(MASSACHUSETTS_CURRENT_CAPTURE.certifiedList.certificationIdentifierColumn, false);
  assert.equal(MASSACHUSETTS_CURRENT_CAPTURE.certifiedList.recordedExportDate, null);
  assert.equal(MASSACHUSETTS_CURRENT_CAPTURE.disclosure.prefixVerified, true);
  assert.equal(MASSACHUSETTS_CURRENT_CAPTURE.massGis.acceptedAsAuthoritativeRoster, false);
  assert.equal(MASSACHUSETTS_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(MASSACHUSETTS_TYPE_DEFINITIONS.notDphNursingOrRestHomeLicense, true);
  assert.equal(MASSACHUSETTS_TYPE_DEFINITIONS.notMassHealthAdultFosterCare, true);
  assert.equal(source.gate, "blocked");
});

test("massachusetts sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateMassachusettsSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.licensingIdentifiersObserved, 0);
  assert.equal(sample.population.rows, 271);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 32);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("massachusetts disclosure: name-derived locations slug verified", () => {
  const disclosure = evaluateMassachusettsDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, true);
  assert.equal(disclosure.findings.rosterContainsCertificationNumber, false);
  assert.equal(disclosure.findings.rosterContainsAlrName, true);
  assert.equal(disclosure.findings.federalEinIsFacilityUnique, false);
  assert.equal(disclosure.findings.nameDerivedLocationSlug.acceptedAsDisclosurePrefix, true);
  assert.equal(disclosure.findings.coordinatesOnOfficialCertifiedList, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("massachusetts eligibility matrix + readiness STOP", () => {
  const matrix = buildMassachusettsEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.certifiedUsableRows, 271);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(MASSACHUSETTS_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(massachusettsInvestigationAllowsPublication(), false);
  const readiness = evaluateMassachusettsInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.massachusettsDirectoryReady, false);
});

test("massachusetts investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    certifiedUsableRows: number;
    statusAnomalyRows: number;
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    notDphNursingOrRestHomeLicense: boolean;
    notMassHealthAdultFosterCare: boolean;
    disclosurePrefixVerified: boolean;
    recordedExportDate: null;
    certificationIdentifierColumn: boolean;
    coordinateColumns: boolean;
    massGisAcceptedAsAuthoritativeRoster: boolean;
    massGisCoordinatesAreLicensingCoordinates: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.certifiedUsableRows, 271);
  assert.equal(fixture.statusAnomalyRows, 1);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, true);
  assert.equal(fixture.certificationIdentifierColumn, false);
  assert.equal(fixture.coordinateColumns, false);
  assert.equal(fixture.massGisAcceptedAsAuthoritativeRoster, false);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{ certifiedUsable: number }>("category-counts.json");
  assert.equal(cats.certifiedUsable, 271);
  const quality = evaluateMassachusettsInvestigationQuality({
    certifiedUsableRows: fixture.certifiedUsableRows,
    statusAnomalyRows: fixture.statusAnomalyRows,
    sampleRows: fixture.sampleRows,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    dphLicenseEquivalenceClaimed: fixture.notDphNursingOrRestHomeLicense === false,
    massHealthAfcEquivalenceClaimed: fixture.notMassHealthAdultFosterCare === false,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    certificationIdentifierColumn: fixture.certificationIdentifierColumn,
    coordinateColumnsPresent: fixture.coordinateColumns,
    massGisAcceptedAsAuthoritativeRoster: fixture.massGisAcceptedAsAuthoritativeRoster,
    massGisCoordinatesAreLicensingCoordinates:
      fixture.massGisCoordinatesAreLicensingCoordinates,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("massachusetts remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Massachusetts")?.publication, "unpublished");
  assert.equal(
    directoryHref("Massachusetts", "https://ajjsyloyihcqdomywhik.supabase.co"),
    null,
  );
  assert.equal(mapHref("Massachusetts"), null);
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

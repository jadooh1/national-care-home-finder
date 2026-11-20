import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  NEW_JERSEY_CURRENT_CAPTURE,
  NEW_JERSEY_PRIOR_BASELINE,
  NEW_JERSEY_TYPE_DEFINITIONS,
  evaluateNewJerseySourceVerification,
  newJerseyDirectoryReady,
} from "../../../lib/new-jersey-source-verification.ts";
import { evaluateNewJerseySampleQuality } from "../../../lib/new-jersey-sample-quality.ts";
import { evaluateNewJerseyDisclosureInvestigation } from "../../../lib/new-jersey-disclosure-investigation.ts";
import { buildNewJerseyEligibilityMatrix } from "../../../lib/new-jersey-eligibility-matrix.ts";
import {
  NEW_JERSEY_INVESTIGATION_STOP_GO,
  evaluateNewJerseyInvestigationReadiness,
  newJerseyInvestigationAllowsPublication,
} from "../../../lib/new-jersey-investigation-readiness.ts";
import { evaluateNewJerseyInvestigationQuality } from "../../../lib/new-jersey-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { georgiaDirectoryReady } from "../../../lib/georgia-source-verification.ts";
import { marylandDirectoryReady } from "../../../lib/maryland-source-verification.ts";
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
  "../fixtures/new-jersey-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("new jersey source verification: ALR 256 / CPCH 32 / ALP 17; export date absent", () => {
  const source = evaluateNewJerseySourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(NEW_JERSEY_PRIOR_BASELINE.compatibilityClass, "C");
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.assistedLivingResidence.rows, 256);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.comprehensivePersonalCareHome.rows, 32);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.assistedLivingProgram.rows, 17);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.combined.rows, 305);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.combined.uniqueFacID, 305);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.assistedLivingProgram.bedsZero, 17);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.allLtcWorkbook.recordedExportDate, null);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.disclosure.prefixVerified, true);
  assert.equal(NEW_JERSEY_CURRENT_CAPTURE.combined.coordinatesAreLicensingCoordinates, false);
  assert.equal(NEW_JERSEY_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
});

test("new jersey sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateNewJerseySampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.alrSampled, 20);
  assert.equal(sample.result.cpchSampled, 6);
  assert.equal(sample.result.alpSampled, 6);
  assert.equal(sample.population.rows, 305);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.plan.extrapolateStatewideFromSample, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 32);
  assert.equal(sample.allowsPublication, false);
});

test("new jersey disclosure: FacID detail prefix verified for ALR/CPCH/ALP", () => {
  const disclosure = evaluateNewJerseyDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, true);
  assert.equal(disclosure.findings.rosterContainsFacID, true);
  assert.equal(disclosure.findings.facIdDetail.acceptedAsDisclosurePrefix, true);
  assert.equal(disclosure.findings.facIdDetail.verifiedOnAlr, true);
  assert.equal(disclosure.findings.facIdDetail.verifiedOnCpch, true);
  assert.equal(disclosure.findings.facIdDetail.verifiedOnAlp, true);
  assert.equal(disclosure.findings.coordinatesAreLicensingCoordinates, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("new jersey eligibility matrix + readiness STOP", () => {
  const matrix = buildNewJerseyEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.combinedRows, 305);
  assert.equal(matrix.counts.alrRows, 256);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(NEW_JERSEY_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(newJerseyInvestigationAllowsPublication(), false);
  const readiness = evaluateNewJerseyInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.newJerseyDirectoryReady, false);
});

test("new jersey investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    ALR: { rows: number };
    CPCH: { rows: number };
    ALP: { rows: number; bedsZero: number };
    combined: { rows: number };
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    disclosurePrefixVerified: boolean;
    recordedExportDate: null;
    openDataCoordinatesAreLicensingCoordinates?: boolean;
    coordinatesAreLicensingCoordinates: boolean;
    alpBedsAllZero: boolean;
    publicationEligible: number;
    overlaps: { facid_ALR_CPCH: number; facid_ALR_ALP: number; facid_CPCH_ALP: number };
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.ALR.rows, 256);
  assert.equal(fixture.CPCH.rows, 32);
  assert.equal(fixture.ALP.rows, 17);
  assert.equal(fixture.combined.rows, 305);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, true);
  assert.equal(fixture.coordinatesAreLicensingCoordinates, false);
  assert.equal(fixture.alpBedsAllZero, true);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{ ALR: number; CPCH: number; ALP: number; combinedRows: number }>(
    "category-counts.json",
  );
  assert.equal(cats.ALR, 256);
  assert.equal(cats.CPCH, 32);
  assert.equal(cats.ALP, 17);
  assert.equal(cats.combinedRows, 305);
  const quality = evaluateNewJerseyInvestigationQuality({
    alrRows: fixture.ALR.rows,
    cpchRows: fixture.CPCH.rows,
    alpRows: fixture.ALP.rows,
    combinedRows: fixture.combined.rows,
    sampleRows: fixture.sampleRows,
    facIdOverlapAcrossTypes:
      fixture.overlaps.facid_ALR_CPCH
      + fixture.overlaps.facid_ALR_ALP
      + fixture.overlaps.facid_CPCH_ALP,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    alpBedsAllZero: fixture.alpBedsAllZero,
    coordinatesAreLicensingCoordinates: fixture.coordinatesAreLicensingCoordinates,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("new jersey remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("New Jersey")?.publication, "unpublished");
  assert.equal(directoryHref("New Jersey", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("New Jersey"), null);
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

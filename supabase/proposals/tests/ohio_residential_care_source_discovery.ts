import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  OHIO_CURRENT_CAPTURE,
  OHIO_PRIOR_BASELINE,
  OHIO_TYPE_DEFINITIONS,
  evaluateOhioSourceVerification,
  ohioDirectoryReady,
} from "../../../lib/ohio-source-verification.ts";
import { evaluateOhioSampleQuality } from "../../../lib/ohio-sample-quality.ts";
import { evaluateOhioDisclosureInvestigation } from "../../../lib/ohio-disclosure-investigation.ts";
import { buildOhioEligibilityMatrix } from "../../../lib/ohio-eligibility-matrix.ts";
import {
  OHIO_INVESTIGATION_STOP_GO,
  evaluateOhioInvestigationReadiness,
  ohioInvestigationAllowsPublication,
} from "../../../lib/ohio-investigation-readiness.ts";
import { evaluateOhioInvestigationQuality } from "../../../lib/ohio-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
import { georgiaDirectoryReady } from "../../../lib/georgia-source-verification.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
import { northCarolinaDirectoryReady } from "../../../lib/north-carolina-onboarding.ts";
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
  "../fixtures/ohio-residential-care-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("ohio source verification: 1152 L12 / 801 ACTIVE; export date absent", () => {
  const source = evaluateOhioSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(OHIO_PRIOR_BASELINE.compatibilityClass, "C");
  assert.equal(OHIO_CURRENT_CAPTURE.residentialCare.l12Rows, 1152);
  assert.equal(OHIO_CURRENT_CAPTURE.residentialCare.activeCount, 801);
  assert.equal(OHIO_CURRENT_CAPTURE.residentialCare.uniqueFacidL12, 1152);
  assert.equal(OHIO_CURRENT_CAPTURE.residentialCare.facidDuplicates, 0);
  assert.equal(OHIO_CURRENT_CAPTURE.facilityListing.recordedExportDate, null);
  assert.equal(OHIO_CURRENT_CAPTURE.arcgisDerivative.acceptedAsAuthoritativeExport, false);
  assert.equal(OHIO_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(OHIO_CURRENT_CAPTURE.residentialCare.coordinateColumns, false);
  assert.equal(source.gate, "blocked");
});

test("ohio sample quality: bounded stratified sample; no geocode invent", () => {
  const sample = evaluateOhioSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.activeSampled, 20);
  assert.equal(sample.population.rows, 1152);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.result.coordinatesObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("ohio disclosure: session detail only; no FACID/STATEID prefix", () => {
  const disclosure = evaluateOhioDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsFacid, true);
  assert.equal(disclosure.findings.rosterContainsStateId, true);
  assert.equal(disclosure.findings.guessedDetailFromIdentifier.acceptedAsDisclosurePrefix, false);
  assert.equal(disclosure.findings.stateIdSearchReturnsFacility, true);
  assert.equal(disclosure.findings.coordinatesOnOfficialListing, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("ohio eligibility matrix + readiness STOP", () => {
  const matrix = buildOhioEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.counts.l12Rows, 1152);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(OHIO_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(ohioInvestigationAllowsPublication(), false);
  const readiness = evaluateOhioInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.ohioDirectoryReady, false);
});

test("ohio investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    l12Rows: number;
    activeCount: number;
    uniqueFacidL12: number;
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    disclosurePrefixVerified: boolean;
    recordedExportDate: null;
    coordinateColumns: boolean;
    arcgisAcceptedAsAuthoritativeExport: boolean;
    programPageApproxAcceptedAsRosterCount: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.l12Rows, 1152);
  assert.equal(fixture.activeCount, 801);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinateColumns, false);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{ L12: number; ACTIVE: number }>("category-counts.json");
  assert.equal(cats.L12, 1152);
  assert.equal(cats.ACTIVE, 801);
  const quality = evaluateOhioInvestigationQuality({
    l12Rows: fixture.l12Rows,
    activeRows: fixture.activeCount,
    sampleRows: fixture.sampleRows,
    facidDuplicates: 0,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinateColumnsPresent: fixture.coordinateColumns,
    arcgisAcceptedAsAuthoritativeExport: fixture.arcgisAcceptedAsAuthoritativeExport,
    programApproxAcceptedAsRosterCount: fixture.programPageApproxAcceptedAsRosterCount,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("ohio remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Ohio")?.publication, "unpublished");
  assert.equal(directoryHref("Ohio", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Ohio"), null);
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

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  GEORGIA_CURRENT_CAPTURE,
  GEORGIA_PRIOR_UNVERIFIED_BASELINE,
  GEORGIA_TYPE_DEFINITIONS,
  evaluateGeorgiaSourceVerification,
  georgiaDirectoryReady,
} from "../../../lib/georgia-source-verification.ts";
import { evaluateGeorgiaSampleQuality } from "../../../lib/georgia-sample-quality.ts";
import { evaluateGeorgiaDisclosureInvestigation } from "../../../lib/georgia-disclosure-investigation.ts";
import { buildGeorgiaEligibilityMatrix } from "../../../lib/georgia-eligibility-matrix.ts";
import {
  GEORGIA_INVESTIGATION_STOP_GO,
  evaluateGeorgiaInvestigationReadiness,
  georgiaInvestigationAllowsPublication,
} from "../../../lib/georgia-investigation-readiness.ts";
import { evaluateGeorgiaInvestigationQuality } from "../../../lib/georgia-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { floridaDirectoryReady } from "../../../lib/florida-source-verification.ts";
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
  "../fixtures/georgia-care-home-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("georgia source verification: 1899 PCH+ALC; export date absent; PDF rejected", () => {
  const source = evaluateGeorgiaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(GEORGIA_PRIOR_UNVERIFIED_BASELINE.compatibilityClass, "D");
  assert.equal(GEORGIA_CURRENT_CAPTURE.personalCareHome.rows, 1573);
  assert.equal(GEORGIA_CURRENT_CAPTURE.assistedLivingCommunity.rows, 326);
  assert.equal(GEORGIA_CURRENT_CAPTURE.combined.rows, 1899);
  assert.equal(GEORGIA_CURRENT_CAPTURE.combined.facidOverlap, 0);
  assert.equal(GEORGIA_CURRENT_CAPTURE.getData.recordedExportDate, null);
  assert.equal(GEORGIA_CURRENT_CAPTURE.regulatedPdf.rejectedAsCurrentLicensingSource, true);
  assert.equal(GEORGIA_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(GEORGIA_CURRENT_CAPTURE.combined.coordinatesAreLicensingCoordinates, false);
  assert.equal(source.gate, "blocked");
});

test("georgia sample quality: bounded PCH+ALC sample; no geocode invent", () => {
  const sample = evaluateGeorgiaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.result.pchSampled, 20);
  assert.equal(sample.result.alcSampled, 12);
  assert.equal(sample.population.rows, 1899);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("georgia disclosure: no FACID prefix; generic search only", () => {
  const disclosure = evaluateGeorgiaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.rosterContainsFacid, true);
  assert.equal(disclosure.findings.guessedDetailFromFacid.acceptedAsDisclosurePrefix, false);
  assert.equal(disclosure.findings.inspectionSearchIsGeneric, true);
  assert.equal(disclosure.findings.coordinatesAreLicensingCoordinates, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("georgia eligibility matrix + readiness STOP", () => {
  const matrix = buildGeorgiaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.categoryResidualOk, true);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(GEORGIA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(georgiaInvestigationAllowsPublication(), false);
  const readiness = evaluateGeorgiaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.georgiaDirectoryReady, false);
});

test("georgia investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    pchRows: number;
    alcRows: number;
    facidOverlap: number;
    sampleRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    disclosurePrefixVerified: boolean;
    recordedExportDate: null;
    coordinatesAreLicensingCoordinates: boolean;
    regulatedFacilitiesPdfRejectedAsCurrent: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "category-counts.json")), true);
  assert.equal(fixture.pchRows + fixture.alcRows, 1899);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  assert.equal(fixture.coordinatesAreLicensingCoordinates, false);
  const sampleRows = loadJson<unknown[]>("bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const cats = loadJson<{
    rows: number;
    "PERSONAL CARE HOME": number;
    "ASSISTED LIVING COMMUNITY": number;
  }>("category-counts.json");
  assert.equal(cats.rows, 1899);
  assert.equal(cats["PERSONAL CARE HOME"], 1573);
  assert.equal(cats["ASSISTED LIVING COMMUNITY"], 326);
  const quality = evaluateGeorgiaInvestigationQuality({
    pchRows: fixture.pchRows,
    alcRows: fixture.alcRows,
    sampleRows: fixture.sampleRows,
    facidOverlap: fixture.facidOverlap,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinatesClaimedAsLicensing: fixture.coordinatesAreLicensingCoordinates,
    regulatedPdfAcceptedAsCurrent: !fixture.regulatedFacilitiesPdfRejectedAsCurrent,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("georgia remains unpublished; peer state contracts unchanged", () => {
  assert.equal(directoryContract("Georgia")?.publication, "unpublished");
  assert.equal(directoryHref("Georgia", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Georgia"), null);
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

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FLORIDA_CURRENT_CAPTURE,
  FLORIDA_PRIOR_COMPARISON_SEARCH_BASELINE,
  FLORIDA_TYPE_DEFINITIONS,
  evaluateFloridaSourceVerification,
  floridaDirectoryReady,
} from "../../../lib/florida-source-verification.ts";
import { evaluateFloridaSampleQuality } from "../../../lib/florida-sample-quality.ts";
import { evaluateFloridaDisclosureInvestigation } from "../../../lib/florida-disclosure-investigation.ts";
import { buildFloridaEligibilityMatrix } from "../../../lib/florida-eligibility-matrix.ts";
import {
  FLORIDA_INVESTIGATION_STOP_GO,
  evaluateFloridaInvestigationReadiness,
  floridaInvestigationAllowsPublication,
} from "../../../lib/florida-investigation-readiness.ts";
import { evaluateFloridaInvestigationQuality } from "../../../lib/florida-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
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
  "../fixtures/florida-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("florida source verification: 3025 ALF rows; export date rejected; AFCH separate", () => {
  const source = evaluateFloridaSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(FLORIDA_PRIOR_COMPARISON_SEARCH_BASELINE.licensingFileOpened, false);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.rows, 3025);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.recordedExportDate, null);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.uniqueLicenseNumbers, 3024);
  assert.equal(FLORIDA_CURRENT_CAPTURE.alf.countyInListEmbed, false);
  assert.equal(FLORIDA_CURRENT_CAPTURE.afch.rows, 230);
  assert.equal(FLORIDA_CURRENT_CAPTURE.afch.bedMax, 5);
  assert.equal(FLORIDA_CURRENT_CAPTURE.dohGis2013.rejectedAsCurrentLicensingSource, true);
  assert.equal(FLORIDA_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.gate, "blocked");
  assert.equal(floridaDirectoryReady(), false);
});

test("florida sample quality: bounded sample; no geocode; no statewide extrapolation", () => {
  const sample = evaluateFloridaSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.population.rows, 3025);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 32);
  assert.equal(sample.allowsPublication, false);
});

test("florida disclosure: Profile LID from LicenseID verified; inspection prefix verified", () => {
  const disclosure = evaluateFloridaDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, true);
  assert.equal(disclosure.inspectionPrefixVerified, true);
  assert.equal(disclosure.findings.profileLidFromLicenseID.verifiedLicenseID, "313782");
  assert.equal(disclosure.findings.listEmbedContainsCounty, false);
  assert.equal(disclosure.findings.coordinatesAreLicensingCoordinates, false);
  assert.equal(disclosure.findings.stableStaticStatewideAlfFileUrl, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("florida eligibility matrix + readiness STOP; actionable next step present", () => {
  const matrix = buildFloridaEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.statusResidualOk, true);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(FLORIDA_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(floridaInvestigationAllowsPublication(), false);
  const readiness = evaluateFloridaInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.floridaDirectoryReady, false);
});

test("florida investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    rows: number;
    licenseStatus: {
      LICENSED: number;
      "IN REVIEW": number;
      PROVISIONAL: number;
      "IN LITIGATION": number;
      "PROV LITIGATION": number;
      INACTIVE: number;
      "PENDING DENIED RENEWAL": number;
      SUSPENDED: number;
    };
    sampleRows: number;
    coordinatePairs: number;
    afchRows: number;
    categoryEquivalenceToWashingtonAfh: boolean;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinatesAreLicensingCoordinates: boolean;
    dohGisRejectedAsCurrentSource: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "alf-bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "status-counts.json")), true);
  assert.equal(fixture.rows, 3025);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, true);
  const sampleRows = loadJson<unknown[]>("alf-bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const statusCounts = loadJson<{ rows: number; LICENSED: number }>("status-counts.json");
  assert.equal(statusCounts.rows, 3025);
  assert.equal(statusCounts.LICENSED, 2253);
  const quality = evaluateFloridaInvestigationQuality({
    rows: fixture.rows,
    licensed: fixture.licenseStatus.LICENSED,
    inReview: fixture.licenseStatus["IN REVIEW"],
    provisional: fixture.licenseStatus.PROVISIONAL,
    inLitigation: fixture.licenseStatus["IN LITIGATION"],
    provLitigation: fixture.licenseStatus["PROV LITIGATION"],
    inactive: fixture.licenseStatus.INACTIVE,
    pendingDeniedRenewal: fixture.licenseStatus["PENDING DENIED RENEWAL"],
    suspended: fixture.licenseStatus.SUSPENDED,
    sampleRows: fixture.sampleRows,
    coordinatePairs: fixture.coordinatePairs,
    afchRows: fixture.afchRows,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinatesClaimedAsLicensing: fixture.coordinatesAreLicensingCoordinates,
    dohGisAcceptedAsCurrent: !fixture.dohGisRejectedAsCurrentSource,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("florida remains unpublished; WA/OR/CA/PA/MI/WI/MN/CO/AZ/TX contracts unchanged", () => {
  assert.equal(directoryContract("Florida")?.publication, "unpublished");
  assert.equal(directoryHref("Florida", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Florida"), null);
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

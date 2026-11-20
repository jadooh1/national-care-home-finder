import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  TEXAS_CURRENT_CAPTURE,
  TEXAS_PRIOR_NOV13_BASELINE,
  TEXAS_TYPE_DEFINITIONS,
  evaluateTexasSourceVerification,
  texasDirectoryReady,
} from "../../../lib/texas-source-verification.ts";
import { evaluateTexasSampleQuality } from "../../../lib/texas-sample-quality.ts";
import { evaluateTexasDisclosureInvestigation } from "../../../lib/texas-disclosure-investigation.ts";
import { buildTexasEligibilityMatrix } from "../../../lib/texas-eligibility-matrix.ts";
import {
  TEXAS_INVESTIGATION_STOP_GO,
  evaluateTexasInvestigationReadiness,
  texasInvestigationAllowsPublication,
} from "../../../lib/texas-investigation-readiness.ts";
import { evaluateTexasInvestigationQuality } from "../../../lib/texas-investigation-quality.ts";
import { arizonaDirectoryReady } from "../../../lib/arizona-source-verification.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { coloradoDirectoryReady } from "../../../lib/colorado-source-verification.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { minnesotaDirectoryReady } from "../../../lib/minnesota-source-verification.ts";
import { pennsylvaniaDirectoryReady } from "../../../lib/pennsylvania-licensing.ts";
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
  "../fixtures/texas-assisted-living-source-discovery",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("texas source verification: 2019 rows; as-of label rejected; types residual-clean", () => {
  const source = evaluateTexasSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(TEXAS_PRIOR_NOV13_BASELINE.rows, 2016);
  assert.equal(TEXAS_CURRENT_CAPTURE.workbook.rows, 2019);
  assert.equal(TEXAS_CURRENT_CAPTURE.workbook.activeAsOfLabel, "11/19/2026");
  assert.equal(TEXAS_CURRENT_CAPTURE.workbook.recordedExportDate, null);
  assert.equal(TEXAS_CURRENT_CAPTURE.workbook.accountIdColumnPresent, false);
  assert.equal(TEXAS_CURRENT_CAPTURE.closures.overlapExactWithActiveWorkbook, 0);
  assert.equal(TEXAS_TYPE_DEFINITIONS.categoryEquivalenceToWashingtonAfh, false);
  assert.equal(source.rowDeltaVsPrior, 3);
  assert.equal(source.gate, "blocked");
  assert.equal(texasDirectoryReady(), false);
});

test("texas sample quality: bounded sample; no geocode; no statewide extrapolation", () => {
  const sample = evaluateTexasSampleQuality();
  assert.equal(sample.integrityOk, true);
  assert.equal(sample.result.rowsSampled, 32);
  assert.equal(sample.population.rows, 2019);
  assert.equal(sample.plan.statewideCrawl, false);
  assert.equal(sample.plan.automaticGeocoding, false);
  assert.equal(sample.result.facilitySpecificLinksObserved, 0);
  assert.equal(sample.allowsPublication, false);
});

test("texas disclosure: TULIP search only; no detail prefix", () => {
  const disclosure = evaluateTexasDisclosureInvestigation();
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.workbookContainsAccountIdColumn, false);
  assert.equal(disclosure.findings.tulipSearchIsSalesforceSpa, true);
  assert.equal(disclosure.findings.physicalAddressLabeledSeparatelyFromOwnerMailing, true);
  assert.equal(disclosure.allowsPublication, false);
});

test("texas eligibility matrix + readiness STOP; actionable next step present", () => {
  const matrix = buildTexasEligibilityMatrix();
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.typeResidualOk, true);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.categoryMappingRisks.some((r) => /Washington adult family home/i.test(r)));
  assert.ok(/ISO export/i.test(matrix.mostActionableNextStep));
  assert.equal(TEXAS_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(texasInvestigationAllowsPublication(), false);
  const readiness = evaluateTexasInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.texasDirectoryReady, false);
});

test("texas investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    rows: number;
    serviceType: { "TYPE A": number; "TYPE B": number; "TYPE C": number };
    geoPairs: number;
    geoCommaOnly: number;
    sampleRows: number;
    closures: { overlapExactWithActiveWorkbook: number };
    categoryEquivalenceToWashingtonAfh: boolean;
    recordedExportDate: null;
    disclosurePrefixVerified: boolean;
    coordinatesAreLicensingCoordinates: boolean;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(existsSync(join(fixtureDir, "alf-bounded-sample.json")), true);
  assert.equal(existsSync(join(fixtureDir, "type-counts.json")), true);
  assert.equal(fixture.rows, 2019);
  assert.equal(fixture.sampleRows, 32);
  assert.equal(fixture.recordedExportDate, null);
  assert.equal(fixture.disclosurePrefixVerified, false);
  const sampleRows = loadJson<unknown[]>("alf-bounded-sample.json");
  assert.equal(sampleRows.length, 32);
  const typeCounts = loadJson<{ rows: number; "TYPE A": number }>("type-counts.json");
  assert.equal(typeCounts.rows, 2019);
  assert.equal(typeCounts["TYPE A"], 335);
  const quality = evaluateTexasInvestigationQuality({
    rows: fixture.rows,
    typeA: fixture.serviceType["TYPE A"],
    typeB: fixture.serviceType["TYPE B"],
    typeC: fixture.serviceType["TYPE C"],
    sampleRows: fixture.sampleRows,
    geoPairs: fixture.geoPairs,
    geoCommaOnly: fixture.geoCommaOnly,
    closureOverlap: fixture.closures.overlapExactWithActiveWorkbook,
    washingtonAfhEquivalenceClaimed: fixture.categoryEquivalenceToWashingtonAfh,
    disclosurePrefixVerified: fixture.disclosurePrefixVerified,
    exportDatePresent: fixture.recordedExportDate != null,
    coordinatesClaimedAsLicensing: fixture.coordinatesAreLicensingCoordinates,
    statewideCrawl: false,
    automaticGeocoding: false,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("texas remains unpublished; WA/OR/CA/PA/MI/WI/MN/CO/AZ contracts unchanged", () => {
  assert.equal(directoryContract("Texas")?.publication, "unpublished");
  assert.equal(directoryHref("Texas", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Texas"), null);
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

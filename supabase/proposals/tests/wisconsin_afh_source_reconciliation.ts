import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  WISCONSIN_CURRENT_CAPTURE,
  WISCONSIN_PRIOR_RECORDED_BASELINE,
  evaluateWisconsinSourceVerification,
  wisconsinDirectoryReady,
} from "../../../lib/wisconsin-source-verification.ts";
import {
  WISCONSIN_RECONCILIATION_LEDGER,
  evaluateWisconsinSourceReconciliation,
  summarizeWisconsinReconciliation,
} from "../../../lib/wisconsin-source-reconciliation.ts";
import { evaluateWisconsinDisclosureInvestigation } from "../../../lib/wisconsin-disclosure-investigation.ts";
import { buildWisconsinEligibilityMatrix } from "../../../lib/wisconsin-eligibility-matrix.ts";
import {
  WISCONSIN_INVESTIGATION_STOP_GO,
  evaluateWisconsinInvestigationReadiness,
  wisconsinInvestigationAllowsPublication,
} from "../../../lib/wisconsin-investigation-readiness.ts";
import { evaluateWisconsinInvestigationQuality } from "../../../lib/wisconsin-investigation-quality.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import { michiganDirectoryReady } from "../../../lib/michigan-licensing.ts";
import { pennsylvaniaDirectoryReady } from "../../../lib/pennsylvania-licensing.ts";
import {
  directoryContract,
  directoryHref,
  mapHref,
  WASHINGTON_LISTED_COUNT,
  OREGON_LISTED_COUNT,
} from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/wisconsin-afh-source-reconciliation",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("wisconsin source verification: prior 1980/2203 + current excel 2479 / gis 2203", () => {
  const source = evaluateWisconsinSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(WISCONSIN_PRIOR_RECORDED_BASELINE.pdfDistinctParentheticalIds, 1980);
  assert.equal(WISCONSIN_PRIOR_RECORDED_BASELINE.gisFeatures, 2203);
  assert.equal(WISCONSIN_PRIOR_RECORDED_BASELINE.gisBlankLicense, 9);
  assert.equal(WISCONSIN_CURRENT_CAPTURE.excel.rows, 2479);
  assert.equal(WISCONSIN_CURRENT_CAPTURE.excel.capacity3 + WISCONSIN_CURRENT_CAPTURE.excel.capacity4, 2479);
  assert.equal(WISCONSIN_CURRENT_CAPTURE.gis.features, 2203);
  assert.equal(WISCONSIN_CURRENT_CAPTURE.gis.blankWiLicenseNum, 9);
  assert.equal(WISCONSIN_CURRENT_CAPTURE.excel.recordedExportDate, null);
  assert.equal(WISCONSIN_CURRENT_CAPTURE.pdf.directoryUpdatedStampIsExportDate, false);
  assert.equal(source.comparison.gisFeatureDelta, 0);
  assert.equal(source.comparison.exportDateStillAbsent, true);
  assert.equal(source.gate, "blocked");
  assert.equal(wisconsinDirectoryReady(), false);
});

test("wisconsin reconciliation: exclusive buckets residual-clean; GIS not accepted", () => {
  const recon = evaluateWisconsinSourceReconciliation();
  const summary = summarizeWisconsinReconciliation();
  assert.equal(recon.integrityOk, true);
  assert.equal(summary.residualOk, true);
  assert.equal(WISCONSIN_RECONCILIATION_LEDGER.matchedUnique, 1914);
  assert.equal(WISCONSIN_RECONCILIATION_LEDGER.matchedAmbiguous, 2);
  assert.equal(WISCONSIN_RECONCILIATION_LEDGER.excelOnly, 563);
  assert.equal(WISCONSIN_RECONCILIATION_LEDGER.gisOnlyWithLicense, 276);
  assert.equal(WISCONSIN_RECONCILIATION_LEDGER.gisBlankLicense, 9);
  assert.equal(recon.gisAcceptedAsDirectory, false);
  assert.equal(recon.rule.inventIdentifiers, false);
  assert.equal(recon.ambiguousSamples.length, 2);
  assert.equal(recon.blankLicenseSamples.length, 9);
});

test("wisconsin disclosure: mailing not substituted; no verified detail prefix", () => {
  const disclosure = evaluateWisconsinDisclosureInvestigation();
  assert.equal(disclosure.findings.mailingNotSubstitutedForFacilityStreet, true);
  assert.equal(disclosure.findings.perRowLicensingStatusColumn, false);
  assert.equal(disclosure.disclosurePrefixVerified, false);
  assert.equal(disclosure.findings.guessedDetailUrlFromFacilityId.acceptedAsDisclosurePrefix, false);
  assert.equal(disclosure.allowsPublication, false);
});

test("wisconsin eligibility matrix + readiness STOP", () => {
  const matrix = buildWisconsinEligibilityMatrix();
  assert.equal(matrix.excelResidualOk, true);
  assert.equal(matrix.gisResidualOk, true);
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.stopGo, "STOP");
  assert.equal(WISCONSIN_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(wisconsinInvestigationAllowsPublication(), false);
  const readiness = evaluateWisconsinInvestigationReadiness(true);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.wisconsinDirectoryReady, false);
});

test("wisconsin investigation quality + fixture capture", () => {
  const fixture = loadJson<{
    excel: { rows: number };
    gis: { features: number };
    reconciliation: {
      matchedUnique: number;
      matchedAmbiguous: number;
      excelOnly: number;
      gisOnlyWithLicense: number;
      gisBlankLicense: number;
    };
    recordedExportDate: null;
    publicationEligible: number;
  }>("capture-summary.json");
  assert.equal(existsSync(join(fixtureDir, "capture-summary.json")), true);
  assert.equal(fixture.excel.rows, 2479);
  assert.equal(fixture.gis.features, 2203);
  const quality = evaluateWisconsinInvestigationQuality({
    excelRows: fixture.excel.rows,
    gisFeatures: fixture.gis.features,
    matchedUnique: fixture.reconciliation.matchedUnique,
    matchedAmbiguous: fixture.reconciliation.matchedAmbiguous,
    excelOnly: fixture.reconciliation.excelOnly,
    gisOnlyWithLicense: fixture.reconciliation.gisOnlyWithLicense,
    gisBlankLicense: fixture.reconciliation.gisBlankLicense,
    mailingSubstituted: false,
    gisAcceptedAsDirectory: false,
    disclosurePrefixVerified: false,
    exportDatePresent: fixture.recordedExportDate != null,
    publicationEligible: fixture.publicationEligible,
    ownerClaimEligible: false,
    productionWrites: false,
  });
  assert.equal(quality.allPass, true);
  assert.equal(quality.gate, "blocked");
});

test("wisconsin remains unpublished; WA/OR/CA/PA/MI contracts unchanged", () => {
  assert.equal(directoryContract("Wisconsin")?.publication, "unpublished");
  assert.equal(directoryHref("Wisconsin", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(mapHref("Wisconsin"), null);
  assert.equal(wisconsinDirectoryReady(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(michiganDirectoryReady(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
  assert.equal(WASHINGTON_LISTED_COUNT > 0, true);
  assert.equal(OREGON_LISTED_COUNT > 0, true);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});

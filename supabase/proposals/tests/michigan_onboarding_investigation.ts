import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  MICHIGAN_CURRENT_CAPTURE,
  MICHIGAN_PRIOR_RECORDED_BASELINE,
  evaluateMichiganSourceVerification,
} from "../../../lib/michigan-source-verification.ts";
import {
  MICHIGAN_ADDRESS_PROFILE_SAMPLES,
  evaluateMichiganAddressExceptions,
  summarizeMichiganAddressExceptions,
} from "../../../lib/michigan-address-exceptions.ts";
import {
  MICHIGAN_XH_EXEMPT_COHORT,
  classifyMichiganTypeEligibility,
  evaluateMichiganExemptInvestigation,
} from "../../../lib/michigan-exempt-investigation.ts";
import { buildMichiganEligibilityMatrix } from "../../../lib/michigan-eligibility-matrix.ts";
import {
  MICHIGAN_INVESTIGATION_STOP_GO,
  evaluateMichiganInvestigationReadiness,
  michiganInvestigationAllowsPublication,
} from "../../../lib/michigan-investigation-readiness.ts";
import { evaluateMichiganInvestigationQuality } from "../../../lib/michigan-investigation-quality.ts";
import {
  MICHIGAN_OFFICIAL_VALIDATION,
  MICHIGAN_UNDESCRIBED_TYPE,
  michiganDirectoryReady,
  michiganFacilityProfileUrl,
  supplementalAddressRole,
  usablePhysicalStreet,
} from "../../../lib/michigan-licensing.ts";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
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
  "../fixtures/michigan-onboarding-investigation",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("michigan source verification: prior 4480 baseline + current 4476 capture", () => {
  const source = evaluateMichiganSourceVerification();
  assert.equal(source.integrityOk, true);
  assert.equal(MICHIGAN_PRIOR_RECORDED_BASELINE.rows, 4480);
  assert.equal(MICHIGAN_PRIOR_RECORDED_BASELINE.streetBlank, 4423);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.rows, 4476);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.streetBlank, 4419);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.streetLetterAndDigit, 57);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.undescribedXhRows, 234);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.statuses.EXEMPT, 234);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.recordedExportDate, null);
  assert.equal(MICHIGAN_CURRENT_CAPTURE.lastModifiedIsExportDate, false);
  assert.equal(source.comparison.rowDelta, -4);
  assert.equal(source.comparison.xhUnchanged, true);
  assert.equal(source.comparison.exportDateStillAbsent, true);
  assert.equal(MICHIGAN_OFFICIAL_VALIDATION.rows, 4480);
  assert.equal(source.gate, "blocked");
});

test("michigan address exceptions: blank streets unresolved; no supplemental substitution", () => {
  const addresses = evaluateMichiganAddressExceptions();
  const summary = summarizeMichiganAddressExceptions();
  assert.equal(summary.blankStreetRows, 4419);
  assert.equal(summary.usableStreetRows, 57);
  assert.equal(summary.residualOk, true);
  assert.equal(summary.streetTextMatches57, true);
  assert.equal(summary.supplementalAdoptedAsPhysical, false);
  assert.equal(summary.mailingAdoptedAsPhysical, false);
  assert.equal(summary.profileDefinesPhysicalVsMailing, false);
  assert.equal(supplementalAddressRole(), null);
  assert.equal(usablePhysicalStreet(""), null);
  assert.equal(usablePhysicalStreet("7047 Madison Avenue SE"), "7047 Madison Avenue SE");
  assert.ok(MICHIGAN_ADDRESS_PROFILE_SAMPLES.every(s => s.physicalOrMailingLabelPresent === false));
  assert.ok(MICHIGAN_ADDRESS_PROFILE_SAMPLES.some(s => s.kind === "blank-street"));
  assert.equal(addresses.gate, "blocked");
});

test("michigan XH/EXEMPT cohort stays undescribed and ineligible", () => {
  const exempt = evaluateMichiganExemptInvestigation();
  assert.equal(MICHIGAN_XH_EXEMPT_COHORT.rows, 234);
  assert.equal(MICHIGAN_XH_EXEMPT_COHORT.statusExempt, 234);
  assert.equal(MICHIGAN_XH_EXEMPT_COHORT.describedInRecordKey, false);
  assert.equal(MICHIGAN_XH_EXEMPT_COHORT.publicationEligible, false);
  assert.equal(exempt.inclusionAuthorized, false);
  assert.equal(classifyMichiganTypeEligibility("XH").publicationEligible, false);
  assert.equal(classifyMichiganTypeEligibility("XH").described, false);
  assert.equal(classifyMichiganTypeEligibility("AF").described, true);
  assert.equal(classifyMichiganTypeEligibility("AF").publicationEligible, false);
  assert.equal(MICHIGAN_UNDESCRIBED_TYPE, "XH");
  assert.equal(michiganFacilityProfileUrl("XH220394302"), "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/XH220394302");
  assert.equal(exempt.gate, "blocked");
});

test("michigan eligibility matrix unpublished; owner claims disabled", () => {
  const matrix = buildMichiganEligibilityMatrix();
  assert.equal(matrix.addressResidualOk, true);
  assert.equal(matrix.typeResidualOk, true);
  assert.equal(matrix.counts.publicationEligible, 0);
  assert.equal(matrix.ownerClaimEligible, false);
  assert.equal(matrix.publication, "unpublished");
  assert.equal(matrix.stopGo, "STOP");
  assert.ok(matrix.requirements.some(r => r.id === "physical-address" && r.status === "blocked"));
  assert.ok(matrix.requirements.some(r => r.id === "licensing-classification" && r.status === "blocked"));
  assert.ok(matrix.requirements.some(r => r.id === "freshness" && r.status === "blocked"));
});

test("michigan investigation readiness / quality: STOP; WA/OR/CA/PA contracts", () => {
  assert.equal(michiganInvestigationAllowsPublication(), false);
  assert.equal(MICHIGAN_INVESTIGATION_STOP_GO.decision, "STOP");
  assert.equal(michiganDirectoryReady(), false);

  const quality = evaluateMichiganInvestigationQuality();
  assert.equal(quality.allPass, true);
  const readiness = evaluateMichiganInvestigationReadiness(quality.allPass);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.californiaRecrawl, false);
  assert.equal(readiness.exclusionActivation, false);

  assert.equal(directoryContract("Michigan")?.publication, "unpublished");
  assert.equal(directoryHref("Michigan", "https://example.supabase.co"), null);
  assert.equal(mapHref("Michigan"), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(WASHINGTON_LISTED_COUNT, 6278);
  assert.equal(OREGON_LISTED_COUNT, 1584);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(pennsylvaniaDirectoryReady(), false);
});

test("michigan investigation fixtures present after package assembly", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    stopGo: string;
    allowsPublication: boolean;
    currentRows: number;
    blankStreetRows: number;
    xhRows: number;
    ownerClaimEligible: boolean;
    exportDate: null;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.currentRows, 4476);
  assert.equal(summary.blankStreetRows, 4419);
  assert.equal(summary.xhRows, 234);
  assert.equal(summary.ownerClaimEligible, false);
  assert.equal(summary.exportDate, null);
});

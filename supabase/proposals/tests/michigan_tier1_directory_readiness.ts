import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { MICHIGAN_CURRENT_CAPTURE } from "../../../lib/michigan-source-verification.ts";
import { MICHIGAN_INVESTIGATION_STOP_GO } from "../../../lib/michigan-investigation-readiness.ts";
import {
  MICHIGAN_ADDRESS_COUNTS,
  michiganDirectoryReady,
  michiganFacilityProfileUrl,
  supplementalAddressRole,
} from "../../../lib/michigan-licensing.ts";
import {
  MICHIGAN_TIER1_CAPTURE,
  MICHIGAN_TIER1_DIRECTORY_BLOCKERS,
  MICHIGAN_TIER1_DIRECTORY_CHECKLIST,
  MICHIGAN_TIER1_DIRECTORY_CONTROLS,
  MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS,
  MICHIGAN_TIER1_DIRECTORY_INVENTORY,
  MICHIGAN_TIER1_DIRECTORY_SOURCE,
  MICHIGAN_TIER1_EXACT_ID_RECONCILIATION,
  MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT,
  MICHIGAN_TIER1_SURFACE_SEPARATION,
  michiganAdoptSupplementalAsPhysicalStreet,
  michiganTier1DirectoryChecklistComplete,
  michiganTier1DirectoryReadyForPublic,
  michiganTier1DirectoryVerdict,
  michiganTier1MapReady,
} from "../../../lib/michigan-tier1-directory-readiness.ts";
import { directoryContract, mapHref } from "../../../lib/state-directory.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("Michigan Tier 1 directory readiness is STOP; Michigan stays unpublished", () => {
  const verdict = michiganTier1DirectoryVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.tier1DirectoryRequirementsMet, false);
  assert.equal(verdict.publicPublicationAuthorized, false);
  assert.equal(verdict.michiganPublished, false);
  assert.equal(verdict.mapEnabled, false);
  assert.equal(verdict.streetResolutionComplete, false);
  assert.equal(verdict.inventoryRows, 4476);
  assert.equal(verdict.publicationEligible, 0);
  assert.deepEqual([...verdict.blockers], [...MICHIGAN_TIER1_DIRECTORY_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 5);

  assert.equal(MICHIGAN_TIER1_DIRECTORY_CONTROLS.stopGo, "STOP");
  assert.equal(MICHIGAN_TIER1_DIRECTORY_CONTROLS.michiganPublished, false);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_CONTROLS.michiganDirectoryReady, false);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_CONTROLS.streetResolutionComplete, false);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_CONTROLS.supabaseWrites, false);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_CONTROLS.pr62Pr63ResearchReused, true);
  assert.equal(michiganTier1DirectoryReadyForPublic(), false);
  assert.equal(michiganTier1MapReady(), false);
  assert.equal(michiganTier1DirectoryChecklistComplete(), false);
  assert.equal(michiganDirectoryReady(), false);
  assert.equal(MICHIGAN_INVESTIGATION_STOP_GO.decision, "STOP");
});

test("LARA source covers AFC and Homes for the Aged; identity, status, capacity, disclosure hold", () => {
  assert.equal(MICHIGAN_TIER1_DIRECTORY_SOURCE.coversAdultFosterCare, true);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_SOURCE.coversHomesForTheAged, true);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_SOURCE.homesForTheAgedTypeCode, "AH");
  assert.equal(MICHIGAN_TIER1_DIRECTORY_SOURCE.recordedExportDateIso, null);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_SOURCE.dailyUpdateNoticeIsExportDate, false);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_SOURCE.disclosurePrefixVerified, true);

  assert.equal(MICHIGAN_TIER1_CAPTURE.rows, 4476);
  assert.equal(MICHIGAN_TIER1_CAPTURE.priorAuditRowsPr62, 4480);
  assert.equal(MICHIGAN_TIER1_CAPTURE.homesForTheAgedRows, 351);
  assert.equal(MICHIGAN_TIER1_CAPTURE.types.AH, 351);
  assert.equal(MICHIGAN_TIER1_CAPTURE.types.XH, 234);
  assert.equal(MICHIGAN_TIER1_CAPTURE.statuses.EXEMPT, 234);
  assert.equal(MICHIGAN_TIER1_CAPTURE.blankLicenses, 0);
  assert.equal(MICHIGAN_TIER1_CAPTURE.duplicateLicenses, 0);
  assert.equal(MICHIGAN_TIER1_CAPTURE.capacityDigits, 4476);
  assert.equal(MICHIGAN_TIER1_CAPTURE.capacityOutsideDescribedRange, 0);
  assert.equal(MICHIGAN_TIER1_CAPTURE.publicationEligible, 0);
  assert.equal(MICHIGAN_TIER1_CAPTURE.lastModifiedIsExportDate, false);

  // Inventory continuity vs Nov 20 investigation row count.
  assert.equal(MICHIGAN_TIER1_CAPTURE.rows, MICHIGAN_CURRENT_CAPTURE.rows);
  assert.equal(MICHIGAN_TIER1_CAPTURE.undescribedXhRows, MICHIGAN_CURRENT_CAPTURE.undescribedXhRows);

  assert.equal(
    michiganFacilityProfileUrl("AM410008657"),
    "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/AM410008657",
  );
  assert.equal(
    michiganFacilityProfileUrl("AH730257847"),
    "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/AH730257847",
  );

  const disclosure = MICHIGAN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "facility-specific-disclosure");
  const freshness = MICHIGAN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "freshness-iso-export-date");
  const street = MICHIGAN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "street-address-resolution");
  const source = MICHIGAN_TIER1_DIRECTORY_CHECKLIST.find((i) => i.id === "authoritative-lara-afc-hfa-text-file");
  assert.equal(disclosure?.complete, true);
  assert.equal(freshness?.complete, false);
  assert.equal(street?.complete, false);
  assert.equal(source?.complete, true);
});

test("street resolution attempt refuses supplemental promotion; exclusions keep XH out", () => {
  assert.equal(MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.attempted, true);
  assert.equal(MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.streetResolutionComplete, false);
  assert.equal(MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.supplementalAdoptedAsPhysical, false);
  assert.equal(MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.blankStreetRows, 4419);
  assert.equal(MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.usableOfficialStreetRows, 57);
  assert.equal(
    MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.blankStreetWithSupplementalLetterDigit,
    4419,
  );
  assert.equal(
    MICHIGAN_TIER1_STREET_RESOLUTION_ATTEMPT.blankStreetSupplementalCandidatesNotAdopted,
    3507,
  );
  assert.equal(michiganAdoptSupplementalAsPhysicalStreet("7047 Madison Avenue SE"), null);
  assert.equal(supplementalAddressRole(), null);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.publicationEligibleRows, 0);

  assert.equal(MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS.xhUndescribedExemptRows, 234);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS.blankStreetUnresolvedRows, 4419);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS.supplementalNotSubstitutedForStreet, true);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS.inventedPhysicalStreets, false);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_EXCLUSIONS.washingtonAfhEquivalence, false);

  assert.equal(MICHIGAN_TIER1_EXACT_ID_RECONCILIATION.currentInventoryIdentityOk, true);
  assert.equal(MICHIGAN_TIER1_EXACT_ID_RECONCILIATION.duplicateLicenseNumbersCurrent, 0);
  assert.equal(MICHIGAN_TIER1_EXACT_ID_RECONCILIATION.netVsPriorAudit, -4);
  assert.equal(MICHIGAN_TIER1_DIRECTORY_INVENTORY.publicationEligible, 0);
  assert.equal(
    MICHIGAN_TIER1_DIRECTORY_INVENTORY.adultFosterCareDescribedRows
      + MICHIGAN_TIER1_DIRECTORY_INVENTORY.homesForTheAgedRows
      + MICHIGAN_TIER1_DIRECTORY_INVENTORY.xhExemptRows,
    4476,
  );
});

test("safeguards keep WA public and MI unpublished; Design 2 untouched", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.notEqual(directoryContract("California")?.publication, "public");
  assert.equal(directoryContract("Michigan")?.publication, "unpublished");
  assert.equal(directoryContract("Michigan")?.directoryPath, null);
  assert.equal(mapHref("Michigan"), null);

  assert.equal(MICHIGAN_TIER1_SURFACE_SEPARATION.washingtonPreserved, true);
  assert.equal(MICHIGAN_TIER1_SURFACE_SEPARATION.californiaPreserved, true);
  assert.equal(MICHIGAN_TIER1_SURFACE_SEPARATION.oregonPreserved, true);
  assert.equal(MICHIGAN_TIER1_SURFACE_SEPARATION.design2Preserved, true);
  assert.equal(MICHIGAN_TIER1_SURFACE_SEPARATION.mapEnabled, false);

  const michigan = PUBLICATION_READINESS_SUMMARIES.find((row) => row.state === "Michigan");
  assert.ok(michigan);
  assert.equal(michigan.stopGo, "STOP");
  assert.equal(michigan.stateAuthorization, "unpublished");
  assert.equal(michigan.tierCounts.tier0, 4476);
  assert.equal(michigan.tierCounts.tier1, 0);
  assert.equal(michigan.ownerClaimsEnabled, false);
  assert.ok(michigan.blockers.includes("blank-street-physical-address-unresolved"));
  assert.ok(michigan.blockers.includes("no-authoritative-iso-export-date"));

  assert.equal(existsSync("lib/michigan-tier1-directory-readiness.ts"), true);
  assert.equal(
    existsSync("supabase/proposals/20261126250000_michigan_tier1_directory_readiness.md"),
    true,
  );
  assert.ok(readFileSync("lib/michigan-tier1-directory-readiness.ts", "utf8").includes("STOP"));
});

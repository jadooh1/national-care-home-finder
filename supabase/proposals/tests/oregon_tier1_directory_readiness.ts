import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  OREGON_DIRECTORY_ACCEPTED_ROWS,
  OREGON_DIRECTORY_ZERO_BED_ROWS,
  OREGON_RECORDED_EXPORT_DATE,
  oregonExportDateReady,
} from "../../../lib/oregon-export-date.ts";
import {
  OREGON_PUBLIC_FIELDS,
  OREGON_ZERO_BED_NOTE,
} from "../../../lib/oregon-public-directory.ts";
import {
  OREGON_TIER1_DIRECTORY_ACCEPTED_COUNT,
  OREGON_TIER1_DIRECTORY_BLOCKERS,
  OREGON_TIER1_DIRECTORY_CHECKLIST,
  OREGON_TIER1_DIRECTORY_CONTROLS,
  OREGON_TIER1_DIRECTORY_ELIGIBILITY,
  OREGON_TIER1_DIRECTORY_PUBLIC_FIELDS,
  OREGON_TIER1_DIRECTORY_SOURCE,
  OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS,
  OREGON_TIER1_SURFACE_SEPARATION,
  oregonTier1DirectoryChecklistComplete,
  oregonTier1DirectoryReadyForPublic,
  oregonTier1DirectoryVerdict,
  oregonTier1MapReady,
} from "../../../lib/oregon-tier1-directory-readiness.ts";
import { directoryContract, mapHref, oregonRefreshReady } from "../../../lib/state-directory.ts";
import { PUBLICATION_READINESS_SUMMARIES } from "../../../lib/publication-eligibility-readiness.ts";

test("Oregon Tier 1 directory readiness is STOP; development directory stays operational", () => {
  const verdict = oregonTier1DirectoryVerdict();
  assert.equal(verdict.stopGo, "STOP");
  assert.equal(verdict.tier1DirectoryRequirementsMet, false);
  assert.equal(verdict.developmentDirectoryOperational, true);
  assert.equal(verdict.publicPublicationAuthorized, false);
  assert.equal(verdict.mapEnabled, false);
  assert.equal(verdict.directoryAcceptedCount, 1584);
  assert.equal(verdict.zeroBedExclusions, 20);
  assert.deepEqual([...verdict.blockers], [...OREGON_TIER1_DIRECTORY_BLOCKERS]);
  assert.ok(verdict.nextHumanActions.length >= 3);

  assert.equal(OREGON_TIER1_DIRECTORY_CONTROLS.stopGo, "STOP");
  assert.equal(OREGON_TIER1_DIRECTORY_CONTROLS.oregonPublished, false);
  assert.equal(OREGON_TIER1_DIRECTORY_CONTROLS.mapEnabled, false);
  assert.equal(OREGON_TIER1_DIRECTORY_CONTROLS.publicPublicationAuthorized, false);
  assert.equal(OREGON_TIER1_DIRECTORY_CONTROLS.releaseCandidatePrepared, true);
  assert.equal(oregonTier1DirectoryReadyForPublic(), false);
  assert.equal(oregonTier1MapReady(), false);
  assert.equal(oregonTier1DirectoryChecklistComplete(), false);
});

test("freshness, identity, eligibility, and disclosure evidence stay aligned with existing audits", () => {
  assert.equal(oregonExportDateReady(), false);
  assert.equal(OREGON_RECORDED_EXPORT_DATE, null);
  assert.equal(OREGON_TIER1_DIRECTORY_SOURCE.recordedExportDateIso, null);
  assert.equal(OREGON_TIER1_DIRECTORY_SOURCE.hasExportDateColumn, false);
  assert.equal(OREGON_TIER1_DIRECTORY_SOURCE.disclosureVerified, true);
  assert.equal(
    OREGON_TIER1_DIRECTORY_SOURCE.disclosurePrefix,
    "https://ltclicensing.oregon.gov/Providers/Details/",
  );

  assert.equal(OREGON_TIER1_DIRECTORY_ACCEPTED_COUNT, OREGON_DIRECTORY_ACCEPTED_ROWS);
  assert.equal(OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS, OREGON_DIRECTORY_ZERO_BED_ROWS);
  assert.deepEqual([...OREGON_TIER1_DIRECTORY_PUBLIC_FIELDS], [...OREGON_PUBLIC_FIELDS]);
  assert.equal(OREGON_TIER1_DIRECTORY_ELIGIBILITY.streetAddressInPublicColumns, false);
  assert.equal(OREGON_TIER1_DIRECTORY_ELIGIBILITY.coordinatesInvented, false);
  assert.equal(OREGON_TIER1_DIRECTORY_ELIGIBILITY.zeroBedOpenHomesExcluded, true);
  assert.ok(OREGON_ZERO_BED_NOTE.includes("20 open"));

  const freshness = OREGON_TIER1_DIRECTORY_CHECKLIST.find(item => item.id === "freshness-iso-export-date");
  const identity = OREGON_TIER1_DIRECTORY_CHECKLIST.find(item => item.id === "facility-identity-source-id");
  const eligibility = OREGON_TIER1_DIRECTORY_CHECKLIST.find(item => item.id === "licensing-eligibility-open-afh-beds");
  const disclosure = OREGON_TIER1_DIRECTORY_CHECKLIST.find(item => item.id === "disclosure-links-odhs-profile");
  assert.equal(freshness?.complete, false);
  assert.equal(identity?.complete, true);
  assert.equal(eligibility?.complete, true);
  assert.equal(disclosure?.complete, true);
});

test("directory readiness is separated from map readiness", () => {
  assert.equal(OREGON_TIER1_SURFACE_SEPARATION.mapPath, null);
  assert.equal(OREGON_TIER1_SURFACE_SEPARATION.mapEnabled, false);
  assert.equal(OREGON_TIER1_SURFACE_SEPARATION.directoryPath, "/oregon");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
  assert.equal(mapHref("Oregon"), null);
  assert.equal(oregonRefreshReady(), false);

  const mapItem = OREGON_TIER1_DIRECTORY_CHECKLIST.find(item => item.id === "map-coordinates-separate");
  assert.equal(mapItem?.surface, "map");
  assert.equal(mapItem?.complete, false);

  const oregon = PUBLICATION_READINESS_SUMMARIES.find(row => row.state === "Oregon");
  assert.ok(oregon);
  assert.equal(oregon.stopGo, "STOP");
  assert.equal(oregon.tierCounts.tier0, 1584);
  assert.equal(oregon.tierCounts.tier1, 0);
  assert.equal(oregon.oregonMapDisabled, true);
  assert.ok(oregon.blockers.includes("no-authoritative-iso-export-date"));
  assert.ok(oregon.blockers.includes("street-withheld-from-public-columns"));
});

test("safeguards keep Washington public and Oregon unpublished; production layout stays fail-closed", () => {
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  // California may be unpublished/development on this development baseline; do not flip it.
  assert.notEqual(directoryContract("California")?.publication, "public");

  const layout = readFileSync("app/oregon/layout.tsx", "utf8");
  assert.ok(layout.includes("PUBLIC_PRODUCTION_HOSTS"));
  assert.ok(layout.includes("notFound()"));
  assert.ok(layout.includes('vercelEnv === "production"'));

  assert.equal(existsSync("lib/oregon-tier1-directory-readiness.ts"), true);
  assert.equal(OREGON_TIER1_SURFACE_SEPARATION.washingtonPreserved, true);
  assert.equal(OREGON_TIER1_SURFACE_SEPARATION.californiaPreserved, true);
  assert.equal(OREGON_TIER1_SURFACE_SEPARATION.ownerClaimsEnabled, false);
});

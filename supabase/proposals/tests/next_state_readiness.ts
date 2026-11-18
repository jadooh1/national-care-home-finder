import assert from "node:assert/strict";
import test from "node:test";
import { californiaEligibleCount } from "../../../lib/california-directory.ts";
import { DIRECTORY_REQUIRES_COORDINATES } from "../../../lib/nationwide-compatibility.ts";
import { MICHIGAN_ADDRESS_COUNTS } from "../../../lib/michigan-licensing.ts";
import { onboardingProfile, publicPublicationPermitted, MICHIGAN_FILE_ROWS, PENNSYLVANIA_PUBLICATION_ELIGIBLE_ROWS, PENNSYLVANIA_ROWS } from "../../../lib/nationwide-onboarding.ts";
import { NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS, NORTH_CAROLINA_UNIQUE_LICENSES } from "../../../lib/north-carolina-onboarding.ts";
import {
  NEXT_STATE_READINESS,
  missingCoordinatesBlockListDirectory,
  nextStatePublicationPermitted,
  oregonListPublicationTasks,
  recommendedNextState,
} from "../../../lib/next-state-readiness.ts";
import { directoryContract, OREGON_LICENSED_BEDS, OREGON_LISTED_COUNT } from "../../../lib/state-directory.ts";

test("missing coordinates do not block a list-only directory", () => {
  assert.equal(DIRECTORY_REQUIRES_COORDINATES, false);
  assert.equal(missingCoordinatesBlockListDirectory(), false);
  for (const item of NEXT_STATE_READINESS) {
    assert.equal(item.optionalRemaining.includes("coordinate-columns") || item.coordinates !== "absent", true);
  }
  assert.equal(NEXT_STATE_READINESS.find(item => item.state === "Pennsylvania")?.coordinates, "georeferenced-not-licensing");
});

test("Oregon is the recommended next list and none of the five is publishable", () => {
  assert.equal(recommendedNextState(), "Oregon");
  assert.deepEqual(NEXT_STATE_READINESS.map(item => item.rank), [1, 2, 3, 4, 5]);
  assert.deepEqual(NEXT_STATE_READINESS.map(item => item.state), [
    "Oregon",
    "Michigan",
    "California",
    "North Carolina",
    "Pennsylvania",
  ]);
  assert.deepEqual(oregonListPublicationTasks(), [
    "authoritative-iso-export-date",
    "approval-for-list-only-publication-without-street-or-coordinates",
  ]);
  const oregon = NEXT_STATE_READINESS[0];
  assert.deepEqual(oregon.mandatoryRemaining, ["authoritative-iso-export-date"]);
  assert.equal(oregon.directory, "development");
  assert.equal(publicPublicationPermitted(onboardingProfile("Oregon")), false);
  assert.equal(nextStatePublicationPermitted("Oregon"), false);
  assert.equal(nextStatePublicationPermitted("California"), false);
  assert.equal(nextStatePublicationPermitted("Michigan"), false);
  assert.equal(nextStatePublicationPermitted("Pennsylvania"), false);
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("North Carolina")?.directoryPath, null);
});

test("coverage counts stay tied to the completed reviews", () => {
  assert.equal(NEXT_STATE_READINESS.find(item => item.state === "Oregon")?.observedRows, OREGON_LISTED_COUNT);
  assert.equal(OREGON_LICENSED_BEDS, 7346);
  assert.equal(NEXT_STATE_READINESS.find(item => item.state === "California")?.observedRows, californiaEligibleCount());
  assert.equal(NEXT_STATE_READINESS.find(item => item.state === "Michigan")?.observedRows, MICHIGAN_FILE_ROWS);
  assert.equal(MICHIGAN_ADDRESS_COUNTS.usablePhysicalStreetRows + MICHIGAN_ADDRESS_COUNTS.unresolvedBlankStreetRows, MICHIGAN_FILE_ROWS);
  assert.equal(NEXT_STATE_READINESS.find(item => item.state === "North Carolina")?.observedRows, NORTH_CAROLINA_UNIQUE_LICENSES);
  assert.equal(NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS, 0);
  assert.equal(NEXT_STATE_READINESS.find(item => item.state === "Pennsylvania")?.observedRows, PENNSYLVANIA_ROWS);
  assert.equal(PENNSYLVANIA_PUBLICATION_ELIGIBLE_ROWS, 0);
  assert.equal(NEXT_STATE_READINESS.every(item => item.capacityRecorded), true);
});

/**
 * California Tier 2 final development validation (baseline 6a04300).
 *
 * Phase 9 identity corroboration of leading-zero GIS collapses, stratified
 * exact-ID plausibility sample, and unmatched-facility documentation.
 * Does not invent coordinates. Public California map stays disabled.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const CALIFORNIA_TIER2_FINAL_VALIDATION_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_TIER2_FINAL_VALIDATION_BASELINE = "6a04300" as const;

export const CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE = {
  kind: "tier2-final-development-validation" as const,
  baselineCommit: CALIFORNIA_TIER2_FINAL_VALIDATION_BASELINE,
  fixtureDir:
    "supabase/proposals/fixtures/california-tier2-final-validation" as const,
  publicMapEnabled: false as const,
  fabricatedCoordinates: 0 as const,
  geocoded: false as const,
  leadingZeroRejectedId: "011405838" as const,
  verifiedOfficialCoords: 15418 as const,
  exactMatchWithValidCoords: 14058 as const,
  leadingZeroIdentityVerified: 1360 as const,
  unmatchedDocumented: 16 as const,
  stratifiedExactSamplePass: 150 as const,
  stratifiedExactSampleFail: 0 as const,
  developmentMapReadiness: "GO-with-verified-subset" as const,
  publicMapReadiness: "STOP" as const,
} as const;

export type CaliforniaTier2UnmatchedFacility = {
  facilityNumber: string;
  name: string | null;
  category: string | null;
  type: string | null;
  status: string | null;
  city: string | null;
  zip: string | null;
  address: string | null;
  leadingZero: boolean;
  collapsedGisLookup: string;
  gisRowPresentForCollapsedId: boolean;
  gisName: string | null;
  gisCity: string | null;
  gisZip: string | number | null;
  note: string;
};

export type CaliforniaTier2FinalValidationReport = {
  observedOn: string;
  baselineCommit: string;
  leadingZero: {
    input: number;
    verified: number;
    rejected: number;
    rejectReasons: Record<string, number>;
  };
  stratifiedExactSample: {
    sampleSize: number;
    pass: number;
    fail: number;
  };
  unmatched: { count: number };
  coverageAfterValidation: {
    verifiedOfficialCoords: number;
    verifiedOfficialCoordsRate: number;
    publicMapEnabled: false;
  };
  publicationReadiness: {
    developmentMap: string;
    publicCaliforniaMap: string;
    correctivePrNeeded: boolean;
  };
};

const FIXTURE = join(
  process.cwd(),
  "supabase/proposals/fixtures/california-tier2-final-validation",
);

export function loadCaliforniaTier2FinalValidationReport(): CaliforniaTier2FinalValidationReport {
  return JSON.parse(
    readFileSync(join(FIXTURE, "report.json"), "utf8"),
  ) as CaliforniaTier2FinalValidationReport;
}

export function loadCaliforniaTier2UnmatchedFacilities(): CaliforniaTier2UnmatchedFacility[] {
  return JSON.parse(
    readFileSync(join(FIXTURE, "unmatched-facilities.json"), "utf8"),
  ) as CaliforniaTier2UnmatchedFacility[];
}

export function californiaTier2FinalPublicationReadiness(): {
  developmentMap: "GO-with-verified-subset";
  publicCaliforniaMap: "STOP";
  verifiedOfficialCoords: number;
  leadingZeroIdentityRejected: number;
  unmatched: number;
  publicMapEnabled: false;
} {
  return {
    developmentMap: "GO-with-verified-subset",
    publicCaliforniaMap: "STOP",
    verifiedOfficialCoords:
      CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.verifiedOfficialCoords,
    leadingZeroIdentityRejected: 1,
    unmatched: CALIFORNIA_TIER2_FINAL_VALIDATION_SCOPE.unmatchedDocumented,
    publicMapEnabled: false,
  };
}

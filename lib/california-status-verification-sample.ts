/**
 * Risk-focused FacilityDetail verification sample for California Phase 2.
 * Sample observations are not statewide conclusions.
 */

import type { CaliforniaStatusVerificationTarget } from "./california-status-verification";

/**
 * Reproducible sample covering exact GIS matches, leading-zero mismatches,
 * GIS-missing rows, LICENSED/CLOSED history, and the confirmed LICENSED→Closed conflict.
 */
export const CALIFORNIA_STATUS_VERIFICATION_SAMPLE: readonly CaliforniaStatusVerificationTarget[] = [
  {
    requestedId: "100400070",
    historicalStatus: "LICENSED",
    gisCohort: "exact-match",
    file: "RCFE",
    label: "exact-match-rcfe-licensed",
  },
  {
    requestedId: "100403816",
    historicalStatus: "LICENSED",
    gisCohort: "exact-match",
    file: "ARF",
    label: "exact-match-arf-licensed",
  },
  {
    requestedId: "216801686",
    historicalStatus: "LICENSED",
    gisCohort: "exact-match",
    file: "RCFE",
    label: "exact-match-rcfe-licensed-2",
  },
  {
    requestedId: "198603605",
    historicalStatus: "LICENSED",
    gisCohort: "exact-match",
    file: "RCFE",
    label: "exact-match-rcfe-licensed-3",
  },
  {
    requestedId: "486801876",
    historicalStatus: "LICENSED",
    gisCohort: "exact-match",
    file: "ARF",
    label: "exact-match-arf-licensed-2",
  },
  {
    requestedId: "486803087",
    historicalStatus: "LICENSED",
    gisCohort: "exact-match",
    file: "ARF",
    label: "exact-match-arf-licensed-3",
  },
  {
    requestedId: "015601302",
    historicalStatus: "LICENSED",
    gisCohort: "leading-zero",
    file: "RCFE",
    label: "leading-zero-hist-licensed",
  },
  {
    requestedId: "15601302",
    historicalStatus: "LICENSED",
    gisCohort: "leading-zero-truncated-request",
    file: "RCFE",
    label: "leading-zero-truncated-request",
  },
  {
    requestedId: "015601222",
    historicalStatus: "LICENSED",
    gisCohort: "leading-zero",
    file: "RCFE",
    label: "leading-zero-hist-licensed-2",
  },
  {
    requestedId: "019201182",
    historicalStatus: "LICENSED",
    gisCohort: "leading-zero",
    file: "RCFE",
    label: "leading-zero-hist-licensed-3",
  },
  {
    requestedId: "011440129",
    historicalStatus: "LICENSED",
    gisCohort: "leading-zero",
    file: "RCFE",
    label: "leading-zero-hist-licensed-4",
  },
  {
    requestedId: "075600335",
    historicalStatus: "LICENSED",
    gisCohort: "leading-zero",
    file: "RCFE",
    label: "leading-zero-hist-licensed-5",
  },
  {
    requestedId: "011400493",
    historicalStatus: "LICENSED",
    gisCohort: "gis-missing",
    file: "ARF",
    label: "confirmed-licensed-to-closed-conflict",
  },
  {
    requestedId: "015601270",
    historicalStatus: "LICENSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-licensed-2",
  },
  {
    requestedId: "015600722",
    historicalStatus: "LICENSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-licensed-3",
  },
  {
    requestedId: "079201256",
    historicalStatus: "LICENSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-licensed-4",
  },
  {
    requestedId: "011400246",
    historicalStatus: "CLOSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-closed",
  },
  {
    requestedId: "496803905",
    historicalStatus: "CLOSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-closed-2",
  },
  {
    requestedId: "374603618",
    historicalStatus: "CLOSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-closed-3",
  },
  {
    requestedId: "011400369",
    historicalStatus: "CLOSED",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-closed-4",
  },
  {
    requestedId: "019201420",
    historicalStatus: "PENDING",
    gisCohort: "gis-missing",
    file: "RCFE",
    label: "gis-missing-pending",
  },
] as const;

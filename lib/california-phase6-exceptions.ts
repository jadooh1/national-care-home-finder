/**
 * Documented exceptional California facility IDs for Phase 6 publication-gate
 * evaluation. Evidence from Phase 5 FacilityDetail samples and historical
 * conflict analysis. Read-only; does not publish California.
 *
 * Kept free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export type CaliforniaPhase6ExceptionId =
  | "366401835"
  | "374604731"
  | "198601400"
  | "306006749"
  | "306006799"
  | "95354";

export const CALIFORNIA_PHASE6_EXCEPTION_IDS = [
  "366401835",
  "374604731",
  "198601400",
  "306006749",
  "306006799",
  "95354",
] as const satisfies readonly CaliforniaPhase6ExceptionId[];

export type CaliforniaPhase6ExceptionRecord = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  classification: string;
  downloadStatus: string;
  downloadType: string;
  liveStatus: string | null;
  summary: string;
  gateImpact:
    | "exclude-invalid-id"
    | "exclude-out-of-scope"
    | "exclude-ineligible-status"
    | "document-only-eligible-if-rules-pass"
    | "exclude-withdrawn-mapping-gap";
};

/**
 * Phase 5 FacilityDetail-checked exceptional records.
 * Gate impact describes how the publication-gate evaluator must treat each ID.
 */
export const CALIFORNIA_PHASE6_EXCEPTIONS: readonly CaliforniaPhase6ExceptionRecord[] = [
  {
    facilityNumber: "366401835",
    file: "ARF",
    classification: "historical-data-defect",
    downloadStatus: "LICENSED",
    downloadType: "ADULT RESIDENTIAL",
    liveStatus: "Licensed",
    summary:
      "Historical CHHS facility_status was the date string 9/2/1997 (data defect). Download and FacilityDetail both show LICENSED / Licensed for an eligible ARF type. Documented exception; eligible under Phase 6 rules if present in the download with valid address.",
    gateImpact: "document-only-eligible-if-rules-pass",
  },
  {
    facilityNumber: "374604731",
    file: "ARF",
    classification: "possible-relicense",
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    liveStatus: "Licensed",
    summary:
      "Historical CLOSED → download LICENSED with later license-first date (possible relicense). FacilityDetail = Licensed, but type is ADULT DAY PROGRAM (out of scope / non-residential). Exclude from publication candidates.",
    gateImpact: "exclude-out-of-scope",
  },
  {
    facilityNumber: "198601400",
    file: "ARF",
    classification: "unusual-transition",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    liveStatus: "Pending",
    summary:
      "Historical LICENSED → download PENDING (unusual). FacilityDetail confirms Pending. Eligible ARF type but PENDING status is ineligible.",
    gateImpact: "exclude-ineligible-status",
  },
  {
    facilityNumber: "306006749",
    file: "ARF",
    classification: "application-withdrawn-mapping-gap",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    liveStatus: "Application Withdrawn",
    summary:
      "Download CLOSED maps to FacilityDetail Application Withdrawn (not Closed*). ADP out of scope and withdrawn-ineligible.",
    gateImpact: "exclude-withdrawn-mapping-gap",
  },
  {
    facilityNumber: "306006799",
    file: "ARF",
    classification: "application-withdrawn-mapping-gap",
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    liveStatus: "Application Withdrawn",
    summary:
      "Download CLOSED maps to FacilityDetail Application Withdrawn (not Closed*). ADP out of scope and withdrawn-ineligible.",
    gateImpact: "exclude-withdrawn-mapping-gap",
  },
  {
    facilityNumber: "95354",
    file: "ARF",
    classification: "invalid-identifier",
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    liveStatus: null,
    summary:
      "Corrupt/shifted download row: Facility Number 95354 matches ZIP and fails 8–9 digit facility-number validation. FacilityDetail not found. Must reject.",
    gateImpact: "exclude-invalid-id",
  },
] as const;

export function californiaPhase6ExceptionsById(): Map<
  string,
  CaliforniaPhase6ExceptionRecord
> {
  return new Map(
    CALIFORNIA_PHASE6_EXCEPTIONS.map(row => [row.facilityNumber, row] as const),
  );
}

export function describeCaliforniaPhase6Exception(
  facilityNumber: string,
): CaliforniaPhase6ExceptionRecord | null {
  return californiaPhase6ExceptionsById().get(facilityNumber) ?? null;
}

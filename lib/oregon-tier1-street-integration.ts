/**
 * Oregon Tier 1 — street address integration controls (development-only).
 *
 * Prepares official ODHS Address integration for all 1,579 qualifying Open AFH
 * rows from the 2026-11-26 dual-format capture (baseline 2d0d037). Controls are
 * reversible and default OFF. Does NOT write Supabase, publish Oregon, adopt an
 * ISO export date, geocode, or change Washington / California / Design 2 /
 * authentication / billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const OREGON_TIER1_STREET_INTEGRATION_OBSERVED_ON = "2026-11-26" as const;
export const OREGON_TIER1_STREET_INTEGRATION_BASELINE = "2d0d037" as const;

export const OREGON_TIER1_STREET_INTEGRATION_CAPTURE = {
  csvFilename: "Provider_Export_11-26-2026.csv" as const,
  excelFilename: "Provider_Export_11-26-2026.xlsx" as const,
  csvSha256: "df843f7195242517723f8354bfd53095ec0a8f1baa7f76a19b7eb1010a0d63b2" as const,
  xlsxSha256: "036885f39e197ac02518dec257744c25664af039d92f85beb6191e0b20389bcd" as const,
  qualifyingAccepted: 1579 as const,
  streetPresent: 1579 as const,
  streetBlank: 0 as const,
  csvExcelAcceptedParity: true as const,
  recordedExportDateIso: null,
  freshnessUnresolvedPendingOdhsConfirmation: true as const,
} as const;

/** Current reduced-field public columns (street withheld). */
export const OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS = [
  "source_id",
  "facility_name",
  "city",
  "county",
  "license_type",
  "status",
  "licensed_beds",
  "official_profile_url",
] as const;

/** Prepared columns when street integration is activated (still development-only). */
export const OREGON_TIER1_STREET_INTEGRATION_PREPARED_FIELDS = [
  "source_id",
  "facility_name",
  "street",
  "city",
  "county",
  "license_type",
  "status",
  "licensed_beds",
  "official_profile_url",
] as const;

/**
 * Reversible integration controls.
 * Defaults keep street off the live directory contract and do not replace rows.
 */
export type OregonTier1StreetIntegrationControls = {
  streetIntegrationPrepared: boolean;
  streetIntegrationActivated: boolean;
  directoryRowReplacementAuthorized: boolean;
  oregonPublished: boolean;
  mapEnabled: boolean;
  supabaseWrites: boolean;
  geocodingEnabled: boolean;
};

export const OREGON_TIER1_STREET_INTEGRATION_DEFAULT_CONTROLS: OregonTier1StreetIntegrationControls =
  {
    streetIntegrationPrepared: true,
    streetIntegrationActivated: false,
    directoryRowReplacementAuthorized: false,
    oregonPublished: false,
    mapEnabled: false,
    supabaseWrites: false,
    geocodingEnabled: false,
  };

/** Rollback snapshot — identical to defaults (integration never activated). */
export const OREGON_TIER1_STREET_INTEGRATION_ROLLBACK_CONTROLS: OregonTier1StreetIntegrationControls =
  {
    streetIntegrationPrepared: true,
    streetIntegrationActivated: false,
    directoryRowReplacementAuthorized: false,
    oregonPublished: false,
    mapEnabled: false,
    supabaseWrites: false,
    geocodingEnabled: false,
  };

export function activateOregonTier1StreetIntegration(
  controls: OregonTier1StreetIntegrationControls = OREGON_TIER1_STREET_INTEGRATION_DEFAULT_CONTROLS,
): OregonTier1StreetIntegrationControls {
  return {
    ...controls,
    streetIntegrationPrepared: true,
    streetIntegrationActivated: true,
    // Hard stops — never flipped by this helper.
    directoryRowReplacementAuthorized: false,
    oregonPublished: false,
    mapEnabled: false,
    supabaseWrites: false,
    geocodingEnabled: false,
  };
}

export function rollbackOregonTier1StreetIntegration(): OregonTier1StreetIntegrationControls {
  return { ...OREGON_TIER1_STREET_INTEGRATION_ROLLBACK_CONTROLS };
}

export function oregonTier1StreetFieldsForControls(
  controls: OregonTier1StreetIntegrationControls = OREGON_TIER1_STREET_INTEGRATION_DEFAULT_CONTROLS,
) {
  return controls.streetIntegrationActivated
    ? OREGON_TIER1_STREET_INTEGRATION_PREPARED_FIELDS
    : OREGON_TIER1_STREET_INTEGRATION_CURRENT_FIELDS;
}

export const OREGON_TIER1_STREET_INTEGRATION_BLOCKERS = [
  "authoritative-export-freshness-unresolved-pending-odhs-confirmation",
  "street-integration-prepared-but-not-activated",
  "directory-row-replacement-not-authorized",
  "prior-directory-1584-source-id-dump-unavailable-offline",
  "state-authorization-development-only",
  "map-disabled-separate-from-directory",
] as const;

export type OregonTier1StreetIntegrationVerdict = {
  stopGo: "STOP";
  streetIntegrationPrepared: true;
  streetIntegrationActivated: false;
  directoryRowsReplaced: false;
  oregonPublished: false;
  qualifyingWithStreet: 1579;
  priorDirectoryAccepted: 1584;
  netDelta: -5;
  csvExcelParity: true;
  freshnessUnresolved: true;
  blockers: typeof OREGON_TIER1_STREET_INTEGRATION_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function oregonTier1StreetIntegrationVerdict(): OregonTier1StreetIntegrationVerdict {
  return {
    stopGo: "STOP",
    streetIntegrationPrepared: true,
    streetIntegrationActivated: false,
    directoryRowsReplaced: false,
    oregonPublished: false,
    qualifyingWithStreet: 1579,
    priorDirectoryAccepted: 1584,
    netDelta: -5,
    csvExcelParity: true,
    freshnessUnresolved: true,
    blockers: OREGON_TIER1_STREET_INTEGRATION_BLOCKERS,
    nextHumanActions: [
      "Confirm ODHS authoritative export freshness policy (do not invent ISO dates).",
      "Provide or authorize a development read of the stored 1,584 source_id list for full exact-ID residual reconciliation.",
      "Authorize streetIntegrationActivated only after freshness + residual ID reconciliation clear.",
      "Keep directory row replacement and public Oregon publication as separate approvals.",
    ],
  };
}

export function oregonTier1StreetIntegrationReadyForActivation(): false {
  return false;
}

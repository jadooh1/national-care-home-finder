/**
 * Oregon Tier 1 — exact source_id reconciliation: prior directory 1,584 vs
 * latest qualifying capture 1,579.
 *
 * Authorized read-only development DB comparison closed the residual:
 * retained 1,572 / removed 12 / added 7 / net −5. Removals and additions are
 * classified from the official 2026-11-26 ODHS Provider Export.
 *
 * No Supabase writes. Street integration and Oregon publication remain off.
 * Intentionally free of sibling runtime imports.
 */

export const OREGON_ID_RECONCILIATION_BASELINE = "8b9fe10" as const;
export const OREGON_ID_RECONCILIATION_OBSERVED_ON = "2026-11-26" as const;

/** Prior published/accepted directory count (development store). */
export const OREGON_PRIOR_DIRECTORY_ACCEPTED = 1584 as const;

/** Latest dual-format qualifying Open AFH accepted count. */
export const OREGON_LATEST_QUALIFYING_ACCEPTED = 1579 as const;

export const OREGON_RECONCILIATION_RETAINED = 1572 as const;
export const OREGON_RECONCILIATION_REMOVED_COUNT = 12 as const;
export const OREGON_RECONCILIATION_ADDED_COUNT = 7 as const;
export const OREGON_RECONCILIATION_NET_DELTA = -5 as const;

/**
 * Verified exact removals (prior directory ∩̸ latest qualifying).
 * Classified from ODHS 2026-11-26 export current Type/Status/Licensed beds.
 */
export const OREGON_VERIFIED_REMOVED_SOURCE_IDS = [
  "0000000196",
  "0000000199",
  "0000000425",
  "11419",
  "11495",
  "11569",
  "515716",
  "5169225761",
  "522195",
  "523278",
  "528272",
  "566448",
] as const;

export const OREGON_VERIFIED_REMOVED_DETAILS = [
  {
    sourceId: "0000000196",
    classification: "closed-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Closed" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "0000000199",
    classification: "closed-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Closed" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "0000000425",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "11419",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "11495",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "11569",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "515716",
    classification: "closed-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Closed" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "5169225761",
    classification: "closed-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Closed" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "522195",
    classification: "closed-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Closed" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "523278",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "528272",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "566448",
    classification: "open-zero-beds" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
] as const;

/** Verified exact additions (latest qualifying ∖ prior directory). */
export const OREGON_VERIFIED_ADDED_SOURCE_IDS = [
  "0000000408",
  "0000000708",
  "0000000713",
  "0000000731",
  "0000000733",
  "11561",
  "8001946102",
] as const;

export const OREGON_VERIFIED_ADDED_DETAILS = [
  {
    sourceId: "0000000408",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "4" as const,
  },
  {
    sourceId: "0000000708",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "5" as const,
  },
  {
    sourceId: "0000000713",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "5" as const,
  },
  {
    sourceId: "0000000731",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "5" as const,
  },
  {
    sourceId: "0000000733",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "4" as const,
  },
  {
    sourceId: "11561",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "4" as const,
  },
  {
    sourceId: "8001946102",
    classification: "newly-qualifying-open-afh" as const,
    licenseType: "AFH" as const,
    status: "Open" as const,
    licensedBeds: "5" as const,
  },
] as const;

export const OREGON_VERIFIED_REMOVAL_CLASSIFICATION_COUNTS = {
  closedZeroBeds: 5 as const,
  openZeroBeds: 7 as const,
  total: 12 as const,
} as const;

/**
 * Verified exact-ID ledger from authorized development DB read + ODHS export.
 * Replaces prior reconstructed residual arithmetic (1581 / unresolved 3).
 */
export const OREGON_VERIFIED_EXACT_RECONCILIATION = {
  priorDirectoryAccepted: 1584 as const,
  latestQualifyingAccepted: 1579 as const,
  retained: 1572 as const,
  removed: 12 as const,
  added: 7 as const,
  netDelta: -5 as const,
  priorDirectoryIdDumpAvailable: true as const,
  residualUnresolvedExactIdCount: 0 as const,
  checksumOk: true as const, // 1584 − 12 = 1572; 1572 + 7 = 1579; 1579 − 1584 = −5
} as const;

/** @deprecated Historical Nov 13 ledger — superseded by OREGON_VERIFIED_* sets. */
export const OREGON_LEAVE13_SOURCE_IDS = [
  "0000000196",
  "0000000425",
  "11419",
  "11495",
  "11569",
  "528272",
  "566448",
] as const;

/** @deprecated Historical Nov 13 ledger — superseded by OREGON_VERIFIED_ADDED_*. */
export const OREGON_NEW13_SOURCE_IDS = [
  "0000000408",
  "0000000708",
  "0000000731",
  "0000000733",
  "8001946102",
] as const;

export type OregonRosterIdReconciliationSummary = {
  observedOn: string;
  baseline: string;
  priorDirectoryAccepted: 1584;
  latestQualifyingAccepted: 1579;
  retained: 1572;
  removed: 12;
  added: 7;
  netDelta: -5;
  csvExcelAcceptedParity: true;
  streetPresent: 1579;
  streetBlank: 0;
  removedIds: typeof OREGON_VERIFIED_REMOVED_SOURCE_IDS;
  removedDetails: typeof OREGON_VERIFIED_REMOVED_DETAILS;
  addedIds: typeof OREGON_VERIFIED_ADDED_SOURCE_IDS;
  addedDetails: typeof OREGON_VERIFIED_ADDED_DETAILS;
  removalClassificationCounts: typeof OREGON_VERIFIED_REMOVAL_CLASSIFICATION_COUNTS;
  verified: typeof OREGON_VERIFIED_EXACT_RECONCILIATION;
  priorDirectoryIdDumpAvailable: true;
  residualUnresolvedExactIdCount: 0;
  freshnessUnresolvedPendingOdhsConfirmation: true;
  recordedExportDateIso: null;
  streetIntegrationActivated: false;
  directoryRowsReplaced: false;
  oregonPublished: false;
  stopGo: "STOP";
};

export function oregonRosterIdReconciliationSummary(
  observedOn = OREGON_ID_RECONCILIATION_OBSERVED_ON,
): OregonRosterIdReconciliationSummary {
  return {
    observedOn,
    baseline: OREGON_ID_RECONCILIATION_BASELINE,
    priorDirectoryAccepted: OREGON_PRIOR_DIRECTORY_ACCEPTED,
    latestQualifyingAccepted: OREGON_LATEST_QUALIFYING_ACCEPTED,
    retained: OREGON_RECONCILIATION_RETAINED,
    removed: OREGON_RECONCILIATION_REMOVED_COUNT,
    added: OREGON_RECONCILIATION_ADDED_COUNT,
    netDelta: OREGON_RECONCILIATION_NET_DELTA,
    csvExcelAcceptedParity: true,
    streetPresent: 1579,
    streetBlank: 0,
    removedIds: OREGON_VERIFIED_REMOVED_SOURCE_IDS,
    removedDetails: OREGON_VERIFIED_REMOVED_DETAILS,
    addedIds: OREGON_VERIFIED_ADDED_SOURCE_IDS,
    addedDetails: OREGON_VERIFIED_ADDED_DETAILS,
    removalClassificationCounts: OREGON_VERIFIED_REMOVAL_CLASSIFICATION_COUNTS,
    verified: OREGON_VERIFIED_EXACT_RECONCILIATION,
    priorDirectoryIdDumpAvailable: true,
    residualUnresolvedExactIdCount: 0,
    freshnessUnresolvedPendingOdhsConfirmation: true,
    recordedExportDateIso: null,
    streetIntegrationActivated: false,
    directoryRowsReplaced: false,
    oregonPublished: false,
    stopGo: "STOP",
  };
}

/**
 * Exact-ID set operations against a provided prior dump.
 */
export function reconcileOregonExactSourceIds(args: {
  priorSourceIds: readonly string[];
  latestQualifyingSourceIds: readonly string[];
}): {
  removed: string[];
  added: string[];
  retained: string[];
  priorCount: number;
  latestCount: number;
  netDelta: number;
} {
  const prior = new Set(args.priorSourceIds.map(String));
  const latest = new Set(args.latestQualifyingSourceIds.map(String));
  const removed: string[] = [];
  const added: string[] = [];
  const retained: string[] = [];
  for (const id of prior) {
    if (latest.has(id)) retained.push(id);
    else removed.push(id);
  }
  for (const id of latest) {
    if (!prior.has(id)) added.push(id);
  }
  removed.sort();
  added.sort();
  retained.sort();
  return {
    removed,
    added,
    retained,
    priorCount: prior.size,
    latestCount: latest.size,
    netDelta: latest.size - prior.size,
  };
}

/** Checksum: prior − removed = retained; retained + added = latest; net = latest − prior. */
export function oregonVerifiedReconciliationChecksumOk(
  verified = OREGON_VERIFIED_EXACT_RECONCILIATION,
): boolean {
  return (
    verified.priorDirectoryAccepted - verified.removed === verified.retained
    && verified.retained + verified.added === verified.latestQualifyingAccepted
    && verified.latestQualifyingAccepted - verified.priorDirectoryAccepted === verified.netDelta
    && verified.removed === OREGON_VERIFIED_REMOVED_SOURCE_IDS.length
    && verified.added === OREGON_VERIFIED_ADDED_SOURCE_IDS.length
    && verified.residualUnresolvedExactIdCount === 0
  );
}

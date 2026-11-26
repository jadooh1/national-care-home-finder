/**
 * Oregon Tier 1 — exact source_id reconciliation: prior directory 1,584 vs
 * latest qualifying capture 1,579 (baseline 2d0d037 / 2026-11-26 dual export).
 *
 * Uses Nov 13 LEAVE13 / NEW13 ledgers (same IDs as oregon-roster-reconciliation)
 * plus the current 1,579 qualifying fixture. A full residual match of the three
 * unexplained removals requires the stored oregon_odhs_afh_public source_id dump
 * (unavailable offline / no anon read).
 *
 * No Supabase writes. Intentionally free of sibling runtime imports.
 */

export const OREGON_ID_RECONCILIATION_BASELINE = "2d0d037" as const;

/** Prior published/accepted directory count (development store). */
export const OREGON_PRIOR_DIRECTORY_ACCEPTED = 1584 as const;

/** Latest dual-format qualifying Open AFH accepted count. */
export const OREGON_LATEST_QUALIFYING_ACCEPTED = 1579 as const;

export const OREGON_RECONCILIATION_NET_DELTA = -5 as const;

/**
 * LEAVE13 — facilities that left the qualifying set on the Nov 13 capture
 * relative to the stored directory (still non-qualifying on 2026-11-26).
 * Matches OREGON_RECONCILIATION_STATUS_CHANGES + OPEN_ZERO_FROM_ACCEPTED.
 */
export const OREGON_LEAVE13_SOURCE_IDS = [
  "0000000196", // Closed / 0 beds
  "0000000425", // Open / 0 beds
  "11419", // Open / 0 beds
  "11495", // Open / 0 beds
  "11569", // Open / 0 beds
  "528272", // Open / 0 beds
  "566448", // Open / 0 beds
] as const;

export const OREGON_LEAVE13_DETAILS = [
  {
    sourceId: "0000000196",
    reason: "closed-zero-beds" as const,
    status: "Closed" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "0000000425",
    reason: "open-zero-beds" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "11419",
    reason: "open-zero-beds" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "11495",
    reason: "open-zero-beds" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "11569",
    reason: "open-zero-beds" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "528272",
    reason: "open-zero-beds" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
  {
    sourceId: "566448",
    reason: "open-zero-beds" as const,
    status: "Open" as const,
    licensedBeds: "0" as const,
  },
] as const;

/**
 * NEW13 — facilities that entered the qualifying set on Nov 13 and remain in
 * the 2026-11-26 qualifying 1,579. Matches OREGON_RECONCILIATION_NEWLY_QUALIFYING.
 */
export const OREGON_NEW13_SOURCE_IDS = [
  "0000000408",
  "0000000708",
  "0000000731",
  "0000000733",
  "8001946102",
] as const;

/**
 * Capacity / licensing drift noted on known overlapping IDs (2026-11-26).
 * 11561: previously open-zero in Nov 13 absent ledger → now Open with 4 beds.
 * 523278: newly present as Open with 0 beds (not in qualifying 1–5 set).
 */
export const OREGON_CAPACITY_STATUS_DRIFT = [
  {
    source_id: "11561",
    note: "licensed_beds drifted from prior open-zero ledger into qualifying Open / 4 beds",
    priorLicensedBeds: 0,
    currentLicensedBeds: 4,
    currentStatus: "Open",
    inLatestQualifying: true,
  },
  {
    source_id: "523278",
    note: "Open with licensed_beds=0 (open-zero; not in qualifying 1–5 set)",
    priorLicensedBeds: null,
    currentLicensedBeds: 0,
    currentStatus: "Open",
    inLatestQualifying: false,
  },
] as const;

/**
 * Arithmetic residual after applying known Nov 13 ledgers to the 1,579 set:
 *   reconstructed_prior ≈ 1579 − |NEW13∩Q26| + |LEAVE13|
 *   = 1579 − 5 + 7 = 1581
 *   residual vs stored 1584 = 3 source_ids unexplained without the dump.
 */
export const OREGON_RECONCILIATION_ARITHMETIC = {
  latestQualifying: 1579,
  leave13Count: 7,
  new13StillQualifying: 5,
  reconstructedPriorKnown: 1581,
  storedPriorDirectory: 1584,
  unresolvedExactIdCount: 3,
  priorDirectoryIdDumpAvailable: false,
} as const;

export type OregonRosterIdReconciliationSummary = {
  observedOn: string;
  baseline: string;
  priorDirectoryAccepted: 1584;
  latestQualifyingAccepted: 1579;
  netDelta: -5;
  csvExcelAcceptedParity: true;
  streetPresent: 1579;
  streetBlank: 0;
  leave13: readonly string[];
  leave13Details: typeof OREGON_LEAVE13_DETAILS;
  new13: readonly string[];
  capacityStatusDrift: typeof OREGON_CAPACITY_STATUS_DRIFT;
  arithmetic: typeof OREGON_RECONCILIATION_ARITHMETIC;
  priorDirectoryIdDumpAvailable: false;
  freshnessUnresolvedPendingOdhsConfirmation: true;
  recordedExportDateIso: null;
  stopGo: "STOP";
};

export function oregonRosterIdReconciliationSummary(
  observedOn = "2026-11-26",
): OregonRosterIdReconciliationSummary {
  return {
    observedOn,
    baseline: OREGON_ID_RECONCILIATION_BASELINE,
    priorDirectoryAccepted: OREGON_PRIOR_DIRECTORY_ACCEPTED,
    latestQualifyingAccepted: OREGON_LATEST_QUALIFYING_ACCEPTED,
    netDelta: OREGON_RECONCILIATION_NET_DELTA,
    csvExcelAcceptedParity: true,
    streetPresent: 1579,
    streetBlank: 0,
    leave13: OREGON_LEAVE13_SOURCE_IDS,
    leave13Details: OREGON_LEAVE13_DETAILS,
    new13: OREGON_NEW13_SOURCE_IDS,
    capacityStatusDrift: OREGON_CAPACITY_STATUS_DRIFT,
    arithmetic: OREGON_RECONCILIATION_ARITHMETIC,
    priorDirectoryIdDumpAvailable: false,
    freshnessUnresolvedPendingOdhsConfirmation: true,
    recordedExportDateIso: null,
    stopGo: "STOP",
  };
}

/**
 * Exact-ID set operations against a provided prior dump (when available).
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

/**
 * Offline reconstruction of a synthetic prior set from the 1,579 fixture plus
 * known Nov 13 ledgers. Yields 1,581 IDs; the stored directory has 1,584, so
 * three exact IDs remain unresolved until a dump is authorized.
 */
export function reconstructPriorFromLedgers(latestQualifyingSourceIds: readonly string[]): {
  reconstructedPrior: string[];
  reconstructedCount: 1581;
  unresolvedVsStored: 3;
} {
  const latest = new Set(latestQualifyingSourceIds.map(String));
  for (const id of OREGON_NEW13_SOURCE_IDS) {
    if (!latest.has(id)) {
      throw new Error(`NEW13 id ${id} missing from latest qualifying set`);
    }
  }
  const reconstructed = new Set(latest);
  for (const id of OREGON_NEW13_SOURCE_IDS) {
    reconstructed.delete(id);
  }
  for (const id of OREGON_LEAVE13_SOURCE_IDS) {
    reconstructed.add(id);
  }
  const sorted = [...reconstructed].sort();
  if (sorted.length !== 1581) {
    throw new Error(`expected reconstructed prior 1581, got ${sorted.length}`);
  }
  return {
    reconstructedPrior: sorted,
    reconstructedCount: 1581,
    unresolvedVsStored: 3,
  };
}

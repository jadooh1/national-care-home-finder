export const OREGON_RECONCILIATION_EXPORT_BYTES = 686812;
export const OREGON_RECONCILIATION_EXPORT_SHA256 = "604cd4270f23c016ff4007dba6b5702fd2ade659005008d9155beb02c8c37cda";
export const OREGON_RECONCILIATION_EXPORT_DATE = null;
export const OREGON_RECONCILIATION_DIRECTORY_ROWS = 1584;
export const OREGON_RECONCILIATION_BOTH = 1584;
export const OREGON_RECONCILIATION_LATEST_QUALIFYING = 1582;
export const OREGON_RECONCILIATION_STILL_QUALIFYING = 1577;
export const OREGON_RECONCILIATION_PATTERN_MISMATCHES = 3;

export const OREGON_RECONCILIATION_MISSING: readonly string[] = [];
export const OREGON_RECONCILIATION_DUPLICATE_IDS: readonly string[] = [];
export const OREGON_RECONCILIATION_INCONSISTENT_IDS: readonly string[] = [];

export const OREGON_RECONCILIATION_NEWLY_QUALIFYING = [
  { sourceId: "0000000408", licensedBeds: "4" },
  { sourceId: "0000000708", licensedBeds: "5" },
  { sourceId: "0000000731", licensedBeds: "5" },
  { sourceId: "0000000733", licensedBeds: "4" },
  { sourceId: "8001946102", licensedBeds: "5" },
] as const;

export const OREGON_RECONCILIATION_STATUS_CHANGES = [
  { sourceId: "0000000196", fromStatus: "Open", toStatus: "Closed", fromBeds: "4", toBeds: "0" },
] as const;

export const OREGON_RECONCILIATION_CAPACITY_CHANGES = [
  { sourceId: "0000000196", fromBeds: "4", toBeds: "0", latestStatus: "Closed" },
  { sourceId: "0000000425", fromBeds: "5", toBeds: "0", latestStatus: "Open" },
  { sourceId: "11419", fromBeds: "5", toBeds: "0", latestStatus: "Open" },
  { sourceId: "11495", fromBeds: "5", toBeds: "0", latestStatus: "Open" },
  { sourceId: "11548", fromBeds: "3", toBeds: "5", latestStatus: "Open" },
  { sourceId: "11569", fromBeds: "4", toBeds: "0", latestStatus: "Open" },
  { sourceId: "3539207808", fromBeds: "5", toBeds: "4", latestStatus: "Open" },
  { sourceId: "528272", fromBeds: "3", toBeds: "0", latestStatus: "Open" },
  { sourceId: "566448", fromBeds: "4", toBeds: "0", latestStatus: "Open" },
] as const;

export const OREGON_RECONCILIATION_OPEN_ZERO_FROM_ACCEPTED = [
  "0000000425",
  "11419",
  "11495",
  "11569",
  "528272",
  "566448",
] as const;

export const OREGON_RECONCILIATION_OPEN_ZERO_ABSENT = [
  "000000",
  "0000000409",
  "10587",
  "11556",
  "11561",
  "11565",
  "502387",
  "509882",
  "522543",
  "524037",
  "527722",
  "528283",
  "529483",
  "6287256704",
  "7392968117",
  "7642079071",
  "7717640833",
  "AF273488",
] as const;

const SOURCE_ID_PATTERN = /^[A-Za-z0-9]{1,32}$/;

export type LatestProviderIdentity = {
  sourceId: string;
  licenseType: string;
  status: string;
  licensedBeds: string;
};

export type StoredProviderIdentity = {
  sourceId: string;
  status: string;
  licensedBeds: number;
};

export function oregonProviderQualifies(provider: LatestProviderIdentity): boolean {
  return provider.licenseType === "AFH"
    && provider.status === "Open"
    && SOURCE_ID_PATTERN.test(provider.sourceId)
    && /^[1-5]$/.test(provider.licensedBeds);
}

export function reconcileOregonProviders(stored: readonly StoredProviderIdentity[], latest: readonly LatestProviderIdentity[]) {
  const latestById = new Map<string, LatestProviderIdentity[]>();
  for (const provider of latest) {
    const group = latestById.get(provider.sourceId) ?? [];
    group.push(provider);
    latestById.set(provider.sourceId, group);
  }
  const duplicateSourceIds = [...latestById.entries()].filter(([, group]) => group.length > 1).map(([sourceId]) => sourceId);
  const inconsistentSourceIds = duplicateSourceIds.filter(sourceId => {
    const group = latestById.get(sourceId) ?? [];
    return group.some(provider => provider.licenseType !== group[0].licenseType || provider.status !== group[0].status || provider.licensedBeds !== group[0].licensedBeds);
  });
  const storedById = new Map(stored.map(provider => [provider.sourceId, provider]));
  const missingFromLatest = [...storedById.keys()].filter(sourceId => !latestById.has(sourceId)).sort();
  const singleLatest = new Map([...latestById.entries()].filter(([, group]) => group.length === 1).map(([sourceId, group]) => [sourceId, group[0]]));
  const statusChanges = [];
  const capacityChanges = [];
  for (const [sourceId, previous] of storedById) {
    const current = singleLatest.get(sourceId);
    if (!current) continue;
    if (current.status !== previous.status) {
      statusChanges.push({ sourceId, fromStatus: previous.status, toStatus: current.status, fromBeds: String(previous.licensedBeds), toBeds: current.licensedBeds });
    }
    if (current.licensedBeds !== String(previous.licensedBeds)) {
      capacityChanges.push({ sourceId, fromBeds: String(previous.licensedBeds), toBeds: current.licensedBeds, latestStatus: current.status });
    }
  }
  const newlyQualifying = [...singleLatest.values()].filter(provider => oregonProviderQualifies(provider) && !storedById.has(provider.sourceId)).map(provider => provider.sourceId).sort();
  const acceptedNowOpenZeroBed = capacityChanges.filter(change => change.toBeds === "0" && change.latestStatus === "Open").map(change => change.sourceId);
  const openZeroBedAbsent = [...singleLatest.values()].filter(provider => provider.licenseType === "AFH" && provider.status === "Open" && provider.licensedBeds === "0" && !storedById.has(provider.sourceId)).map(provider => provider.sourceId).sort();
  return {
    recordsChanged: false as const,
    exportDateAdopted: false as const,
    both: [...storedById.keys()].filter(sourceId => latestById.has(sourceId)).length,
    missingFromLatest,
    newlyQualifying,
    statusChanges,
    capacityChanges,
    acceptedNowOpenZeroBed,
    openZeroBedAbsent,
    duplicateSourceIds,
    inconsistentSourceIds,
  };
}

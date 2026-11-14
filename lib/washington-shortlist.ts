export const WASHINGTON_SHORTLIST_LIMIT = 3;
export const WASHINGTON_SHORTLIST_STORAGE_KEY = "nchf.washington.facility-shortlist";

export type WashingtonShortlistItem = {
  license: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  county: string | null;
  stateCode: string | null;
  postalCode: string | null;
  licensedCapacity: number | null;
  recordStatus: "verified" | "unverified";
};

type ShortlistStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
  return text || null;
}

export function washingtonShortlistItem(input: {
  license?: string | null;
  name?: string | null;
  addressLine?: string | null;
  city?: string | null;
  county?: string | null;
  stateCode?: string | null;
  postalCode?: string | null;
  licensedCapacity?: number | null;
  recordStatus?: string | null;
}): WashingtonShortlistItem | null {
  const license = input.license?.trim() ?? "";
  if (!/^\d{1,20}$/.test(license)) return null;
  const name = cleanText(input.name, 200);
  if (!name) return null;
  const capacity = input.licensedCapacity;
  const licensedCapacity = typeof capacity === "number" && Number.isInteger(capacity) && capacity >= 0 && capacity <= 999
    ? capacity
    : null;
  return {
    license,
    name,
    addressLine: cleanText(input.addressLine, 200),
    city: cleanText(input.city, 80),
    county: cleanText(input.county, 80),
    stateCode: cleanText(input.stateCode, 8),
    postalCode: cleanText(input.postalCode, 12),
    licensedCapacity,
    recordStatus: input.recordStatus === "verified" ? "verified" : "unverified",
  };
}

export function addWashingtonShortlist(
  items: readonly WashingtonShortlistItem[],
  candidate: WashingtonShortlistItem | null,
): { items: WashingtonShortlistItem[]; status: "added" | "present" | "full" | "invalid" } {
  if (!candidate) return { items: [...items], status: "invalid" };
  if (items.some(item => item.license === candidate.license)) return { items: [...items], status: "present" };
  if (items.length >= WASHINGTON_SHORTLIST_LIMIT) return { items: [...items], status: "full" };
  return { items: [...items, candidate], status: "added" };
}

export function removeWashingtonShortlist(items: readonly WashingtonShortlistItem[], license: string): WashingtonShortlistItem[] {
  return items.filter(item => item.license !== license);
}

export function readWashingtonShortlist(storage: ShortlistStorage | null | undefined): WashingtonShortlistItem[] {
  if (!storage) return [];
  const raw = storage.getItem(WASHINGTON_SHORTLIST_STORAGE_KEY);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const items: WashingtonShortlistItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const item = washingtonShortlistItem({
      license: typeof record.license === "string" ? record.license : null,
      name: typeof record.name === "string" ? record.name : null,
      addressLine: typeof record.addressLine === "string" ? record.addressLine : null,
      city: typeof record.city === "string" ? record.city : null,
      county: typeof record.county === "string" ? record.county : null,
      stateCode: typeof record.stateCode === "string" ? record.stateCode : null,
      postalCode: typeof record.postalCode === "string" ? record.postalCode : null,
      licensedCapacity: typeof record.licensedCapacity === "number" ? record.licensedCapacity : null,
      recordStatus: typeof record.recordStatus === "string" ? record.recordStatus : null,
    });
    if (!item || items.some(existing => existing.license === item.license)) continue;
    items.push(item);
    if (items.length === WASHINGTON_SHORTLIST_LIMIT) break;
  }
  return items;
}

export function writeWashingtonShortlist(storage: ShortlistStorage | null | undefined, items: readonly WashingtonShortlistItem[]): void {
  if (!storage) return;
  const safe = items
    .map(item => washingtonShortlistItem(item))
    .filter((item): item is WashingtonShortlistItem => item !== null)
    .filter((item, index, list) => list.findIndex(existing => existing.license === item.license) === index)
    .slice(0, WASHINGTON_SHORTLIST_LIMIT);
  if (safe.length === 0) storage.removeItem(WASHINGTON_SHORTLIST_STORAGE_KEY);
  else storage.setItem(WASHINGTON_SHORTLIST_STORAGE_KEY, JSON.stringify(safe));
}

export const ENABLED_OWNER_FACILITY_STATES = ["WA"] as const;
export const OWNER_FACILITY_SOURCE = "wa_dshs_listed_facilities";
export const OWNER_FACILITY_COLUMNS = "id,canonical_name,address_line1,city,county,license_number";
export const OWNER_LISTING_FACILITY_COLUMNS = "id,canonical_name,license_number";

export type OwnerFacilityRecord = {
  id: string;
  canonical_name: string;
  address_line1?: string | null;
  city?: string | null;
  county?: string | null;
  license_number: string | null;
};

type FacilityQuery = {
  data: OwnerFacilityRecord[] | null;
  error: { message: string } | null;
};

type SelectedFacilities = {
  in(column: "id", ids: readonly string[]): PromiseLike<FacilityQuery>;
  or(filters: string): {
    order(column: "canonical_name", options: { ascending: boolean }): {
      limit(count: number): PromiseLike<FacilityQuery>;
    };
  };
};

export type OwnerFacilityClient = {
  from(source: string): {
    select(columns: string): SelectedFacilities;
  };
};

export type ManagedFacilityRead = {
  failed: boolean;
  facilities: OwnerFacilityRecord[];
  missingIds: string[];
};

export function managedOwnerFacilityIds(requestedIds: readonly string[], authorizedIds: readonly string[]): string[] {
  const allowed = new Set(authorizedIds);
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of requestedIds) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function ownerFacilitySearchFilter(term: string): string {
  const pattern = `"%${term}%"`;
  return `canonical_name.ilike.${pattern},license_number.ilike.${pattern},city.ilike.${pattern}`;
}

export async function readManagedOwnerFacilities(
  client: OwnerFacilityClient,
  input: { requestedIds: readonly string[]; authorizedIds: readonly string[]; columns: string },
): Promise<ManagedFacilityRead> {
  const ids = managedOwnerFacilityIds(input.requestedIds, input.authorizedIds);
  if (ids.length === 0) return { failed: false, facilities: [], missingIds: [] };
  let result: FacilityQuery;
  try {
    result = await client.from(OWNER_FACILITY_SOURCE).select(input.columns).in("id", ids);
  } catch {
    return { failed: true, facilities: [], missingIds: ids };
  }
  if (result.error) return { failed: true, facilities: [], missingIds: ids };
  const allowed = new Set(ids);
  const facilities = (result.data ?? []).filter(row => allowed.has(row.id));
  const found = new Set(facilities.map(row => row.id));
  return {
    failed: false,
    facilities,
    missingIds: ids.filter(id => !found.has(id)),
  };
}

export async function searchOwnerFacilities(
  client: OwnerFacilityClient,
  input: { columns: string; term: string },
): Promise<FacilityQuery> {
  return client.from(OWNER_FACILITY_SOURCE).select(input.columns).or(ownerFacilitySearchFilter(input.term)).order("canonical_name", { ascending: true }).limit(15);
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ENABLED_OWNER_FACILITY_STATES,
  OWNER_FACILITY_SOURCE,
  managedOwnerFacilityIds,
  ownerFacilitySearchFilter,
  readManagedOwnerFacilities,
  searchOwnerFacilities,
  type OwnerFacilityClient,
  type OwnerFacilityRecord,
} from "../../../lib/owner-facility-read.ts";

const approved = "00000000-0000-4000-8000-000000000101";
const other = "00000000-0000-4000-8000-000000000104";
const missing = "00000000-0000-4000-8000-000000000105";

function facility(id: string): OwnerFacilityRecord {
  return { id, canonical_name: "Listed home", license_number: "100001", city: "Kent", county: "King", address_line1: "1 Street" };
}

function client(result: { data: OwnerFacilityRecord[] | null; error: { message: string } | null }, calls: string[]): OwnerFacilityClient {
  return {
    from(source) {
      calls.push(source);
      return {
        select() {
          return {
            in() {
              return Promise.resolve(result);
            },
            or(filters) {
              calls.push(filters);
              return {
                order() {
                  return { limit: () => Promise.resolve(result) };
                },
              };
            },
          };
        },
      };
    },
  };
}

test("an approved owner reads only the requested Washington facilities", async () => {
  const calls: string[] = [];
  const read = await readManagedOwnerFacilities(client({ data: [facility(approved), facility(other)], error: null }, calls), {
    requestedIds: [approved, approved],
    authorizedIds: [approved],
    columns: "id,canonical_name,license_number",
  });
  assert.deepEqual(ENABLED_OWNER_FACILITY_STATES, ["WA"]);
  assert.equal(OWNER_FACILITY_SOURCE, "wa_dshs_listed_facilities");
  assert.deepEqual(calls, [OWNER_FACILITY_SOURCE]);
  assert.equal(read.failed, false);
  assert.deepEqual(read.facilities.map(row => row.id), [approved]);
  assert.deepEqual(read.missingIds, []);
});

test("an unapproved owner and an unauthorized facility id return no official record", async () => {
  const calls: string[] = [];
  const unapproved = await readManagedOwnerFacilities(client({ data: [facility(approved)], error: null }, calls), {
    requestedIds: [approved],
    authorizedIds: [],
    columns: "id,canonical_name,license_number",
  });
  const unauthorized = managedOwnerFacilityIds([approved, other], [approved]);
  assert.deepEqual(calls, []);
  assert.equal(unapproved.failed, false);
  assert.deepEqual(unapproved.facilities, []);
  assert.deepEqual(unapproved.missingIds, []);
  assert.deepEqual(unauthorized, [approved]);
});

test("missing official data stays distinct from a failed facility read", async () => {
  const missingRead = await readManagedOwnerFacilities(client({ data: [], error: null }, []), {
    requestedIds: [missing],
    authorizedIds: [missing],
    columns: "id,canonical_name,license_number",
  });
  const failed = await readManagedOwnerFacilities(client({ data: null, error: { message: "permission denied" } }, []), {
    requestedIds: [approved],
    authorizedIds: [approved],
    columns: "id,canonical_name,license_number",
  });
  const thrown = await readManagedOwnerFacilities({
    from() {
      return { select: () => { throw new Error("network"); } };
    },
  }, {
    requestedIds: [approved],
    authorizedIds: [approved],
    columns: "id,canonical_name,license_number",
  });
  assert.equal(missingRead.failed, false);
  assert.deepEqual(missingRead.missingIds, [missing]);
  assert.equal(failed.failed, true);
  assert.deepEqual(failed.facilities, []);
  assert.equal(thrown.failed, true);
  assert.deepEqual(thrown.missingIds, [approved]);
});

test("owner search stays on the Washington listing and the owner pages keep their current controls", async () => {
  const calls: string[] = [];
  const found = await searchOwnerFacilities(client({ data: [facility(approved)], error: null }, calls), {
    columns: "id,canonical_name,address_line1,city,county,license_number",
    term: "Kent",
  });
  assert.deepEqual(calls, [OWNER_FACILITY_SOURCE, ownerFacilitySearchFilter("Kent")]);
  assert.equal(found.error, null);
  assert.equal(found.data?.[0].id, approved);
  const dashboard = readFileSync(new URL("../../../app/owner/dashboard/page.tsx", import.meta.url), "utf8");
  const listing = readFileSync(new URL("../../../app/owner/listing-edits/page.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../../app/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /readManagedOwnerFacilities\(supabase as unknown as OwnerFacilityClient/);
  assert.match(dashboard, /searchOwnerFacilities\(supabase as unknown as OwnerFacilityClient/);
  assert.match(dashboard, /href="\/washington"/);
  assert.match(listing, /readManagedOwnerFacilities\(supabase as unknown as OwnerFacilityClient/);
  assert.match(listing, /manageableOwnerContentView\(process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(listing, /published\.length === 0 && !error/);
  assert.doesNotMatch(dashboard, /oregon|california|wa_afh_published_owner_content/i);
  assert.doesNotMatch(listing, /oregon|california|wa_afh_published_owner_content/i);
  assert.match(home, /Find the right care home for your loved one\./);
  assert.match(page, /\{t\.heading\}/);
});

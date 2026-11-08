import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

export function publicFacilityVisible(row: { recordStatus: string; presence: string | null }): boolean {
  const listed = row.recordStatus === "source_matched" || row.recordStatus === "verified";
  return listed && row.presence !== "absent";
}

export function newClaimAllowed(row: { recordStatus: string; presence: string | null }): boolean {
  return row.recordStatus === "source_matched" && row.presence !== "absent";
}

test("archived facilities stay stored but are not publicly visible or newly claimable", () => {
  assert.equal(publicFacilityVisible({ recordStatus: "source_matched", presence: "absent" }), false);
  assert.equal(newClaimAllowed({ recordStatus: "source_matched", presence: "absent" }), false);
  assert.equal(publicFacilityVisible({ recordStatus: "source_matched", presence: "active" }), true);
  assert.equal(publicFacilityVisible({ recordStatus: "source_matched", presence: null }), true);
  assert.equal(publicFacilityVisible({ recordStatus: "verified", presence: "active" }), true);
  assert.equal(publicFacilityVisible({ recordStatus: "verified", presence: "absent" }), false);
  assert.equal(newClaimAllowed({ recordStatus: "source_matched", presence: "active" }), true);
  assert.equal(newClaimAllowed({ recordStatus: "verified", presence: "active" }), false);
});

test("the migration preserves claims and the development script keeps the public counts", () => {
  const migration = readFileSync(new URL("../../migrations/20261107234500_absent_facility_public_read.sql", import.meta.url), "utf8");
  const execution = readFileSync(new URL("../20261107234500_absent_facility_visibility_EXECUTE.sql", import.meta.url), "utf8");
  assert.match(migration, /Public read verified facilities/);
  assert.match(migration, /another public read policy still exposes archived facilities/);
  assert.match(migration, /presence is distinct from 'absent'/);
  assert.match(migration, /and facility\.presence is distinct from 'absent'/);
  assert.equal(migration.toLowerCase().includes("delete from public.owner_claims"), false);
  assert.equal(migration.toLowerCase().includes("delete from public.facilities"), false);
  assert.match(execution, /listed_count <> 6278 or mapped_count <> 6278/);
  assert.match(execution, /owner, edit, or administrator counts changed/);
  assert.equal(execution.toLowerCase().includes("delete from public.owner_claims"), false);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { HOMEPAGE_DIRECTORY_NOTE } from "../../../lib/family-journey.ts";
import { OREGON_DIRECTORY_FIELDS, OREGON_DIRECTORY_RPC } from "../../../lib/oregon-development-directory.ts";
import {
  homepageDirectoryNote,
  loadOregonPublicDirectory,
  loadOregonPublicProfile,
  OREGON_BEDS_NOTE,
  OREGON_FRESHNESS_NOTE,
  OREGON_LOCATION_NOTE,
  OREGON_PUBLIC_COLUMNS,
  OREGON_PUBLIC_FIELDS,
  OREGON_PUBLIC_HOMEPAGE_NOTE,
  OREGON_PUBLIC_VIEW,
  OREGON_ZERO_BED_NOTE,
  oregonPublicDirectoryAvailable,
  publicDirectoryQuery,
  publicProfileQuery,
} from "../../../lib/oregon-public-directory.ts";

const developmentUrl = "https://ajjsyloyihcqdomywhik.supabase.co";
const productionUrl = "https://yiehgstweswxjakbcdzc.supabase.co";

function row(overrides: Record<string, unknown> = {}) {
  return {
    source_id: "0000000183",
    facility_name: "Validation Fixture",
    city: "Salem",
    county: "Marion",
    license_type: "Oregon adult foster home",
    status: "Open",
    licensed_beds: 4,
    official_profile_url: "https://ltclicensing.oregon.gov/Providers/Details/0000000183",
    ...overrides,
  };
}

test("the public directory is allowlisted to the development project only", () => {
  assert.equal(oregonPublicDirectoryAvailable(developmentUrl), true);
  assert.equal(oregonPublicDirectoryAvailable(productionUrl), false);
  assert.equal(oregonPublicDirectoryAvailable("https://ci.invalid"), false);
  assert.equal(oregonPublicDirectoryAvailable("https://ajjsyloyihcqdomywhik.supabase.co.example"), false);
  assert.equal(oregonPublicDirectoryAvailable("not a url"), false);
});

test("the homepage note stays Washington-only until the Oregon directory is available", () => {
  assert.equal(homepageDirectoryNote(false), null);
  assert.equal(HOMEPAGE_DIRECTORY_NOTE.includes("labels only"), true);
  assert.equal(homepageDirectoryNote(true), OREGON_PUBLIC_HOMEPAGE_NOTE);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("Oregon adult foster home"), true);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("adult family home"), true);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("labels only"), true);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("Licensed beds are not vacancies."), true);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("0 licensed beds"), true);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("Oregon listings do not include street addresses"), true);
  assert.equal(OREGON_PUBLIC_HOMEPAGE_NOTE.includes("live"), false);
});

test("a withheld directory or profile does not query", async () => {
  let calls = 0;
  const directory = await loadOregonPublicDirectory({
    supabaseUrl: productionUrl,
    filters: { name: "", city: "", county: "", page: 0 },
    query: async () => {
      calls += 1;
      return { data: [], error: "", count: 0 };
    },
  });
  const profile = await loadOregonPublicProfile({
    supabaseUrl: productionUrl,
    sourceId: "0000000183",
    query: async () => {
      calls += 1;
      return { data: null, error: "" };
    },
  });
  assert.deepEqual(directory, { state: "withheld" });
  assert.deepEqual(profile, { state: "withheld" });
  assert.equal(calls, 0);
});

test("search arguments stay on the public view and do not build an or filter", () => {
  const args = publicDirectoryQuery({ name: "a%_or(city", city: "Bend", county: "Deschutes", page: 2 });
  assert.deepEqual(args, {
    view: OREGON_PUBLIC_VIEW,
    columns: OREGON_PUBLIC_COLUMNS,
    name: "aorcity",
    city: "Bend",
    county: "Deschutes",
    from: 40,
    to: 59,
  });
  assert.equal(args.columns.split(",").length, 8);
  assert.deepEqual(args.columns.split(","), [...OREGON_DIRECTORY_FIELDS]);
  assert.deepEqual([...OREGON_PUBLIC_FIELDS], [...OREGON_DIRECTORY_FIELDS]);
  assert.equal(JSON.stringify(args).includes(".or("), false);
  assert.equal(JSON.stringify(args).includes(OREGON_DIRECTORY_RPC), false);
  assert.equal(publicProfileQuery("0000000183")?.view, OREGON_PUBLIC_VIEW);
  assert.equal(publicProfileQuery("ABC109")?.sourceId, "ABC109");
  assert.equal(publicProfileQuery("100001")?.view, OREGON_PUBLIC_VIEW);
  assert.equal(publicProfileQuery("../facilities"), null);
  assert.equal(publicProfileQuery("x".repeat(33)), null);
});

test("an extra field, a Washington label, or a bed outside 1 to 5 fails closed", async () => {
  const extra = await loadOregonPublicDirectory({
    supabaseUrl: developmentUrl,
    filters: { name: "", city: "", county: "", page: 0 },
    query: async (args) => {
      assert.equal(args.view, OREGON_PUBLIC_VIEW);
      return { data: [row({ phone: "555-0100" })], error: "", count: 1 };
    },
  });
  const closed = await loadOregonPublicDirectory({
    supabaseUrl: developmentUrl,
    filters: { name: "", city: "", county: "", page: 0 },
    query: async () => ({ data: [row({ licensed_beds: 0 })], error: "", count: 1 }),
  });
  const washington = await loadOregonPublicProfile({
    supabaseUrl: developmentUrl,
    sourceId: "0000000183",
    query: async () => ({ data: row({ license_type: "Washington adult family home" }), error: "" }),
  });
  assert.equal(extra.state, "unavailable");
  assert.equal(closed.state, "unavailable");
  assert.equal(washington.state, "unavailable");
});

test("a matching profile keeps the eight fields and a missing home does not invent one", async () => {
  const ready = await loadOregonPublicProfile({
    supabaseUrl: developmentUrl,
    sourceId: "0000000183",
    query: async (args) => {
      assert.equal(args.sourceId, "0000000183");
      return { data: row(), error: "" };
    },
  });
  const missing = await loadOregonPublicProfile({
    supabaseUrl: developmentUrl,
    sourceId: "not a source",
    query: async () => {
      throw new Error("query should not run");
    },
  });
  assert.equal(ready.state, "ready");
  if (ready.state === "ready") {
    assert.deepEqual(Object.keys(ready.row).sort(), [...OREGON_DIRECTORY_FIELDS].sort());
    assert.equal(ready.row.licensed_beds, 4);
  }
  assert.equal(missing.state, "missing");
});

test("the proposal exposes select on the view only and leaves Washington untouched", () => {
  const sql = readFileSync("supabase/proposals/20261108233000_oregon_public_directory.sql", "utf8").toLowerCase();
  assert.match(sql, /create view public\.or_odhs_listed_afh/);
  assert.match(sql, /security_barrier = true, security_invoker = false/);
  assert.match(sql, /revoke all on table public\.or_odhs_listed_afh from public, anon, authenticated, service_role/);
  assert.match(sql, /grant select on table public\.or_odhs_listed_afh to anon, authenticated/);
  assert.equal(/grant\s+select\s+on\s+table\s+public\.oregon_odhs_afh_public/.test(sql), false);
  assert.equal(/grant\s+select[\s\S]*to\s+service_role/.test(sql), false);
  assert.equal(/insert\s+into\s+public\.facilities/.test(sql), false);
  assert.equal(/create\s+(or\s+replace\s+)?function\s+public\.development_list_oregon_afh/.test(sql), false);
  assert.match(sql, /licensed_beds between 1 and 5/);
  assert.match(sql, /1584/);
  assert.match(sql, /7346/);
  assert.match(sql, /drop view if exists public\.or_odhs_listed_afh/);
  assert.equal(sql.includes("drop table"), false);
});

test("public pages use the view copy and do not call the administrator function", () => {
  const pages = [
    "app/page.tsx",
    "app/oregon/page.tsx",
    "app/oregon/[sourceId]/page.tsx",
  ].map(path => readFileSync(path, "utf8")).join("\n");
  assert.equal(pages.includes(OREGON_DIRECTORY_RPC), false);
  assert.equal(pages.includes("oregon_odhs_afh_public"), false);
  assert.equal(pages.includes(".or("), false);
  assert.equal(pages.includes(OREGON_PUBLIC_VIEW), false);
  assert.equal(pages.includes("OREGON_BEDS_NOTE"), true);
  assert.equal(pages.includes("OREGON_ZERO_BED_NOTE"), true);
  assert.equal(pages.includes("OREGON_LOCATION_NOTE"), true);
  assert.equal(pages.includes("OREGON_FRESHNESS_NOTE"), true);
  assert.equal(OREGON_BEDS_NOTE.includes("not vacancies"), true);
  assert.equal(OREGON_ZERO_BED_NOTE.includes("0 licensed beds"), true);
  assert.equal(OREGON_FRESHNESS_NOTE.includes("not a live"), true);
  assert.equal(pages.includes("recorded licensed capacity"), false);
  assert.equal(pages.includes("available beds"), false);
  for (const path of ["app/washington/page.tsx", "app/washington/map/page.tsx", "app/washington/[license]/page.tsx", "app/owner/dashboard/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    assert.equal(source.includes(OREGON_PUBLIC_VIEW), false, path);
    assert.equal(source.includes("/oregon"), false, path);
  }
});

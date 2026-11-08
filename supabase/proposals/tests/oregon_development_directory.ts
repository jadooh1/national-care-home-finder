import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { OREGON_ADULT_FOSTER_HOME } from "../../../lib/oregon-odhs-roster.ts";
import {
  acceptDirectoryRow,
  acceptDirectoryRows,
  cleanDirectoryTerm,
  directoryArguments,
  loadOregonDevelopmentDirectory,
  OREGON_ADULT_FOSTER_HOME_LABEL,
  OREGON_DIRECTORY_FIELDS,
  OREGON_DIRECTORY_RPC,
  oregonDirectoryTarget,
} from "../../../lib/oregon-development-directory.ts";

const developmentUrl = "https://ajjsyloyihcqdomywhik.supabase.co";
const productionUrl = "https://yiehgstweswxjakbcdzc.supabase.co";

function row(overrides: Record<string, unknown> = {}) {
  return {
    source_id: "0000000183",
    facility_name: "Validation Fixture",
    city: "Salem",
    county: "Marion",
    license_type: OREGON_ADULT_FOSTER_HOME_LABEL,
    status: "Open",
    licensed_beds: 4,
    official_profile_url: "https://ltclicensing.oregon.gov/Providers/Details/0000000183",
    ...overrides,
  };
}

test("the directory label stays distinct from a Washington adult family home", () => {
  assert.equal(OREGON_ADULT_FOSTER_HOME_LABEL, OREGON_ADULT_FOSTER_HOME);
  assert.equal(OREGON_ADULT_FOSTER_HOME_LABEL.includes("family home"), false);
});

test("only the development project host can request the directory", () => {
  assert.equal(oregonDirectoryTarget(developmentUrl), "development");
  assert.equal(oregonDirectoryTarget(productionUrl), "withheld");
  assert.equal(oregonDirectoryTarget("https://ci.invalid"), "withheld");
  assert.equal(oregonDirectoryTarget("https://ajjsyloyihcqdomywhik.supabase.co.example"), "withheld");
  assert.equal(oregonDirectoryTarget("not a url"), "withheld");
});

test("a withheld or signed-out request does not query", async () => {
  let calls = 0;
  const query = async () => {
    calls += 1;
    return { data: [], error: "" };
  };
  assert.deepEqual(await loadOregonDevelopmentDirectory({
    supabaseUrl: productionUrl, signedIn: true, filters: { name: "", city: "", county: "", page: 0 }, query,
  }), { state: "withheld" });
  assert.deepEqual(await loadOregonDevelopmentDirectory({
    supabaseUrl: developmentUrl, signedIn: false, filters: { name: "", city: "", county: "", page: 0 }, query,
  }), { state: "signed_out" });
  assert.equal(calls, 0);
});

test("filters stay inside the read function arguments", () => {
  const args = directoryArguments({ name: "a%_or(city", city: "Bend", county: "Deschutes", page: 2 });
  assert.deepEqual(args, { p_name: "aorcity", p_city: "Bend", p_county: "Deschutes", p_limit: 20, p_offset: 40 });
  assert.equal(cleanDirectoryTerm("x".repeat(120)).length, 80);
  assert.equal(JSON.stringify(args).includes(OREGON_DIRECTORY_RPC), false);
});

test("accepted rows keep the eight fields and reject private or Washington values", () => {
  const accepted = acceptDirectoryRow(row());
  assert.deepEqual(accepted && Object.keys(accepted).sort(), [...OREGON_DIRECTORY_FIELDS].sort());
  assert.equal(acceptDirectoryRow(row({ address: "Hidden Street" })), null);
  assert.equal(acceptDirectoryRow(row({ phone: "555-0100" })), null);
  assert.equal(acceptDirectoryRow(row({ email: "hidden@example.invalid" })), null);
  assert.equal(acceptDirectoryRow(row({ zip: "97301" })), null);
  assert.equal(acceptDirectoryRow(row({ license_type: "adult family home" })), null);
  assert.equal(acceptDirectoryRow(row({ license_type: "Washington adult family home" })), null);
  assert.equal(acceptDirectoryRow(row({ status: "Closed" })), null);
  assert.equal(acceptDirectoryRow(row({ licensed_beds: 0 })), null);
  assert.equal(acceptDirectoryRow(row({ licensed_beds: 6 })), null);
  assert.equal(acceptDirectoryRow(row({ official_profile_url: "https://example.invalid/0000000183" })), null);
});

test("duplicate source ids are omitted and an administrator error stays forbidden", async () => {
  assert.deepEqual(acceptDirectoryRows([row(), row({ facility_name: "Second copy" })]), []);
  const forbidden = await loadOregonDevelopmentDirectory({
    supabaseUrl: developmentUrl,
    signedIn: true,
    filters: { name: "", city: "", county: "", page: 0 },
    query: async (rpc) => {
      assert.equal(rpc, OREGON_DIRECTORY_RPC);
      return { data: null, error: "administrator required" };
    },
  });
  assert.deepEqual(forbidden, { state: "forbidden" });
});

test("the proposal grants execute only to signed-in users and does not expose the table", () => {
  const sql = readFileSync("supabase/proposals/20261108200000_development_oregon_directory.sql", "utf8").toLowerCase();
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /raise exception 'administrator required'/);
  assert.match(sql, /revoke all on function public\.development_list_oregon_afh\(text, text, text, integer, integer\) from public, anon, authenticated, service_role/);
  assert.match(sql, /grant execute on function public\.development_list_oregon_afh\(text, text, text, integer, integer\) to authenticated/);
  assert.equal(/grant\s+execute[\s\S]*to\s+anon/.test(sql), false);
  assert.equal(/grant\s+(select|all|insert|update|delete)\b/.test(sql), false);
  assert.match(sql, /oregon adult foster home/);
  assert.match(sql, /licensed_beds between 1 and 5/);
  assert.equal(sql.includes("wa_dshs_listed_facilities"), false);
  assert.equal(sql.includes("wa_afh_map_facilities"), false);
});

test("public washington pages do not reference the development directory", () => {
  for (const path of ["app/page.tsx", "app/washington/page.tsx", "app/washington/map/page.tsx", "app/washington/[license]/page.tsx"]) {
    const source = readFileSync(path, "utf8");
    assert.equal(source.includes("development/oregon"), false, path);
    assert.equal(source.includes("oregon_odhs_afh_public"), false, path);
    assert.equal(source.includes(OREGON_DIRECTORY_RPC), false, path);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_SUPABASE_PLACEHOLDER_KEY,
  PUBLIC_SUPABASE_PLACEHOLDER_URL,
  createPublicSupabaseClient,
  isPublicSupabaseConfigured,
  readPublicSupabaseEnv,
} from "../../../lib/supabase.ts";
import { DEVELOPMENT_SUPABASE_HOST } from "../../../lib/premium-option-a.ts";
import {
  loadWashingtonDirectorySlice,
  washingtonPublicRestConfig,
} from "../../../lib/washington-public-roster.ts";

/** Realistic development-shaped values — not live credentials. */
const DEVELOPMENT_URL = `https://${DEVELOPMENT_SUPABASE_HOST}`;
const DEVELOPMENT_SHAPED_PUBLISHABLE_KEY = "sb_publishable_test_not_a_real_credential";

test("hardcoded development host constant is not proof NEXT_PUBLIC_SUPABASE_URL is set", () => {
  assert.equal(DEVELOPMENT_SUPABASE_HOST, "ajjsyloyihcqdomywhik.supabase.co");
  const empty = readPublicSupabaseEnv({});
  assert.equal(empty.supabaseUrl, "");
  assert.equal(isPublicSupabaseConfigured(empty), false);
  // Bundle scanners that only match the host string would false-PASS here.
  assert.match(DEVELOPMENT_SUPABASE_HOST, /ajjsyloyihcqdomywhik/);
  assert.equal(empty.supabaseUrl.includes(DEVELOPMENT_SUPABASE_HOST), false);
});

test("createPublicSupabaseClient accepts realistic development env without throwing", () => {
  const client = createPublicSupabaseClient({
    NEXT_PUBLIC_SUPABASE_URL: DEVELOPMENT_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: DEVELOPMENT_SHAPED_PUBLISHABLE_KEY,
  });
  assert.equal(typeof client.from, "function");
  assert.equal(
    isPublicSupabaseConfigured(
      readPublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: DEVELOPMENT_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: DEVELOPMENT_SHAPED_PUBLISHABLE_KEY,
      }),
    ),
    true,
  );
});

test("createPublicSupabaseClient does not throw when public env is missing", () => {
  assert.doesNotThrow(() => createPublicSupabaseClient({}));
  assert.doesNotThrow(() =>
    createPublicSupabaseClient({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    }),
  );
  const client = createPublicSupabaseClient({});
  assert.equal(typeof client.from, "function");
  // Placeholder must stay non-routable so roster REST helpers refuse it.
  assert.equal(PUBLIC_SUPABASE_PLACEHOLDER_URL, "https://ci.invalid");
  assert.equal(PUBLIC_SUPABASE_PLACEHOLDER_KEY, "ci-placeholder-not-a-credential");
});

test("washington roster config with realistic env builds a development REST target", async () => {
  const config = washingtonPublicRestConfig({
    NEXT_PUBLIC_SUPABASE_URL: DEVELOPMENT_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: DEVELOPMENT_SHAPED_PUBLISHABLE_KEY,
  });
  assert.equal(config.supabaseUrl, DEVELOPMENT_URL);
  assert.equal(config.publishableKey, DEVELOPMENT_SHAPED_PUBLISHABLE_KEY);

  let requested: URL | null = null;
  const slice = await loadWashingtonDirectorySlice({
    page: 0,
    config: {
      ...config,
      fetchImpl: async (input) => {
        requested = new URL(String(input));
        return new Response(
          JSON.stringify([
            {
              id: "11111111-1111-4111-8111-111111111111",
              canonical_name: "Cedar Grove Adult Family Home",
              address_line1: "123 Maple St",
              city: "Tacoma",
              county: "Pierce",
              state_code: "WA",
              postal_code: "98402",
              license_number: "100702",
              licensed_capacity: 6,
              record_status: "verified",
            },
          ]),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "content-range": "0-0/6278",
            },
          },
        );
      },
    },
  });

  assert.ok(requested);
  assert.equal(requested.hostname, DEVELOPMENT_SUPABASE_HOST);
  assert.match(requested.pathname, /wa_dshs_listed_facilities/);
  assert.equal(slice.ok, true);
  if (slice.ok) {
    assert.equal(slice.total, 6278);
    assert.equal(slice.facilities[0]?.license_number, "100702");
  }
});

test("washington roster config with empty env stays unavailable instead of throwing", async () => {
  const config = washingtonPublicRestConfig({});
  assert.equal(config.supabaseUrl, "");
  assert.equal(config.publishableKey, "");
  const slice = await loadWashingtonDirectorySlice({ page: 0, config });
  assert.equal(slice.ok, false);
});

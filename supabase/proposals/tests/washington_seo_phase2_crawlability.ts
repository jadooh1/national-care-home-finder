import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  displayWashingtonFacilityName,
  loadWashingtonListedFacility,
  profileMetadataFacts,
  WASHINGTON_DIRECTORY_PAGE_SIZE,
} from "../../../lib/washington-public-roster.ts";

const proposal = readFileSync(
  "supabase/proposals/20261127090000_washington_seo_phase2_crawlability.md",
  "utf8",
);
const roster = readFileSync("lib/washington-public-roster.ts", "utf8");
const metadata = readFileSync("lib/public-metadata.ts", "utf8");
const profilePage = readFileSync("app/washington/[license]/page.tsx", "utf8");
const profileLayout = readFileSync("app/washington/[license]/layout.tsx", "utf8");
const profileClient = readFileSync(
  "app/washington/[license]/washington-facility-profile-client.tsx",
  "utf8",
);
const directoryPage = readFileSync("app/washington/page.tsx", "utf8");
const directoryClient = readFileSync("app/washington/washington-directory-client.tsx", "utf8");
const citiesPage = readFileSync("app/washington/cities/page.tsx", "utf8");
const countiesPage = readFileSync("app/washington/counties/page.tsx", "utf8");
const countiesClient = readFileSync(
  "app/washington/counties/washington-counties-client.tsx",
  "utf8",
);

test("phase 2 proposal keeps unpaid constraints and measurement plan", () => {
  assert.match(proposal, /30 \/ 60 \/ 90-day measurement plan/);
  assert.match(proposal, /Indexed \(2026-11-22\)/);
  assert.match(proposal, /6,278/);
  assert.match(proposal, /Design 2/);
  assert.match(proposal, /No JSON-LD/);
  assert.doesNotMatch(proposal, /enable production GA|launch paid ads/i);
});

test("roster helper stays on publishable REST and excludes reserved E2E fixture", () => {
  assert.match(roster, /wa_dshs_listed_facilities/);
  assert.match(roster, /WASHINGTON_RESERVED_E2E_FACILITY_ID/);
  assert.match(roster, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(roster, /SERVICE_ROLE|service_role/);
  assert.equal(WASHINGTON_DIRECTORY_PAGE_SIZE, 20);
  assert.equal(displayWashingtonFacilityName("!! Demo Home"), "Demo Home");
});

test("missing licenses hard-404 and metadata uses roster facts", async () => {
  assert.match(profilePage, /notFound\(\)/);
  assert.match(profilePage, /getWashingtonListedFacility/);
  assert.equal(profilePage.includes('"use client"'), false);
  assert.match(profileLayout, /getWashingtonListedFacility/);
  assert.match(profileLayout, /profileMetadataFacts|profileMetadata/);
  assert.match(profileClient, /initialFacility/);
  assert.match(profileClient, /PREMIUM_OWNER_CONTENT_VIEW/);
  assert.match(metadata, /facts === null/);
  assert.match(metadata, /Washington adult family home not found/);
  assert.match(metadata, /\$\{name\} · Washington adult family home/);

  const facts = profileMetadataFacts({
    id: "1",
    canonical_name: "!! Riverview",
    address_line1: null,
    city: "Olympia",
    county: "Thurston",
    state_code: "WA",
    postal_code: null,
    license_number: "123",
    licensed_capacity: 6,
    record_status: "verified",
  });
  assert.equal(facts.name, "Riverview");
  assert.equal(facts.city, "Olympia");

  const invalid = await loadWashingtonListedFacility("not-a-license", {
    supabaseUrl: "https://example.supabase.co",
    publishableKey: "test",
    fetchImpl: async () => {
      throw new Error("should not fetch invalid licenses");
    },
  });
  assert.equal(invalid.status, "invalid");

  const missing = await loadWashingtonListedFacility("999999999", {
    supabaseUrl: "https://example.supabase.co",
    publishableKey: "test-key",
    fetchImpl: async () =>
      new Response("[]", { status: 200, headers: { "content-type": "application/json" } }),
  });
  assert.equal(missing.status, "missing");

  const unavailable = await loadWashingtonListedFacility("100702", {
    supabaseUrl: "https://example.supabase.co",
    publishableKey: "test-key",
    fetchImpl: async () => new Response("nope", { status: 401 }),
  });
  assert.equal(unavailable.status, "unavailable");
});

test("directory cities and counties server-feed crawlable links", () => {
  assert.match(directoryPage, /loadWashingtonDirectorySlice/);
  assert.equal(directoryPage.includes('"use client"'), false);
  assert.match(directoryClient, /washingtonDirectorySearchPath/);
  assert.match(directoryClient, /<Link[\s\S]*page: page \+ 1/);
  assert.match(directoryClient, /initialFacilities/);
  assert.match(citiesPage, /loadWashingtonCityMarketSummaries/);
  assert.match(countiesPage, /loadWashingtonCountyMarketSummaries/);
  assert.match(countiesClient, /\/washington\?county=/);
  assert.match(countiesClient, /directoryLink/);
});

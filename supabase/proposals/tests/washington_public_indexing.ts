import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { facilityProfilePath } from "../../../lib/family-journey.ts";
import {
  DIRECTORY_VIEW,
  PRIVATE_INDEX_PREFIXES,
  PUBLIC_CANONICAL_HOST,
  PUBLIC_CANONICAL_ORIGIN,
  WASHINGTON_PUBLIC_PAGES,
  absolutePublicUrl,
  eligibleProfilePath,
  listIndexableLicenses,
  profileSitemapPaths,
  publicIndexingAllowed,
  robotsPolicy,
  sitemapPaths,
  sitemapUrls,
} from "../../../lib/public-indexing.ts";

const privatePaths = ["/oregon", "/oregon/529480", "/development/oregon", "/owner", "/owner/dashboard", "/owner/listing-edits", "/owner/reset-password", "/admin/claims", "/admin/listing-edits", "/auth/callback"];

test("indexing is limited to the public production host", () => {
  assert.equal(PUBLIC_CANONICAL_HOST, "national-care-home-finder.vercel.app");
  assert.equal(publicIndexingAllowed({}), false);
  assert.equal(publicIndexingAllowed({ vercelEnv: "preview", productionHost: PUBLIC_CANONICAL_HOST }), false);
  assert.equal(publicIndexingAllowed({ vercelEnv: "production", productionHost: "national-care-home-finder-dev.vercel.app" }), false);
  assert.equal(publicIndexingAllowed({ vercelEnv: "production", productionHost: "https://national-care-home-finder-dev.vercel.app" }), false);
  assert.equal(publicIndexingAllowed({ vercelEnv: "production", productionHost: PUBLIC_CANONICAL_HOST }), true);
  assert.equal(publicIndexingAllowed({ vercelEnv: "production", productionHost: `${PUBLIC_CANONICAL_ORIGIN}/` }), true);
});

test("development and preview robots block the site and omit the sitemap", () => {
  const hidden = robotsPolicy(false);
  assert.equal(hidden.disallow, "/");
  assert.equal(hidden.sitemap, undefined);
  assert.equal(sitemapUrls(false, ["100001"]).length, 0);
});

test("public robots allow Washington and exclude private sections", () => {
  const policy = robotsPolicy(true);
  assert.equal(policy.allow, "/");
  assert.equal(policy.sitemap, `${PUBLIC_CANONICAL_ORIGIN}/sitemap.xml`);
  assert.deepEqual(policy.disallow, [...PRIVATE_INDEX_PREFIXES]);
  for (const prefix of PRIVATE_INDEX_PREFIXES) {
    assert.equal(policy.disallow.includes(prefix), true);
  }
  assert.equal(policy.disallow.includes("/washington"), false);
});

test("the public sitemap lists real Washington pages and eligible profiles only", () => {
  for (const page of WASHINGTON_PUBLIC_PAGES) {
    const file = page.path === "/" ? "app/page.tsx" : `app${page.path}/page.tsx`;
    assert.equal(existsSync(file), true, file);
    assert.equal(absolutePublicUrl(page.path).startsWith(`${PUBLIC_CANONICAL_ORIGIN}/`), true);
  }
  const urls = sitemapUrls(true, [" 100001 ", "100001", "ABC109", "", "42"]);
  assert.deepEqual(urls.slice(0, WASHINGTON_PUBLIC_PAGES.length), WASHINGTON_PUBLIC_PAGES.map(page => absolutePublicUrl(page.path)));
  assert.equal(urls.includes(`${PUBLIC_CANONICAL_ORIGIN}/washington/100001`), true);
  assert.equal(urls.includes(`${PUBLIC_CANONICAL_ORIGIN}/washington/42`), true);
  assert.equal(urls.filter(url => url.endsWith("/washington/100001")).length, 1);
  for (const url of urls) {
    assert.equal(url.startsWith(PUBLIC_CANONICAL_ORIGIN), true, url);
    for (const prefix of PRIVATE_INDEX_PREFIXES) {
      assert.equal(url.includes(`${PUBLIC_CANONICAL_ORIGIN}${prefix}`), false, url);
    }
  }
  assert.deepEqual(profileSitemapPaths(["ABC109", "100001"]), ["/washington/100001"]);
  assert.equal(eligibleProfilePath("100001"), facilityProfilePath("100001"));
  assert.equal(eligibleProfilePath("ABC109"), facilityProfilePath("ABC109"));
});

test("private routes stay out of the sitemap paths", () => {
  const paths = sitemapPaths(true, ["100001"]);
  for (const path of privatePaths) assert.equal(paths.includes(path), false, path);
  const source = [
    "app/robots.ts",
    "app/sitemap.ts",
    "lib/public-indexing.ts",
    "lib/public-metadata.ts",
  ].map(path => readFileSync(path, "utf8")).join("\n");
  assert.equal(source.includes("or_odhs_listed_afh"), false);
  assert.equal(source.includes("oregon_odhs_afh_public"), false);
  assert.equal(source.includes(DIRECTORY_VIEW), true);
});

test("a license read uses the public directory and fails closed", async () => {
  const calls: string[] = [];
  const first = Array.from({ length: 1000 }, (_, index) => ({ license_number: String(index + 1) }));
  const listed = await listIndexableLicenses({
    supabaseUrl: "https://example.test",
    publishableKey: "publishable",
    fetchImpl: async (input, init) => {
      const url = input instanceof URL ? input : new URL(String(input));
      calls.push(`${url.pathname}?${url.searchParams.toString()}`);
      const range = new Headers(init?.headers).get("Range");
      const rows = range === "0-999" ? first : [{ license_number: "200000" }, { license_number: null }, { license_number: 5 }];
      return new Response(JSON.stringify(rows), { status: 200 });
    },
  });
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(listed.licenses[0], "1");
    assert.equal(listed.licenses.at(-1), "200000");
    assert.equal(listed.licenses.length, 1001);
  }
  assert.equal(calls[0].includes(`/rest/v1/${DIRECTORY_VIEW}`), true);
  assert.equal(calls[0].includes("select=license_number"), true);

  const denied = await listIndexableLicenses({
    supabaseUrl: "https://example.test",
    publishableKey: "publishable",
    fetchImpl: async () => new Response("no", { status: 401 }),
  });
  assert.equal(denied.ok, false);
  assert.deepEqual(sitemapPaths(true, []), WASHINGTON_PUBLIC_PAGES.map(page => page.path));

  const placeholder = await listIndexableLicenses({
    supabaseUrl: "https://ci.invalid",
    publishableKey: "ci-placeholder-not-a-credential",
    fetchImpl: async () => {
      throw new Error("placeholder host must not be queried");
    },
  });
  assert.equal(placeholder.ok, false);
});

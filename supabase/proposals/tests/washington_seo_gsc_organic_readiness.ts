import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { measurementIdReady } from "../../../lib/analytics.ts";
import { googleSiteVerificationToken } from "../../../lib/site-verification.ts";

const proposal = readFileSync(
  "supabase/proposals/20261127070000_washington_seo_gsc_organic_readiness.md",
  "utf8",
);
const metadata = readFileSync("lib/public-metadata.ts", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const homePage = readFileSync("app/page.tsx", "utf8");
const homeCopy = readFileSync("lib/copy/home.ts", "utf8");
const analytics = readFileSync("lib/analytics.ts", "utf8");

test("GSC verification accepts opaque tokens and rejects GA measurement IDs", () => {
  assert.equal(googleSiteVerificationToken(undefined), undefined);
  assert.equal(googleSiteVerificationToken(""), undefined);
  assert.equal(googleSiteVerificationToken("G-DEVPREP01"), undefined);
  assert.equal(googleSiteVerificationToken("abc_def-12345678"), "abc_def-12345678");
});

test("production analytics remain disabled on www and apex", () => {
  assert.equal(measurementIdReady("www.nationalcarehomefinder.com", "G-DEVPREP01"), null);
  assert.equal(measurementIdReady("nationalcarehomefinder.com", "G-DEVPREP01"), null);
  assert.match(analytics, /PRODUCTION_SITE_HOSTS/);
});

test("public metadata wires icons, Open Graph, and optional GSC verification", () => {
  assert.match(metadata, /googleSiteVerificationToken/);
  assert.match(metadata, /openGraph/);
  assert.match(metadata, /\/home\/mark\.webp/);
  assert.match(metadata, /\/home\/washington\.webp/);
});

test("sitemap assigns priorities without enabling new states", () => {
  assert.match(sitemap, /changeFrequency: "weekly"/);
  assert.match(sitemap, /priority/);
  assert.match(sitemap, /\/washington/);
});

test("homepage owner CTA is bilingual and deep-links login", () => {
  assert.match(homeCopy, /ownerCta: string/);
  assert.match(homeCopy, /Care home owners — sign in or claim your listing/);
  assert.match(homeCopy, /Propietarios — inicie sesión o reclame su listado/);
  assert.match(homePage, /owner\?mode=login/);
  assert.match(homePage, /ownerCta/);
});

test("proposal documents GSC human steps and keeps billing/ads/GA off", () => {
  assert.match(proposal, /Google Search Console/);
  assert.match(proposal, /sitemap\.xml/);
  assert.match(proposal, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(proposal, /Paid advertising/);
  assert.match(proposal, /Production GA4/);
  assert.match(proposal, /Re-running S5-A \/ S5-B \/ S6/);
});

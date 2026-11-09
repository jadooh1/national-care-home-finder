import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { invalidZipMessage, mapResultSummary, stateFilterStatus } from "../../../lib/family-journey.ts";
import {
  localizedInvalidZip,
  localizedMapSummary,
  localizedOregonCareType,
  localizedOregonLicenseStatus,
  localizedPasswordProblem,
  localizedStateStatus,
  navigationCopy,
  parseLocale,
} from "../../../lib/locale.ts";
import { passwordProblem } from "../../../lib/password-recovery.ts";

test("english stays the default and spanish is the only other choice", () => {
  assert.equal(parseLocale(undefined), "en");
  assert.equal(parseLocale(""), "en");
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("fr"), "en");
  assert.equal(parseLocale("es"), "es");
});

test("english helpers match the existing journey and password checks", () => {
  assert.equal(localizedStateStatus("en", 0), stateFilterStatus(0));
  assert.equal(localizedStateStatus("en", 2), stateFilterStatus(2));
  const input = { zip: "98056", loading: false, error: "", count: 4 };
  assert.equal(localizedMapSummary("en", input), mapResultSummary(input));
  assert.equal(localizedInvalidZip("en", "98056"), invalidZipMessage("98056"));
  assert.equal(localizedPasswordProblem("en", "short", "short"), passwordProblem("short", "short"));
  assert.equal(localizedPasswordProblem("en", "lettersletters", "lettersletters"), passwordProblem("lettersletters", "lettersletters"));
  assert.equal(localizedPasswordProblem("en", "password12345", "password1234"), passwordProblem("password12345", "password1234"));
  assert.equal(localizedPasswordProblem("en", "password12345", "password12345"), null);
});

test("spanish keeps place names and license-like numbers unchanged", () => {
  assert.equal(localizedStateStatus("es", 0).includes("No se encontraron"), true);
  assert.equal(localizedMapSummary("es", { zip: "98056", loading: false, error: "", count: 4 }).includes("98056"), true);
  assert.equal(localizedInvalidZip("es", "98056").includes("98056"), true);
  assert.equal(localizedPasswordProblem("es", "password12345", "different12345")?.includes("no coinciden"), true);
  assert.equal(navigationCopy.es.directory, "Directorio");
  assert.equal(navigationCopy.en.directory, "Directory");
  assert.equal(navigationCopy.es.summary, "Washington");
  assert.deepEqual(Object.keys(navigationCopy.en).sort(), Object.keys(navigationCopy.es).sort());
});

test("spanish display labels do not rewrite official oregon records", () => {
  assert.equal(localizedOregonCareType("en", "Oregon adult foster home"), "Oregon adult foster home");
  assert.equal(localizedOregonLicenseStatus("en", "Open"), "Open");
  assert.equal(localizedOregonCareType("es", "Oregon adult foster home"), "Hogar de acogida para adultos de Oregon");
  assert.equal(localizedOregonLicenseStatus("es", "Open"), "Abierta");
  assert.equal(localizedOregonCareType("es", "Adult family home"), "Adult family home");
  assert.equal(localizedOregonLicenseStatus("es", "Closed"), "Closed");
  const oregonCopy = readFileSync("lib/copy/oregon.ts", "utf8");
  const profile = readFileSync("app/oregon/[sourceId]/page.tsx", "utf8");
  const owner = readFileSync("app/owner/page.tsx", "utf8");
  assert.equal(oregonCopy.includes("localizedOregonCareType"), true);
  assert.equal(oregonCopy.includes("localizedOregonLicenseStatus"), true);
  assert.equal(profile.includes("t.careType(row.license_type)"), true);
  assert.equal(owner.includes("localizedPasswordProblem"), true);
  assert.equal(owner.includes('minLength={mode === "register" ? 12 : 6}'), true);
});

test("the selector is shared and washington pages stay free of oregon routes", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const localeSource = readFileSync("lib/locale.ts", "utf8");
  const header = readFileSync("components/washington-public.tsx", "utf8");
  const language = readFileSync("components/language.tsx", "utf8");
  assert.equal(localeSource.includes('nchf-language'), true);
  assert.equal(layout.includes("LANGUAGE_COOKIE"), true);
  assert.equal(layout.includes("lang={locale}"), true);
  assert.equal(header.includes("LanguageSelector"), true);
  assert.equal(language.includes("localStorage"), true);
  assert.equal(language.includes('aria-pressed'), true);
  assert.equal(language.includes("Español"), false);
  for (const path of [
    "app/washington/page.tsx",
    "app/washington/map/page.tsx",
    "app/washington/[license]/page.tsx",
    "app/owner/dashboard/page.tsx",
  ]) {
    assert.equal(readFileSync(path, "utf8").includes("/oregon"), false, path);
  }
});

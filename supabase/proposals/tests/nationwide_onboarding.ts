import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MICHIGAN_BLANK_DATES,
  MICHIGAN_EIGHT_DIGIT_DATES,
  MICHIGAN_FILE_ROWS,
  MICHIGAN_FIVE_DIGIT_ZIPS,
  MICHIGAN_NINE_DIGIT_ZIPS,
  MICHIGAN_OBSERVED_STATUSES,
  MICHIGAN_OBSERVED_TYPES,
  MICHIGAN_PROFILE_PREFIX,
  MICHIGAN_RECORDED_EXPORT_DATE,
  michiganDescribedRows,
  michiganProfileUrl,
  onboardingProfile,
  onboardingProfiles,
  publicPublicationPermitted,
} from "../../../lib/nationwide-onboarding.ts";
import { onboardingDecision } from "../../../lib/state-onboarding.ts";
import {
  WASHINGTON_DSHS_LOCATOR,
  WASHINGTON_SOURCE_RETRIEVED_ON,
  directoryContract,
  directoryHref,
  mapHref,
} from "../../../lib/state-directory.ts";

test("Washington is the only public reference and Oregon stays on its development contract", () => {
  const washington = onboardingProfile("Washington");
  const oregon = onboardingProfile("Oregon");
  assert.equal(publicPublicationPermitted(washington), true);
  assert.equal(washington.recordedExportDate, WASHINGTON_SOURCE_RETRIEVED_ON);
  assert.equal(washington.sourceUrl, WASHINGTON_DSHS_LOCATOR);
  assert.equal(publicPublicationPermitted(oregon), false);
  assert.equal(oregon.publication, "development");
  assert.equal(oregon.recordedExportDate, null);
  assert.deepEqual(oregon.blockers, onboardingDecision("Oregon").blockers);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(mapHref("Washington"), "/washington/map");
  assert.equal(mapHref("Oregon"), null);
});

test("California remains unpublished inside the shared framework", () => {
  const california = onboardingProfile("California");
  assert.equal(california.publication, "unpublished");
  assert.equal(california.disclosurePrefix, null);
  assert.equal(california.recordedExportDate, null);
  assert.equal(publicPublicationPermitted(california), false);
  assert.deepEqual(california.blockers, onboardingDecision("California").blockers);
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.deepEqual(california.categories.map(category => category.code), ["RCFE", "ARF"]);
});

test("Michigan stays unpublished and its file observation is not treated as availability", () => {
  const michigan = onboardingProfile("Michigan");
  assert.equal(michigan.role, "candidate");
  assert.equal(michigan.publication, "unpublished");
  assert.equal(michigan.coordinateColumns, false);
  assert.equal(michigan.recordedExportDate, MICHIGAN_RECORDED_EXPORT_DATE);
  assert.equal(publicPublicationPermitted(michigan), false);
  assert.equal(directoryContract("Michigan")?.publication, "unpublished");
  assert.equal(directoryContract("Michigan")?.directoryPath, null);
  assert.equal(directoryHref("Michigan", "https://ajjsyloyihcqdomywhik.supabase.co"), null);
  assert.equal(michiganDescribedRows(), 4246);
  assert.equal(michiganDescribedRows() + 234, MICHIGAN_FILE_ROWS);
  assert.equal(MICHIGAN_OBSERVED_TYPES.reduce((sum, category) => sum + category.observedRows, 0), MICHIGAN_FILE_ROWS);
  assert.equal(MICHIGAN_OBSERVED_STATUSES.reduce((sum, status) => sum + status.observedRows, 0), MICHIGAN_FILE_ROWS);
  assert.equal(MICHIGAN_FIVE_DIGIT_ZIPS + MICHIGAN_NINE_DIGIT_ZIPS, MICHIGAN_FILE_ROWS);
  assert.equal(MICHIGAN_EIGHT_DIGIT_DATES + MICHIGAN_BLANK_DATES, MICHIGAN_FILE_ROWS);
  assert.equal(MICHIGAN_OBSERVED_TYPES.find(category => category.code === "XH")?.label, null);
  assert.equal(MICHIGAN_OBSERVED_TYPES.find(category => category.code === "XH")?.eligible, false);
  assert.ok(michigan.blockers.includes("undescribed-type-code-xh-is-not-corrected"));
  assert.ok(michigan.blockers.includes("file-server-clock-is-not-an-export-date"));
});

test("a Michigan profile link is built only from the observed prefix and license shape", () => {
  assert.equal(michiganProfileUrl("ZZ000000000"), `${MICHIGAN_PROFILE_PREFIX}ZZ000000000`);
  assert.equal(michiganProfileUrl("as340420376"), null);
  assert.equal(michiganProfileUrl("ZZ00000000"), null);
  assert.equal(onboardingProfiles().filter(profile => profile.disclosureVerified).map(profile => profile.state).sort().join(), "Michigan,Oregon,Washington");
});

test("the development review is not linked from the home page and does not publish rows", () => {
  const page = readFileSync(new URL("../../../app/development/onboarding/page.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../../../app/page.tsx", import.meta.url), "utf8");
  const source = readFileSync(new URL("../../../lib/nationwide-onboarding.ts", import.meta.url), "utf8");
  assert.equal(home.includes("/development/onboarding"), false);
  assert.equal(home.includes("/michigan"), false);
  assert.equal(page.includes("Michigan is unpublished"), true);
  assert.equal(page.includes("not an available placement"), true);
  assert.equal(page.includes("supabase"), false);
  assert.equal(page.includes("fetch("), false);
  assert.equal(page.includes("latitude"), false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("insert"), false);
  assert.equal(source.includes("AS340420376"), false);
});

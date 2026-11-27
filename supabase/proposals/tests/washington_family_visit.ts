import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy } from "../../../lib/copy/washington-detail.ts";
import { washingtonDisclosureUrl } from "../../../lib/state-directory.ts";

const topics = ["vacanc", "rate", "staff", "medic", "visit", "licen"] as const;

test("the visit checklist asks six questions and does not record answers", () => {
  for (const locale of ["en", "es"] as const) {
    const profile = copy[locale].profile;
    assert.equal(profile.visitQuestions.length, 6);
    assert.match(profile.visitNote, locale === "en" ? /not verified facts/ : /No son datos verificados/);
    assert.match(profile.contactAbsent, locale === "en" ? /does not include a telephone number, email address, or website/ : /no incluye un teléfono, un correo electrónico ni un sitio web/);
  }
  const english = copy.en.profile.visitQuestions.join(" ").toLowerCase();
  const spanish = copy.es.profile.visitQuestions.join(" ").toLowerCase();
  for (const topic of topics) assert.match(english, new RegExp(topic));
  assert.match(spanish, /vacantes/);
  assert.match(spanish, /tarifa mensual/);
  assert.match(spanish, /personal/);
  assert.match(spanish, /medicamentos/);
  assert.match(spanish, /recorridos/);
  assert.match(spanish, /inspecciones/);
  assert.equal(copy.en.profile.visitQuestions.join(" ").includes("$"), false);
  assert.equal(english.includes("call "), false);
});

test("contact opens the official DSHS record and leaves the directory query unchanged", () => {
  assert.equal(
    washingtonDisclosureUrl("100001"),
    "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=100001",
  );
  const profile = readFileSync("app/washington/[license]/washington-facility-profile-client.tsx", "utf8");
  const directory = readFileSync("app/washington/washington-directory-client.tsx", "utf8");
  const home = readFileSync("lib/copy/home.ts", "utf8");
  assert.match(profile, /text\.visitQuestions/);
  assert.match(profile, /text\.contactAbsent/);
  assert.match(profile, /washingtonDisclosureUrl\(facility\.license_number\)/);
  assert.match(profile, /id="visit-heading"/);
  assert.ok(profile.indexOf('id="details-heading"') < profile.indexOf('id="visit-heading"'));
  assert.ok(profile.indexOf('id="visit-heading"') < profile.indexOf('id="claim-heading"'));
  assert.match(profile, /PREMIUM_OWNER_CONTENT_VIEW/);
  assert.doesNotMatch(profile, /public_phone|telephone|email_address|website/);
  const roster = readFileSync("lib/washington-public-roster.ts", "utf8");
  assert.match(roster, /canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status/);
  assert.match(profile, /initialFacility/);
  assert.match(directory, /addWashingtonShortlist/);
  assert.match(directory, /washingtonFacilityLink/);
  assert.match(home, /Find the right care home for your loved one/);
});

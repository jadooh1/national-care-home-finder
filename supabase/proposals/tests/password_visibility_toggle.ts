import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copy } from "../../../lib/copy/account.ts";

const fieldSource = readFileSync("components/password-field.tsx", "utf8");
const ownerSource = readFileSync("app/owner/page.tsx", "utf8");
const resetSource = readFileSync("app/owner/reset-password/page.tsx", "utf8");

test("password visibility copy exists in English and Spanish with matching keys", () => {
  assert.equal(copy.en.owner.showPassword, "Show password");
  assert.equal(copy.en.owner.hidePassword, "Hide password");
  assert.equal(copy.es.owner.showPassword, "Mostrar contraseña");
  assert.equal(copy.es.owner.hidePassword, "Ocultar contraseña");
  assert.equal(copy.en.reset.showPassword, "Show password");
  assert.equal(copy.en.reset.hidePassword, "Hide password");
  assert.equal(copy.es.reset.showPassword, "Mostrar contraseña");
  assert.equal(copy.es.reset.hidePassword, "Ocultar contraseña");
  assert.deepEqual(
    Object.keys(copy.en.owner).sort(),
    Object.keys(copy.es.owner).sort(),
  );
  assert.deepEqual(
    Object.keys(copy.en.reset).sort(),
    Object.keys(copy.es.reset).sort(),
  );
});

test("PasswordField defaults to hidden and exposes accessible show/hide controls", () => {
  assert.match(fieldSource, /useState\(false\)/);
  assert.match(fieldSource, /type=\{visible \? "text" : "password"\}/);
  assert.match(fieldSource, /aria-pressed=\{visible\}/);
  assert.match(fieldSource, /aria-label=\{visible \? visibility\.hide : visibility\.show\}/);
  assert.match(fieldSource, /aria-controls=\{id\}/);
  assert.match(fieldSource, /type="button"/);
  assert.match(fieldSource, /minWidth: 44/);
  assert.match(fieldSource, /minHeight: 44/);
  assert.match(fieldSource, /spellCheck=\{false\}/);
  assert.match(fieldSource, /EyeOpenIcon|EyeOffIcon/);
  assert.doesNotMatch(fieldSource, /signUp|signInWithPassword|updateUser|resetPasswordForEmail/);
});

test("owner portal register and sign-in use PasswordField for the shared admin/owner password", () => {
  assert.match(ownerSource, /import \{ PasswordField \}/);
  assert.match(ownerSource, /id="owner-password"/);
  assert.match(ownerSource, /autoComplete=\{mode === "register" \? "new-password" : "current-password"\}/);
  assert.match(ownerSource, /minLength=\{mode === "register" \? 12 : 6\}/);
  assert.match(ownerSource, /visibility=\{\{ show: text\.showPassword, hide: text\.hidePassword \}\}/);
  assert.match(ownerSource, /signInWithPassword/);
  assert.match(ownerSource, /signUp/);
  assert.doesNotMatch(ownerSource, /id="owner-password"[^>]*type="password"/);
});

test("PR #232 owner mode=login deep-link remains compatible with PasswordField", () => {
  assert.match(ownerSource, /params\.get\("mode"\)/);
  assert.match(ownerSource, /setMode\("login"\)/);
  assert.match(ownerSource, /setMode\("recover"\)/);
  assert.match(ownerSource, /PasswordField/);
  const claim = readFileSync("lib/owner-claim.ts", "utf8");
  assert.match(claim, /owner\?mode=login/);
});

test("password reset and confirmation fields use independent PasswordField toggles", () => {
  assert.match(resetSource, /import \{ PasswordField \}/);
  assert.match(resetSource, /id="new-password"/);
  assert.match(resetSource, /id="confirm-password"/);
  assert.equal((resetSource.match(/<PasswordField/g) || []).length, 2);
  assert.match(resetSource, /autoComplete="new-password"/);
  assert.match(resetSource, /updateUser\(\{ password \}\)/);
  assert.doesNotMatch(resetSource, /id="new-password"[^>]*type="password"/);
  assert.doesNotMatch(resetSource, /id="confirm-password"[^>]*type="password"/);
});

test("recovery-session reset form remains gated; live toggle QA is documented as deferred", () => {
  assert.match(resetSource, /PASSWORD_RECOVERY/);
  assert.match(resetSource, /recoveryPending/);
  assert.match(resetSource, /allowed \?/);
  assert.match(resetSource, /text\.errors\.expired/);
  const proposal = readFileSync(
    "supabase/proposals/20261126280000_password_visibility_toggle.md",
    "utf8",
  );
  assert.match(proposal, /Untested: recovery-session reset form/);
  assert.match(proposal, /Do \*\*not\*\* send production password-reset emails/);
});

test("show/hide toggle does not change Design 2 routes or auth redirect surfaces", () => {
  for (const path of [
    "app/washington/washington-directory-client.tsx",
    "app/washington/map/page.tsx",
    "components/washington-public.tsx",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.equal(source.includes("PasswordField"), false, path);
    assert.equal(source.includes("showPassword"), false, path);
  }
  assert.match(ownerSource, /recoveryRedirectUrl|clearRecoveryPending/);
  assert.match(resetSource, /PASSWORD_RECOVERY|recoveryPending/);
});

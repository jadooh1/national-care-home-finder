import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AUTH_CALLBACK_PATH,
  authCallbackHandoffHref,
  authCallbackParamsPresent,
  recoveryRedirectOrigin,
} from "../../../lib/password-recovery.ts";
import { PUBLIC_CANONICAL_ORIGIN } from "../../../lib/public-indexing.ts";

const recoverySource = readFileSync("lib/password-recovery.ts", "utf8");
const catcherSource = readFileSync("components/auth-callback-catcher.tsx", "utf8");
const layoutSource = readFileSync("app/layout.tsx", "utf8");
const callbackSource = readFileSync("app/auth/callback/page.tsx", "utf8");
const resetSource = readFileSync("app/owner/reset-password/page.tsx", "utf8");
const proposal = readFileSync(
  "supabase/proposals/20261127050000_password_recovery_callback_handoff.md",
  "utf8",
);

test("homepage Site URL fallback hands Auth params to /auth/callback", () => {
  const href =
    "https://www.nationalcarehomefinder.com/?code=abc123&type=recovery";
  assert.equal(authCallbackParamsPresent(href), true);
  assert.equal(
    authCallbackHandoffHref(href),
    "https://www.nationalcarehomefinder.com/auth/callback?code=abc123&type=recovery",
  );
});

test("hash-token recovery on / also hands off with hash preserved", () => {
  const href =
    "https://www.nationalcarehomefinder.com/#access_token=tok&type=recovery&refresh_token=r";
  assert.equal(
    authCallbackHandoffHref(href),
    "https://www.nationalcarehomefinder.com/auth/callback#access_token=tok&type=recovery&refresh_token=r",
  );
});

test("already on /auth/callback does not hand off again", () => {
  const href =
    "https://www.nationalcarehomefinder.com/auth/callback?code=abc123&type=recovery";
  assert.equal(authCallbackHandoffHref(href), null);
  assert.equal(AUTH_CALLBACK_PATH, "/auth/callback");
});

test("ordinary homepage traffic is not treated as Auth callback", () => {
  assert.equal(authCallbackParamsPresent("https://www.nationalcarehomefinder.com/"), false);
  assert.equal(authCallbackHandoffHref("https://www.nationalcarehomefinder.com/"), null);
  assert.equal(authCallbackHandoffHref("https://www.nationalcarehomefinder.com/washington"), null);
});

test("apex recovery origin prefers www canonical", () => {
  assert.equal(
    recoveryRedirectOrigin("https://nationalcarehomefinder.com"),
    PUBLIC_CANONICAL_ORIGIN,
  );
  assert.equal(
    recoveryRedirectOrigin("https://www.nationalcarehomefinder.com"),
    "https://www.nationalcarehomefinder.com",
  );
});

test("layout mounts AuthCallbackCatcher; callback still routes recovery to reset", () => {
  assert.match(layoutSource, /AuthCallbackCatcher/);
  assert.match(catcherSource, /authCallbackHandoffHref/);
  assert.match(catcherSource, /location\.replace/);
  assert.match(recoverySource, /authCallbackHandoffHref/);
  assert.match(recoverySource, /handedOff/);
  assert.match(callbackSource, /router\.replace\("\/owner\/reset-password"\)/);
});

test("reset-password form keeps Show/Hide PasswordField pair", () => {
  const fields = resetSource.match(/<PasswordField/g) ?? [];
  assert.equal(fields.length, 2);
  assert.match(resetSource, /showPassword/);
  assert.match(resetSource, /hidePassword/);
  assert.match(resetSource, /PASSWORD_RECOVERY/);
});

test("proposal documents production Site URL and redirect allowlist approval", () => {
  assert.match(proposal, /Site URL/);
  assert.match(proposal, /Redirect URLs/);
  assert.match(proposal, /www\.nationalcarehomefinder\.com\/auth\/callback/);
  assert.match(proposal, /yiehgstweswxjakbcdzc/);
  assert.match(proposal, /No repeated recovery emails/);
});

# Show / hide password toggle (development)

## Summary

Adds an eye-icon control that toggles password visibility on owner and
administrator credential fields. Passwords remain hidden by default. The same
`/owner` portal is the sign-in surface for owners and administrators.

**Integration base:** stacked on PR #232 (`cursor/washington-launch-completion-617b`)
so `/owner?mode=login` deep-link and roster evidence remain intact.

## Surfaces covered

| Surface | Fields | Browser verified |
| --- | --- | --- |
| Owner / admin register | Password | Yes |
| Owner / admin sign-in | Password | Yes |
| Password reset (recovery session) | New password + confirm | **No — see gap below** |

Recover-by-email stays email-only (no password field).

## Untested: recovery-session reset form

The `/owner/reset-password` page only renders the new/confirm password fields when
a valid `PASSWORD_RECOVERY` / recovery-pending session is present. Without that
session the page shows the expired-link message and **no form**.

| Item | Status |
| --- | --- |
| Source wiring (`PasswordField` ×2 on new + confirm) | Present; unit-tested |
| Live browser toggle with recovery session | **Not exercised** |
| Intentionally skipped | Do **not** send production password-reset emails solely to re-test the eye toggle |

Accept this as a documented residual QA item for a human with an authorized
disposable recovery session, or defer until a controlled recovery fixture exists.
It is **not** a production-auth or Design 2 blocker for this UI change.

## Localization

English and Spanish labels:

- Show password / Mostrar contraseña
- Hide password / Ocultar contraseña

## Accessibility

- Toggle is a `type="button"` with `aria-pressed`, `aria-label`, and `aria-controls`
- Minimum 44×44 px touch target for mobile (~46px observed at 390px viewport)
- Default input `type="password"`; visible mode uses `type="text"` with `spellCheck={false}`
- Existing `autoComplete`, `minLength`, and `maxLength` rules preserved

## Security / Design 2 / PR #232 compatibility

- Display-only toggle; does not change Auth APIs, redirects, or password policy
- Preserves `#232` owner `mode`/`tab` deep-link and `ownerSignInHref` login mode
- No Design 2, Washington public directory, billing, or schema changes
- Development implementation; production deploy requires separate approval

## Verification

- `node --experimental-strip-types --test supabase/proposals/tests/password_visibility_toggle.ts`
- `node --experimental-strip-types --test supabase/proposals/tests/washington_owner_claim_entry.ts`
- `node --experimental-strip-types --test supabase/proposals/tests/washington_roster_reconciliation.ts`
- `npm run build`
- Browser smoke: register/sign-in EN+ES + mobile (recovery form deferred as above)

## Approvals requested

1. Merge into `development` after CI green (this branch / PR).
2. Production deploy — separate human gate.
3. Optional later: human recovery-session QA of reset toggles (no agent-initiated resets).

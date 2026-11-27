# Password recovery callback handoff (Site URL fallback)

## Problem

Production password recovery emails were received, but opening the link landed on
the National Care Home Finder **homepage** instead of `/owner/reset-password`.

App recovery always requests:

`redirectTo = <origin>/auth/callback`

`/auth/callback` exchanges the Auth `code` / OTP and routes recovery sessions to
`/owner/reset-password`. The homepage previously did **not** hand off Auth
params, so when Supabase fell back to **Site URL** (`/`) — typically because
`/auth/callback` was missing from the Redirect URLs allowlist, or Site URL did
not match the requested host — the recovery tokens were never exchanged and the
reset form never opened.

## App fix (this change)

1. `authCallbackHandoffHref` / `AuthCallbackCatcher` — any route that receives
   Auth query/hash params (including `/`) redirects to `/auth/callback` **with
   params preserved** before stripping.
2. `captureAndStripAuthCallback` — same handoff when invoked outside
   `/auth/callback` (owner/admin pages), so module-level capture cannot destroy
   an unexchanged `code`.
3. `recoveryRedirectOrigin` — recovery/signup redirects from the apex host
   `nationalcarehomefinder.com` prefer
   `https://www.nationalcarehomefinder.com/auth/callback`.

Show/Hide Password on `/owner/reset-password` is unchanged (`PasswordField` ×2).

## Required production Supabase Auth configuration (human approval)

In project `yiehgstweswxjakbcdzc` → Authentication → URL configuration:

| Setting | Required value |
| --- | --- |
| **Site URL** | `https://www.nationalcarehomefinder.com` |
| **Redirect URLs** (allowlist) must include | `https://www.nationalcarehomefinder.com/auth/callback` |
| Also allow if used | `https://nationalcarehomefinder.com/auth/callback` |
| Also allow if used | `https://national-care-home-finder.vercel.app/auth/callback` |
| Preview (optional) | matching `https://*.vercel.app/auth/callback` patterns already in use |

Without the allowlist entry for `/auth/callback`, Supabase continues to send
users to Site URL (`/`). The app handoff now recovers that case, but the
allowlist remains the correct primary fix.

## Out of scope

- No repeated recovery emails from agents
- No production deploy until human approves (code → `development`, then prod)
- No Auth user password changes, billing, or roster/state expansion

## Verification (no new recovery emails required)

1. Unit tests: handoff URL construction; apex → www redirect origin; reset page
   still mounts `PasswordField`.
2. After deploy: open a **synthetic** URL on production
   `https://www.nationalcarehomefinder.com/?code=test&type=recovery` and confirm
   the browser navigates to `/auth/callback?...` (session will expire — that is
   expected). Do **not** send another recovery email solely for this check.
3. Optional later: one controlled Owner B recovery after allowlist + deploy,
   confirming `/owner/reset-password` with Show/Hide toggles.

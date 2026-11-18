# Washington production cutover — catalog verify (REVIEW ONLY)

**Do not apply automatically.** Companion checklist for human-gated A2/A3 catalog confirmation. Agents must not run this against production (`yiehgstweswxjakbcdzc`). A3–A5 remain **UNAPPROVED** for production execution.

## Script safety

| Guard | Behavior |
| --- | --- |
| Header | States VERIFY-only; no DDL/DML that modifies data or config |
| Session GUCs | Requires `nchf.cutover_verify_authorization` + `nchf.cutover_verify_target=yiehgstweswxjakbcdzc` |
| Transaction | `BEGIN` → `SET TRANSACTION READ ONLY` → checks → `COMMIT` |
| Privilege method | `has_table_privilege('anon'\|'authenticated', …)` — **not** current-session `SELECT` probes |
| Mutating SQL | None (`CREATE`/`ALTER`/`GRANT`/`REVOKE`/`INSERT`/`UPDATE`/`DELETE`/`DROP` absent) |

GUCs do **not** prove which database is connected. A human must still confirm the SQL console / pooler host before running.

## Expected results (production posture)

| Check | Pass rule |
| --- | --- |
| Required relations present | `wa_afh_published_owner_content`, `wa_afh_premium_owner_content`, `wa_afh_claimed_owner_content`, `published_owner_listings`, `premium_subscriptions`, `premium_subscription_events`, `app_admins` |
| Ungated published view | **Neither** `anon` nor `authenticated` has `SELECT` (or write) on `wa_afh_published_owner_content` |
| Premium owner view | **Both** `anon` and `authenticated` have `SELECT` on `wa_afh_premium_owner_content`; no write privileges |
| Claimed owner view | `anon` has **no** `SELECT`; `authenticated` has `SELECT`; neither role has write privileges |
| Subscription tables | Browser roles have **no** `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` on `premium_subscriptions` / `premium_subscription_events` |
| Development ledger RPC | `development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)` is **absent** |
| Entitlement count | `NOTICE` only; **0** rows is the approved MVP default with billing off |

On success the session emits:  
`washington cutover verify posture OK (published closed; premium SELECT for anon+authenticated; claimed SELECT for authenticated only; ledger RPC absent)`.

## Development / isolated validation behavior

| Host | What happens |
| --- | --- |
| Development (`ajjsyloyihcqdomywhik`) without production GUCs | Fails immediately: target is not the reviewed production project |
| Development with forged production GUCs | Still **fails**: development ledger RPC is present → `refuses the development premium ledger RPC` |
| Isolated fixture without the RPC / with matching grants | Can pass the privilege + absence checks without touching production |
| Production (human-only, after A3 approval) | Passes only if catalog matches the table above |

Static repo check (no database): `node --test --experimental-strip-types supabase/proposals/tests/washington_production_cutover_verify.ts`.

## App read path (cutover app)

| Surface | Required view | Notes |
| --- | --- | --- |
| Family facility profile | `wa_afh_premium_owner_content` | Do **not** use `wa_afh_published_owner_content`. |
| Signed-in owner listing edits | `wa_afh_claimed_owner_content` | Via `manageableOwnerContentView`. |
| Live billing / development ledger | Disabled on production host | Keep RPC absent; no checkout on prod host. |
| Public entitled owner text at cutover | Empty until separate approval | Zero entitlement rows → premium view returns no rows. |

## Do not re-apply (already present on production)

- `20261113200000_premium_owner_text_gate.sql` — objects exist; proposal refuses re-create.
- `20261109120000_premium_option_a_development.sql` — development-only; never production.
- `20261109140000_development_owner_text_grants.sql` — development-only.
- `20261113210000_owner_listing_read_REVIEW_ONLY.sql` — refuses if `wa_afh_claimed_owner_content` already exists (it does on production).

## Preserve (document; no prod writes from agents)

- Original administrator membership (`69030d82-…`).
- Existing facilities / claims / publications / audit rows.
- RLS/grants: ungated published view remains unreadable to `anon` / `authenticated`.
- No synthetic `…e2` / `…02` / `999…` imports; no development entitlement copy.

## Limitations

1. Role privilege checks are grant-level; they do **not** prove RLS row filters for a specific owner/admin JWT.
2. Session GUCs are human-supplied and can be mistyped against the wrong pooler — host confirmation is still required.
3. Entitlement `count(*)` needs a role that can read `premium_subscriptions` (typically SQL console / elevated role). Browser roles are expected to lack that privilege.
4. Auth redirect allowlist and Vercel env targets are **out of scope** for this SQL (see A2 readiness report).
5. This file is not a migration and must not be applied as one.

## Rollback implications

| Layer | Implication |
| --- | --- |
| This VERIFY script | **No rollback.** It changes nothing when it runs (READ ONLY). Failure leaves catalog untouched. |
| Prior gate / claimed-view applies | Only use matching `*_ROLLBACK.sql` if that forward script was actually applied; reopening ungated published text is a **security downgrade** and needs explicit approval. |
| App | Redeploy previous known-good production deployment SHA (A4-style approval). |
| Entitlements / audits | Do not DELETE entitlement or publication audit history if a later entitlement path is approved. |

## Human confirmation probes still required outside this script

1. Auth redirect allowlist includes production www (+ vercel host if used).
2. Production Vercel env → production Supabase host only.
3. Original admin membership intact (dashboard / privileged read — not asserted here).

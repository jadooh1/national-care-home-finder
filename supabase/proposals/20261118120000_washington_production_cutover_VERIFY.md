# Washington production cutover — catalog verify (REVIEW ONLY)

**Do not apply automatically.** This companion to the cutover draft PR is a human-gated checklist. No agent may run it against production.

## App read path (this PR)

| Surface | Required view | Notes |
| --- | --- | --- |
| Family facility profile | `wa_afh_premium_owner_content` | Unconditional. Do **not** use `wa_afh_published_owner_content`. |
| Signed-in owner listing edits | `wa_afh_claimed_owner_content` | Via `manageableOwnerContentView`. |
| Live billing / development ledger | Disabled on production host | `developmentBillingAllowed` / `developmentCheckoutIntent` refuse non-dev hosts. |
| Public entitled owner text at cutover | Empty until separate approval | Zero entitlement rows → premium view returns no rows (safe empty). |

## Do not re-apply (already present on production)

- `20261113200000_premium_owner_text_gate.sql` — objects exist; proposal refuses re-create.
- `20261109120000_premium_option_a_development.sql` — development-only; never production.
- `20261109140000_development_owner_text_grants.sql` — development-only.
- `20261113210000_owner_listing_read_REVIEW_ONLY.sql` — refuses if `wa_afh_claimed_owner_content` already exists (it does on production).

## Preserve (document; no prod writes from agents)

- Original administrator membership (`69030d82-…`).
- Existing facilities / claims / publications / audit rows.
- RLS: ungated published view remains unreadable to `anon` / `authenticated`.
- No synthetic `…e2` / `…02` / `999…` imports; no development entitlement copy.

## Human A2 confirmation probes (dashboard / SQL console by human)

1. `wa_afh_published_owner_content` — SELECT denied for browser roles.
2. `wa_afh_premium_owner_content` — SELECT allowed; row count may be **0**.
3. `wa_afh_claimed_owner_content` — readable by authenticated approved owner / admin for own facilities.
4. `development_record_premium_subscription` — **absent**.
5. Auth redirect allowlist includes production www (+ vercel host if used).
6. Production Vercel env → production Supabase host only.

## Rollback posture

- App rollback: redeploy previous production deployment SHA (A4-style approval).
- Do **not** reopen ungated published text without explicit security approval.
- Do not DELETE entitlement or publication audit history if any later entitlement path is approved.

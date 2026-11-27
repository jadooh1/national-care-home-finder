# Acquisition monitoring snapshot — 2026-11-27

**Scope:** Washington organic surfaces + Batch 1 claim/outreach readiness.  
**No** production/GA/billing/other-state changes. **No** paid spend recorded.

## Organic search (agent-observable)

| Check | Result |
|-------|--------|
| `/washington` HTTP | **200** |
| `/sitemap.xml` HTTP | **200** |
| Sitemap URL count | **6,287** total · **~6,284** Washington paths |
| WA hubs in sitemap | `/washington`, `/map`, `/cities`, `/counties` present |
| `robots.txt` | Allows `/`; Disallows `/owner`, `/admin`, `/auth`, `/development`, `/oregon`; Sitemap declared |

### GSC Pages / Performance (human console)

| Metric | Last recorded | This check |
|--------|---------------|------------|
| Indexed | **277** (baseline 2026-11-22) | *Not refreshed — no GSC session in agent* |
| Not indexed | **6,013** (baseline 2026-11-22) | *Not refreshed* |
| Impressions / clicks | — | *Not refreshed* |

Do **not** re-verify domain or re-submit sitemap unless GSC shows an error.

## Legitimate owner claims

| Check | Result |
|-------|--------|
| Admin claim ledger / DB read | **Blocked** — production Supabase key in this environment rejected (`Invalid API key`); agent cannot count pending/verified claims |
| Public claim path | Still via facility profile → “Claim this facility” / owner portal (unchanged) |

Record claim counts in `weekly_acquisition_tracker.csv` when admin ledger is available.

## Batch 1 outreach status (materials)

| Item | Status |
|------|--------|
| Phase 1 letters PDF (20) | Ready — `print/batch1_phase1_letters_20.pdf` |
| Phase 1 mailing labels | Ready — `print/batch1_phase1_mailing_labels.pdf` |
| Phase 1 physical mail | Pending human print/postage (≤ $150 combined) |
| Phases 2–3 (80) | **Held** for response review |
| Referral contacts (6) | Ready — `family_referral_contacts_batch1.md` |
| Referral intros (6) | Ready — `family_referral_intros_batch1.md` |
| Referral sends | Pending human mailbox |
| Social Posts A + B1 | **Queued / suspended** — `social_publish_queue_batch1.md` |

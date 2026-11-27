# Washington commercial validation — Batch 1 consolidation

**Branch:** `cursor/wa-acquisition-execution-prep-5a8c` → PR into **development**.  
**Purpose:** Single development PR consolidating approved Batch 1 acquisition deliverables for commercial validation.  
**Unchanged:** production runtime, billing, GA, paid advertising, other-state publication.

## Consolidated deliverables (in `supabase/proposals/acquisition/`)

| Deliverable | Path |
|-------------|------|
| Phase 1 print letters (20) | `print/batch1_phase1_letters_20.pdf` |
| Phase 1 mailing labels | `print/batch1_phase1_mailing_labels.pdf` |
| Prospect funnel tracker (prepared/sent/delivered/responded/converted) | `prospect_funnel_tracker_batch1.csv` + `prospect_funnel_definitions.md` |
| Weekly commercial report | `weekly_commercial_report.md` (+ scorecard/tracker) |
| Claims baseline | **0** legitimate production owner claims as of **2026-11-27** |
| Referral contacts + intros (≤6) | `family_referral_contacts_batch1.md`, `family_referral_intros_batch1.md` |
| No-cost opportunities (no social auth) | `no_cost_acquisition_opportunities.md` |
| Social A/B1 | Queued / **suspended** — `social_publish_queue_batch1.md` |

## Holds

- Owner outreach **phases 2 and 3** until Phase 1 response review.
- Facebook/LinkedIn publish until authenticated sessions exist (no login retries from agent).

## Human intervention only

1. Print/mail Phase 1 under ≤$150 postage+print.
2. Send ≤6 referral intros from a real mailbox.
3. Weekly GSC export + admin claims ledger into `weekly_commercial_report.md`.

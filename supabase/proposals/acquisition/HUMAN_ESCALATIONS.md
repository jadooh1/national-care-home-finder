# Batch 1 — human actions required

Agent materials for Phase 1 are ready. Remaining blockers are mail, payment, and social authentication.

## 1. Print & mail Phase 1 (20) — print PDFs ready

- **Letters PDF:** [batch1_phase1_letters_20.pdf](https://github.com/jadooh1/national-care-home-finder/raw/cursor/wa-acquisition-execution-prep-5a8c/supabase/proposals/acquisition/print/batch1_phase1_letters_20.pdf)
- **Mailing labels (Avery 5160):** [batch1_phase1_mailing_labels.pdf](https://github.com/jadooh1/national-care-home-finder/raw/cursor/wa-acquisition-execution-prep-5a8c/supabase/proposals/acquisition/print/batch1_phase1_mailing_labels.pdf)
- Details: `print/README.md`
- Budget: count spend toward **$150** postage + printing ceiling
- Log spend + mail date in `execution_log_batch1.csv`

**Hold Phase 2 (30) and Phase 3 (50)** until response review of the prior phase is recorded.

## 2. Facebook + LinkedIn authentication (required to publish)

**Genuine blocker (2026-11-27, after remote-desktop auth claim):** Agent Chrome (`--user-data-dir=.../google-chrome-cdp`) still has **no** Facebook/LinkedIn session cookies (`c_user`/`xs`/`li_at` absent). Login walls remain. Posts A/B1 **not** published. Latest evidence: `/opt/cursor/artifacts/social-linkedin-still-logged-out-2.png`.

**Unblock (pick one — agent will not retry login):**
1. In remote desktop, confirm the **same** Chrome window shows a **logged-in feed** (not a login form) for both sites as the National Care Home Finder Page/Company, leave tabs open, reply “feeds visible”, **or**
2. Publish Post A + B1 yourself (copy in `social_publish_queue_batch1.md`) and paste the **four permalinks** (FB A, LI A, FB B1, LI B1).

Organic only — **no boosts**. Nextdoor deferred.

## 3. Family referral intros (≤6) — contacts identified

Public org contacts: `family_referral_contacts_batch1.md`  
Approved copy: `family_referral_intros_batch1.md`  
Send from a real mailbox; log each send.

## 4. Weekly tracking

Fill `weekly_acquisition_scorecard.md` and `weekly_acquisition_tracker.csv`.

## Not in scope

Production code, GA, billing, other-state publication, paid advertising, list purchases, Nextdoor, mailing the remaining 80 letters.

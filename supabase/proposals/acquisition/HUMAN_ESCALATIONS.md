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

**Genuine blocker (re-confirmed after “auth completed”):** this VM’s Chrome still shows Facebook and LinkedIn login walls. Auth likely happened in a different browser/profile than the agent’s Chrome (`google-chrome-cdp`). No Page session and no API tokens are available here. Screenshots: `/opt/cursor/artifacts/social-linkedin-still-logged-out.png` (plus earlier login-wall PNGs).

**Please do one of the following:**
1. In **this agent’s Chrome window** (the computer-use browser), sign in as admin of the existing National Care Home Finder Facebook Page and LinkedIn Company Page, leave those tabs open, and reply — agent will publish Post A then B1 and return permalinks, **or**
2. Publish Post A (and B1 Tacoma) yourself from `social_publish_queue_batch1.md` and paste the two post URLs here so the queue can continue, **or**
3. Provide Page-admin access another way that this environment can use (still no paid boosts / no new accounts).

Organic only — **no boosts**. Nextdoor remains deferred.

## 3. Family referral intros (≤6) — contacts identified

Public org contacts: `family_referral_contacts_batch1.md`  
Approved copy: `family_referral_intros_batch1.md`  
Send from a real mailbox; log each send.

## 4. Weekly tracking

Fill `weekly_acquisition_scorecard.md` and `weekly_acquisition_tracker.csv`.

## Not in scope

Production code, GA, billing, other-state publication, paid advertising, list purchases, Nextdoor, mailing the remaining 80 letters.

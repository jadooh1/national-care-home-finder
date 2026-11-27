# Prospect funnel stages — Batch 1 execution tracker

Source of truth: `prospect_funnel_tracker_batch1.csv` (one row per prospect).  
Update columns as events occur; do not invent deliveries or responses.

| Stage | Column | Meaning | Flip to `yes` when |
|-------|--------|---------|-------------------|
| **Prepared** | `prepared` | Personalized letter + address ready (PDF for Phase 1) | Materials exist (already `yes` for all 100 as of 2026-11-27) |
| **Sent** | `sent` | Outreach left our control | Letter dropped at USPS / handed to carrier (Phase 1 only until gates clear) |
| **Delivered** | `delivered` | Reach confirmed at address | No return-to-sender / USPS tracking delivered / recipient confirmed receipt |
| **Responded** | `responded` | Inbound owner engagement | Phone/email/mail reply, portal question, or documented association handoff reply |
| **Converted** | `converted` | Legitimate commercial outcome | Owner claim **submitted** or **verified** in admin for that license (not spam/duplicate) |

## Gates

- Phase 1 (20): sendable after print/postage.
- Phase 2 (30): `hold_reason=HOLD_UNTIL_PHASE1_RESPONSE_REVIEW`
- Phase 3 (50): `hold_reason=HOLD_UNTIL_PHASE2_RESPONSE_REVIEW`

## Claims baseline

Production owner-claim baseline: **0** legitimate claims as of **2026-11-27**.  
All conversions after that date count toward weekly commercial reporting.

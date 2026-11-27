# Batch 1 acquisition — approved execution plan

**Approved:** all 100 owner prospects; organic Posts A–E on Facebook + LinkedIn; ≤6 family referral intros.  
**Deferred:** Nextdoor.  
**Budget cap:** $150 combined postage + printing. **No** paid advertising, boosts, subscriptions, or list purchases.  
**Unchanged:** production code, GA, billing, other-state publication.

---

## Phased owner outreach (20 / 30 / 50)

| Phase | Count | Gate | File | Letters |
|-------|------:|------|------|---------|
| 1 | 20 | **APPROVED_SEND_NOW** — ship after print/postage | `owner_outreach_phase1_20.csv` | `letters_phase1/` |
| 2 | 30 | **HOLD_UNTIL_PHASE1_RESPONSE_REVIEW** | `owner_outreach_phase2_30.csv` | `letters_phase2/` |
| 3 | 50 | **HOLD_UNTIL_PHASE2_RESPONSE_REVIEW** | `owner_outreach_phase3_50.csv` | `letters_phase3/` |

Master CSV: `owner_outreach_batch1_personalized.csv`  
Manifest: `batch1_approval_manifest.json`  
Preview: `owner_outreach_batch1_preview.md`

**Letter compliance (all phases):**
- No internal approval footers
- Independence disclaimer: independent directory, not a government agency, not affiliated with or endorsed by Washington DSHS
- Claim URL + facility page URL included

**Do not print or mail Phase 2/3 until response review of the prior phase is recorded.**

---

## 30-day schedule (adjusted for phases)

| Window | Owner mail | Social (FB + LI) | Referrals | Tracking |
|--------|------------|------------------|-----------|----------|
| Days 1–3 | Print + mail **Phase 1** (20) | Post A | — | Log send dates |
| Days 4–7 | — | Post B1 (Tacoma) | Intro 1–2 | Week 1 scorecard |
| Days 8–14 | **Phase 1 response review**; if OK → print/mail **Phase 2** (30) | Posts C, E | Intro 3–4 | Week 2 scorecard |
| Days 15–21 | Collect Phase 2 responses | Post D, B2 (Vancouver) | Intro 5–6 | Week 3 scorecard |
| Days 22–30 | **Phase 2 response review**; if OK → print/mail **Phase 3** (50) | B3/B4 as capacity | — | Week 4 scorecard + 30-day rollup |

Organic search: pull GSC indexing + query impressions weekly into `weekly_acquisition_tracker.csv` (no production/GA code changes).

---

## Budget (postage + printing ≤ $150)

| Item | Estimate | Notes |
|------|--------:|-------|
| Phase 1 print (20 × 1 page) | ~$8–15 | B&W laser / copy shop |
| Phase 1 postage (20 × Forever) | ~$15–18 | USPS First-Class |
| Phase 2 print + postage (30) | ~$35–45 | Only after Phase 1 review |
| Phase 3 print + postage (50) | ~$55–70 | Only after Phase 2 review |
| **Ceiling** | **$150** | Stop if remaining balance insufficient |

Envelopes: use existing stock if available; otherwise include in print line under the same $150 cap.  
No paid ads, boosts, Nextdoor paid, list buys, or SaaS subscriptions for this batch.

---

## Agent vs human

| Activity | Agent (done / autonomous) | Human escalate |
|----------|---------------------------|----------------|
| Prospect list + phased CSVs | Done | — |
| Personalized letters (phases 1–3) | Done | — |
| Independence disclaimer / no footers | Done | — |
| Social copy A–E (FB/LI; Nextdoor deferred) | Done | Authenticate + publish |
| Referral intros 1–6 | Done | Send from real mailbox |
| Schedule + budget + trackers | Done | — |
| Physical print + USPS mail | — | **Required** |
| Postage / print payment ≤ $150 | — | **Required** |
| FB / LinkedIn login + publish | — | **Required** |
| Phase 2/3 gate after response review | Prep materials ready | Confirm review outcome |

---

## Escalation packet (immediate)

1. **Print & mail Phase 1 only** — use `letters_phase1/` (20 files) + `owner_outreach_phase1_20.csv` for addresses.  
2. **Pay** print + postage from the $150 cap; record actual spend in `execution_log_batch1.csv`.  
3. **Authenticate** Facebook Page + LinkedIn Page; publish Post A (then B1 per schedule).  
4. **Send** up to six referral intros when contacts are available.  
5. **Do not** mail Phase 2/3 until response review is logged.

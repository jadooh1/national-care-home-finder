# Washington organic acquisition initiatives (no spend)

## Status

**Planning / drafts only.** Do **not** launch campaigns, send outreach, or change
production from this document. GA, billing, paid ads, and other-state publication
remain **disabled**.

Depends on Phase 3 baseline (`20261127200000_washington_organic_growth_phase3_baseline.md`)
merged via PR #248 → `development` @ `62d9b0b`. Pagination correction remains closed at
production `187d907`.

---

## Priority markets (verified roster)

Focus unpaid family discovery and owner claims where AFH density is highest.

### Tier A — counties (first)

| County | AFHs | Family entry URL | Owner angle |
| --- | ---: | --- | --- |
| King | 1,834 | `/washington?county=King` | Largest claim pool; admin review priority |
| Snohomish | 1,195 | `/washington?county=Snohomish` | Strong Lynnwood/Everett city density |
| Pierce | 1,091 | `/washington?county=Pierce` | Tacoma / Lakewood / Puyallup cluster |
| Spokane | 649 | `/washington?county=Spokane` | Eastern WA hub + Spokane Valley |
| Clark | 605 | `/washington?county=Clark` | Vancouver is #1 city by AFH count |
| Thurston | 345 | `/washington?county=Thurston` | Olympia / Lacey capital-region |

### Tier A — cities (share + local SEO)

| City | County | AFHs | Share / deep link |
| --- | --- | ---: | --- |
| Vancouver | Clark | 528 | `/washington?city=Vancouver&county=Clark` |
| Tacoma | Pierce | 378 | `/washington?city=Tacoma&county=Pierce` |
| Spokane | Spokane | 354 | `/washington?city=Spokane&county=Spokane` |
| Lynnwood | Snohomish | 317 | `/washington?city=Lynnwood&county=Snohomish` |
| Everett | Snohomish | 315 | `/washington?city=Everett&county=Snohomish` |
| Kent | King | 289 | `/washington?city=Kent&county=King` |
| Federal Way | King | 281 | `/washington?city=Federal+Way&county=King` |
| Lakewood | Pierce | 279 | `/washington?city=Lakewood&county=Pierce` |
| Spokane Valley | Spokane | 257 | `/washington?city=Spokane+Valley&county=Spokane` |
| Renton | King | 205 | `/washington?city=Renton&county=King` |

Hubs to cite in every outreach pack: `/washington`, `/washington/cities`,
`/washington/counties`, `/washington/map`.

---

## Family acquisition initiatives

### F1 — Place-pack share kit (no spend)

**Goal:** Families and referral partners open the right filtered directory in one click.

**Assets (existing product):**

1. County pack: six Tier A county URLs + `/washington/counties`
2. City pack: ten Tier A city URLs + `/washington/cities`
3. Always include: homepage → “Search Washington homes”, map `/washington/map`, EN/ES language note

**Conversion path:**

`share link` → filtered `/washington?…` → shortlist (≤3) → facility profile → DSHS disclosure / contact paths

**Measurable targets (GSC + ops):**

| Metric | 30-day target vs Phase 3 start |
| --- | --- |
| Clicks to `/washington` | ↑ week over week in GSC |
| Clicks to `/washington/cities` + `/washington/counties` | Combined ↑ |
| Landing page impressions for ≥5 Tier A city/county queries | Visible in GSC Performance |
| Indexed pages | **> 277** (vs 2026-11-22); prefer Discovered-not-indexed **< 4,786** |

**Launch rule:** Human may paste share kits into community lists; agent does not send.

### F2 — Referral intro (aging / hospital / faith / senior centers)

**Audience:** Discharge planners, ADRCs, senior centers, faith communities in Tier A counties.

**Draft message (English) — approve before send:**

> Subject: Free Washington adult family home directory (DSHS-linked)
>
> We maintain a free public directory of licensed Washington adult family homes
> (6,278 listings) at https://www.nationalcarehomefinder.com/washington
>
> Families can filter by city or county, compare a short shortlist, and open each
> home’s profile with links to official DSHS resources. Examples:
> - King County: https://www.nationalcarehomefinder.com/washington?county=King
> - Tacoma: https://www.nationalcarehomefinder.com/washington?city=Tacoma&county=Pierce
>
> This is an independent informational directory — not a placement agency and not
> a paid referral network. No cost to families or providers to browse.

**Spanish:** use site EN/ES toggle; keep official DSHS disclaimer tone from site copy.

**Target:** ≥6 warm intros across Tier A counties in 30 days (human-sent); track referred
landing clicks via GSC if UTM-free path is hubs/filters only.

### F3 — Organic content hygiene (no new doorways)

**Actions (require separate approval if code/copy changes):**

- Keep internal links from hubs → Tier A filters healthy
- Prefer sharing **filtered directory URLs** over inventing `/city/slug` paths
- Spot GSC “Crawled — not indexed” samples among Tier A landings after SSR Phase 2

---

## AFH owner acquisition → verified claims

### O1 — Claim conversion path (existing)

```
Facility profile → “Claim this facility” → /owner (login/register)
  → submit ownership claim → admin review → approved claim
  → optional listing proposal (separate admin publish)
```

**Preserve:** Claim does not alter DSHS name/address/license/capacity; owner text
publishes only after admin review.

### O2 — Owner outreach pack (Tier A)

**Draft message — approve before send:**

> Subject: Claim your licensed Adult Family Home listing (free)
>
> Your home may already appear in the public Washington directory:
> https://www.nationalcarehomefinder.com/washington
>
> Search by city or license, open your profile, and choose **Claim this facility**.
> Create a free owner account, submit a short claim, and an administrator will review it.
> Approved owners can later propose public description/services text (still reviewed).
>
> Official DSHS licensing data stays authoritative. Claiming is free — no billing or ads.
>
> Owner portal: https://www.nationalcarehomefinder.com/owner?mode=login

**Target segments:** AFH associations / Facebook groups / county provider lists in
King, Pierce, Snohomish, Clark, Spokane, Thurston — **human send only**.

### O3 — Admin conversion ops

| Cadence | Action | Target |
| --- | --- | --- |
| Weekly | Count pending / approved / rejected claims | Ledger snapshot |
| Weekly | Review **Tier A county** pending claims first | Reduce pending age |
| Monthly | Approved claims MoM | **Net ↑ approved** vs prior month |

**30-day owner targets:**

| Metric | Target |
| --- | --- |
| New claim submissions | ≥10 (any WA) |
| Approved claims | ≥5 |
| Approved in Tier A counties | ≥4 of those 5 |

---

## Measurement board (no GA)

| Channel | Source | Cadence |
| --- | --- | --- |
| Indexing | GSC Pages vs 2026-11-22 (277 indexed / 6,013 not indexed) | Weekly |
| Visibility | GSC Performance (queries + landings) | Weekly |
| Family | GSC clicks to hubs + Tier A filter URLs | Weekly |
| Owners | Admin claim counts | Weekly |
| Guardrails | Confirm no gtag / no billing / WA-only public | Monthly spot |

**Do not** enable production GA, paid ads, billing, or other-state publication for these initiatives.

---

## Explicit non-goals

- Launching email/SMS/social campaigns from the agent
- Paid search, boosts, or sponsorships
- Production code changes from this proposal alone
- Duplicate GSC verification or sitemap re-submission
- Clear-filters residual work (unless newly reproducible)
- Re-running closed technical acceptance suites

## Execution prep pack

Batch materials (prospects, personalized drafts, social, channels, scorecard):
`supabase/proposals/acquisition/` — see `20261127220000_washington_organic_acquisition_execution_prep.md`.

## Approval gates

| Action | Required |
| --- | --- |
| Send F2 / O2 outreach | **Human approve + human send** (prefer batch approval of `acquisition/`) |
| Copy/SEO code changes (titles, JSON-LD, CTAs) | Explicit approval |
| Production deploy | Explicit approval |
| GA / paid ads / billing / new states | Explicit approval |

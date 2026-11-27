# Washington organic growth Phase 3 — measurable baseline

## Phase transition

| Item | Status |
| --- | --- |
| Pagination soft-nav correction | **CLOSED — shipped & accepted** on production `main` @ `187d907` (PR #247) |
| Production deploy | Vercel READY `8gEshPZ5cKZUcJMoU1vs6p2fQr8R` (live acceptance PASS) |
| Clear filters residual | Documented; **do not pursue** unless newly reproducible |
| Technical acceptance (SSR/hydration/pagination/SEO Phase 2) | Complete — **do not re-run** |
| This assessment | **Docs / planning only** — production unchanged |

## Constraints (unchanged)

- Design 2 preserved; authoritative roster **6,278** Washington AFHs
- Owner/admin claim + review paths preserved
- **Disabled:** billing, paid advertising, production Google Analytics, other-state publication
- No new doorway URL taxonomy without explicit approval (Phase 2: no per-city/county path segments)
- No JSON-LD / production GA without explicit approval

---

## Measurable baseline (as of 2026-11-27)

Sources: live production HTML/sitemap; prior GSC readiness docs; verified city/county market tables.

### A. Google indexing

| Metric | Baseline | How to measure | Owner |
| --- | --- | --- | --- |
| Sitemap URL count | **6,287** (`sitemap.xml`) | Fetch sitemap | Agent (spot) / GSC |
| WA facility URLs in sitemap | **6,278** | Count `/washington/{license}` locs | Agent |
| Public WA hubs in sitemap | `/washington`, `/map`, `/cities`, `/counties`, `/demographics`, `/opportunity` | Sitemap | Agent |
| `robots.txt` | Allow `/`; disallow `/owner`, `/admin`, `/auth`, `/development`, `/oregon` | Live fetch | Agent |
| GSC property verified | **Not confirmed in-app** (`google-site-verification` meta **absent**) | GSC UI | **Human** |
| Sitemap submitted in GSC | Unknown until GSC connected | GSC → Sitemaps | **Human** |
| Indexed page count | Unknown until GSC | GSC → Pages / Coverage | **Human** |

**Gate:** HTML-tag token → Vercel `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` → redeploy → Verify → submit  
`https://www.nationalcarehomefinder.com/sitemap.xml` (see `20261127070000_washington_seo_gsc_organic_readiness.md`).

### B. Search visibility

| Metric | Baseline | How to measure |
| --- | --- | --- |
| Brand / homepage discovery | Domain resolves; homepage titled for national + WA AFH framing | SERP / GSC Performance |
| Query classes to track (unpaid) | `adult family home {city}`, `AFH {county} WA`, brand `national care home finder`, license lookups | GSC queries (after verify) |
| Public web snippet check | Homepage appears for brand-adjacent retrieval; **no reliable city-intent ranking evidence yet** | Manual SERP (human) + GSC |

Until GSC is verified, treat visibility as **instrumentation-blocked**, not product-blocked.

### C. Priority city & county landings (existing functionality)

No separate `/washington/cities/{slug}` doorways. Priority landings are **existing filtered directory URLs** linked from hubs:

#### Priority counties (by listed AFHs on `/washington/counties`)

| Rank | County | AFHs | Directory URL |
| --- | ---: | ---: | --- |
| 1 | King | 1,834 | `/washington?county=King` |
| 2 | Snohomish | 1,195 | `/washington?county=Snohomish` |
| 3 | Pierce | 1,091 | `/washington?county=Pierce` |
| 4 | Spokane | 649 | `/washington?county=Spokane` |
| 5 | Clark | 605 | `/washington?county=Clark` |
| 6 | Thurston | 345 | `/washington?county=Thurston` |

#### Priority cities (by listed AFHs on `/washington/cities`)

| Rank | City | County | AFHs | Directory URL |
| --- | --- | --- | ---: | --- |
| 1 | Vancouver | Clark | 528 | `/washington?city=Vancouver&county=Clark` |
| 2 | Tacoma | Pierce | 378 | `/washington?city=Tacoma&county=Pierce` |
| 3 | Spokane | Spokane | 354 | `/washington?city=Spokane&county=Spokane` |
| 4 | Lynnwood | Snohomish | 317 | `/washington?city=Lynnwood&county=Snohomish` |
| 5 | Everett | Snohomish | 315 | `/washington?city=Everett&county=Snohomish` |
| 6 | Kent | King | 289 | `/washington?city=Kent&county=King` |
| 7 | Federal Way | King | 281 | `/washington?city=Federal+Way&county=King` |
| 8 | Lakewood | Pierce | 279 | `/washington?city=Lakewood&county=Pierce` |
| 9 | Spokane Valley | Spokane | 257 | `/washington?city=Spokane+Valley&county=Spokane` |
| 10 | Renton | King | 205 | `/washington?city=Renton&county=King` |

**Hub pages:** `/washington/cities` (181 city groups), `/washington/counties` (35 counties) — both indexable, canonical www.

### D. Family acquisition

| Funnel step | Existing asset | Baseline signal |
| --- | --- | --- |
| Land | `/`, `/washington` | Live; OG/Twitter ready |
| Orient by place | `/washington/cities`, `/washington/counties`, `/washington/map` | Live SSR hubs |
| Browse / filter | Directory `q` / `city` / `county` / `page` | Soft-nav pagination fixed @ `187d907` |
| Compare | Shortlist (≤3) on directory | Client session storage |
| Decide | Profile `/washington/{license}` + DSHS disclosure links | 6,278 profiles in sitemap |
| Measure | Production GA **off** | Use GSC landing pages after verify; no GA enablement |

### E. AFH owner acquisition → verified claims

| Funnel step | Existing asset | Conversion note |
| --- | --- | --- |
| Discover claim | Profile “Claim this facility” → `ownerClaimHref(license)` | Present on facility profiles |
| Account | `/owner?mode=login` / register; homepage owner CTA EN/ES | Live |
| Submit claim | Owner dashboard claim flow | Admin must approve |
| Verified listing | Approved claim → optional listing proposals (admin publish) | Separate from DSHS record |
| Ops metric | Count **pending / approved / rejected** claims in admin | Human/ops weekly |

Target outcome for Phase 3: **increase approved ownership claims** in priority metros (King, Snohomish, Pierce, Spokane, Clark, Thurston) using existing claim UI — not paid acquisition.

---

## High-impact improvements (existing product + verified data)

Prioritized for **real family users** and **owner → verified claim** conversion. No production code in this assessment.

### P0 — Unblock measurement (human)

1. Complete GSC verify + sitemap submit + inspect `/`, `/washington`, `/washington/cities`, `/washington/counties`, one priority city filter URL, one profile.
2. Weekly ops: export GSC clicks/impressions; admin claim status counts by week.

### P1 — Attract families with existing place hubs (agent after approval of any copy/SEO change)

1. Strengthen internal links from homepage / directory tools into **priority city & county** directory URLs (tables already emit them).
2. Ensure share/OG paths for hubs stay healthy (already shipped Phase 1 SEO).
3. Spot-check priority filter URLs remain SSR-capable and crawlable after soft-nav fix (no new acceptance suite — regression only if evidenced).

### P2 — Convert AFH owners (ops + light product)

1. Surface claim CTA clarity on high-traffic profiles in priority cities (copy already exists EN/ES).
2. Admin SLA: review pending claims for priority counties first.
3. Optional outreach drafts to AFH associations in King/Pierce/Snohomish/Clark — **human approve before send**.

### P3 — Needs explicit approval before build

| Idea | Why | Approval |
| --- | --- | --- |
| Unique titles/descriptions for `?city=` / `?county=` directory states | Better SERP relevance for place intent | SEO copy change |
| JSON-LD `LocalBusiness`/`Residence` on profiles | Rich results | Explicit |
| Production GA4 | Behavioral funnel | Explicit |
| Paid search/social | Acquisition scale | Explicit |
| Per-city path doorways | Risk vs Phase 2 policy | Explicit |

---

## Phase 3 success criteria (measurable)

| Goal | Target | Evidence |
| --- | --- | --- |
| Indexing instrumentation | GSC verified + sitemap green | GSC screenshots / status |
| Place visibility | Impressions on ≥5 priority city/county queries | GSC Performance |
| Family entry | Rising clicks to `/washington` + cities/counties hubs | GSC |
| Owner conversion | MoM increase in **approved** claims (ops count) | Admin ledger |
| Guardrails | GA/billing/ads/other-state still off; Design 2 + 6,278 intact | Live spot checks |

## Non-goals

- Re-running pagination / SSR / hydration acceptance
- Clear-filters residual work (unless newly reproducible)
- Production deploys from this assessment branch
- Enabling GA, billing, paid ads, or new states

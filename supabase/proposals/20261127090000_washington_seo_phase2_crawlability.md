# Washington SEO Phase 2 — Crawlability and indexing optimization

## Baseline (Search Console, human-reported)

Domain property already verified. Sitemap submission **SUCCESS**.

| Signal | Value |
| --- | --- |
| Sitemap discovered | 6,285 URLs |
| Live sitemap | 6,287 URLs |
| Organic clicks | 5 |
| Indexed (2026-11-22) | 277 |
| Discovered, not indexed | 4,786 |
| Crawled, not indexed | 1,194 |
| Duplicate / Google chose other canonical | 30 |
| Page with redirect | 3 |

## Evidence from audit

1. WA directory, profiles, cities, and counties were **client-fetched shells** — Googlebot HTML lacked facility facts and profile `<a>` links.
2. Directory pagination used **buttons**, not crawlable `?page=` links.
3. Missing numeric licenses returned **HTTP 200** with `index,follow` (soft-404 risk).
4. Profile titles/descriptions were **license-only / identical boilerplate**.
5. Counties hub had **no links** into the directory.
6. Canonical www + apex→www 308 already correct; sitemap eligibility remains numeric licenses from `wa_dshs_listed_facilities`.

## Implemented on `development` (this change)

| Fix | Behavior |
| --- | --- |
| Profile SSR feed | Server loads roster row; `notFound()` when missing/invalid |
| Unique metadata | Name + city/county in title/description when roster facts exist; `noindex` when missing |
| Directory SSR feed | First HTML paint includes current-page facility cards + profile links |
| Crawlable pagination | Prev/Next are `<Link href="/washington?page=N">` (filters preserved) |
| Cities/counties SSR | Market summary rows in initial HTML; counties link to `/washington?county=` |
| Shared roster helper | `lib/washington-public-roster.ts` (publishable REST only; no invented facts) |

Design 2 UI, 6,278 roster, owner/admin, billing/ads/GA/other-state gates unchanged. No per-city/county doorway URLs. No JSON-LD (still needs separate approval). No bulk indexing APIs.

## Explicit non-goals

- Fabricating amenities, vacancies, ratings, or “best of” copy
- Thin geo doorway pages
- Unauthorized URL Inspection / indexing automation
- Production GA, billing, paid ads, new-state publication
- Re-running closed Washington launch acceptance

## 30 / 60 / 90-day measurement plan

Track in Google Search Console (Domain property). Prefer observation over re-requests.

### Day 0 (ship baseline)

Record: indexed count, discovered-not-indexed, crawled-not-indexed, sitemap discovered vs live URL count, organic clicks/impressions (Search results), sample URL Inspection for `/`, `/washington`, one city hub, one profile with SSR name.

### Day 30

| Metric | Healthy direction |
| --- | --- |
| Indexed | Up vs 277 (watch absolute count, not only %) |
| Discovered, not indexed | Down or stable while indexed rises |
| Crawled, not indexed | Should shrink as unique SSR content lands |
| Soft-404 / excluded by `notFound` | Missing licenses should leave index over time |
| Top landing pages | `/washington`, hubs, named profiles appear |

Action if flat: confirm SSR HTML still ships name/address links (curl + Googlebot UA); do **not** mass Request Indexing.

### Day 60

| Metric | Healthy direction |
| --- | --- |
| Indexed | Continued climb; gap vs ~6,278 profiles narrowing |
| Queries / clicks | Organic clicks > 5 with branded + geo queries |
| Duplicate canonical | ≤ 30 or falling |
| Crawl stats | Steady fetch rate; no sitemap fetch failures |

Action if crawled-not-indexed dominates: review thin duplicates, internal link depth from hubs, sitemap vs live 404 rate.

### Day 90

| Metric | Healthy direction |
| --- | --- |
| Indexed share of sitemap | Material fraction of WA profiles; hubs fully indexed |
| Clicks / impressions | Sustained unpaid growth without ads |
| Coverage regressions | No spike in soft-404 or redirect exclusions |

Decide next phase only with evidence: optional JSON-LD (approval), deeper hub content, or leave crawl budget alone.

## Production

Ship to production only after CI green on `development` and explicit production approval.

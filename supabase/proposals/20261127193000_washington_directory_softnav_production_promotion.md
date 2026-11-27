# Production promotion — Washington directory soft-navigation fix

## Status

**Ready for separate human approval.** Not merged to `main`.

## Development validation

| Item | Value |
| --- | --- |
| Development PR | [#246](https://github.com/jadooh1/national-care-home-finder/pull/246) **MERGED** |
| Development tip | `9828d7e1c3302ce1172dd28b88131f9dad40ee3a` |
| Preview deployment | `dpl_EAbSzKrA7bYU6ANqQbfRwF6LkyKx` |
| CI | npm run build + Isolated PostgreSQL 16/17 + Vercel — green before merge |

## What ships to production

Fix for Next/Prev soft-navigation stuck on loading (PR #245 residual after #244):

- Crawlable Prev/Next `href`s retained
- `preventDefault` + local `setPage` so refetch runs
- Page-only `history.pushState`; filter edits `replaceState`
- `popstate` sync for browser Back/Forward
- SSR/prior rows preserved on failed browser refetch

## Production branch

`cursor/prod-wa-softnav-pagination-5a8c` — based on `main` @ `85f5fff` with soft-nav fix cherry-picked.

## Preserved

Design 2, 6,278 WA roster (no data change), owner/admin, billing/ads/GA/other-state publication disabled. No production Supabase/env changes.

## Gate

Open/merge production PR to `main` only after human approval of this promotion.

## Preview browser validation (development)

Performed on Preview deployment `dpl_EAbSzKrA7bYU6ANqQbfRwF6LkyKx` / commit `9828d7e` (not production).

| Check | Result |
| --- | --- |
| Initial `/washington` Design 2 + 6,278 | PASS |
| Next ×3 / Prev ×3 without hard reload | PASS |
| Browser Back ×2 / Forward ×1 | PASS |
| City/county/search + URL sync | PASS |
| Crawlable `?page=` hrefs | PASS |
| Stuck loading on pagination | None observed |

### Accepted residual (not a soft-nav pagination blocker)

Intermittent **Clear filters** after a search can leave “Loading listings…” even though the unfiltered Supabase response returned successfully. Recoverable by typing a new search (no hard reload). Observed once in three Clear-filters attempts. Schedule as a small post-promotion follow-up; do not block this production promotion.


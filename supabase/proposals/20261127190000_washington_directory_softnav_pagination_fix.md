# Washington directory soft-navigation pagination fix

## Status

**Development-only.** Resolves the Next/Prev soft-navigation defect recorded in PR #245
(residual after production SEO Phase 2 / PR #244). Production promotion requires
**separate approval**.

## Root cause

Phase 2 made Prev/Next crawlable `<Link href="/washington?page=N">` controls. On click the
handler called `setLoading(true)` and allowed Next.js App Router soft-navigation to change
the URL. The client instance was reused, so React `useState(initialPage)` kept the **stale
page index**. The fetch effect depends on local `page` and never re-ran, leaving the UI on
“Loading listings…” with **no Supabase request** until a hard reload.

`history.replaceState` (filter URL sync) could also race the soft-nav URL back toward page 1.

## Fix

1. Prev/Next keep crawlable `href`s for no-JS/crawlers, but `preventDefault` and call
   `setPage` so the existing refetch effect runs.
2. Page-only URL updates use `history.pushState`; filter/search edits keep `replaceState`.
3. `popstate` rehydrates q/city/county/page from the URL for browser Back/Forward.
4. Failed browser refetch continues to preserve prior/SSR rows (no empty wipe).

## Preserved

- Design 2 directory UI
- Authoritative **6,278** Washington roster (no data change)
- Crawlable `?page=` links
- Owner/admin surfaces untouched
- Billing, paid advertising, Google Analytics, and other-state publication remain disabled

## Validation

- Unit/regression: `washington_directory_softnav_pagination.ts`
- CI workflow step added
- Deployed Preview browser: repeated Next/Prev, Back/Forward, filters/search without hard reload

## Production

Do **not** merge to `main` or deploy production without explicit human approval of this
correction PR after development validation.

## Browser validation note

Development Preview (`dpl_EAbSzKrA7bYU6ANqQbfRwF6LkyKx` / `9828d7e`): Next/Prev/Back/Forward and filters/search **PASS** without hard reload.

Residual: intermittent Clear-filters stuck loading (response already 206) — separate follow-up, not a pagination soft-nav regression.

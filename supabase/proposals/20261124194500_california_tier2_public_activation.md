# California Tier 2 — public map activation

## Authorization

User explicitly approved public California map activation using PR #221 head
`30c508c` as baseline. Separate activation PR against `main`. Agents do not
merge or deploy.

## Counts

| Surface | Count |
| --- | ---: |
| Directory | 15,435 |
| Verified map points | 15,418 |
| Unverified omitted | 17 (includes `011405838`) |
| Source as-of | 2026-11-22 |

## Activation flips

- `directoryContract('California').mapPath` → `/california/map`
- `CALIFORNIA_PUBLIC_PAGES` includes `/california/map`
- Public `/california/map` interactive map (filters, markers, profiles, CDSS)
- `/development/california/map` redirects to public map
- Coverage disclosure on `/california` links to the map
- Owner / enhanced remain disabled; Oregon unpublished

## Rollback

Revert production `main` to **`b07a1ac`** (see `californiaTier2RollbackPlan()`).

## Out of scope

No database, authentication, or billing changes. No ArcGIS status override.
No fabricated/geocoded coordinates.

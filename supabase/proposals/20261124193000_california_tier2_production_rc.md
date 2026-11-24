# California Tier 2 — production release candidate (protected)

## Baseline

Validated development commit **`056b35f`** (PR #220). Draft PR against **`main`**.
Public California map authorization remains **OFF**.

## Counts

| Surface | Count |
| --- | ---: |
| Tier 1 directory facilities | 15,435 |
| Verified map locations | 15,418 |
| Unverified excluded from map | 17 (16 unmatched + 1 identity-rejected) |

## What this RC ports

- Development-only interactive map: `/development/california/map`
- Phase 9 identity-filtered coordinate fixtures
- Public-facing map coverage disclosure on `/california` (map not linked)
- Release controls + rollback plan in `lib/california-tier2-release.ts`

## Preserved

- Washington public directory + Design 2
- Live California Tier 1 directory
- Oregon unpublished + production fail-closed
- Owner claims WA-only
- `directoryContract('California').mapPath === null`

## Rollback

See `californiaTier2RollbackPlan()` — disable development map route, revert Tier 2
fixtures/controls, keep mapPath null, verify Tier 1 / WA / Oregon intact.

## Out of scope

No merge, production deploy, database, auth, or billing changes from this proposal.
Separate explicit approval is required before any public California map authorization.

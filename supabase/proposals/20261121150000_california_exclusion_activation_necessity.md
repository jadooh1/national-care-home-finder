# California exclusion activation necessity and sequencing

**Baseline:** PR #208 merged at `54855fd`  
**Observed:** 2026-11-21  
**Mode:** Development-only / read-only. No activation, no Supabase writes, no California publication.

## Recommendation

**DEFER** exclusion ledger activation until prepublication testing / CA listing wire-up.

- Current security / publication risk from inactive exclusions: **none**
- Activation necessary before continuing launch prep: **no**
- Activation necessary before listing wire-up / publication: **yes** (hard precondition)

## Evidence

Public California is blocked structurally: unpublished `directoryContract`, `californiaDirectoryReady()=false`, no `app/california` routes, no CA listing queries, WA-only owner claims and sitemap, framework `publicationStopGo=STOP`, `publicationEligible=0`. Residual exclusion gates are development specification only and are not on production paths today.

## Safest sequence

1. Continue launch prep with exclusions inactive  
2. Reconfirm source freshness  
3. Approve + activate exclusion ledger (separate decision)  
4. Wire residual gate into every future CA listing path  
5. Verify residual block + rollback  
6. Optional mapping activation (separate)  
7. Statewide publication only after the above (currently STOP)

## Artifacts

- `lib/california-exclusion-activation-necessity.ts`
- `/development/california-exclusion-necessity`
- `supabase/proposals/tests/california_exclusion_activation_necessity.ts`

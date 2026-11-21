# California Tier 1 launch-readiness validation

**Base:** `development` @ `c9d9f6c` (#202)  
**Observed:** 2026-11-21  
**Scope:** Development-only. Exclusions inactive. California unpublished.

## Pending Increase mapping status

**Approved for future eligibility consideration only** (conservative mapping).  
Not activated in app/DB. Does not publish California.

## Fresh downloads

| File | As-of | Newer available? |
| --- | --- | --- |
| RCFE / ARF `…11152026.csv` | **2026-11-15** | **No** (unchanged from #199) |

## Live CDSS validation (2026-11-21)

### 66 Pending Increase — all pass

| Check | Result |
| --- | ---: |
| Facility Number exact match | 66/66 |
| Download `LICENSED` | 66/66 |
| FacilityDetail `Licensed/Pending Increase` | 66/66 |
| Cleared to exact `Licensed` | 0 |
| Download License First Date present | 66/66 |
| Download ↔ FacilityDetail capacity agreement | 66/66 |
| CDSS agreement pass | **66/66** |
| New conflicts | **0** |

### Remaining 22 exclusions — reconfirmed

| Bucket | Count | Status |
| --- | ---: | --- |
| Missing first-license date | 14 | Still empty on Download; `LICENSEFIRSTDATE` null; never use effective date |
| Provisional License | 5 | Still Provisional License |
| Prior status conflicts | 3 | 502701867 Pending Incomplete; 019201167/019201133 still Pending Increase (prior controls) |

## Offline Tier 1 recalculation

| Metric | Value |
| --- | ---: |
| Pre-approval otherwise-clear | 15,363 |
| Pending Increase future-eligible | +66 |
| **Tier 1 offline under approved mapping** | **15,429** |
| Remaining listing exclusions | 22 |
| Publication eligible | **0** |
| Exclusions activated | **No** |

## Launch assessment

| Area | Stop/Go |
| --- | --- |
| Data integrity | **GO** (with residual 22 exclusions) |
| Eligibility accounting | **CONDITIONAL** (mapping approved, not activated) |
| Security / production boundary | **GO** |
| Disclosures / terms | **STOP** |
| Public publication | **STOP** |

## Decisions still requiring human approval

1. **`activate-california-exclusion-ledger-in-app-db`** — Activate offline eligibility ledger without publishing (recommend defer).
2. **`approve-california-statewide-public-publication`** — Public launch (do not approve yet).
3. **`reclassify-prior-control-pending-increase-ids`** — Optionally move 019201167 / 019201133 under approved mapping (+2 → 15,431) (optional; keep excluded by default).

## Reproduce

```bash
node --experimental-strip-types --test \
  supabase/proposals/tests/california_tier1_launch_readiness.ts \
  supabase/proposals/tests/california_pending_increase_publication_policy.ts
```

Dev preview: `/development/california-tier1-launch`

## Restrictions

No California publication, exclusion activation, Supabase writes, production changes, agency outreach, or merge without approval.

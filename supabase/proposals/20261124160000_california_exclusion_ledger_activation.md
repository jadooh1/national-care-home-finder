# California exclusion ledger activation (development-only)

**Baseline:** PR #213 merged at `22e522c`  
**Authorization:** `activate-california-exclusion-ledger-in-app-db` (development only)  
**Public California:** STOP  
**Database writes:** none (application-level)

## Before → after

| Control | Before | After |
| --- | --- | --- |
| exclusionsActivated | false | **true** (development) |
| eligibilityMappingActivated | false | false |
| californiaPublished | false | false |
| publicationEligibleCount | 0 | 0 |

## CDSS reconciliation (2026-11-24)

Live FacilityDetail for all **22/22** residual IDs: exact FACILITYNUMBER match.

| Bucket | Count | Evidence |
| --- | ---: | --- |
| Missing first-license date | 14 | Licensed + empty LICENSEFIRSTDATE |
| Provisional license | 5 | Provisional License |
| Status conflict | 3 | Pending Incomplete / Licensed/Pending Increase prior-control |
| Truncation alias | verified | `19201167` → `019201167` |

Source as-of remains **2026-11-22** DownloadStateData roster (15,435 listable; residuals absent).

## Rollback (executable, no DB)

1. Record rollback approval  
2. Flip `exclusionsActivated → false` in application controls  
3. Bump `CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION`  
4. Verify fail-closed + residual membership  
5. Verify WA/OR unchanged  

## Restrictions preserved

No eligibility activation, California publication, production/auth/billing changes, or Supabase writes.

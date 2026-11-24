# California eligibility mapping activation (development-only)

**Baseline:** PR #214 merged at `b7fb8d8`  
**Authorization:** `activate-pending-increase-mapping-in-app-db` (development only)  
**Public California:** STOP  
**Database writes:** none (application-level)

## Before → after

| Control | Before (#214) | After |
| --- | --- | --- |
| exclusionsActivated | true | **true** (unchanged) |
| eligibilityMappingActivated | false | **true** (development) |
| californiaPublished | false | false |
| publicationEligibleCount | 0 | 0 |
| cache generation | exclusion-ledger-activated-v1 | `eligibility-mapping-activated-v1` |

## CDSS / roster reconciliation (2026-11-24)

Source as-of remains **2026-11-22** DownloadStateData roster (15,435 listable).

| Bucket | Count | Evidence |
| --- | ---: | --- |
| Historical Pending Increase IDs | 66 | Policy ledger |
| Listable informational (`pi`) | 58 | Present in development roster with LICENSED + first date + capacity |
| Historical out-of-scope | 8 | Adult Day Program (7) + Social Rehabilitation Facility (1); not listable |
| Live FacilityDetail sample (listable) | 8/8 | Exact ID, Licensed/Pending Increase, first-date + capacity agreement |
| Live FacilityDetail sample (out-of-scope) | 8/8 | Exact ID; non-RCFE/ARF types confirmed |

## Residual exclusions

All **22** residual IDs and truncation aliases remain blocked with mapping ON. Exclusion ledger stays activated.

## Rollback (executable, no DB)

1. Record mapping-rollback approval  
2. Flip `eligibilityMappingActivated → false` (exclusions stay ON)  
3. Bump `CALIFORNIA_ELIGIBILITY_MAPPING_CACHE_GENERATION`  
4. Verify residuals still blocked; publicationEligible=0; californiaPublished=false  
5. Verify WA/OR unchanged  

## Restrictions preserved

No California publication, production/auth/billing changes, or Supabase writes. Publication-eligible count remains zero.

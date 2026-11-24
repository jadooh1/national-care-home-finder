# California Tier 1 full-roster development directory

**Baseline:** PR #210 merged at `ce3cadb`  
**Observed:** 2026-11-24  
**Source as-of:** 2026-11-22 (DownloadStateData Content-Disposition)  
**Mode:** Development-only statewide roster. No California publication, no exclusion/eligibility activation, no Supabase writes.

## Source check

| File | Content-Disposition | sha256 | rows |
| --- | --- | --- | ---: |
| RCFE | `ResidentialElderCareFacility11222026.csv` | `07166e7ee6…` | 13,354 |
| ARF | `AdultResidentialFacilities11222026.csv` | `25267a8f6b…` | 11,050 |

Prior adopted as-of was 2026-11-15; current dual-file as-of is **2026-11-22**.

## Reconciliation vs prior 15,429 / 22

| Metric | Value |
| --- | ---: |
| Prior offline Tier 1 | 15,429 |
| Current listable development roster | **15,435** |
| Delta | **+6** |
| Residual-22 present in download | **22 / 22** (still blocked) |
| Historical Pending Increase IDs still listable | 58 / 66 (8 out-of-scope types omitted) |

Listable rule: eligible RCFE/ARF types + `LICENSED`/`ON PROBATION` + non-empty License First Date + not residual-22.

## Artifacts

- `scripts/california-tier1-full-roster-import.mjs` (reproducible import)
- `supabase/proposals/fixtures/california-tier1-full-roster/{manifest,roster}.json`
- `lib/california-tier1-full-roster.ts`
- `/development/california` searchable + paginated
- `/development/california/[facilityNumber]` detail
- Tests + CI

## Restrictions

`publicationEligible=0`. Exclusions deferred. Eligibility mapping inactive. Public `/california` absent.

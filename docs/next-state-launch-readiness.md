# Next-state launch readiness

**Base:** `4869fbf3e66e76c1a15a776ca4b048073d8ce8f1`  
**Observed:** 2026-11-21  
**Scope:** Development-only alternate track while Florida awaits AHCA freshness. No new-state publication. No Supabase writes. Agency email draft only — not sent.

## Selection

**Ohio** is the strongest unpublished alternate for verified Tier 1 directory listings.

| Metric | Value |
| --- | --- |
| Offline Tier 1 candidates (ACTIVE only) | **801 / 1,152** L12 |
| Publication eligible / finalPublicVisibility | **0** / false |
| Primary identity | FACID |
| Disclosure required for Tier 1? | No (still unresolved / session-bound) |

## Top candidates (Tier 1 structural score / 10; disclosure optional)

Ranked by Tier 1 structural score (identity + status + address + freshness + data quality). Official facility links are scored separately and do not outrank clearer status domains.

| Rank | State | Structural | Incl. links | Key strength | Key Tier 1 gap |
| --- | ---: | ---: | ---: | --- | --- |
| 1 | Ohio | 8 | 8 | ACTIVE/CLOSED status + FACID + address | ISO + disclosure |
| 2 | Alabama | 7 | 7 | Regular status + Fac ID + address | ISO + disclosure |
| 3 | Tennessee | 7 | 7 | Licensed status + lic_no + beds | ISO + city blanks |
| 4 | Virginia | 7 | 9 | Verified disclosure + licenseId | ISO + licenseType mapping |
| 5 | Georgia | 6 | 6 | Active status + FACID + address | ISO + disclosure |
| 6 | South Carolina | 6 | 6 | ACT + LICENSE_NBR + address | ISO + disclosure |
| 7 | New Jersey | 6 | 8 | Verified FacID disclosure + address | No Active/Closed domain |
| 8 | Maryland | 5 | 5 | License # + address + capacity | No status domain |

Excluded from ranking: Washington (public), Florida (AHCA wait / parallel), Oregon (existing development directory), California (blocked), North Carolina & Delaware (active-work exclusion), Massachusetts (identifier gap).

## Shortest safe path

1. Keep Ohio unpublished; ship `/development/ohio-tier1` + `/development/next-state-readiness`.  
2. Human sends ODH clarification email (draft in `lib/ohio-tier1-launch.ts`; do not send from agents).  
3. Freeze ACTIVE-only status rule (or expand only with written approval).  
4. Separate explicit publication approval before any `directoryContract` change.

## Florida parallel

Preserve Florida offline **2,251 / 3,025** Tier 1 candidates and freshness STOP until AHCA responds.

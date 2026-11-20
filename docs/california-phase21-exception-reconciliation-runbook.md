# California Phase 21 — exception reconciliation runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** activate exclusion policy in application or database.  
**Do not** repeat the statewide FacilityDetail crawl.

## Purpose

1. Investigate the **71** Phase 20 licensing conflicts (Download ↔ FacilityDetail).  
2. Investigate inconclusive IDs `365530371` and `331881723` (prior HTTP 500).  
3. Maintain an offline exception ledger including preserved prior exceptions.  
4. Reassess launch blockers vs facility-level exceptions.

## Commands

```bash
node --experimental-strip-types scripts/california-phase21-exception-reconciliation-run.mjs \
  --out california-phase21-audit-out
```

Skip inconclusive retries (keep Phase 20 HTTP 500 evidence only):

```bash
node --experimental-strip-types scripts/california-phase21-exception-reconciliation-run.mjs \
  --out california-phase21-audit-out --skip-inconclusive-retry
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase21_exception_reconciliation.ts
```

## Safeguards

| Control | Value |
| --- | --- |
| Probe set | 71 conflicts + 2 inconclusive only |
| Concurrency | 1 |
| Min interval | ≥450 ms |
| Auto-stop | 429/403 |
| Statewide crawl | **not repeated** |
| Exclusion activation | **false** |
| Gate | **blocked** |

## Classification classes

- `explainable-coarsening-or-timing` (e.g. LICENSED vs Licensed/Pending Increase) — still unknown-ineligible  
- `genuine-unresolved-licensing-conflict`  
- `invalid-or-mismatched-identity`  
- `closed-pending-or-withdrawn`  
- `requires-cdss-clarification`  
- `inconclusive-transport-or-server-error`  
- `match-no-longer-discrepant` (re-probe only; publication still gated)

## Stop / go

**STOP.** Publication remains blocked until ISO export date / CDSS reply / exclusion activation (and other global blockers) are resolved by humans.

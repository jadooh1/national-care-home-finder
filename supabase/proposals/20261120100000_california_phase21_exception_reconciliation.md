# California Phase 21 — exception reconciliation + decision-ready report

**Issue:** #131  
**Base:** `development` including Phase 20 merge `d7e3cfe`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED**. **No statewide re-crawl.** Exclusion policy offline classification only — not activated in app/DB.

## Objective

1. Investigate and classify the **71** Phase 20 licensing conflicts.  
2. Investigate inconclusive IDs `365530371` and `331881723` (prior HTTP 500).  
3. Maintain a machine-readable offline exception ledger (including preserved prior exceptions).  
4. Reassess global launch blockers vs facility-level exceptions.

## Probe controls (narrow only)

| Parameter | Value |
| --- | --- |
| Conflict IDs | **71** |
| Inconclusive IDs | **2** |
| Concurrency | **1** |
| Min interval | ≥450 ms |
| Statewide crawl | **not repeated** |
| Exclusion activation | **false** |
| Gate | **blocked** |

## Gate / safeguards

Baseline preserved: **24,377** official / **15,451** candidates / **15,423** verified coords / **28** unresolved / cumulative disclosure **15,451/15,451**. Gate **BLOCKED**. `allowsPublication=false`.

## Artifacts

- `lib/california-phase21-conflict-ids.ts`
- `lib/california-phase21-conflict-classification.ts`
- `lib/california-phase21-exception-ledger.ts`
- `lib/california-phase21-quality.ts`
- `lib/california-phase21-readiness.ts`
- `scripts/california-phase21-exception-reconciliation-run.mjs`
- `docs/california-phase21-exception-reconciliation-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase21-exception-reconciliation/`
- Tests: `supabase/proposals/tests/california_phase21_exception_reconciliation.ts`

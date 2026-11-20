# California Phase 20 — staged statewide verification + offline exclusion classification

**Issue:** #131  
**Base:** `development` including Phase 19 merge `8655b0f`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED**. Staged statewide crawl ≤14,744 additional unique facilities is **user-authorized**. Exclusion policy adopted for **offline classification only** — not activated in app/DB.

## Objective

1. Execute the authorized staged California verification (≤14,744 previously-unverified publication candidates; batches ≤250) via the Phase 13 harness.
2. Start from coverage baseline **707**; do not duplicate completed verification.
3. Analyze disclosure / status consistency, anomalies, stop conditions, and throughput.
4. Classify exceptions with the Phase 18 exclusion policy offline (fail-closed; government records unaltered).
5. Report progress; claim statewide roster completion only when authorized remaining queue is exhausted.

## Staged controls

| Parameter | Value |
| --- | --- |
| Prior baseline | **707 / 15,451** |
| Additional cap | **≤14,744** unique previously-unverified |
| Batch cap | **≤250** |
| Rate limit | ≥450 ms min interval (all requests) |
| Concurrency | **1** |
| Retry / backoff | 3 attempts; 500 / 1500 / 3000 ms |
| Checkpointing | every 10; `--resume` |
| Error stop | 8 consecutive inconclusive; 429/403; sustained 5xx |
| Exclusion | Offline only |
| Gate | **BLOCKED** |

## Artifacts

- `lib/california-phase20-sample.ts`
- `lib/california-phase20-disclosure-audit.ts`
- `lib/california-phase20-exclusion-classification.ts`
- `lib/california-phase20-quality.ts`
- `lib/california-phase20-readiness.ts`
- `lib/california-phase20-staged.ts`
- `scripts/california-phase20-staged-verification-run.mjs`
- `docs/california-phase20-staged-verification-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase20-staged-verification/`
- Tests: `supabase/proposals/tests/california_phase20_staged_verification.ts`

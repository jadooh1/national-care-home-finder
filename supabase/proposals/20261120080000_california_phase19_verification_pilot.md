# California Phase 19 — limited verification pilot + offline exclusion classification

**Issue:** #131  
**Base:** `development` including Phase 18 merge `a691d99`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED**. Limited pilot ≤250 is **pre-approved**. **Staged statewide not started.** Exclusion policy adopted for **offline classification only** — not activated in app/DB.

## Objective

1. Execute the approved ≤250 previously-unverified California verification pilot via the Phase 13 harness.
2. Analyze official status consistency, disclosure-link validity, anomalies, stop conditions, and throughput.
3. Classify exceptions with the Phase 18 exclusion policy offline (fail-closed; government records unaltered).
4. Recommend whether evidence supports requesting staged statewide approval — do not start it.

## Pilot controls

| Parameter | Value |
| --- | --- |
| Prior baseline | **462 / 15,451** |
| Pilot cap | **≤250** unique previously-unverified |
| Rate limit | ≥450 ms min interval |
| Concurrency | **1** |
| Retry / backoff | 3 attempts; 500 / 1500 / 3000 ms |
| Checkpointing | every 10; `--resume` |
| Error stop | 8 consecutive inconclusive; 429/403; sustained 5xx |
| Exclusion | Offline only |
| Statewide | Not started |

## Gate / safeguards

Baseline preserved: **24,377** official / **15,451** candidates / **15,423** verified coords / **28** unresolved. Gate **BLOCKED**. `allowsPublication=false`. No Design 2 / billing / auth / California publication.

## Artifacts

- `lib/california-phase19-sample.ts`
- `lib/california-phase19-disclosure-audit.ts`
- `lib/california-phase19-exclusion-classification.ts`
- `lib/california-phase19-quality.ts`
- `lib/california-phase19-readiness.ts`
- `lib/california-phase19-pilot.ts`
- `scripts/california-phase19-verification-pilot-run.mjs`
- `docs/california-phase19-verification-pilot-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase19-verification-pilot/`
- Tests: `supabase/proposals/tests/california_phase19_verification_pilot.ts`

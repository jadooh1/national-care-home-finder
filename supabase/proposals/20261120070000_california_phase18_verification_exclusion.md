# California Phase 18 — full-roster verification plan + facility-exclusion policy

**Issue:** #131  
**Base:** `development` including Phase 17 merge `8de92b7`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED** — not changed or opened. **No crawl started. Exclusion policy not activated.**

## Objective

1. Prepare an evidence-based, approval-ready statewide verification plan for 15,451 candidates (from prior sample 462/15,451).
2. Draft a formal facility-exclusion policy for approval (listing exclusion vs feature suppression).
3. Produce a decision-ready readiness report preserving the Phase 10–17 baseline.
4. Present separate approval options (crawl authorization; exclusion adoption; publication preconditions) — **do not** request opening the publication gate.

## Verification plan (not executed)

| Parameter | Value |
| --- | --- |
| Sample evidence | **462 / 15,451** (~2.99%) |
| Remaining approx | **14,989** |
| Rate limit | ≥450 ms min interval |
| Concurrency | **1** (no parallel CDSS fan-out) |
| Retry / backoff | 3 attempts; 500 / 1500 / 3000 ms |
| Checkpointing | every 10 probes; `--resume` skips completedKeys |
| Error stop | 8 consecutive inconclusive; 429/5xx burst; sha256 drift |
| Duration estimate | ~3.75 h min / ~4.68 h conservative (2 probes/facility) |
| Sessions @ 250 cap | **~60** |
| Recommended if authorized | **limited pilot (≤500)** then staged statewide |
| `performNow` | **false** |

## Exclusion policy (draft only)

Classes: unverified/conflicting status; invalid/mismatched IDs; missing license evidence (14 statewide); unverified coords (28 → map suppression); bad disclosure links; closed/pending/withdrawn.  
`activated=false`. Authoritative government records unaltered. Audit trails + correction/reinstatement required.

## Readiness / gate

Baseline preserved: **24,377** official / **15,451** candidates / **15,423** verified coords / **28** unresolved / **462** disclosure samples / **14** missing-license-date flags. CDSS clarification still unanswered.  
**STOP.** Gate **BLOCKED**. Global launch blockers ≠ facility-specific exceptions.

## Approval options (recommendations only)

1. Authorize limited pilot vs staged statewide vs deny crawl?  
2. Adopt proposed exclusion policy?  
3. Conditions before any future publication approval? (**not** a gate-open request)

## Artifacts

- `lib/california-phase18-verification-plan.ts`
- `lib/california-phase18-exclusion-policy.ts`
- `lib/california-phase18-approval-options.ts`
- `lib/california-phase18-quality.ts`
- `lib/california-phase18-readiness.ts`
- `lib/california-phase18-verification-exclusion.ts`
- `scripts/california-phase18-verification-exclusion-run.mjs`
- `docs/california-phase18-verification-exclusion-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase18-verification-exclusion/`
- Tests: `supabase/proposals/tests/california_phase18_verification_exclusion.ts`

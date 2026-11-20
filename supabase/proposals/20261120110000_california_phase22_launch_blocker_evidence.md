# California Phase 22 — launch-blocker evidence and policy-bound reconciliation

**Issue:** #131  
**Base:** `development` including Phase 21 merge `e668fd2`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED**. **No statewide re-crawl.** Exclusion policy offline classification only — not activated in app/DB.

## Objective

1. Authoritative freshness evidence for DownloadStateData (ISO export/version stamp).  
2. Unique-ID / capacity / facility-type policy-bound review with fail-closed recommendations.  
3. Reassess five Provisional License conflicts + three prior controls (narrow probes only).  
4. Readiness decision matrix: statewide prerequisites vs facility suppressions; development-only vs later-approval actions.  
5. Keep launch recommendation **STOP**.

## Probe controls (narrow only)

| Parameter | Value |
| --- | --- |
| Provisional IDs | **5** |
| Prior controls | **3** |
| Concurrency | **1** |
| Min interval | ≥450 ms |
| Statewide crawl | **not repeated** |
| Exclusion activation | **false** |
| Gate | **blocked** |
| Stop / go | **STOP** |

## Gate / safeguards

Baseline preserved: **24,377** official / **15,451** candidates / **15,423** verified coords / **28** unresolved / cumulative disclosure **15,451/15,451**. Gate **BLOCKED**. `allowsPublication=false`.

## Artifacts

- `lib/california-phase22-ids.ts`
- `lib/california-phase22-freshness.ts`
- `lib/california-phase22-unique-id-capacity.ts`
- `lib/california-phase22-provisional-review.ts`
- `lib/california-phase22-decision-matrix.ts`
- `lib/california-phase22-ledger.ts`
- `lib/california-phase22-quality.ts`
- `lib/california-phase22-readiness.ts`
- `scripts/california-phase22-launch-blocker-evidence-run.mjs`
- `docs/california-phase22-launch-blocker-evidence-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase22-launch-blocker-evidence/`
- Tests: `supabase/proposals/tests/california_phase22_launch_blocker_evidence.ts`

# California Phase 24 — freshness blocker + launch-dependency decisions

**Issue:** #131  
**Base:** `development` including Phase 23 merge `416f9e2`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. Prior CDSS clarification already sent — **no duplicate inquiries**. Follow-up draft is **draft-do-not-send**. Publication gate stays **BLOCKED**. **No statewide re-crawl.** Exclusion policy offline only — not activated.

## Objective

1. Document authoritative freshness blocker; prepare concise CDSS follow-up draft (do not send).  
2. Reconcile Phase 23 matrix counts and coordinate overlaps.  
3. Prioritized launch-dependency checklist (future authorization called out).  
4. Keep launch recommendation **STOP**.

## Artifacts

- `lib/california-phase24-freshness.ts`
- `lib/california-phase24-count-reconciliation.ts`
- `lib/california-phase24-launch-dependencies.ts`
- `lib/california-phase24-quality.ts`
- `lib/california-phase24-readiness.ts`
- `scripts/california-phase24-freshness-launch-decisions-run.mjs`
- `docs/california-phase24-freshness-launch-decisions-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase24-freshness-launch-decisions/`
- Tests: `supabase/proposals/tests/california_phase24_freshness_launch_decisions.ts`

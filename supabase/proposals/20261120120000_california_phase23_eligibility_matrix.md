# California Phase 23 — final offline eligibility matrix + launch controls

**Issue:** #131  
**Base:** `development` including Phase 22 merge `a8764a2`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**. Publication gate stays **BLOCKED**. **No statewide re-crawl.** Exclusion policy offline only — not activated in app/DB.

## Objective

1. Reaffirm authoritative freshness (ISO export date still absent).  
2. Auditable offline eligibility matrix for 15,451 candidates (listing vs map vs disclosure).  
3. Future launch controls: checklist, rollback, STOP/GO.  
4. Keep launch recommendation **STOP**.

## Gate / safeguards

Baseline preserved: **24,377** official / **15,451** candidates / **15,423** verified coords / **28** unresolved / cumulative disclosure **15,451/15,451**. Gate **BLOCKED**. `allowsPublication=false`.

## Artifacts

- `lib/california-phase23-exception-sets.ts`
- `lib/california-phase23-freshness.ts`
- `lib/california-phase23-eligibility.ts`
- `lib/california-phase23-eligibility-matrix.ts`
- `lib/california-phase23-launch-controls.ts`
- `lib/california-phase23-quality.ts`
- `lib/california-phase23-readiness.ts`
- `scripts/california-phase23-eligibility-matrix-run.mjs`
- `docs/california-phase23-eligibility-matrix-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase23-eligibility-matrix/`
- Tests: `supabase/proposals/tests/california_phase23_eligibility_matrix.ts`

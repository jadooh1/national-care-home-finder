# California Phase 13 — scalable disclosure audit + expanded status verification

**Issue:** #131  
**Base:** `development` including Phase 12 merge `36a30d7`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**.

## Objective

1. Build a scalable, resumable, rate-limited disclosure-link audit process for the **15,451** California publication candidates (exact IDs including leading zeros).
2. Begin with a predefined **larger stratified sample** (target N=120 disclosure; N=48 status) rather than an uncontrolled statewide crawl.
3. Expand FacilityDetail licensing-status verification across licensed / probationary / closed / pending / exceptional strata; retain five CLOSED→Application Withdrawn regression controls as `withdrawn-ineligible`.
4. Preserve readiness baseline and keep the publication gate **BLOCKED**.

## Audit harness

| Capability | Detail |
| --- | --- |
| Checkpointing | `disclosure-audit-checkpoint.json` every 10 probes; `--resume` skips completed keys |
| Rate limit | 450 ms min interval |
| Retry / backoff | 3 attempts; 500 / 1500 / 3000 ms |
| Caps | `--max-requests`, 30 min duration, 8 consecutive inconclusive |
| Coverage | Always reports `verifiedCount / 15451`; never claims statewide from a partial sample |

Operational runbook: `docs/california-phase13-disclosure-audit-runbook.md`.

## Status evidence distinction

| Kind | Meaning |
| --- | --- |
| `facility-detail-verified` | Live FacilityDetail STATUS (+ dates) observed |
| `download-only-indicator` | Download CLOSED + empty License First Date (planning only) |

Application Withdrawn remains documented coarsening (PIN coarse Closed bucket + Title 22 §80029 + never-licensed markers). **Not** Closed* equivalence. **Never** publication-eligible.

## Readiness / gate

Baseline preserved: **24,377** total; **15,451** active/restricted candidates; **15,423** verified coords; **28** unresolved; **21** missing capacities on excluded. Gate stays **BLOCKED**. California **unpublished**.

## Artifacts

- `lib/california-phase13-disclosure-audit.ts`
- `lib/california-phase13-status-verification.ts`
- `lib/california-phase13-sample.ts`
- `lib/california-phase13-readiness.ts`
- `lib/california-phase13-quality.ts`
- `scripts/california-phase13-disclosure-audit-run.mjs`
- `docs/california-phase13-disclosure-audit-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase13-disclosure-audit/`
- Tests: `supabase/proposals/tests/california_phase13_disclosure_audit.ts`

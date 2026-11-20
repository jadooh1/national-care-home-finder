# California Phase 14 — disclosure coverage expansion + exception investigation

**Issue:** #131  
**Base:** `development` including Phase 13 merge `2e8f9c3`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**.

## Objective

1. Expand verified disclosure-link coverage with an additional previously-unverified stratified batch using the Phase 13 rate-limited resumable harness.
2. Investigate exceptional records: ambiguous/invalid disclosure cases and the 28 unresolved candidate coordinates.
3. Strengthen licensing-status evidence on a bounded sample; retain five CLOSED→Application Withdrawn regression controls as `withdrawn-ineligible`.
4. Preserve readiness baseline and keep the publication gate **BLOCKED**.

## Coverage accounting

| Line | Count |
| --- | ---: |
| Phase 13 baseline | **116 / 15,451** |
| Phase 14 incremental | **117 / 15,451** (all working) |
| Cumulative | **233 / 15,451** |

`statewideCoverageClaimed=false`. Sample only — not roster-complete.

## Exception findings

| Case | Resolution |
| --- | --- |
| Truncated `15601219` → `015601219` | Exact official ID works; truncated remains non-canonical |
| Invalid `95354` | Confirmed refuse-closed |
| 28 unresolved coords | Re-probed; **0** authoritative resolutions; **28** remain unresolved (no fabrication) |
| Status conflict `502701867` | Download LICENSED vs FacilityDetail `Pending Incomplete Application` — unresolved / `unknown-ineligible` |

## Status evidence

Phase 14 status sample N=36: match / documented-coarsening / conflict / invalid-id reported with exact denominators. Five withdrawn regression controls remain **5/5** documented coarsening / withdrawn-ineligible.

## Readiness / gate

Baseline preserved: **24,377** total; **15,451** active/restricted candidates; **15,423** verified coords; **28** unresolved; **21** missing capacities on excluded. Gate stays **BLOCKED**. California **unpublished**.

## Artifacts

- `lib/california-phase14-disclosure-audit.ts`
- `lib/california-phase14-sample.ts`
- `lib/california-phase14-exceptions.ts`
- `lib/california-phase14-status-verification.ts`
- `lib/california-phase14-readiness.ts`
- `lib/california-phase14-quality.ts`
- `scripts/california-phase14-disclosure-exceptions-run.mjs`
- `docs/california-phase14-disclosure-exceptions-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase14-disclosure-exceptions/`
- Tests: `supabase/proposals/tests/california_phase14_disclosure_exceptions.ts`

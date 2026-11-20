# California Phase 15 — status conflict investigation + disclosure expansion

**Issue:** #131  
**Base:** `development` including Phase 14 merge `2f7dc74`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**.

## Objective

1. Investigate licensing-status conflict `502701867` (DownloadStateData LICENSED vs FacilityDetail Pending Incomplete Application).
2. Expand verified disclosure-link coverage with an additional previously-unverified stratified batch from the Phase 14 cumulative **233 / 15,451** baseline.
3. Preserve exception safeguards (withdrawn controls, invalid `95354`, leading zeros, 28 unresolved coords without repeating unsuccessful checks).
4. Keep the publication gate **BLOCKED** and distinguish statewide blockers from individual facility exceptions.

## Status conflict `502701867`

| Field | DownloadStateData | FacilityDetail |
| --- | --- | --- |
| Status | LICENSED | Pending Incomplete Application |
| License First Date | empty | empty |
| License Effective Date | n/a | empty |
| Name / address | DORSAKU RESIDENTIAL / 4373 VANGUARD DRIVE, MODESTO 95356 | exact match |
| ArcGIS FAC_NBR hits | — | **0** |

**Outcome:** identity-matched conflict; record reuse not supported; never-licensed markers present; no hypothesis adopted as resolution. Eligibility **unknown-ineligible**. Cannot publish or claim. Individual facility exception — not a change to statewide baseline accounting.

## Coverage accounting

| Line | Count |
| --- | ---: |
| Phase 14 cumulative | **233 / 15,451** |
| Phase 15 incremental | **114 / 15,451** (all working) |
| Cumulative | **347 / 15,451** |

`statewideCoverageClaimed=false`. Sample only — not roster-complete.

## Exception safeguards

| Case | Resolution |
| --- | --- |
| Truncated `15601219` → `015601219` | Preserved from Phase 14 (no repeat) |
| Invalid `95354` | Confirmed refuse-closed |
| 28 unresolved coords | **Not re-probed** (no new authoritative evidence); baseline 28 preserved |
| Five CLOSED→Application Withdrawn | **5/5** withdrawn-ineligible |

## Readiness / gate

Baseline preserved: **24,377** total; **15,451** active/restricted candidates; **15,423** verified coords; **28** unresolved; **21** missing capacities on excluded. Gate stays **BLOCKED**. California **unpublished**.

## Artifacts

- `lib/california-phase15-status-conflict.ts`
- `lib/california-phase15-disclosure-audit.ts`
- `lib/california-phase15-sample.ts`
- `lib/california-phase15-exceptions.ts`
- `lib/california-phase15-status-verification.ts`
- `lib/california-phase15-readiness.ts`
- `lib/california-phase15-quality.ts`
- `scripts/california-phase15-status-conflict-run.mjs`
- `docs/california-phase15-status-conflict-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase15-status-conflict/`
- Tests: `supabase/proposals/tests/california_phase15_status_conflict.ts`

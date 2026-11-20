# California Phase 16 — automated exception detection + disclosure expansion

**Issue:** #131  
**Base:** `development` including Phase 15 merge `935938d`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**.

## Objective

1. Expand verified disclosure-link coverage with an additional previously-unverified stratified batch from the Phase 15 cumulative **347 / 15,451** baseline.
2. Implement automated deterministic exception detection for unsafe facility records (ID / status / missing license dates / disclosure pages / source-data changes).
3. Preserve exception safeguards and regression controls (`502701867`, `95354`, `015601219`, five withdrawn, 28 unresolved coords without repeating unsuccessful checks).
4. Keep the publication gate **BLOCKED**. Distinguish sampled findings from statewide checks.

## Coverage accounting

| Line | Count |
| --- | ---: |
| Phase 15 cumulative | **347 / 15,451** |
| Phase 16 incremental | **115 / 15,451** (all working) |
| Cumulative | **462 / 15,451** (~2.99%) |

`statewideCoverageClaimed=false`. Sample only — not roster-complete. Geographic bands in incremental plan: southern 48 / central 15 / bay-northern 52. Leading-zero exact working links (incremental): 17.

## Exception detection (live)

| Scope | Count |
| --- | ---: |
| Sampled findings | **21** |
| Statewide checks | **14** (LICENSED-missing-initial-date scan; sha256 unchanged) |
| Regression controls | preserved (`502701867`, `95354`, `015601219`/`15601219`, five withdrawn) |

Sampled status conflicts (not statewide): e.g. `342700333`, `496803751`, `335530163`, `496802077`, `342701152`, `515002949`, `486804268` — kept **unknown-ineligible**. Download sha256 matches Phase 10–15 baseline.

## Automated exception detection

| Detector | Classification | Eligibility |
| --- | --- | --- |
| Malformed facility ID | `facility-id-malformed` | invalid-id-ineligible |
| Lost leading zeros | `facility-id-lost-leading-zeros` | unknown-ineligible |
| Facility ID mismatch | `facility-id-mismatch` | unknown-ineligible |
| Status conflict | `status-conflict` / `unknown-ineligible-control` | unknown-ineligible |
| LICENSED missing initial date | `licensed-missing-initial-date` | unknown-ineligible |
| Disclosure invalid / missing / ambiguous / redirected / mismatched | corresponding disclosure class | ineligible |
| Unexpected Download sha256 change | `source-data-unexpected-change` | statewide-check; gate blocked |

Uncertain records remain ineligible until authoritative evidence supports another class. Sample findings are **not** statewide conclusions.

## Exception safeguards / regressions

| Case | Resolution |
| --- | --- |
| Truncated `15601219` → `015601219` | Preserved (exact official ID works; truncated non-canonical) |
| Invalid `95354` | Confirmed refuse-closed |
| `502701867` | unknown-ineligible / unpublishable / unclaimable |
| 28 unresolved coords | **Not re-probed** (no new authoritative evidence); baseline 28 preserved |
| Five CLOSED→Application Withdrawn | **5/5** withdrawn-ineligible |

## Readiness / gate

Baseline preserved: **24,377** total; **15,451** active/restricted candidates; **15,423** verified coords; **28** unresolved; **21** missing capacities on excluded. Gate stays **BLOCKED**. California **unpublished**. CDSS clarification: **sent-awaiting-response** (do not resend).

## Artifacts

- `lib/california-phase16-exception-detection.ts`
- `lib/california-phase16-disclosure-audit.ts`
- `lib/california-phase16-sample.ts`
- `lib/california-phase16-exceptions.ts`
- `lib/california-phase16-status-verification.ts`
- `lib/california-phase16-status-conflict.ts`
- `lib/california-phase16-readiness.ts`
- `lib/california-phase16-quality.ts`
- `scripts/california-phase16-exception-detection-run.mjs`
- `docs/california-phase16-exception-detection-runbook.md`
- Fixtures under `supabase/proposals/fixtures/california-phase16-exception-detection/`
- Tests: `supabase/proposals/tests/california_phase16_exception_detection.ts`

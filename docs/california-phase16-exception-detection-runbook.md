# California Phase 16 — exception detection + disclosure expansion runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent).  
**Do not** write to Supabase, production, or `main`.  
**Do not** fabricate coordinates, license IDs, or disclosure links.  
**Do not** re-probe the 28 unresolved coordinates without new authoritative evidence.

## Purpose

1. Expand verified disclosure-link coverage with an additional previously-unverified stratified batch using the Phase 13 rate-limited resumable harness from the Phase 15 cumulative **347 / 15,451** baseline.
2. Run automated deterministic exception detection for unsafe facility records:
   - facility ID mismatches / malformed IDs / lost leading zeros
   - conflicting official licensing statuses
   - LICENSED records with missing initial license dates
   - ambiguous / invalid / redirected / mismatched disclosure pages
   - unexpected changes in official source data (DownloadStateData sha256)
3. Preserve regression controls: `502701867` unknown-ineligible; `95354` refuse-closed; `015601219` exact canonical; five CLOSED→Application Withdrawn withdrawn-ineligible.
4. Report exact incremental and cumulative coverage vs the **15,451** publication-candidate roster. Never claim statewide coverage from a partial sample.
5. Distinguish **sampled** findings from **statewide-check** findings in the exception report.

## Coverage accounting

| Line | Meaning |
| --- | --- |
| Phase 15 cumulative | **347 / 15,451** |
| Phase 16 incremental | newly probed previously-unverified facilities |
| Cumulative | 347 + incremental |

Required report line:

`incremental N / 15451; cumulative (347+N) / 15451 — sample only; statewideCoverageClaimed=false`

## Exception detection rules

| Detector | Behavior |
| --- | --- |
| Facility ID | Malformed (not 8–9 digits) → `invalid-id-ineligible`; lost leading zeros / mismatch → `unknown-ineligible` |
| Status conflict | Download vs FacilityDetail disagreement (except documented CLOSED→Application Withdrawn) → `unknown-ineligible`; never invent equivalence |
| Licensed missing date | Download `LICENSED` + empty License First Date → `unknown-ineligible` |
| Disclosure page | invalid / missing / ambiguous / redirected / mismatched → keep ineligible; no fabricated URLs |
| Source data change | Download sha256 ≠ Phase 10–15 baseline → statewide-check; gate stays blocked |
| Uncertain records | Remain ineligible until authoritative evidence supports another class |

### Regression controls (must remain)

| Case | Expected |
| --- | --- |
| `502701867` | unknown-ineligible / unpublishable / unclaimable |
| `95354` | refuse-closed / invalid-id-ineligible |
| `015601219` | exact canonical working; truncated `15601219` non-canonical |
| Five withdrawn IDs | withdrawn-ineligible (documented coarsening) |
| 28 unresolved coords | **not** re-probed without new evidence |

## Harness properties (inherited from Phase 13)

| Property | Behavior |
| --- | --- |
| Read-only | FacilityDetail GET + DownloadStateData CSV + targeted ArcGIS FAC_NBR query (conflict regression only) |
| Exact IDs | Preserves leading zeros; refuses non 8–9 digit IDs |
| Rate limit | Default `minIntervalMs=450` between FacilityDetail calls |
| Retry / backoff | Up to 3 attempts; backoff 500 / 1500 / 3000 ms on 429/5xx/transport errors |
| Checkpointing | Writes `disclosure-audit-checkpoint.json` every 10 completions |
| Request cap | `--max-requests` (default 250 per session) |
| Duration cap | Default 30 minutes wall time per session |
| Consecutive failures | Stops after 8 consecutive `inconclusive` results |
| Resume | `--resume` skips `completedKeys` from checkpoint |
| Coord re-probe | **Skipped** unless genuinely new authoritative evidence |
| CDSS email | **Never sent** from this harness |

## Commands

### Exception detection + incremental disclosure (Phase 16 default)

```bash
node --experimental-strip-types scripts/california-phase16-exception-detection-run.mjs \
  --out california-phase16-audit-out \
  --max-requests 250
```

Produces:

- `disclosure-sample-plan.json` — previously-unverified stratified plan + geographic bands
- `status-sample-plan.json` — status sample including five withdrawn regression controls + conflict ID
- `disclosure-audit-checkpoint.json` — resumable progress
- `exception-detection-report.json` — sampled vs statewide-check vs regression findings
- `live-run-summary.json` — compact denominators + exception rollup
- `california-phase16-exception-detection-live.json` — full evidence bundle

### Resume a partial session

```bash
node --experimental-strip-types scripts/california-phase16-exception-detection-run.mjs \
  --out california-phase16-audit-out \
  --checkpoint california-phase16-audit-out/disclosure-audit-checkpoint.json \
  --resume \
  --max-requests 250
```

## Safeguards checklist

- [ ] California `unpublished`
- [ ] Owner claims disabled
- [ ] Gate `blocked`
- [ ] Conflict `502701867` remains `unknown-ineligible` / unpublishable / unclaimable
- [ ] No CDSS email sent
- [ ] No Supabase / production writes
- [ ] No merge without human approval
- [ ] Branch targets `development`, not `main`
- [ ] No fabricated coordinates / license IDs / disclosure links
- [ ] 28 unresolved coords not re-probed without new evidence
- [ ] Sample findings not claimed as statewide
- [ ] Baseline preserved: 24,377 / 15,451 / 15,423 / 28 / 21

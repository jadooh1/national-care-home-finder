# California Phase 14 — disclosure expansion + exception investigation runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent).  
**Do not** write to Supabase, production, or `main`.  
**Do not** fabricate coordinates, license IDs, or disclosure links.

## Purpose

1. Expand verified disclosure-link coverage with an additional previously-unverified stratified batch using the Phase 13 rate-limited resumable harness.
2. Investigate exceptional records: ambiguous/invalid disclosure cases and the 28 unresolved candidate coordinates.
3. Strengthen licensing-status evidence on a bounded sample while retaining five CLOSED→Application Withdrawn regression controls.
4. Report exact incremental and cumulative coverage vs the **15,451** publication-candidate roster. Never claim statewide coverage from a partial sample.

## Coverage accounting

| Line | Meaning |
| --- | --- |
| Phase 13 baseline | **116 / 15,451** |
| Phase 14 incremental | newly probed previously-unverified facilities |
| Cumulative | baseline + incremental |

Required report line:

`incremental N / 15451; cumulative (116+N) / 15451 — sample only; statewideCoverageClaimed=false`

## Harness properties (inherited from Phase 13)

| Property | Behavior |
| --- | --- |
| Read-only | FacilityDetail GET + DownloadStateData CSV + targeted ArcGIS FAC_NBR query |
| Exact IDs | Preserves leading zeros; refuses non 8–9 digit IDs |
| Rate limit | Default `minIntervalMs=450` between FacilityDetail calls |
| Retry / backoff | Up to 3 attempts; backoff 500 / 1500 / 3000 ms on 429/5xx/transport errors |
| Checkpointing | Writes `disclosure-audit-checkpoint.json` every 10 completions |
| Request cap | `--max-requests` (default 250 per session) |
| Duration cap | Default 30 minutes wall time per session |
| Consecutive failures | Stops after 8 consecutive `inconclusive` results |
| Resume | `--resume` skips `completedKeys` from checkpoint |
| CDSS email | **Never sent** from this harness |

## Commands

### Incremental disclosure + exceptions (Phase 14 default)

```bash
node --experimental-strip-types scripts/california-phase14-disclosure-exceptions-run.mjs \
  --out california-phase14-audit-out \
  --max-requests 250
```

Produces:

- `disclosure-sample-plan.json` — previously-unverified stratified plan + geographic bands
- `status-sample-plan.json` — status sample including five withdrawn regression controls
- `disclosure-audit-checkpoint.json` — resumable progress
- `live-run-summary.json` — compact denominators + exception rollup
- `california-phase14-disclosure-exceptions-live.json` — full evidence bundle

### Resume a partial session

```bash
node --experimental-strip-types scripts/california-phase14-disclosure-exceptions-run.mjs \
  --out california-phase14-audit-out \
  --checkpoint california-phase14-audit-out/disclosure-audit-checkpoint.json \
  --resume \
  --max-requests 250
```

## Exception investigation rules

| Case | Authoritative resolution rule |
| --- | --- |
| Truncated `15601219` → `015601219` | Exact official ID must work; truncated request stays non-canonical / ambiguous |
| Invalid `95354` | Generator refuse-closed; no URL fabricated |
| 28 unresolved coords | Adopt coords only on exact GIS FAC_NBR (or uniquely corroborated leading-zero collapse) + FacilityDetail identity; otherwise leave unresolved |

## Status verification notes

- Official status evidence = FacilityDetail `STATUS` (+ license dates for CLOSED interpretation).
- Five Phase 11/12 CLOSED→Application Withdrawn IDs remain **regression controls** (`withdrawn-ineligible`).
- Do not invent Closed* equivalence.
- Do not extrapolate sample results statewide.

## Safeguards checklist

- [ ] California `unpublished`
- [ ] Owner claims disabled
- [ ] Gate `blocked`
- [ ] No CDSS email sent
- [ ] No Supabase / production writes
- [ ] No merge without human approval
- [ ] Branch targets `development`, not `main`
- [ ] No fabricated coordinates / license IDs / disclosure links

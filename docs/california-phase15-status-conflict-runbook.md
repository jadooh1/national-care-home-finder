# California Phase 15 — status conflict + disclosure expansion runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent).  
**Do not** write to Supabase, production, or `main`.  
**Do not** fabricate coordinates, license IDs, or disclosure links.

## Purpose

1. Investigate status conflict `502701867` (Download LICENSED vs FacilityDetail Pending Incomplete Application) with authoritative identity, dates, and provenance — without inventing equivalence.
2. Expand verified disclosure-link coverage with an additional previously-unverified stratified batch using the Phase 13 rate-limited resumable harness.
3. Preserve exception safeguards (withdrawn controls, invalid `95354`, leading zeros, 28 unresolved coords without repeating unsuccessful checks).
4. Report exact incremental and cumulative coverage vs the **15,451** publication-candidate roster. Never claim statewide coverage from a partial sample.

## Coverage accounting

| Line | Meaning |
| --- | --- |
| Phase 14 cumulative | **233 / 15,451** |
| Phase 15 incremental | newly probed previously-unverified facilities |
| Cumulative | 233 + incremental |

Required report line:

`incremental N / 15451; cumulative (233+N) / 15451 — sample only; statewideCoverageClaimed=false`

## Status conflict rules

| Rule | Behavior |
| --- | --- |
| Compare sources | DownloadStateData + FacilityDetail + ArcGIS FAC_NBR |
| Identity | Exact number + name/address/city/ZIP agreement rejects record-reuse |
| Never invent | Do not equate LICENSED with Pending Incomplete Application |
| Eligibility | Keep `unknown-ineligible` until reliable evidence supports another class |
| Publication / claims | Conflicting facility cannot be published or claimed |
| Blocker type | Individual facility exception — distinct from statewide launch blockers |

## Harness properties (inherited from Phase 13)

| Property | Behavior |
| --- | --- |
| Read-only | FacilityDetail GET + DownloadStateData CSV + targeted ArcGIS FAC_NBR query (conflict only) |
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

### Status conflict + incremental disclosure (Phase 15 default)

```bash
node --experimental-strip-types scripts/california-phase15-status-conflict-run.mjs \
  --out california-phase15-audit-out \
  --max-requests 250
```

Produces:

- `disclosure-sample-plan.json` — previously-unverified stratified plan + geographic bands
- `status-sample-plan.json` — status sample including five withdrawn regression controls + conflict ID
- `disclosure-audit-checkpoint.json` — resumable progress
- `live-run-summary.json` — compact denominators + conflict rollup
- `california-phase15-status-conflict-live.json` — full evidence bundle

### Resume a partial session

```bash
node --experimental-strip-types scripts/california-phase15-status-conflict-run.mjs \
  --out california-phase15-audit-out \
  --checkpoint california-phase15-audit-out/disclosure-audit-checkpoint.json \
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

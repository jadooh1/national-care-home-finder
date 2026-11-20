# California Phase 13 — disclosure audit operational runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent).  
**Do not** write to Supabase, production, or `main`.

## Purpose

Provide a safe, reproducible process to verify official CDSS FacDetail disclosure links for California publication candidates (baseline **15,451**), starting with a predefined larger stratified sample rather than an uncontrolled statewide crawl.

## Harness properties

| Property | Behavior |
| --- | --- |
| Read-only | FacilityDetail GET + DownloadStateData CSV only |
| Exact IDs | Preserves leading zeros; refuses non 8–9 digit IDs |
| Rate limit | Default `minIntervalMs=450` between FacilityDetail calls |
| Retry / backoff | Up to 3 attempts; backoff 500 / 1500 / 3000 ms on 429/5xx/transport errors |
| Checkpointing | Writes `disclosure-audit-checkpoint.json` every 10 completions |
| Request cap | `--max-requests` (default 250 per session) |
| Duration cap | Default 30 minutes wall time per session |
| Consecutive failures | Stops after 8 consecutive `inconclusive` results |
| Resume | `--resume` skips `completedKeys` from checkpoint |
| Coverage claims | Always `statewideCoverageClaimed: false` until a dedicated roster-complete run is explicitly signed off |

## Stopping conditions

The runner stops when any of these fire:

1. `queue-exhausted` — planned sample (or queue) fully probed  
2. `max-requests` — session request cap reached (resume later)  
3. `max-duration` — session wall-time cap reached (resume later)  
4. `consecutive-inconclusive` — API unhealthy; operator should investigate before resume  
5. `operator-abort` — reserved for manual interrupt handling

## Commands

### Stratified sample (Phase 13 default)

```bash
node --experimental-strip-types scripts/california-phase13-disclosure-audit-run.mjs \
  --out california-phase13-audit-out \
  --max-requests 250
```

Produces:

- `disclosure-sample-plan.json` — deterministic stratified plan (seed + download expansion)
- `status-sample-plan.json` — status sample including five withdrawn regression controls
- `disclosure-audit-checkpoint.json` — resumable progress
- `live-run-summary.json` — compact denominators
- `california-phase13-disclosure-audit-live.json` — full evidence bundle

### Resume a partial session

```bash
node --experimental-strip-types scripts/california-phase13-disclosure-audit-run.mjs \
  --out california-phase13-audit-out \
  --checkpoint california-phase13-audit-out/disclosure-audit-checkpoint.json \
  --resume \
  --max-requests 250
```

### Future roster-wide candidate audit (not Phase 13 default)

1. Build a queue of all **15,451** publication-candidate facility numbers from DownloadStateData (LICENSED + ON PROBATION that pass Phase 6 eligibility).  
2. Create a checkpoint with `mode: "roster-resume"`.  
3. Run in sessions of `--max-requests` ≤ 500 with `--resume` until `stopReason=queue-exhausted`.  
4. Report exact `verifiedCount / 15451`. **Never** claim statewide verification from a partial checkpoint.

## Interpreting results

| Classification | Meaning |
| --- | --- |
| working | FacilityDetail `FACILITYNUMBER` exact match; canonical page URL preserves ID |
| missing | Well-formed URL but FacilityDetail not found |
| ambiguous | Leading-zero canonicalization or ID mismatch |
| invalid | Non 8–9 digit ID (generator refuse-closed) |
| inconclusive | Timeout / non-200 / transport failure |

**Coverage line (required in every report):**

`verified N / 15451 publication candidates — sample only; statewideCoverageClaimed=false`

## Status verification notes

- Official status evidence = FacilityDetail `STATUS` (+ license dates for CLOSED interpretation).  
- Download-only `CLOSED` + empty License First Date is a **planning/accounting indicator**, not FacilityDetail-verified withdrawn status.  
- Five Phase 11/12 CLOSED→Application Withdrawn IDs are **regression controls**; keep `withdrawn-ineligible`.  
- Do not invent Closed* equivalence.

## Safeguards checklist

- [ ] California `unpublished`  
- [ ] Owner claims disabled  
- [ ] Gate `blocked`  
- [ ] No CDSS email sent  
- [ ] No Supabase / production writes  
- [ ] No merge without human approval  
- [ ] Branch targets `development`, not `main`

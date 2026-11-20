# California Phase 19 — limited verification pilot runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** change or open the publication gate.  
**Do not** start staged statewide without a separate human approval.  
**Do not** activate exclusion policy in application or database.  
**Do not** fabricate coordinates, license IDs, or disclosure links.  
**Do not** re-probe the 28 unresolved coordinates without new authoritative evidence.

## Purpose

1. Execute the **user-approved** limited California verification pilot (≤250 unique previously-unverified facilities) using the Phase 13 harness.
2. Analyze disclosure / status consistency results and distinguish them from the prior **462** baseline.
3. Apply the Phase 18 exclusion policy for **offline classification only**.
4. Produce an evidence-based recommendation on whether to **request** staged statewide approval (do not start it).

## Safeguards

| Control | Value |
| --- | --- |
| Concurrency | **1** |
| Min interval | **450 ms** (including retries) |
| Cap | **≤250** unique previously-unverified |
| Prior samples | Skip existing **462** disclosure IDs |
| Checkpoint | every 10; `--resume` supported |
| Retries | 3 attempts; 500 / 1500 / 3000 ms |
| Auto-stop | 8 consecutive inconclusive; 429/403; sustained 5xx; queue / max-requests / max-duration |
| Exact IDs | Leading zeros preserved |
| Exclusion | Offline classify only (`activatedInApplicationOrDatabase=false`) |
| Statewide | `stagedStatewideStarted=false` |

## Commands

```bash
node --experimental-strip-types scripts/california-phase19-verification-pilot-run.mjs \
  --out california-phase19-audit-out \
  --max-requests 250
```

Resume:

```bash
node --experimental-strip-types scripts/california-phase19-verification-pilot-run.mjs \
  --out california-phase19-audit-out \
  --checkpoint california-phase19-audit-out/disclosure-audit-checkpoint.json \
  --resume \
  --max-requests 250
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase19_verification_pilot.ts
```

## Outputs

- `disclosure-sample-plan.json`
- `disclosure-audit-checkpoint.json`
- `live-run-summary.json`
- `california-phase19-verification-pilot-live.json`
- `exclusion-classification.json`
- `recommendation.json`
- `pilot-dossier.json`

## Coverage line (required)

`verified (462 + N) / 15451 publication candidates — pilot + prior sample only; statewideCoverageClaimed=false`

## Stop / go

Publication remains **STOP / BLOCKED**. Pilot recommendation may request staged statewide approval separately; this phase never starts it.

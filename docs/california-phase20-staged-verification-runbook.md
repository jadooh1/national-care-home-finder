# California Phase 20 — staged statewide verification runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** change or open the publication gate.  
**Do not** activate exclusion policy in application or database.  
**Do not** fabricate coordinates, license IDs, or disclosure links.  
**Do not** re-probe the 28 unresolved coordinates without new authoritative evidence.

## Purpose

1. Execute the **user-authorized** staged California verification of up to **14,744** previously-unverified publication candidates (batches ≤250) using the Phase 13 harness.
2. Start from coverage baseline **707** (462 Phase 13–16 + 245 Phase 19). Do not duplicate completed verification.
3. Apply the Phase 18 exclusion policy for **offline classification only**.
4. Report progress; claim statewide roster completion only when the authorized remaining queue is exhausted.

## Safeguards

| Control | Value |
| --- | --- |
| Concurrency | **1** |
| Min interval | **450 ms** (all requests including retries) |
| Batch cap | **≤250** unique facilities |
| Overall cap | **≤14,744** additional unique |
| Prior samples | Skip Phase 13–19 probed IDs (baseline **707**) |
| Checkpoint | every 10; `--resume` supported |
| Retries | 3 attempts; 500 / 1500 / 3000 ms |
| Auto-stop | 8 consecutive inconclusive; 429/403; sustained 5xx; queue / max-additional / max-duration |
| Exact IDs | Leading zeros preserved |
| Exclusion | Offline classify only (`activatedInApplicationOrDatabase=false`) |
| Page probes | Default **skipped** (FacilityDetail API is authoritative); `--with-page-probe` enables rate-limited page GETs |

## Commands

```bash
node --experimental-strip-types scripts/california-phase20-staged-verification-run.mjs \
  --out california-phase20-audit-out \
  --batch-size 250 \
  --max-additional 14744
```

Resume:

```bash
node --experimental-strip-types scripts/california-phase20-staged-verification-run.mjs \
  --out california-phase20-audit-out \
  --checkpoint california-phase20-audit-out/disclosure-audit-checkpoint.json \
  --resume \
  --batch-size 250 \
  --max-additional 14744
```

Smoke (one small batch):

```bash
node --experimental-strip-types scripts/california-phase20-staged-verification-run.mjs \
  --out california-phase20-audit-out \
  --batch-size 5 \
  --max-additional 5 \
  --max-batches 1
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase20_staged_verification.ts
```

## Outputs

- `remaining-queue-plan.json`
- `disclosure-audit-checkpoint.json`
- `batch-progress.json`
- `live-run-summary.json`
- `california-phase20-staged-verification-live.json`
- `exclusion-classification.json`
- `progress.json`
- `staged-dossier.json`
- `handoff.json` (exact resume command if incomplete)

## Coverage line (required)

`verified (707 + N) / 15451 publication candidates — staged crawl; statewideCoverageClaimed only when authorized remaining queue exhausted`

## Stop / go

Publication remains **STOP / BLOCKED**. Staged crawl authorization does **not** open the publication gate.

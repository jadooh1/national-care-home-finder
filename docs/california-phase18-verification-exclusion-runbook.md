# California Phase 18 — verification plan + exclusion policy runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** change or open the publication gate.  
**Do not** request permission to open the publication gate in this phase.  
**Do not** start a pilot or statewide FacilityDetail crawl.  
**Do not** activate the exclusion policy.  
**Do not** fabricate coordinates, license IDs, or disclosure links.  
**Do not** re-probe the 28 unresolved coordinates without new authoritative evidence.

## Purpose

1. Assemble an approval-ready full-roster verification plan from prior sample evidence (**462 / 15,451**).
2. Draft a facility-exclusion policy (complete listing exclusion vs map/disclosure/owner-claim feature suppression).
3. Produce a decision-ready readiness report separating global launch blockers from facility-specific exceptions.
4. Present separate human approval options: crawl authorization; exclusion adoption; publication preconditions.

## Commands

### Assemble dossier (optional live Download sha256 probe)

```bash
node --experimental-strip-types scripts/california-phase18-verification-exclusion-run.mjs \
  --out california-phase18-audit-out
```

Skip the download probe:

```bash
node --experimental-strip-types scripts/california-phase18-verification-exclusion-run.mjs \
  --out california-phase18-audit-out --skip-download
```

Outputs: `verification-plan.json`, `exclusion-policy.json`, `approval-options.json`, `readiness-report.json`, `verification-exclusion-dossier.json`, `live-run-summary.json`, optional `download-probe.json`.

### Tests

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase18_verification_exclusion.ts
```

## Hard rules

| Rule | Behavior |
| --- | --- |
| Gate | Remains `blocked`; `californiaPhase18AllowsPublication()` is always `false` |
| Crawl | `performNow=false`; `crawlStarted=false`; requires separate human approval |
| Exclusion policy | `activated=false` / `adopted=false` until human adoption |
| CDSS email | Never sent from this harness |
| Gate-open request | Not made in Phase 18 |
| Coords | 28 unresolved not re-probed without new evidence |
| Government records | Never altered; exclusions are product-layer audit decisions |

## Duration estimate (plan only)

| Metric | Value |
| --- | ---: |
| Remaining facilities | 14,989 |
| Probes per facility | 2 |
| Min interval | 450 ms |
| Min wall (no retries) | ~3.75 h |
| Conservative (+25%) | ~4.68 h |
| Sessions @ 250 cap | ~60 |

## Stop / go

**STOP.** Publication remains blocked. Two human decisions are ready: (1) crawl authorization — limited pilot vs staged statewide vs deny; (2) exclusion-policy adoption. Preconditions for any future publication approval are recorded without requesting gate open.

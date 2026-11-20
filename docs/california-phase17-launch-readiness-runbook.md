# California Phase 17 — launch-readiness dossier runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** change or open the publication gate.  
**Do not** perform uncontrolled statewide FacilityDetail crawls.  
**Do not** fabricate coordinates, license IDs, or disclosure links.  
**Do not** re-probe the 28 unresolved coordinates without new authoritative evidence.

## Purpose

1. Prioritize remaining California launch blockers in a decision matrix (statewide vs facility-excludable).
2. Reassess authoritative CDSS freshness evidence (docs + DownloadStateData metadata). Check mailbox for CDSS reply **only if** an authorized connected mailbox is available; never resend.
3. Evaluate Phase 16 exception results (14 statewide LICENSED-missing-date + 21 sampled) for genuine eligibility risk.
4. Decide disclosure-audit strategy for cumulative **462 / 15,451** — pause small samples; full-roster crawl needs **separate approval**.
5. Produce a launch-readiness dossier with stop/go conditions and human decisions required.

## Commands

### Assemble dossier + live freshness probe (default)

```bash
node --experimental-strip-types scripts/california-phase17-launch-readiness-run.mjs \
  --out california-phase17-audit-out
```

Outputs: `launch-readiness-dossier.json`, `decision-matrix.json`, `freshness-channels.json`, `exception-risks.json`, `disclosure-strategy.json`, `readiness-report.json`, `live-run-summary.json`, `download-probe.json`.

### Tests

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase17_launch_readiness.ts
```

## Hard rules

| Rule | Behavior |
| --- | --- |
| Gate | Remains `blocked`; `californiaPhase17AllowsPublication()` is always `false` |
| CDSS email | Never sent from this harness |
| Full-roster crawl | `performNow=false`; requires separate human approval |
| Small samples | Not recommended for launch readiness at ~3% coverage |
| Exceptions | Uncertain records stay ineligible; sample ≠ statewide |
| Coords | 28 unresolved not re-probed without new evidence |

## Stop / go

**STOP** until human-confirmed: authoritative ISO export date (or approved freshness policy), roster status/disclosure verification complete or exclusion policy approved, exception facilities excluded under fail-closed rules, and explicit human approval to open the gate.

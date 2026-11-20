# California Phase 24 — freshness + launch decisions runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS email (follow-up draft is `draft-do-not-send`).  
**Do not** write to Supabase, production, or `main`.  
**Do not** activate exclusion policy.  
**Do not** repeat the statewide FacilityDetail crawl.

## Purpose

1. Document authoritative freshness blocker (ISO export/version still absent).  
2. Reconcile Phase 23 eligibility counts (15,451 / 88 / 15,363 / 27 / 28).  
3. Prioritized launch-dependency checklist with future-authorization lanes.  
4. Keep launch recommendation **STOP**.

## Commands

```bash
node --experimental-strip-types scripts/california-phase24-freshness-launch-decisions-run.mjs \
  --out california-phase24-audit-out
```

Skip download revalidation:

```bash
node --experimental-strip-types scripts/california-phase24-freshness-launch-decisions-run.mjs \
  --out california-phase24-audit-out --skip-download
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase24_freshness_launch_decisions.ts
```

## Count reconciliation

| Metric | Count |
| --- | ---: |
| Candidates | **15,451** |
| Listing exclusions (in candidates) | **88** |
| Otherwise-clear offline | **15,363** |
| Map-only suppressions | **27** |
| Underlying unresolved coords | **28** |

Overlap: `502701867` is both listing-excluded and unresolved-coord → listing wins; 27 remain map-only.

## Stop / go

**STOP.** Follow-up CDSS draft must not be sent without human approval.

# Pennsylvania onboarding investigation runbook

**Scope:** Development-only, read-only. Pennsylvania stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California or send CDSS follow-up.

## Purpose

1. Re-verify official DHS personal-care-home open-data counts (989 rows).  
2. Ledger the 13 letter-only street exceptions without inventing addresses.  
3. Confirm no facility-specific disclosure permalinks are recorded.  
4. Keep an offline eligibility matrix and STOP readiness.

## Commands

```bash
node --experimental-strip-types scripts/pennsylvania-onboarding-investigation-run.mjs \
  --out pennsylvania-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/pennsylvania_onboarding_investigation.ts
```

## Baseline

| Metric | Count |
| --- | ---: |
| Official rows | **989** |
| Usable streets | **976** |
| Letter-only street exceptions | **13** |
| Publication-eligible | **0** |

## Stop / go

**STOP.** License number, status, authoritative export date, and facility disclosure remain blockers.

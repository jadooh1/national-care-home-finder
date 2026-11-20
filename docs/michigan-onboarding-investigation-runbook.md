# Michigan onboarding investigation runbook

**Scope:** Development-only, read-only. Michigan stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California or activate exclusions.

## Purpose

1. Re-verify LARA `afc_sw.txt` counts against the prior 4,480-row baseline.  
2. Keep blank Street rows unresolved; do not promote supplemental/mailing text.  
3. Keep all 234 `XH` / `EXEMPT` rows ineligible without an authoritative definition.  
4. Maintain an offline readiness matrix under **STOP**.

## Commands

```bash
node --experimental-strip-types scripts/michigan-onboarding-investigation-run.mjs \
  --out michigan-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/michigan_onboarding_investigation.ts
```

## Baseline

| Metric | Prior | Current |
| --- | ---: | ---: |
| Rows | 4,480 | **4,476** |
| Blank Street | 4,423 | **4,419** |
| Usable Street | 57 | **57** |
| XH / EXEMPT | 234 | **234** |

## Stop / go

**STOP.** Physical-address definition, XH classification, and authoritative export date remain blockers.

# California Phase 26 — release readiness runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** activate exclusion policy.  
**Do not** crawl FacilityDetail statewide.  
**Do not** send CDSS email.  
**Do not** write to Supabase, production, or `main`.

## Purpose

1. Consolidate Phases 20–25 into one versioned readiness manifest.  
2. Rehearse blocked-publication restrictions (directories, search, maps, APIs, sitemap, owner claims).  
3. Confirm security / rollback readiness.  
4. Preserve CDSS freshness STOP without repeating investigations or sending mail.

## Commands

```bash
node --experimental-strip-types scripts/california-phase26-release-readiness-run.mjs \
  --out california-phase26-audit-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase26_release_readiness.ts
```

## Baseline (verified)

| Metric | Count |
| --- | ---: |
| Official records | **24,377** |
| Candidates | **15,451** |
| Listing exclusions | **88** |
| Otherwise-clear offline | **15,363** |
| Unresolved coordinates | **28** |
| Map-only suppressions | **27** |

## Stop / go

**STOP.** Gate remains **BLOCKED**. Exact freshness evidence still needed: source-issued ISO as-of / version stamp for DownloadStateData.

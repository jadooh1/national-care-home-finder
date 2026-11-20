# California Phase 25 — launch QA / security runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** activate exclusion policy.  
**Do not** crawl FacilityDetail statewide.  
**Do not** send CDSS email.  
**Do not** write to Supabase, production, or `main`.

## Purpose

1. Audit unpublished California access (routes, APIs, map, search, sitemap/robots, owner/admin).  
2. Regress Phase 23/24 eligibility counts (15,451 / 88 / 15,363 / 28 / 27).  
3. Confirm source-data safeguards (IDs, leading zeros, escaping, disclosure URLs, coords, capacity).  
4. Rehearse launch acceptance, rollback, and remaining approvals — keep **STOP**.

## Commands

```bash
node --experimental-strip-types scripts/california-phase25-launch-qa-security-run.mjs \
  --out california-phase25-audit-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase25_launch_qa_security.ts
```

## Eligibility regression

| Metric | Count |
| --- | ---: |
| Candidates | **15,451** |
| Listing exclusions (in candidates) | **88** |
| Otherwise-clear offline | **15,363** |
| Underlying unresolved coords | **28** |
| Map-only suppressions | **27** |

Offline otherwise-clear candidates do **not** grant public visibility while `californiaDirectoryReady() === false`.

## Security surfaces checked

- No public `/california` route; only `/development/california` (review, no facility list)
- Homepage California card: Unpublished (no directory href)
- No `app/api` California endpoints; no middleware
- Sitemap Washington-only; robots disallow `/development`
- Owner claims / admin: no California publish path (credentialed live probe optional for humans)

## Stop / go

**STOP.** Gate remains **BLOCKED**. Production / gate-open require separate human approval.

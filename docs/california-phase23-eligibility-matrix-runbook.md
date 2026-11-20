# California Phase 23 — eligibility matrix & launch controls runbook

**Scope:** Development-only, read-only. California stays unpublished. Gate stays **BLOCKED**.  
**Do not** send CDSS clarification email (already sent — no duplicates).  
**Do not** write to Supabase, production, or `main`.  
**Do not** activate exclusion policy in application or database.  
**Do not** repeat the statewide FacilityDetail crawl.

## Purpose

1. Reaffirm authoritative freshness blocker (ISO export/version stamp still absent).  
2. Build an auditable offline eligibility matrix for **15,451** candidates (listing vs map vs disclosure).  
3. Document future launch controls: release checklist, rollback, STOP/GO.  
4. Keep launch recommendation **STOP**.

## Commands

```bash
node --experimental-strip-types scripts/california-phase23-eligibility-matrix-run.mjs \
  --out california-phase23-audit-out
```

Skip DownloadStateData revalidation:

```bash
node --experimental-strip-types scripts/california-phase23-eligibility-matrix-run.mjs \
  --out california-phase23-audit-out --skip-download
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_phase23_eligibility_matrix.ts
```

## Matrix scopes

| Scope | Meaning |
| --- | --- |
| `complete-listing-exclusion` | Facility stays off California listings offline |
| `feature-suppression-map` | Map pin suppressed (may still be listing-clear offline) |
| `feature-suppression-disclosure` | Disclosure feature suppressed |
| `none-clear-offline` | No Phase 16–22 exception overlay — still unpublished while gate BLOCKED |

## Stop / go

**STOP.** Do not publish until every statewide go-criterion is human-confirmed. Facility exceptions alone do not clear the gate.

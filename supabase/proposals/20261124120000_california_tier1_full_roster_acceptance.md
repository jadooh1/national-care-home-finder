# California Tier 1 full-roster acceptance (development-only)

**Baseline:** PR #211 merged at `22a367f`  
**Branch intent:** verify statewide 15,435-facility development directory reliability; remediate confirmed defects only.  
**Public California:** STOP

## Verified

- Development commit `22a367f`; local production build serves `/development/california`.
- Search, city filter, category filter, pagination, and detail navigation at statewide scale.
- In-process helper budgets: search p95 ≤ 50ms; lookup p95 ≤ 5ms; warm listing TTFB ≈ 19–30ms.
- Desktop / mobile / keyboard focus smoke for the roster form.
- Roster integrity: 15,435 unique exact IDs; approved capacity present; FacDetail URLs for representative samples.
- All 22 residual exclusions + leading-zero truncation aliases + invalid IDs fail closed.
- No California leak into public listings, maps, APIs, sitemap, or owner workflows.
- Washington / Oregon contracts and unit suites remain intact (WA-only owner/sitemap).

## Remediation in this change

- STOP banner now distinguishes prior offline Tier 1 (15,429) from current listable roster (15,435).
- Roster search form exposes `role="search"` + accessible name.
- Acceptance regression test suite + CI step.

## Remaining prepublication blockers (unchanged)

1. Activate residual exclusion ledger before any public CA listing wire-up.
2. Eligibility-mapping activation (separate decision).
3. Statewide publication approval (`publicationEligible` remains 0).

## Restrictions preserved

No California publication, exclusion activation, eligibility activation, database writes, production changes, or merge without approval.

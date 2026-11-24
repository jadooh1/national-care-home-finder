# California prepublication cutover controls (development-only)

**Baseline:** PR #212 merged at `d94276a`  
**Public California:** STOP  
**Runtime activation:** none

## What shipped

Functional (inactive) cutover controls for future California publication:

1. **Publication-selection pipeline** — `californiaPrepublicationSelectFacility` evaluates candidates with fail-closed reasons.
2. **Exclusion ledger wired in** — residual-22 IDs (+ truncation aliases) never select for publication; hard precondition requires `exclusionsActivated` before selection can pass.
3. **Eligibility mapping behind independent control** — Pending Increase mapping applies only when `eligibilityMappingActivated`; default OFF.
4. **Fail-closed safeguards** — stale source as-of, invalid identifiers, status conflicts, unverified disclosure links.
5. **Dry-run activation / rollback sequences** — executable rehearsals that never mutate default runtime controls or write Supabase.
6. **Development review page** — `/development/california-prepublication-cutover`.

## Defaults (unchanged after rehearsal)

| Control | Value |
| --- | --- |
| exclusionsActivated | false |
| eligibilityMappingActivated | false |
| californiaPublished | false |
| publicationEligibleCount | 0 |

## Remaining human approvals (separate)

1. `activate-california-exclusion-ledger-in-app-db`
2. `activate-pending-increase-mapping-in-app-db`
3. `approve-california-statewide-public-publication`

## Restrictions preserved

No actual activation, California publication, Supabase writes, production changes, or merge without approval. Washington / Oregon contracts unchanged.

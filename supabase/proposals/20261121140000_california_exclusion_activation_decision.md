# California exclusion-control activation decision audit

**Baseline:** PR #207 merged at `50dbad4`  
**Observed:** 2026-11-21  
**Mode:** Development-only / read-only. No activation, no Supabase writes, no California publication.

## Recommendation

**GO** for future exclusion-control activation readiness. Public California remains **STOP**. Ledger remains inactive until human approval of `activate-california-exclusion-ledger-in-app-db`.

## Evidence

- Live FacilityDetail: 22/22 residual IDs exact match
- Listing gates fail-closed on search / detail / API / map / owner-claim
- Truncation aliases hardened (`19201167` → `019201167`, etc.)
- Offline activation/rollback rehearsal: exclusion activation alone does not activate eligibility mapping or publish California; `publicationEligible` stays 0
- Unexpected identifiers fail closed; cache keys must use canonical Facility Number at wire-up

## Three independent approvals

1. Exclusion ledger activation (readiness GO; not executed)
2. Pending Increase eligibility mapping (separate; inactive)
3. California statewide public publication (STOP)

## Artifacts

- `lib/california-exclusion-activation-decision.ts`
- Truncation hardening in `lib/california-exclusion-control-readiness.ts`
- `/development/california-exclusion-activation`
- `supabase/proposals/tests/california_exclusion_activation_decision.ts`

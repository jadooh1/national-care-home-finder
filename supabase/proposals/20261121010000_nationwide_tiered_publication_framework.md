# Nationwide evidence-based tiered publication framework (proposal)

**Issue:** #189  
**Observed:** 2026-11-21  
**Applied:** false  
**Schema migration applied:** false  

## Intent

Replace all-or-nothing source-discovery readiness with a fail-closed **per-facility** publication eligibility evaluator (Tiers 0–3), keeping **state authorization** (`directoryContract`) separate from row eligibility.

## Tiers

| Tier | Name | Gate summary |
| --- | --- | --- |
| 0 | Blocked | Invalid/ambiguous ID, unverified provenance, ambiguous status, unusable address, category conflict, unresolved exclusion, freshness STOP, CA blocked |
| 1 | Verified directory listing | Identity + provenance + in-scope category + usable status + usable physical address + freshness (ISO **or** documented policy + independent evidence). Disclosure/capacity optional. No coords required. |
| 2 | Mapped listing | Tier 1 + licensing coordinate provenance + address alignment. Georeferenced pins rejected. Oregon map stays disabled. |
| 3 | Enhanced listing | Tier 1/2 + separately verified capacity + enhanced disclosure/inspection under existing controls. Missing inspection ≠ clean inspection. |

## Additive code (no production publish)

- `lib/publication-eligibility.ts` — evaluator + reason codes
- `lib/publication-eligibility-profiles.ts` — WA/OR/CA/FL/NC/SC/KY/TN/MA rules
- `lib/publication-eligibility-evidence.ts` — hard-case fixtures
- `lib/publication-eligibility-readiness.ts` — development readiness report
- `lib/publication-eligibility-rollout.ts` — candidate + rollout/rollback
- `app/development/publication-eligibility/page.tsx` — internal preview only

## Preserved invariants

- Washington `public` directory + map unchanged
- Oregon `development`, `mapPath` null, host-gated
- California publication BLOCKED; exclusion policy inactive
- Owner claims Washington-only (`ENABLED_OWNER_FACILITY_STATES = ["WA"]`)
- No Supabase writes; no new public state routes
- SC and KY evidence preserved; Alabama discovery remains on its separate branch

## Freshness

HTTP Last-Modified, page clocks, retrieval time, and filename timestamps are **rejected** as official export dates. Missing ISO export is a flagged limitation; Tier 1 may proceed **only** with a documented freshness policy **and** independent official currentness evidence; otherwise STOP.

## First realistic launch candidate

**Oregon** — staged development-preview continuation (already authorized as development). Not a public launch.  
**Strongest unpublished follow-on:** Florida — after ISO + status mapping + coordinate provenance. Still STOP until separate approval.

## Schema

No applied migration. If a future roster table is needed, reuse the existing additive roster proposal (`ROSTER_MIGRATION_PROPOSAL.applied === false`). This framework does not require a new table to land.

## Rollback

1. Revert any accidental `directoryContract` change (this PR makes none).  
2. Remove `/development/publication-eligibility` if needed.  
3. Confirm WA/OR/CA/owner-claim regressions.  
4. No DB rollback for this proposal (nothing applied).

# Publication framework acceptance — Oregon & Florida

**Base commit:** `e4a5335914b5492df488d5de47b5913207354881` (PR #190 merge)  
**Scope:** Development-only acceptance of the nationwide tiered publication framework.  
**Does not** publish states, write Supabase, activate owner claims, or change California exclusions.

## Launch-readiness recommendation

| State | Public launch | Decision | Notes |
| --- | --- | --- | --- |
| Oregon | No | **STOP** | Continue existing host-gated development directory only. Map/refresh off. Framework Tier 1 unmet (street withheld, no ISO). |
| Florida | No | **STOP** | Strongest unpublished Tier 1 precursor. Blocked on ISO export, LicenseStatus mapping, licensing coordinate provenance. |
| Overall | No new publics | **STOP** | Eligibility never auto-publishes. Separate approval required. |

## Acceptance matrix (summary)

| Area | Verdict |
| --- | --- |
| `/development` robots/sitemap exclusion | pass |
| Eligibility page noindex metadata | pass |
| No Supabase writes / no contract mutation | pass |
| Oregon development + map/refresh/owner-claim disabled | pass |
| Oregon Tier 0 without street / ISO | pass (blocked for public) |
| Florida identifiers + Profile/?LID= disclosure | pass |
| Florida freshness / status mapping / licensing coords | blocked |
| Florida publicationEligible = 0 | pass |
| Offline Tier 1 ≠ finalPublicVisibility | pass |
| Hard-case fail-closed suite | pass |
| Never auto-publish | pass |

Full machine-readable rows: `lib/publication-eligibility-acceptance.ts`.

## Preview checklist

1. Open `/development/publication-eligibility` on development/preview only.  
2. Confirm robots disallow `/development` and sitemap omits the path.  
3. Confirm Oregon/Florida cards show STOP, tier counts, blockers, and ISO export = null.  
4. Confirm tier table columns T0–T3 and source dates render on mobile (horizontal scroll).  
5. Confirm copy states eligibility never auto-publishes.

## Rollback checklist

1. Revert this acceptance PR if needed; framework from #190 remains on `development`.  
2. Do not change `directoryContract` publication values.  
3. Keep `/development/publication-eligibility` internal/noindex.  
4. Re-run WA public + OR map-null + CA blocked + owner-claim WA-only regressions.  
5. No database rollback (no migration applied).

## Genuine blockers requiring approval

1. Oregon public authorization change (ISO export + street policy).  
2. Florida AHCA ISO export / version stamp.  
3. Florida LicenseStatus → publication mapping.  
4. Florida licensing coordinate provenance decision.  
5. Any new public state flip of `directoryContract`.

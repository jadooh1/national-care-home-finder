# California ArcGIS Tier 1 reconciliation (read-only)

California stays unpublished. This proposal records a 2026-11-21 full-dataset reconciliation of CDSS ArcGIS FeatureServer/0 against historical CHHS RCFE/ARF CSVs and an explicit **framework Tier 1** readiness decision.

## Verdict

**STOP.** ArcGIS alone does not meet Tier 1 directory-readiness. Development-preview Tier 1 from ArcGIS-as-roster is also STOP (`tier1OfflineEligible = 0`) because STATUS integers are undocumented.

## Evidence summary

See `docs/california-arcgis-tier1-reconciliation-runbook.md` and `lib/california-arcgis-tier1-eligibility.ts`.

Key quantified results:

- ArcGIS rows: **37,871** (was 37,887 on 2026-11-19)
- Exact ID matches vs 21,131 eligible CHHS licenses: **12,766**
- Exact misses: **8,365** (1,240 leading-zero mismatches; 7,125 truly missing)
- In-scope GIS address usable: **15,448 / 15,448**
- Undocumented STATUS on in-scope rows: `{3: 15251, 4: 29, 5: 60, 6: 108}`
- Publication / owner-claim eligible: **0 / 0**

## Code

- `lib/california-arcgis-tier1-eligibility.ts` — Tier 1 assessment + recorded live counts
- `supabase/proposals/tests/california_arcgis_tier1_eligibility.ts` — regression tests
- CI step wired in `.github/workflows/pr-validation.yml`

No directoryContract, publication flag, exclusion activation, Design 2, WA/OR, auth, billing, or Supabase changes.

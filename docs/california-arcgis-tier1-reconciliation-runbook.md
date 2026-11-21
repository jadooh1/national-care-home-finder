# California ArcGIS Tier 1 reconciliation runbook

**Issue:** https://github.com/jadooh1/national-care-home-finder/issues/131  
**Also:** https://github.com/jadooh1/national-care-home-finder/issues/127  
**Observed:** 2026-11-21  
**Scope:** Development-only, read-only. California remains unpublished.

## Purpose

Re-verify the official CDSS ArcGIS CCL point layer against historical CHHS RCFE/ARF licensing CSVs and decide whether ArcGIS meets **framework Tier 1** directory readiness. Tier 2 map pins require separate licensing-coordinate approval and are out of scope.

## Verdict

**STOP** for public Tier 1 and for ArcGIS-as-roster development preview. ArcGIS alone cannot clear identity, status, or freshness gates. `tier1OfflineEligible = 0`, `publicationEligible = 0`.

## Official sources

| Source | URL |
| --- | --- |
| Geospatial catalog | https://publish.data.ca.gov/dataset/community-care-licensing-facilities1 |
| ArcGIS FeatureServer/0 | https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0 |
| CHHS package | https://data.chhs.ca.gov/dataset/ccl-facilities |
| FacilityDetail API | https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{id} |

CHHS resource IDs are stable; download filenames rotate (`tmp*.csv`). Resolve the current download URL via CKAN `package_show` before each fetch. Catalog clocks, ArcGIS editing timestamps, layer name year `2023`, and CHHS `file_date` text `05252025` are **not** authoritative ISO export dates.

## Live counts (2026-11-21, full dataset)

| Metric | Count |
| --- | ---: |
| ArcGIS total rows | 37,871 |
| RCFE-like / ARF-like | 8,643 / 6,805 |
| In-scope usable street+city | 15,448 / 15,448 |
| CHHS RCFE eligible | 12,521 |
| CHHS ARF eligible (shifted excluded) | 8,610 |
| Combined eligible | 21,131 |
| Exact ID matches | 12,766 |
| Missing from GIS (exact) | 8,365 |
| Leading-zero representation mismatches | 1,240 |
| Truly missing even if zeros collapsed | 7,125 |
| Duplicate historical / GIS | 0 / 0 |
| Invalid in-scope coordinates | 0 |
| Tier 1 offline eligible (ArcGIS roster) | **0** |
| Publication eligible | **0** |

Drift vs PR #133 (2026-11-19): GIS −16 rows; exact matches −5; eligible baseline unchanged at 21,131.

## Why ArcGIS fails Tier 1

1. **Status:** integer `STATUS` domain is null; codes are not accepted.  
2. **Identity:** incomplete exact coverage; integer `FAC_NBR` truncates leading zeros.  
3. **Freshness:** no source-issued ISO export/version stamp.  
4. **Authorization:** California publication remains blocked; exclusions stay inactive.  
5. **Tier 2:** layer is georeferenced (`Master_CCL_County_Intersect_2023`); not licensing coordinate provenance.

Address completeness on in-scope GIS rows and zero duplicate in-scope IDs are positive signals but do not clear the failed gates.

## Reproduce

```bash
# Unit tests (no network)
node --experimental-strip-types --test supabase/proposals/tests/california_arcgis_tier1_eligibility.ts

# Optional live re-probe (network)
node --experimental-strip-types -e 'import { probeCaliforniaCclLayer } from "./lib/california-ccl-arcgis-probe.ts"; console.log(await probeCaliforniaCclLayer());'
```

Module: `lib/california-arcgis-tier1-eligibility.ts`  
Proposal: `supabase/proposals/20261121060000_california_arcgis_tier1_reconciliation.md`

## Remaining blockers

- Undocumented GIS STATUS domain  
- Incomplete exact ID coverage vs CHHS  
- Integer FAC_NBR leading-zero truncation  
- No authoritative ISO export date  
- California publication blocked / unpublished authorization  
- Exclusion policy inactive (do not activate here)  
- Separate Tier 2 licensing-coordinate approval still required for map pins  

## Next step

Do not use ArcGIS as the California directory roster. Continue DownloadStateData + FacilityDetail for status/identity (Phases 20–26). Keep ArcGIS as optional coordinate corroboration only after separate Tier 2 approval. Resolve CDSS ISO export/version stamp before any Tier 1 public claim.

## Guardrails

No production/`main` changes, no Supabase writes, no auth/billing/Design 2 changes, no WA/OR behavior changes, no Florida/Ohio re-investigation, no CDSS outreach, no merge without approval.

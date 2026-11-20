# Florida assisted-living source discovery runbook

**Scope:** Development-only, read-only. Florida stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Florida.  
**Do not** equate Florida ALF or Adult Family Care Homes with Washington adult family homes.

## Purpose

1. Verify FloridaHealthFinder / AHCA assisted-living licensing surfaces.  
2. Confirm ALF vs AFCH vs specialty-license definitions (Ch. 429, F.S.).  
3. Assess identifiers, addresses, capacity, status, coordinates, and disclosure.  
4. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| ALF comparison embed | https://quality.healthfinder.fl.gov/Facility-Provider/ALF?LS=1&type=1 |
| AFCH comparison embed | https://quality.healthfinder.fl.gov/Facility-Provider/Adult-FamilyCare?type=1 |
| Facility locate search | https://quality.healthfinder.fl.gov/Facility-Search/FacilityLocateSearch |
| Profile disclosure | https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID={LicenseID} |
| Inspection details | https://apps.ahca.myflorida.com/dm_web/facility_inspection_details.aspx?client_code=11&file_number={FileNumber} |
| AHCA ALF program page | https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/assisted-living-unit/assisted-living-facility.html |
| AHCA AFCH program page | https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/assisted-living-unit/adult-family-care-home.html |
| DOH GIS 2013 layer (rejected) | https://maps.floridahealth.gov/server/rest/services/DEMO/HealthCareFacilities/FeatureServer/3 |

## Commands

```bash
node --experimental-strip-types scripts/florida-assisted-living-source-discovery-run.mjs \
  --out florida-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/florida_assisted_living_source_discovery.ts
```

## Verified ALF metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| ALF embed rows | 3,025 |
| Unique FileNumber / LicenseID | 3,025 / 3,025 |
| Unique LicenseNumber | 3,024 |
| LICENSED / IN REVIEW / other | 2,253 / 645 / 127 |
| Blank street address | 0 |
| Bed range | 4–510 |
| Coordinate pairs | 3,025 |
| AFCH embed rows (separate type) | 230 |
| DOH GIS 2013 rows (rejected) | 3,093 |

No ISO export date. Page Date header and “updated nightly” claim are **not** export dates. Miami-Dade sample title `2026/8/24` is **not** a statewide ALF export date.

## Stop / go

**STOP.** Strong ALF identifiers, addresses, capacity, LicenseStatus, and verified Profile/`LID` disclosure remain blocked on export date, status publication mapping, coordinate provenance, and category mapping. Publication eligible rows: **0**.

**Most actionable next step:** Ask AHCA for an authoritative ISO export/version stamp for the statewide Assisted Living Facility roster (or a dated bulk file matching the FloridaHealthFinder ALF embed).

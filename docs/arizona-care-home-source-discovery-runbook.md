# Arizona care-home source discovery runbook

**Scope:** Development-only, read-only. Arizona stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Arizona.  
**Do not** equate Arizona Assisted Living Homes/Centers with Washington adult family homes.

## Purpose

1. Identify ADHS Assisted Living Home vs Center licensing sources.  
2. Verify FACID/LICENSE_NUMBER, status, capacity, address, coordinates, and disclosure posture with bounded read-only checks.  
3. Reject portal/run stamps as ISO export dates.  
4. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| Assisted Living Home FeatureServer | https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/Assisted_Living_Home_Feb_2025/FeatureServer/18 |
| Assisted Living Center FeatureServer | https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/Assisted_Living_Center_Feb_2025/FeatureServer/18 |
| AZLicensedFacilities Residential layer | https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/AZLicensedFacilities/FeatureServer/12 |
| Residential facilities licensing | https://www.azdhs.gov/licensing/residential-facilities/index.php |
| AZ Care Check | https://azcarecheck.azdhs.gov/s/ |
| ARS §36-401 definitions | https://www.azleg.gov/viewdocument/?docName=https://www.azleg.gov/ars/36/00401.htm |

## Commands

```bash
node --experimental-strip-types scripts/arizona-care-home-source-discovery-run.mjs \
  --out arizona-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/arizona_care_home_source_discovery.ts
```

## Verified Home / Center metrics

| Metric | Home | Center |
| --- | ---: | ---: |
| Rows | 1,719 | 328 |
| Unique FACID | 1,719 | 328 |
| Capacity range | 0–10 | 13–259 |
| OPERATION_STATUS ACTIVE | 1,719 | 328 |
| Blank ADDRESS | 0 | 0 |

ARS §36-401: Home = ten or fewer residents; Center = eleven or more.  
Coordinates are geocode matches (CENTRUS-TOMTOM / StreetmapPremium).  
`RUN_DATE` 2025-02-03 and Feb_2025 service stamps are **not** ISO export dates.

## Stop / go

**STOP.** Home/Center rows are available and separable, but export-date, licensing-coordinate, disclosure-prefix, and category-mapping decisions remain open. Publication eligible rows: **0**.

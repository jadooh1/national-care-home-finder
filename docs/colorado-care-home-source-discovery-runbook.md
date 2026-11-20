# Colorado care-home source discovery runbook

**Scope:** Development-only, read-only. Colorado stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Colorado.  
**Do not** equate Colorado Assisted Living Residences with Washington adult family homes.

## Purpose

1. Identify authoritative CDPHE Assisted Living Residence (ALR) licensing data and related residential categories.  
2. Verify Facility_ID, status, capacity, address, coordinates, and disclosure posture with bounded read-only checks.  
3. Reject portal clocks as ISO export dates.  
4. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| CDPHE Health Facilities FeatureServer | https://services3.arcgis.com/66aUo8zsujfVXRIT/arcgis/rest/services/CDPHE_Health_Facilities/FeatureServer/0 |
| CDPHE Hub about page | https://data-cdphe.opendata.arcgis.com/datasets/CDPHE::cdphe-health-facilities/about |
| data.colorado.gov mirror (non-tabular) | https://data.colorado.gov/Health/Health-Facilities/98pp-s4r4 |
| ALR program page | https://cdphe.colorado.gov/assisted-living-residences |
| Find and Compare Facilities | https://cdphe.colorado.gov/health-facilities/find-and-compare-facilities |
| 6 CCR 1011-1 Chapter 7 (ALR) | https://www.sos.state.co.us/CCR/DisplayRule.do?action=ruleinfo&ruleId=3036&deptID=16&agencyID=144 |
| 6 CCR 1011-1 Chapter 2 (general licensing) | https://www.sos.state.co.us/CCR/DisplayRule.do?action=ruleinfo&ruleId=3031&deptID=16&agencyID=144 |

## Commands

```bash
node --experimental-strip-types scripts/colorado-care-home-source-discovery-run.mjs \
  --out colorado-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/colorado_care_home_source_discovery.ts
```

## Verified ALR filter (FeatureServer)

| Metric | Value |
| --- | ---: |
| Assisted Living Residence rows | 685 |
| Unique Facility_ID | 685 |
| Blank Address_Full | 0 |
| Zero Licensed_Beds_Total | 27 |
| Active + Licensed + beds > 0 | 646 |
| Layer total (all types) | 5,091 |

Coordinates are **address geocode matches**, not licensing-surveyed coordinates.  
`Date_Data_Updated` (uniform 2026-09-29) and layer `editingInfo` / HTTP Last-Modified are **not** ISO export dates.

## Stop / go

**STOP.** ALR-only rows are available and filterable, but export-date, licensing-coordinate, disclosure-prefix, and category-mapping decisions remain open. Publication eligible rows: **0**.

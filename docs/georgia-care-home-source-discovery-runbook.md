# Georgia care-home source discovery runbook

**Scope:** Development-only, read-only. Georgia stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Georgia.  
**Do not** equate Personal Care Homes or Assisted Living Communities with Washington adult family homes.

## Purpose

1. Verify HFRD GetFacilitiesData / GaMap2Care licensing surfaces.  
2. Keep Personal Care Home (PCH) and Assisted Living Community (ALC) separate.  
3. Assess FACID, addresses, capacity, status, coordinates, and disclosure.  
4. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| GetFacilitiesData | https://forms.dch.georgia.gov/HFRD/GetFacilitiesData.svc/GetData |
| Facility Finder | https://forms.dch.georgia.gov/HFRD/GaMap2Care.html |
| HFRD home | https://forms.dch.georgia.gov/HFRD/ |
| PCH program page | https://dch.georgia.gov/divisionsoffices/hfrd/facilities-provider-information/personal-care-homes |
| License verification | https://forms.dch.georgia.gov/hfrd/Verify_License.html |
| Inspection search | https://weblink.dch.georgia.gov/WebLink/CustomSearch.aspx?SearchName=InspectionReportSearch&repo=WEB |
| Regulated PDF (rejected) | https://forms.dch.georgia.gov/HFRD/List_Of_Regulated_Facilities.pdf |

## Commands

```bash
node --experimental-strip-types scripts/georgia-care-home-source-discovery-run.mjs \
  --out georgia-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/georgia_care_home_source_discovery.ts
```

## Verified PCH / ALC metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| GetData all facility types | 36,194 |
| PERSONAL CARE HOME | 1,573 |
| ASSISTED LIVING COMMUNITY | 326 |
| Unique FACID / overlap | 1,899 / 0 |
| Blank street address | 0 |
| OPERSTDESC Active/ACTIVE | 1,899 |
| Zero bed rows | 67 |
| Coordinate pairs (geocoded) | 1,899 |

No ISO export date. `List_Of_Regulated_Facilities.pdf` Last-Modified **2020-03-10** is rejected.

## Stop / go

**STOP.** Strong FACIDs and addresses remain blocked on export date, status completeness, FACID disclosure, licensing-coordinate policy, and PCH/ALC mapping. Publication eligible rows: **0**.

**Most actionable next step:** Ask Georgia DCH/HFRD for an authoritative ISO export/version stamp for GetFacilitiesData, and confirm whether a stable FACID → facility disclosure/inspection URL exists outside generic search pages.

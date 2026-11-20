# New Jersey assisted living source discovery runbook

**Scope:** Development-only, read-only. New Jersey stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish New Jersey.  
**Do not** equate ALR, CPCH, or ALP with Washington adult family homes.  
**Do not** invent ALP capacities or geocodes for zero LAT/LNG cells.  
**Do not** statewide-crawl facility detail pages — detail checks stay bounded.

## Purpose

1. Verify NJDOH `All_LTC.xlsx` for ALR, CPCH, and ALP separately.  
2. Assess FacID/LIC#, addresses, status, capacity, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| LTC facility search | https://healthapps.nj.gov/facilities/fsSearch.aspx |
| County / type search | https://healthapps.nj.gov/facilities/fsSetSearch.aspx?by=county |
| All_LTC.xlsx | https://healthapps.nj.gov/facilities/documents2/All_LTC.xlsx |
| Facility details | https://healthapps.nj.gov/facilities/fsFacilityDetails.aspx?item={FacID} |
| Health Facilities hub | https://www.nj.gov/health/healthfacilities/ |

## Commands

```bash
node --experimental-strip-types scripts/new-jersey-assisted-living-source-discovery-run.mjs \
  --out new-jersey-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/new_jersey_assisted_living_source_discovery.ts
```

## Verified metrics (observed 2026-11-20)

| Metric | ALR | CPCH | ALP |
| --- | ---: | ---: | ---: |
| Rows / unique FacID | 256 | 32 | 17 |
| Blank address | 0 | 0 | 0 |
| Lic_Beds_Slots | 21–288 | 16–308 | **0 on all 17** |
| Nonzero / zero LAT+LNG | 246 / 10 | 32 / 0 | 15 / 2 |
| Cross-type FacID overlap | 0 | 0 | 0 |

Combined ALR+CPCH+ALP: **305** unique FacIDs. Disclosure prefix `fsFacilityDetails.aspx?item={FacID}` verified for all three types. Workbook RunDate / HTTP Last-Modified **2026-11-06** rejected as ISO export.

## Stop / go

**STOP.** Strong identifiers, addresses, ALR/CPCH capacities, and verified disclosure remain blocked on export date, operating-status domain, ALP capacity zeros, and coordinate provenance. Publication eligible rows: **0**.

**Most actionable next step:** Ask NJDOH for an ISO export/version stamp for `All_LTC.xlsx`, a field dictionary for `Lic_Expires` vs operating status and ALP `Lic_Beds_Slots=0`, and whether LAT/LNG are licensing coordinates or geocodes.

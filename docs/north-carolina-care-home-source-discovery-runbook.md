# North Carolina care-home source discovery runbook

**Scope:** Development-only, read-only. North Carolina stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish North Carolina.  
**Do not** equate Family Care Homes (FCL) or Adult Care Homes (HAL) with Washington adult family homes.

## Purpose

1. Re-verify DHSR Adult Care Home and Family Care Home workbooks.  
2. Keep HAL and FCL categories separate.  
3. Assess identifiers, site vs mailing addresses, capacity, star/expiry fields, and disclosure.  
4. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| DHSR reports / listings | https://info.ncdhhs.gov/dhsr/reports.htm |
| Adult Care Home workbook | https://info.ncdhhs.gov/dhsr/data/Ahlist.xlsx |
| Family Care Home workbook | https://info.ncdhhs.gov/dhsr/data/Fchlist.xlsx |
| Facility listings page | https://info.ncdhhs.gov/DHSR/acls/faclistings.html |
| Star-rating search | https://info.ncdhhs.gov/dhsr/acls/star/search.asp |
| Stale FCH text (rejected) | https://info.ncdhhs.gov/dhsr/data/fch.txt |

## Commands

```bash
node --experimental-strip-types scripts/north-carolina-care-home-source-discovery-run.mjs \
  --out north-carolina-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/north_carolina_care_home_source_discovery.ts
node --experimental-strip-types --test supabase/proposals/tests/north_carolina_onboarding.ts
```

## Verified workbook metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| HAL licensed rows | 566 |
| FCL licensed rows | 520 |
| Unique licenses / overlap | 1,086 / 0 |
| Blank trailing rows | 2 |
| Site addresses (NC, ZIP5) | 1,086 |
| HAL beds / FCL beds | 9–201 / 2–6 |
| Identical / distinct mailing | 189 / 897 |
| Star N/A / expiry before obs | 27 / 5 |

Listings page **10/28/2026**, workbook **As of 10/2026**, and HTTP Last-Modified are **not** ISO export dates. `fch.txt` Last-Modified **2021-12-15** is rejected.

## Stop / go

**STOP.** Strong HAL/FCL identifiers and site addresses remain blocked on export date, per-row status, License # disclosure prefix, coordinates, and category mapping. Publication eligible rows: **0**.

**Most actionable next step:** Ask NCDHHS DHSR for an authoritative ISO export/version stamp for `Ahlist.xlsx` and `Fchlist.xlsx`, and confirm whether a stable License # → facility disclosure URL exists outside the star-rating search.

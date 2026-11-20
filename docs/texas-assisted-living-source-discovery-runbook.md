# Texas assisted-living source discovery runbook

**Scope:** Development-only, read-only. Texas stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Texas.  
**Do not** equate Texas Assisted Living Type A/B/C with Washington adult family homes.

## Purpose

1. Re-verify the official HHSC active ALF workbook and closures PDF.  
2. Confirm Type A / B / C definitions (26 TAC §553.5).  
3. Assess identifiers, addresses, capacity, geo cells, and TULIP disclosure.  
4. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| Active ALF workbook | https://apps.hhs.texas.gov/providers/directories/al.xlsx |
| Closures PDF | https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf |
| TULIP provider search | https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-search |
| ALF provider page | https://www.hhs.texas.gov/providers/long-term-care-providers/assisted-living-facilities-alf |
| Type definitions | 26 TAC §553.5 |

## Commands

```bash
node --experimental-strip-types scripts/texas-assisted-living-source-discovery-run.mjs \
  --out texas-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/texas_assisted_living_source_discovery.ts
node --experimental-strip-types --test supabase/proposals/tests/texas_alf_directory.ts
```

## Verified workbook metrics (as of label 11/19/2026)

| Metric | Value |
| --- | ---: |
| Active rows | 2,019 |
| TYPE A / B / C | 335 / 1,676 / 8 |
| Unique Facility ID / License No | 2,019 / 2,019 |
| Blank Physical Address | 0 |
| Geo pairs / comma-only | 1,937 / 82 |
| Closures unique IDs / active overlap | 1,515 / 0 |

Title as-of **11/19/2026** and HTTP Last-Modified are **not** ISO export dates.

## Stop / go

**STOP.** Strongest ALF file remains blocked on export date, operating-status semantics, TULIP disclosure prefix, and category mapping. Publication eligible rows: **0**.

**Most actionable next step:** Obtain an authoritative ISO export/version stamp for `al.xlsx` from HHSC, and separately verify whether a stable TULIP detail URL can be built without inventing account ids.

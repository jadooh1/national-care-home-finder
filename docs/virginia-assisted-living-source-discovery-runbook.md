# Virginia assisted living source discovery runbook

**Scope:** Development-only, read-only. Virginia stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Virginia.  
**Do not** equate Virginia Assisted Living Facilities with Washington adult family homes.  
**Do not** fetch all facility detail pages statewide — detail checks stay bounded to the sample.

## Purpose

1. Verify VDSS Assisted Living Facility Search list and disclosure.  
2. Assess licenseId, addresses, status, capacity, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| ALF Search | https://www.dss.virginia.gov/licensed-care/search-licensing-programs/assisted-living-facility-search/ |
| ALF program | https://www.dss.virginia.gov/licensed-care/assisted-living-facilities-alf/ |
| Licensed Care hub | https://www.dss.virginia.gov/licensed-care/ |
| Legacy alf.cgi | https://www.dss.virginia.gov/facility/search/alf.cgi (redirects to licensed-care) |

## Commands

```bash
node --experimental-strip-types scripts/virginia-assisted-living-source-discovery-run.mjs \
  --out virginia-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/virginia_assisted_living_source_discovery.ts
```

## Verified ALF metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| List total reported | 576 |
| Unique licenseId | 575 |
| Duplicate licenseId rows | 1 (53896) |
| licensed=true | 575 |
| Blank composed address | 0 |
| Disclosure prefix | `?licenseId={id}&endpoint=alf` verified |
| Sample detail capacities (n=32) | 4–225 (not extrapolated) |
| Sample licenseType codes | 1YR/2YR/3YR/COND |
| Coordinate columns | 0 |

No ISO export date.

## Stop / go

**STOP.** Strong licenseIds, addresses, and verified disclosure remain blocked on export date, list-level capacity/licenseType, status-domain mapping, and coordinates. Publication eligible rows: **0**.

**Most actionable next step:** Ask VDSS DOLP for an ISO export/version stamp and a licenseType field dictionary, plus whether capacity can ship on the list extract without statewide detail crawling.

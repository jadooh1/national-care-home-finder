# Ohio residential care source discovery runbook

**Scope:** Development-only, read-only. Ohio stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Ohio.  
**Do not** equate Ohio Residential Care Facilities with Washington adult family homes.

## Purpose

1. Verify ODH EID Facility Listing / Provider Search licensing surfaces.  
2. Assess FACID, STATEID, addresses, capacity, status, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| EID home | https://publicapps.odh.ohio.gov/eid/ |
| Facility Listing criteria | https://publicapps.odh.ohio.gov/EID/reports/EID_Report_Criteria.aspx |
| Provider Search | https://publicapps.odh.ohio.gov/EID/Provider_Search.aspx |
| State license detail (session) | https://publicapps.odh.ohio.gov/EID/Detail_StateLicense.aspx |
| RCF program page | https://odh.ohio.gov/know-our-programs/residential-care-facilities-assisted-living |
| ArcGIS derivative (rejected as export) | https://services6.arcgis.com/zxOMWqh0yAD6mMsJ/arcgis/rest/services/Assisted_Facilities_in_Ohio_NEW/FeatureServer/0 |

## Commands

```bash
node --experimental-strip-types scripts/ohio-residential-care-source-discovery-run.mjs \
  --out ohio-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/ohio_residential_care_source_discovery.ts
```

## Verified RCF metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| Facility Listing L12 rows (unique FACID) | 1,152 |
| ACTIVE | 801 |
| ACTIVE - PENDING RENEWAL | 16 |
| PENDING | 26 |
| CLOSED-* | 309 |
| L17 / CIN-R closed residue | 5 |
| Blank ADDRESS (L12) | 0 |
| ACTIVE bed range | 5–508 |
| Coordinate columns on listing | 0 |

No ISO export date. ArcGIS OneSource (814 rows, edited 2026-10-05) and program-page “approximately 720” are rejected as export/roster stamps.

## Stop / go

**STOP.** Strong FACID/STATEID, addresses, and status remain blocked on export date, disclosure prefix, official coordinates, and RCF mapping. Publication eligible rows: **0**.

**Most actionable next step:** Ask ODH for an authoritative ISO export/version stamp for the Facility Listing extract, and confirm whether a stable STATEID/FACID → Detail_StateLicense (or survey) URL exists outside session search.

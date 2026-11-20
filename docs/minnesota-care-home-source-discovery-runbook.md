# Minnesota care-home source discovery runbook

**Scope:** Development-only, read-only. Minnesota stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Minnesota.  
**Do not** equate Minnesota Assisted Living with Washington adult family homes.

## Purpose

1. Identify authoritative MDH assisted-living and related residential classifications.  
2. Record official aggregate counts from the 2026 annual directory PDF.  
3. Attempt bounded facility-level sampling from the interactive provider directory (blocked this run by maintenance).  
4. Keep DHS Licensing Lookup separate and unreconciliation-bound.  
5. Maintain an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| MDH directories index | https://www.health.mn.gov/facilities/regulation/directory/index.html |
| Provider directory select | https://www.health.mn.gov/facilities/regulation/directory/providerselect.html |
| 2026 annual PDF | https://www.health.mn.gov/facilities/regulation/directory/2026mdhdirectory.pdf |
| Field outline | https://www.health.mn.gov/facilities/regulation/directory/directorydatafile.html |
| Assisted living licensure | https://www.health.mn.gov/facilities/regulation/assistedliving/index.html |
| DHS licensing lookup | https://licensinglookup.dhs.state.mn.us/Search.aspx |

## Commands

```bash
node --experimental-strip-types scripts/minnesota-care-home-source-discovery-run.mjs \
  --out minnesota-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/minnesota_care_home_source_discovery.ts
```

## Verified aggregates (PDF as of 2026-03-13)

| Classification | Facilities | Beds |
| --- | ---: | ---: |
| Assisted Living Facilities | 1,083 | 17,871 |
| Assisted Living Facility Dementia Care | 566 | 40,042 |
| Provisional Assisted Living Facility | 310 | 1,678 |
| Provisional Assisted Living Facility Dementia Care | 6 | 91 |
| Boarding Care Homes | 17 | 1,166 |
| Supervised Living Facilities | 183 | 4,088 |

PDF contains **no** facility-level rows.

## Stop / go

**STOP.** Facility-level roster unavailable this run (interactive maintenance). Physical/mailing address, disclosure prefix, ISO export date, and category-mapping decisions remain open.

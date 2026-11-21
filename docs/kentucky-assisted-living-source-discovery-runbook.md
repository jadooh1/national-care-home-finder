# Kentucky assisted living community source discovery runbook

**Scope:** Development-only, read-only. Kentucky stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Kentucky.  
**Do not** equate ALC / ALC-BH / ALC-DC with personal care homes, family care homes, nursing facilities, or Washington adult family homes.  
**Do not** invent blank `LICENSE #` values, treat Pending Renewal as Active/Closed, or invent geocodes.

## Purpose

1. Verify the CHFS OIG Assisted Living Community Directory (XLSX/PDF).  
2. Assess identifiers, TYPE grains, units, addresses, expiration, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| HCF directories page | https://www.chfs.ky.gov/agencies/os/oig/dhc/Pages/hcf.aspx |
| ALC Directory XLSX | https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.xlsx |
| ALC Directory PDF | https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.pdf |
| Regulation | 902 KAR 20:480 Assisted living communities |
| Personal Care Home Directory (separate) | https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Personal%20Care%20Home%20Directory.xlsx |
| Long Term Care Directory (separate) | https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Long%20Term%20Care%20Directory.xlsx |

## Commands

```bash
node --experimental-strip-types scripts/kentucky-assisted-living-source-discovery-run.mjs \
  --out kentucky-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/kentucky_assisted_living_source_discovery.ts
```

## Verified metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| Sheet | November 2026 |
| Directory TYPE rows | **247** |
| Unique `LICENSE #` | **244** |
| Blank `LICENSE #` | 1 |
| Duplicate `LICENSE #` groups | 2 |
| TYPE ALC / ALC-BH / ALC-DC | 88 / 74 / 85 |
| Blank street/city/ZIP/name | 0 |
| UNITS | 0–137 (1 zero) |
| Pending Renewal | 75 |
| Coordinate columns | Absent |
| `LICENSE #` disclosure prefix | Not verified |
| PCH / FCH / LTC peer rows | 47 / 24 / 313 |

Sheet label “November 2026”, beginning-of-month update claim, and HTTP Last-Modified Fri, 30 Oct 2026 12:11:40 GMT rejected as ISO export.

## Stop / go

**STOP.** Strong monthly ALC TYPE roster with addresses and UNITS remains blocked on ISO export date, LICENSE # uniqueness rules, operating status, disclosure prefix, and coordinates. Publication eligible rows: **0**.

**Most actionable next step:** Ask Kentucky CHFS OIG for an authoritative ISO export/version stamp for the Assisted Living Community Directory, a field dictionary for ALC vs ALC-BH vs ALC-DC type-rows (including how duplicate LICENSE # and blank LICENSE # should be treated), confirmation whether Pending Renewal is an operating status, and whether LICENSE # maps to a stable facility disclosure / survey URL.

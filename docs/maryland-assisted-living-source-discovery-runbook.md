# Maryland assisted living program source discovery runbook

**Scope:** Development-only, read-only. Maryland stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Maryland.  
**Do not** equate Maryland Assisted Living Programs with Washington adult family homes.  
**Do not** invent small/large regulatory labels beyond observed Capacity and Level of Care.  
**Do not** statewide-crawl MHCC or invent geocodes from the IMAP derivative.

## Purpose

1. Verify MDH OHCQ Assisted Living Excel licensee directory.  
2. Assess License Number, addresses, status, capacity, Level of Care, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| OHCQ Licensee Directories | https://health.maryland.gov/ohcq/Pages/OHCQ-Licensee-Directories.aspx |
| Assisted Living Excel | https://health.maryland.gov/ohcq/docs/Provider-Listings/Excel/Assisted-Living-Excel.xlsx |
| MHCC consumer guide | https://healthcarequality.mhcc.maryland.gov/AssistedLiving/Suggestion |
| IMAP FeatureServer (derivative; rejected) | https://mdgeodata.md.gov/imap/rest/services/Health/MD_LongTermCareAssistedLiving/FeatureServer/1 |

## Commands

```bash
node --experimental-strip-types scripts/maryland-assisted-living-source-discovery-run.mjs \
  --out maryland-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/maryland_assisted_living_source_discovery.ts
```

## Verified ALP metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| Excel rows | 1676 |
| Unique License Number | 1675 |
| Duplicate License Number groups | 1 (AL-00064) |
| Blank Street Address | 0 |
| Capacity | 2–319 (0 nullish/zero) |
| Capacity ≤16 / >16 | 1472 / 204 |
| Level of Care 1 / 2 / 3 / blank | 1 / 51 / 1623 / 1 |
| Per-row status column | Absent |
| Coordinate columns on Excel | Absent |
| Disclosure prefix | Not verified |
| IMAP FeatureServer rows | 1568 (rejected) |

No ISO export date. Sheet “as of 11-05-26”, page Last Updated November 16, 2026, and HTTP Last-Modified Nov 6 are rejected as export stamps.

## Stop / go

**STOP.** Strong License Numbers, addresses, capacities, and Level of Care remain blocked on export date, status domain, disclosure prefix, and official coordinates. Publication eligible rows: **0**.

**Most actionable next step:** Ask MDH OHCQ for an ISO export/version stamp for the Assisted Living Excel, and confirm whether a stable License Number → facility disclosure/survey URL exists, plus publication rules for Level of Care and observed capacity ≤16 vs >16 bands.

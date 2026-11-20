# Wisconsin AFH source reconciliation runbook

**Scope:** Development-only, read-only. Wisconsin stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Wisconsin.

## Purpose

1. Re-verify DHS AFH Excel/PDF licensing directory counts against the prior ~1,980 PDF-ID baseline.  
2. Re-verify GIS Adult Family Home layer count (**2,203**) and blank/duplicate license fields.  
3. Reconcile Excel `Facility ID` to GIS `WI_LICENSE_NUM` without inventing identifiers.  
4. Keep mailing addresses, GIS-only residuals, and unresolved disclosures ineligible.  
5. Maintain an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| AFH consumer guide | https://www.dhs.wisconsin.gov/guide/afh.htm |
| AFH Excel directory | https://www.dhs.wisconsin.gov/guide/afhdirexcel.xlsx |
| AFH PDF directory | https://www.dhs.wisconsin.gov/guide/afhdir.pdf |
| GIS MapServer layer 2 | https://dhsgis.wi.gov/server/rest/services/DHS_GIS/Facilities/MapServer/2 |
| Provider Search | https://www.forwardhealth.wi.gov/WIPortal/subsystem/public/DQAProviderSearch.aspx |

## Commands

```bash
node --experimental-strip-types scripts/wisconsin-afh-source-reconciliation-run.mjs \
  --out wisconsin-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/wisconsin_afh_source_reconciliation.ts
```

## Current capture (2026-11-20)

| Metric | Prior | Current |
| --- | ---: | ---: |
| PDF distinct IDs | 1,980 | **2,516** |
| Excel Facility ID rows | — | **2,479** |
| GIS features | 2,203 | **2,203** |
| GIS blank WI_LICENSE_NUM | 9 | **9** |
| Matched unique (ID int == WI_LICENSE_NUM) | — | **1,914** |
| Ambiguous | — | **2** |
| Excel-only | — | **563** |
| GIS-only | — | **276** |
| Export date | null | **null** |

## Stop / go

**STOP.** Identifier residuals, disclosure prefix, per-row status, and authoritative export date remain blockers. GIS is not the accepted directory.

# South Carolina Community Residential Care Facility source discovery runbook

**Scope:** Development-only, read-only. South Carolina stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish South Carolina.  
**Do not** equate CRCFs with nursing homes, intermediate care facilities, or Washington adult family homes.  
**Do not** invent `CRC_NBR_TOTAL_BEDS` from `NBR_LICENSED` or treat ArcGIS edit clocks as ISO export dates.

## Purpose

1. Verify the South Carolina DPH Find a Facility CRCF layer.  
2. Assess identifiers, status, beds, addresses, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| Find a Facility | https://dph.sc.gov/professionals/healthcare-quality/find-facility |
| CRCF program page | https://dph.sc.gov/professionals/healthcare-quality/licensed-facilities-professionals/community-residential-care |
| Dataviz embed | https://dataviz.dph.sc.gov/Health_Facility/ |
| Experience Builder app | https://experience.arcgis.com/experience/fd09063e5e034b329f97c43ea8e8c4c2 |
| Health Facilities FeatureServer | https://services5.arcgis.com/G4BLIH7rTQoIjCFv/arcgis/rest/services/Health_Facilities/FeatureServer/0 |
| CRCF filter | `PERMIT_TYPE = 'HLRESIDENTIALCARE'` |

## Commands

```bash
node --experimental-strip-types scripts/south-carolina-crcf-source-discovery-run.mjs \
  --out south-carolina-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/south_carolina_crcf_source_discovery.ts
```

## Verified metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| CRCF rows (`HLRESIDENTIALCARE`) | **427** |
| Unique `LICENSE_NBR` | **427** |
| Duplicate `LICENSE_NBR` groups | 0 |
| `PERMIT_OPERATING_CODE` ACT | 427 |
| Blank street / city / ZIP / name | 0 / 0 / 0 / 0 |
| `NBR_LICENSED` | 5–193 (0 null/zero) |
| `CRC_NBR_TOTAL_BEDS` present / null | 155 / 272 |
| `CRC_NBR_TOTAL_BEDS` conflicts with `NBR_LICENSED` | 54 |
| Geometry (outSR=4326) | 427 |
| Attribute X/Y non-WGS84 | 17 |
| `LICENSE_NBR` disclosure prefix | Not verified |
| Nursing homes / ICF 15- / ICF 16+ (peer counts) | 192 / 56 / 8 |

FeatureServer `dataLastEditDate` 2026-11-20T12:04:49Z and HTTP Last-Modified Fri, 20 Nov 2026 12:04:58 GMT rejected as ISO export. Capture SHA-256 of stable feature JSON recorded in fixtures.

## Stop / go

**STOP.** Strong CRCF roster with unique `LICENSE_NBR`, complete addresses, ACT codes, `NBR_LICENSED`, and point geometry remains blocked on ISO export date, capacity-field dictionary, verified disclosure prefix, closed-facility status coverage, and licensing-coordinate provenance. Publication eligible rows: **0**.

**Most actionable next step:** Ask South Carolina DPH Healthcare Quality for an authoritative ISO export/version stamp for the Health Facilities CRCF layer, a field dictionary distinguishing `NBR_LICENSED` vs `CRC_NBR_TOTAL_BEDS`, confirmation whether closed/non-ACT CRCFs appear on the layer, whether FeatureServer coordinates are licensing coordinates, and whether `LICENSE_NBR` maps to a stable facility disclosure URL.

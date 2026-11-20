# Massachusetts assisted living residence source discovery runbook

**Scope:** Development-only, read-only. Massachusetts stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Massachusetts.  
**Do not** equate EOEA ALR certification with DPH nursing/rest-home licenses, MassHealth adult foster care, or Washington adult family homes.  
**Do not** treat units as beds or invent geocodes from MassGIS.

## Purpose

1. Verify the EOEA/AGE certified Assisted Living Residences Excel list.  
2. Assess identifiers, status, units (including SCR), addresses, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| ALR program | https://www.mass.gov/assisted-living-residences |
| Certified list (current) | https://www.mass.gov/doc/list-of-certified-assisted-living-residences-as-of-june-2026/download |
| Locations directory | https://www.mass.gov/assisted-living-residences/locations |
| Location detail | https://www.mass.gov/locations/{slug-from-alr-name} |
| MassGIS LTC (rejected) | https://www.mass.gov/info-details/massgis-data-long-term-care-residences |

## Commands

```bash
node --experimental-strip-types scripts/massachusetts-assisted-living-source-discovery-run.mjs \
  --out massachusetts-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/massachusetts_assisted_living_source_discovery.ts
```

## Verified metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| Workbook data rows | 273 |
| Certified usable (name+address) | **271** |
| Status anomaly / blank trailing | 1 / 1 |
| Units (Certified) | 8–173 |
| SCR>0 / SCR=0 | 204 / 67 |
| Certification number column | Absent |
| Coordinate columns on list | Absent |
| Disclosure | `/locations/{slug}` verified (name-derived) |

Title “as of June 25, 2026” and HTTP Last-Modified Jul 14, 2026 rejected as ISO export. April 2025 doc URL redirects to the June 2026 file.

## Stop / go

**STOP.** Strong Certified roster with addresses, units/SCR, and name-derived disclosure remains blocked on export date, stable certification identifier, and official coordinates. Publication eligible rows: **0**.

**Most actionable next step:** Ask EOEA/AGE for an ISO export/version stamp and a stable certification/facility identifier column (not ALR Name or shared Federal EIN), plus whether MassGIS coordinates may be used with provenance.

# Alabama assisted living facility source discovery runbook

**Scope:** Development-only, read-only. Alabama stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Alabama.  
**Do not** equate ALF with SCALF, nursing facilities, or Washington adult family homes.  
**Do not** invent geocodes or treat Excel filename timestamps as ISO export dates.

## Purpose

1. Verify ADPH FacilitiesDirectory Excel exports for ALF and SCALF.  
2. Assess Fac ID, status, beds, addresses, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| Facilities Directory landing | https://www.alabamapublichealth.gov/providerstandards/directory.html |
| Interactive directory | https://dph1.adph.state.al.us/FacilitiesDirectory/ |
| ALF type code | `D` — Assisted Living Facilities |
| SCALF type code | `P` — Assisted Living Facilities (Specialty Care) |
| ALF rules | AAC Chapter 420-5-4 |
| SCALF rules | AAC Chapter 420-5-20 |

## Commands

```bash
node --experimental-strip-types scripts/alabama-assisted-living-source-discovery-run.mjs \
  --out alabama-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/alabama_assisted_living_source_discovery.ts
```

## Verified metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| ALF rows / unique Fac ID | **188** / **188** |
| SCALF rows / unique Fac ID | **106** / **106** |
| Combined unique Fac ID | **294** |
| ALF License Status | Regular 188 |
| SCALF License Status | Regular 105 / Probational 1 |
| ALF Licensed Beds | 8–160 |
| SCALF Licensed Beds | 12–104 |
| Blank street/city/ZIP/name | 0 |
| Coordinate columns | Absent |
| Fac ID disclosure prefix | Not verified |
| Nursing Home peer rows | 232 |
| Shared ALF/SCALF campus addresses | 45 |

Landing “Page last updated: June 23, 2026” and Excel filename generation timestamps rejected as ISO export.

## Stop / go

**STOP.** Strong ALF/SCALF Excel rosters with unique Fac IDs, addresses, License Status, and Licensed Beds remain blocked on ISO export date, Fac ID disclosure prefix, closed-facility coverage, coordinates, and ALF/SCALF campus rules. Publication eligible rows: **0**.

**Most actionable next step:** Ask Alabama Department of Public Health Provider Services for an authoritative ISO export/version stamp for the FacilitiesDirectory ALF and SCALF Excel extracts, confirmation whether closed/non-Regular facilities appear in those exports, whether Fac ID maps to a stable facility disclosure / survey URL, and written rules for keeping ALF vs SCALF separate when campuses share an address.

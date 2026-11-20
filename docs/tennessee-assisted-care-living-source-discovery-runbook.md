# Tennessee assisted-care living facility source discovery runbook

**Scope:** Development-only, read-only. Tennessee stays unpublished. Owner claims disabled.  
**Do not** write to Supabase, production, or `main`.  
**Do not** recrawl California, activate exclusions, or publish Tennessee.  
**Do not** equate Assisted Care Living Facilities with Residential Homes for the Aged, nursing facilities, or Washington adult family homes.  
**Do not** invent blank city values or geocode from non-licensing sources.

## Purpose

1. Verify the Tennessee Health Facilities Commission ACLF Full Bed Report.  
2. Assess identifiers, status, beds, addresses, coordinates, and disclosure.  
3. Keep an offline readiness matrix under **STOP**.

## Official sources

| Source | URL |
| --- | --- |
| HFC licensure reports index | https://www.tn.gov/hfc/publication-and-reports/licensure-reports.html |
| ACLF Full Bed Report PDF | https://www.tn.gov/content/dam/tn/health/healthprofboards/hcf/ACLF-Full-Beds-Report.pdf |
| RHA Full Bed Report PDF (separate type) | https://www.tn.gov/content/dam/tn/health/healthprofboards/hcf/RHA-Full-Beds-Report.pdf |
| FacilityListings search | https://internet.health.tn.gov/FacilityListings/ |

## Commands

```bash
node --experimental-strip-types scripts/tennessee-assisted-care-living-source-discovery-run.mjs \
  --out tennessee-investigation-out
```

Tests:

```bash
node --experimental-strip-types --test supabase/proposals/tests/tennessee_assisted_care_living_source_discovery.ts
```

## Verified metrics (observed 2026-11-20)

| Metric | Value |
| --- | ---: |
| ACLF Full Bed Report rows | **333** |
| Unique `lic_no` | **333** |
| Duplicate `lic_no` groups | 0 |
| Licensed / On Probation / LLC Licensed | 331 / 1 / 1 |
| Blank street / blank city | 0 / 7 |
| `total_beds` | 6–184 (0 nullish/zero) |
| Secured beds > 0 | 188 |
| Coordinate columns | Absent |
| `lic_no` disclosure prefix | Not verified |

Index latest label: “Assisted Care Living Facilities Full Bed Report - October 2026”. Month label and unavailable HTTP Last-Modified are rejected as ISO export. Capture used a WebFetch markdown table extract (`textExtractSha256` recorded; binary PDF SHA unavailable due to egress 403).

RHA is a separate license type. The undated RHA PDF extract includes footer “Generated May 25, 2022” while the index lists October 2026 — not accepted as a current reconciled RHA roster and not merged into ACLF.

## Stop / go

**STOP.** Strong ACLF roster with unique `lic_no`, streets, `lic_status`, and beds remains blocked on ISO export date, verified `lic_no` disclosure prefix, official coordinates, and address-field cleanup (blank city / concatenated city+state). Publication eligible rows: **0**.

**Most actionable next step:** Ask Tennessee Health Facilities Commission for an authoritative ISO export/version stamp for the ACLF Full Bed Report PDF, confirm whether FacilityListings exposes a stable `lic_no` → facility disclosure URL, and reconcile the undated RHA-Full-Beds-Report.pdf (footer Generated May 25, 2022) to the October 2026 index label.

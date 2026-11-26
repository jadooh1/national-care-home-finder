# Wisconsin Tier 1 — directory publication readiness (development-only)

## Verdict

**STOP** for Wisconsin Tier 1 directory publication.

Official DHS Excel/PDF directories are verified for **AFH**, **CBRF**, and **RCAC**.
Street and capacity coverage on Excel are complete. Framework Tier 1 requirements
are **not** met (freshness, Excel↔GIS residuals, per-row operating status,
facility-specific disclosure). Wisconsin stays **unpublished**.

## Evidence reused

- AFH source verification / Excel↔GIS reconciliation / disclosure investigation
  (`lib/wisconsin-*.ts`, runbook; Excel SHA unchanged on 2026-11-26 re-fetch)
- Nationwide publication eligibility readiness framework
- Texas / Oregon Tier 1 readiness control patterns (checklist + surface separation)

## Categories and regulatory pathways

| Category | Pathway | Regulation | Excel rows |
| --- | --- | --- | ---: |
| Adult Family Home (AFH) | **Licensed** | DHS 88 (DQA 3–4 bed; 1–2 bed county-regulated outside) | 2,479 |
| Community-Based Residential Facility (CBRF) | **Licensed** | DHS 83 | 1,534 |
| Residential Care Apartment Complex (RCAC) | **Certified** (265) or **Registered** (95) | DHS 89 | 360 |
| **Total Excel inventory** | | | **4,373** |
| **publicationEligible** | | | **0** |

RCAC is not licensed. Class `CERTIFIED` vs `REGISTERED` is a regulatory pathway,
not open/closed status. AFH/CBRF `Class` values are ambulatory subclasses — also
not operating status.

## Official sources (2026-11-26)

| Source | URL |
| --- | --- |
| AFH Excel | https://www.dhs.wisconsin.gov/guide/afhdirexcel.xlsx |
| CBRF Excel | https://www.dhs.wisconsin.gov/guide/cbrfdirexcel.xlsx |
| RCAC Excel | https://www.dhs.wisconsin.gov/guide/rcacdirexcel.xlsx |
| Provider Search | https://www.forwardhealth.wi.gov/WIPortal/subsystem/public/DQAProviderSearch.aspx |
| GIS MapServer | layers 2 (AFH), 7 (CBRF), 17 (RCAC) |

## Gate evidence

| Gate | Result |
| --- | --- |
| Facility ID uniqueness (Excel) | AFH 2,479 / CBRF 1,534 / RCAC 360 — no duplicates |
| Street / capacity | 0 blank Street and Capacity on all three Excel files |
| Freshness | PDF `11/04/2026`, RCAC quarterly notice, HTTP Last-Modified **rejected**; `recordedExportDateIso=null` |
| Operating status | No Status column |
| Disclosure | Provider Search only; no verified Facility-ID→detail prefix |
| Excel↔GIS | Residuals remain on all three layers; GIS not accepted as directory |

### Excel↔GIS residuals (exact Facility ID / WI_LICENSE_NUM)

| Category | Excel | GIS | Matched | Excel-only | GIS-only | Blank GIS license | Dup keys |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| AFH (prior) | 2,479 | 2,203 | 1,914 unique | 563 | 276 | 9 | 2 |
| CBRF | 1,534 | 1,555 | 1,340 | 194 | 212 | 1 | 2 |
| RCAC | 360 | 367 | 310 | 50 | 54 | 3 | 0 |

## Outstanding blockers

1. No authoritative ISO export/version stamp
2. Excel↔GIS identifier reconciliation incomplete
3. GIS is not the accepted directory
4. No per-row licensing/operating status column
5. No verified facility-specific disclosure URL prefix
6. RCAC certified vs registered product taxonomy needs explicit policy
7. State authorization remains unpublished

## Out of scope / preserved

No production deployment, Wisconsin public/development directory route, Supabase
writes, geocoding, authentication, or billing changes. Washington public,
California unpublished / Design 2, and Oregon development host-gating unchanged.

## Next human actions

1. Obtain DHS ISO export/version stamps (do not invent from PDF footers).
2. Close Excel↔GIS residuals or adopt Excel-only policy excluding GIS-only rows.
3. Define operating-status rules independent of Class.
4. Verify disclosure URL prefix or accept search-only under policy.
5. Approve AFH/CBRF licensed vs RCAC certified/registered taxonomy (≠ WA AFH).
6. Keep map separate; authorize publication only after blockers clear.

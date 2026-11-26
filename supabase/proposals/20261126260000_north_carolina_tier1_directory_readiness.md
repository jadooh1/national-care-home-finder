# North Carolina Tier 1 — directory publication readiness (development-only)

## Verdict

**STOP** for North Carolina Tier 1 directory publication.

NCDHHS DHSR `Ahlist.xlsx` (HAL Adult Care Homes) and `Fchlist.xlsx` (FCL Family
Care Homes) remain the authoritative open inventories. Unique `License #`
identity, NC Site Address coverage, and capacity ranges are verified.
Freshness, per-row licensing status, facility-specific disclosure, and HAL/FCL
product taxonomy remain open. `publicationEligible = 0`. North Carolina stays
**unpublished**.

## Evidence reused

- Nov 13 feasibility baseline (566 HAL + 520 FCL = 1,086 unique licenses)
- Nov 20 source discovery / eligibility / disclosure / investigation readiness
  (`lib/north-carolina-*.ts`, runbook)
- 2026-11-26 workbook re-fetch: SHA-256 unchanged for both workbooks
- Nationwide publication eligibility readiness framework

## Authoritative source

| Field | Value |
| --- | --- |
| Agency | NCDHHS DHSR, Adult Care Licensure Section |
| Listings | https://info.ncdhhs.gov/dhsr/reports.htm (Updated `10/28/2026` — **rejected**) |
| Adult Care Homes | https://info.ncdhhs.gov/dhsr/data/Ahlist.xlsx |
| Family Care Homes | https://info.ncdhhs.gov/dhsr/data/Fchlist.xlsx |
| Workbook As of | `10/2026` (**rejected** as export date) |
| HAL SHA-256 | `5671a352bea147a1b7b1607e7d73cb41b953f1af2aa459e83d25ab39dcca3d92` |
| FCL SHA-256 | `c6d66684bf04ae0f98c00c644a9c2a1af7935e9a6e91e6eb494220bf6b8afc80` |
| Last-Modified | `Wed, 28 Oct 2026 17:10:30/29 GMT` (**rejected**) |
| recordedExportDateIso | `null` |
| Stale `fch.txt` | Rejected (Last-Modified 2021-12-15) |
| Disclosure | Star search only; no License # → stable facility URL verified |

## Inventory

| Bucket | Count |
| --- | ---: |
| Adult Care Homes (HAL) | 566 |
| Family Care Homes (FCL) | 520 |
| Unique License # | 1,086 |
| License overlap HAL∩FCL | 0 |
| Blank trailing workbook rows | 2 |
| Site Address complete (NC, ZIP5) | 1,086 |
| Identical mailing / distinct mailing | 189 / 897 |
| HAL beds | 9–201 |
| FCL beds | 2–6 (0 outside range) |
| Star Rating N/A | 27 |
| Expiry before observation | 5 |
| **publicationEligible** | **0** |

## Outstanding blockers

1. No authoritative ISO export/version stamp
2. Listings page date and workbook As-of labels rejected
3. No per-row licensing status (Star Rating / Expiry Date are not Active/Closed)
4. No verified License # → facility disclosure URL prefix
5. HAL vs FCL product taxonomy unapproved (neither equals Washington AFH)
6. No coordinate columns (map stays off)
7. State authorization remains unpublished

## Out of scope / preserved

No database writes, North Carolina public/development directory flip, production
deploy, geocoding, authentication, or billing changes. Washington public,
California / Design 2, and Oregon development host-gating unchanged.

## Next human actions

1. Obtain an authoritative NCDHHS DHSR ISO export/version stamp for both workbooks.
2. Confirm whether a stable License # → facility disclosure URL exists outside star search.
3. Define per-row operating-status rules that do not treat Star Rating or Expiry Date as Active/Closed.
4. Approve HAL vs FCL product taxonomy without equating either to Washington AFH.
5. Keep map work separate — never invent geocodes.
6. Separate human authorization before any North Carolina public or development directory flip.

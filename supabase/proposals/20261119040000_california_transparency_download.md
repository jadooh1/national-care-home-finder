# California Transparency DownloadStateData verification (Phase 3, read-only)

California stays unpublished. This report continues issue #131 after Phase 2 FacilityDetail sample verification (PR #145 / `3632fd29` on `development`). It evaluates the official CDSS Transparency Site **Download Data** bulk export (`DownloadStateData`) for RCFE and ARF licensing rosters.

Observed on **2026-11-19** from a network-enabled development environment.

## Official download provenance

| Item | Value |
| --- | --- |
| Download Data page | `https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata` |
| API | `https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData?id={id}&GUID={guid}` |
| RCFE id | `ResidentialElderCareFacility` |
| ARF id | `AdultResidentialFacilities` |
| Client config header | `DSS-Transparency-Config` with client `Version` `11.18.0R` and a per-session GUID |
| Response | `text/csv` attachment |

### Observed attachments (2026-11-19)

| File | Content-Disposition filename | Rows | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| RCFE | `ResidentialElderCareFacility11152026.csv` | 13,337 | 8,635,782 | `e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e` |
| ARF | `AdultResidentialFacilities11152026.csv` | 11,040 | 5,434,124 | `f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe` |

The `11152026` stamp parses as MMDDYYYY → ISO **candidate** `2026-11-15`. It is **not** adopted as an authoritative ISO export date. CSV bodies have **no** `file_date` column (unlike historical CHHS dumps).

## What the bulk download provides

- Statewide RCFE and ARF group CSVs with `Facility Number`, `Facility Status`, `Facility Type`, addresses, license/closed/visit dates, and visit/complaint columns.
- Status domain observed: `LICENSED`, `CLOSED`, `PENDING`, `ON PROBATION`.
- Leading-zero facility numbers are preserved as strings (for example `015601302`).
- Closed facilities are included.
- No RCFE/ARF facility-number overlap in the observed downloads.
- Duplicate facility numbers: **0** / **0**.

### RCFE status / type counts

| Status | Count |
| --- | ---: |
| LICENSED | 8,626 |
| CLOSED | 3,764 |
| PENDING | 922 |
| ON PROBATION | 25 |

Dominant types: `RESIDENTIAL CARE ELDERLY` (13,190), `RCFE-CONTINUING CARE RETIREMENT COMMUNITY` (135), blank (12).

### ARF status / type counts

| Status | Count |
| --- | ---: |
| LICENSED | 8,123 |
| CLOSED | 2,345 |
| PENDING | 559 |
| ON PROBATION | 13 |

Types include `ADULT RESIDENTIAL` (8,784) plus non-residential / adjacent categories (`ADULT DAY PROGRAM`, `SOCIAL REHABILITATION FACILITY`, and others). One invalid facility number was observed: `95354` (matches ZIP; pending row).

## Comparison to historical CHHS open data

Historical dumps (resource IDs from prior California work) still show raw `file_date` `5252025` / `05252025` and truncated leading zeros on many RCFE ids.

| Metric | RCFE | ARF |
| --- | ---: | ---: |
| Historical rows | 12,522 | 10,498 |
| Download rows | 13,337 | 11,040 |
| Exact ID matches | 10,309 | 9,754 |
| Leading-zero representation matches | 983 | 0 |
| Historical-only | 1,230 | 744 |
| Download-only | 2,045 | 1,286 |
| Status conflicts on exact matches | 1,389 | 1,000 |
| Historical LICENSED → download non-LICENSED | 716 | 508 |

Historical-only RCFE rows are overwhelmingly old `CLOSED` records (mostly closed 2020–2021), consistent with Transparency Site retention limits described in CCLD PIN material (~five years).

## Comparison to ArcGIS and Phase 2 FacilityDetail

- ArcGIS FeatureServer/0 count remains 37,887 all-types; integer `FAC_NBR` still truncates leading zeros. Download strings keep zeros.
- Known Phase 2 LICENSED→Closed conflicts are **CLOSED** in DownloadStateData and Closed* on FacilityDetail:
  - `011400493` — download CLOSED / FacilityDetail `Closed, Licensee Initiated` (historical LICENSED)
  - `015601270`, `015600722`, `079201256` — same pattern
- Download `CLOSED` is **coarser** than FacilityDetail. Stratified live checks found download `CLOSED` rows whose FacilityDetail status is `Application Withdrawn` (conflict under Closed*-only mapping).

### Bounded stratified FacilityDetail check (sample)

| Relation | Count |
| --- | ---: |
| match | 19 |
| conflict | 2 (`Application Withdrawn`) |
| invalid-download-id / missing-live | 1 (`95354`) |

Sample verification is **not** a roster-wide conclusion.

## Publication gate

| Gate | Result |
| --- | --- |
| Bulk RCFE/ARF roster available | yes |
| Leading zeros preserved | yes |
| Closed facilities present | yes |
| Authoritative ISO export date | **no** |
| FacilityDetail subtype parity | **no** |
| California publication | **unpublished** |
| Owner-claim eligible | **false** |

## Code on this branch

- `lib/california-transparency-download.ts` — URL/header helpers, filename-date parse (never adopted), CSV parse, roster summary, historical/download compare, download↔FacilityDetail status relation, publication gate
- `lib/california-transparency-download-sample.ts` — stratified sample including `011400493` and invalid `95354`
- `scripts/california-transparency-download-run.mjs` — optional live runner (read-only)
- Fixtures under `supabase/proposals/fixtures/california-transparency-download/`
- Regression tests in `supabase/proposals/tests/california_transparency_download.ts`

## Remaining blockers

1. No authoritative ISO export date (filename MMDDYYYY is only a candidate).
2. Download `CLOSED` ≠ FacilityDetail Closed* for every row; mapping rules remain unresolved for publication.
3. ARF download includes categories outside the accepted residential publication set; category gating still required.
4. Invalid / shifted identifiers must be rejected (`95354`).
5. Historical open-data and ArcGIS remain incomplete or lossy relative to this download; they are not the preferred current roster.
6. California stays unpublished / owner-claim ineligible until a later human-approved publication phase.

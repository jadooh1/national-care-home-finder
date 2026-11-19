# California CCL ArcGIS reconciliation (read-only)

California stays unpublished. This report records a live, read-only reconciliation of official CDSS ArcGIS identifiers against the historical CHHS RCFE/ARF open-data files. It does not persist rows, adopt an export date, interpret undocumented GIS `STATUS` integers, or publish a directory.

Observed on **2026-11-19** from a network-enabled development environment.

## Official sources

| Source | URL |
| --- | --- |
| Historical open-data package | https://data.chhs.ca.gov/dataset/ccl-facilities |
| RCFE CSV resource | https://data.chhs.ca.gov/dataset/46ffcbdf-4874-4cc1-92c2-fb715e3ad014/resource/744d1583-f9eb-45b6-b0f8-b9a9dab936a6 |
| ARF CSV resource | https://data.chhs.ca.gov/dataset/46ffcbdf-4874-4cc1-92c2-fb715e3ad014/resource/9f5d1d00-6b24-4f44-a158-9cbe4b43f117 |
| Geospatial catalog | https://publish.data.ca.gov/dataset/community-care-licensing-facilities1 |
| ArcGIS FeatureServer/0 | https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0 |
| Transparency detail API | https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facNumber} |
| Facility detail page pattern | https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{facNumber} |

Catalog clocks and ArcGIS `editingInfo` timestamps are **not** facility-license freshness and are not adopted as an export date.

## Historical open-data baselines (independently rechecked)

| File | Raw rows | Eligible rows | Notes |
| --- | --- | --- | --- |
| RCFE | 12,522 | **12,521** | Categories `RESIDENTIAL CARE ELDERLY` and `RCFE-CONTINUING CARE RETIREMENT COMMUNITY`; one blank category excluded |
| ARF | 10,498 | **8,610** | Eligible adult-residential categories only; 1,887 other categories and 1 shifted row excluded |
| Combined eligible | — | **21,131** | Matches the previously recorded baseline |

Eligible status totals still match the recorded directory constants (RCFE licensed 7,939 / closed 3,821 / pending 738 / on probation 23; ARF licensed 6,332 / closed 1,840 / pending 429 / on probation 9). Duplicate eligible license strings: **0**. Every eligible `facility_number` is nine digits; **1,810** keep a leading zero.

Live download observation: every RCFE and ARF `file_date` value on this run was the raw text `05252025`. Earlier reviews recorded RCFE as `5252025`. Neither value is an ISO export date; `recorded_export_date` stays null.

## ArcGIS layer metadata

- Layer name: `Master_CCL_County_Intersect_2023`
- Geometry: `esriGeometryPoint`
- `maxRecordCount`: 1000
- Required probe fields present: yes
- Total count (`where=1=1`, `returnCountOnly`): **37,887**
- `STATUS` field: integer, **domain null** — codes observed `{3: 30450, 12: 6230, 4: 610, 6: 498, 5: 99}` and **not accepted**
- `PROGRAM_TYPE` field: string, domain null
- `FAC_TYPE_DESC`: string values include trailing spaces and truncation (for example `RESIDENTIAL-ELDERLY ` and `RESIDENTIAL ELDERLY-`)

### Observed RCFE/ARF-like `FAC_TYPE_DESC` (after trim; prefixes only)

| Class | Rows | Observed prefixes |
| --- | ---: | --- |
| RCFE-like | 8,639 | `RESIDENTIAL-ELDERLY`, `RESIDENTIAL ELDERLY-` |
| ARF-like | 6,806 | `ADULT RESIDENTIAL`, `ARF-ENHANCED BEHAVIO`, `ARFPSHN`, `COMMUNITY CRISIS HOM` |

These prefixes are descriptive labels for reconciliation filtering. They are not a published category domain and do not accept GIS status codes.

## Identifier reconciliation (exact string match; leading zeros preserved)

Historical input: 21,131 eligible rows. GIS input: all 37,887 ArcGIS attribute rows, paginated read-only.

| Metric | Count |
| --- | ---: |
| Historical distinct licenses | 21,131 |
| GIS distinct licenses | 37,887 |
| Exact matches | **12,771** |
| Missing from GIS (exact) | **8,360** |
| GIS-only | **25,116** |
| Duplicate historical IDs | 0 |
| Duplicate GIS IDs | 0 |
| Invalid GIS identifiers | 0 |
| Missing GIS coordinates | 0 |
| Invalid GIS coordinates | 3 (all `RESOURCE FAMILY HOME` with `0.0`/`0.0`; none in RCFE/ARF-like) |
| Leading-zero representation mismatches | **1,242** |

Leading-zero representation mismatches are historical nine-digit IDs such as `015601302` that are absent as exact strings because ArcGIS stores `FAC_NBR` as an integer (`15601302`). They are **reported separately and are not counted as matches**. Collapsing zeros is still refused by the pure reconciler.

Of the 8,360 exact misses, **7,118** remain missing even if integer truncation is considered. Status text on those historical rows: closed 5,661; licensed 1,216; pending 233; on probation 8. Historical open-data status remains file text only.

Against RCFE/ARF-like GIS rows only (15,445): exact matches remain **12,771**; GIS-only within that subset is **2,674**.

## Transparency sample (official FacilityDetail only)

| Requested ID | Role | HTTP | Returned `FACILITYNUMBER` | Official `STATUS` | Notes |
| --- | --- | ---: | --- | --- | --- |
| `100400070` | Exact match, historical LICENSED RCFE | 200 | `100400070` | Licensed | Detail page pattern resolves |
| `100403816` | Exact match, historical LICENSED ARF | 200 | `100403816` | Licensed | Detail page pattern resolves |
| `015601302` | Leading-zero historical form | 200 | `015601302` | Licensed | Canonical form keeps the leading zero |
| `15601302` | GIS integer form of the same facility | 200 | `015601302` | Licensed | Same facility; do not store the truncated form as the license |
| `011400493` | Exact miss, historical LICENSED | 200 | `011400493` | Closed, Licensee Initiated | Live conflict vs open-data LICENSED |
| `011400246` | Exact miss, historical CLOSED | 200 | `011400246` | Closed, Licensee Initiated | Still closed; not currently active |
| `019201420` | Exact miss, historical PENDING | 200 | `019201420` | Application Withdrawn | Not currently active |

Facility-search welcome and `https://www.ccld.dss.ca.gov/carefacilitysearch/` returned HTTP 200 on this run. The detail URL pattern is recorded as a **candidate** only. No disclosure URL is adopted for publication. `currentLicenseStatusVerified` stays false for the roster as a whole.

## Code changes on this branch

- Pure reconciler reports `leadingZeroRepresentationMismatches` without collapsing zeros or accepting GIS status.
- Read-only paginated ArcGIS attribute fetch helper with fail-closed errors.
- Official facility-number pattern accepts leading zeros on 8–9 digit strings so disclosure URL helpers do not reject real CDSS identifiers.
- Regression tests cover leading-zero reporting, GIS type prefixes, pagination, and disclosure URL acceptance.
- PR validation runs the CCL probe and reconciliation tests.

## Remaining blockers (unchanged publication gate)

- California remains `unpublished` and owner-claim ineligible.
- No authoritative ISO export date.
- GIS `STATUS` integers still have no documented domain and are not accepted.
- Exact identifier coverage is incomplete; leading-zero truncation is a representation defect in GIS, not a license match.
- Live status conflicts continue (sample above; prior recorded conflicts remain).
- No public California directory, map, auth, billing, Design 2, or database changes are authorized by this report.

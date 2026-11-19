# California current-status verification (Phase 2, read-only)

California stays unpublished. This report continues issue #131 after the merged ArcGIS identifier reconciliation (PR #133 / `885e0d9`). It does **not** repeat that reconciliation. It independently checks current license status through the official CDSS transparency FacilityDetail API for a risk-focused sample.

Observed on **2026-11-19** from a network-enabled development environment.

## Official status provenance

| Item | Value |
| --- | --- |
| Detail API | `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facilityNumber}` |
| Detail page pattern (candidate only) | `https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{facilityNumber}` |
| Status proof fields | `FACILITYNUMBER`, `STATUS` |
| Supporting fields recorded | `FACILITYNAME`, `FACILITYTYPE`, `STREETADDRESS`, `CITY`, `ZIPCODE`, `DATECLOSED`, `LICENSEEFFECTIVEDATE`, `LICENSEFIRSTDATE` |
| Response wrapper observed | `{ "FacilityDetail": { ... }, "TSO": { ... } }` |

### Limitations (do not over-read)

- FacilityDetail is a **per-facility** lookup used by the care-facility search application. It is **not** a bulk roster export and provides **no** authoritative ISO export date.
- HTTP 200 can still mean “Facility Number Not Found” with an empty `STATUS`.
- Requesting a leading-zero-stripped ID (for example `15601302`) can return canonical `FACILITYNUMBER` `015601302`. The truncated request must not be stored as the license.
- Historical open-data `LICENSED` / `CLOSED` / `PENDING` text is never current by itself.
- ArcGIS integer `STATUS` codes remain undocumented and are **not** accepted.

## Risk-focused sample design

21 requests covering:

- Exact GIS identifier matches (historical LICENSED RCFE/ARF)
- Leading-zero historical forms present in GIS only after integer truncation
- One truncated GIS-form request for the same facility
- GIS-missing historical LICENSED and CLOSED rows
- The confirmed historical `LICENSED` → official Closed conflict (`011400493`)

Sample rows are listed in `lib/california-status-verification-sample.ts`. Historical file dates remain raw text `05252025` and are not treated as current.

## Live sample outcomes (2026-11-19)

| Classification | Count |
| --- | ---: |
| match | 14 |
| conflict | 5 |
| missing | 2 |
| inconclusive | 0 |

| Metric | Count |
| --- | ---: |
| Sample size | 21 |
| LICENSED → official Closed conflicts | **4** |
| Leading-zero canonicalizations (truncated request) | 1 |
| `currentLicenseStatusVerified` (roster) | **false** |
| Publication | **unpublished** |
| Sample is statewide conclusion | **false** |

### Conflicts

| Requested ID | Historical | Official `STATUS` | GIS cohort |
| --- | --- | --- | --- |
| `011400493` | LICENSED | Closed, Licensee Initiated | gis-missing |
| `015601270` | LICENSED | Closed, Change of Ownership | gis-missing |
| `015600722` | LICENSED | Closed, Licensee Initiated | gis-missing |
| `079201256` | LICENSED | Closed, Change of Ownership | gis-missing |
| `019201420` | PENDING | Application Withdrawn | gis-missing |

### Identifier / missing notes

| Requested ID | Result |
| --- | --- |
| `15601302` | Official canonical `015601302` / Licensed; classified **missing** for identifier equality because the truncated request is not an exact license match |
| `374603618` | Historical CLOSED; FacilityDetail returned not-found (empty status) |

Exact-match and leading-zero **historical** forms that were still Licensed live matched official `Licensed`. CLOSED historical rows that resolved live remained closed (or not found). No observation sets `currentlyActive` or publishes California.

## Code on this branch

- `lib/california-status-verification.ts` — parse FacilityDetail, relate leading-zero IDs, rate-limited/retry-bounded fetch, sample summary, evidence threshold, provenance constants
- `lib/california-status-verification-sample.ts` — reproducible risk sample
- `scripts/california-status-verification-run.mjs` — optional live runner (read-only)
- Fixtures under `supabase/proposals/fixtures/california-status-verification/`
- Regression tests in `supabase/proposals/tests/california_status_verification.ts`
- PR validation workflow step for those tests

## Proposed evidence threshold for roster-wide publication readiness

A sample **cannot** clear publication. Proposed gate (all required):

1. Authoritative ISO export date for the eligible roster source
2. Roster-wide current status verification against FacilityDetail (or an equally authoritative current source)
3. No unresolved historical-LICENSED vs official non-Licensed conflicts for rows proposed for publication
4. Exact license identifier coverage that does not store GIS-truncated forms
5. Documented GIS `STATUS` domain **or** explicit non-reliance on GIS status for publication

`CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD.sampleVerificationSufficient` remains `false`.

## Remaining blockers

- California remains unpublished and owner-claim ineligible
- No authoritative ISO export date
- Sample found multiple live LICENSED→Closed conflicts; roster-wide rate is unknown
- Leading-zero / truncated GIS identifiers remain a representation defect
- Undocumented GIS `STATUS` integers
- No public California directory, map, auth, billing, Design 2, or database changes are authorized

## How to reproduce

```bash
node --experimental-strip-types --test supabase/proposals/tests/california_status_verification.ts
node --experimental-strip-types scripts/california-status-verification-run.mjs /tmp/california-status-verification-live.json
```

# California Phase 10 — freshness resolution and publication-readiness (read-only)

California stays **unpublished**. Continues issue #131 after Phase 9 coordinates/capacity/freshness (PR #152 / `36d4ba66` on `development`).

Observed on **2026-11-19**.

## Objective

Resolve or conclusively document California’s remaining official-data freshness blocker, produce a final publication-readiness assessment, and revalidate the complete dataset. Do **not** publish California. Do **not** weaken publication safeguards. Gate stays **blocked** without a verified authoritative ISO export date.

## Freshness verdict (conclusive)

Phase 10 re-probed DownloadStateData headers/body, Transparency SPA assets, FAQ API, PIN/docs, CHHS/publish.data.ca.gov catalogs, ArcGIS clocks, and the CCLD Public Portal project.

### Authoritative finding

Official Transparency FAQ (`FAQ?mode=Public&id=context`, Download Data section):

- **Q:** How often is the data updated?
- **A:** The data is updated weekly.

`downloadstatedata.html` also states a copy is regularly published to the CalHHS Open Data Portal.

### Still missing

**Authoritative ISO export date for a specific DownloadStateData attachment remains null.**

Weekly cadence and “regularly published” copy language are **policy-only**. They do **not** identify the export ISO date of `ResidentialElderCareFacility11152026.csv` / `AdultResidentialFacilities11152026.csv`. Filename MMDDYYYY (`2026-11-15`), HTTP clocks, SPA `TVERSION`/`AppVersion`, CHHS/DCAT clocks, GIS `editingInfo`, Public Portal schedules, and retrieval timestamps remain non-authoritative.

**Gate:** `blocked`  
**Policy:** `require-official-iso-export-channel`  
**Publication:** unpublished / owner-claim-ineligible

### CDSS clarification draft

A draft request to `cclwebmaster@dss.ca.gov` / `opendata@cdss.ca.gov` is in fixtures (`cdss-clarification-request-draft.md`). **Do not send without human approval.**

## Publication-readiness decision

**California is NOT publication-ready.**

| Area | Result | Severity |
| --- | --- | --- |
| Authoritative ISO export date | fail | launch-blocking |
| Licensing status rules / CLOSED↔Withdrawn / roster-wide status | partial | launch-blocking |
| Eligible facility types (RCFE/ARF) | pass | launch-blocking |
| Unique valid IDs (fail-closed exceptions) | partial | launch-blocking |
| Capacity integrity (21 PENDING blanks; 0 candidate blanks) | partial | launch-blocking |
| Official coordinates (15,423 verified / 28 unresolved) | partial | launch-blocking |
| Official disclosure links | partial | launch-blocking |
| Exclusive-bucket accounting 24,377 | pass | launch-blocking |
| Sample vs roster verification breadth | fail | launch-blocking |
| Publication / owner-claim safeguards | pass | launch-blocking |
| Resolve remaining 28 coords | fail | optional enhancement |
| Public Portal future channel | n/a | optional enhancement |

## Dataset revalidation

Live DownloadStateData sha256 **unchanged** vs Phase 9. No source-data drift to report.

| Bucket | Count |
| --- | ---: |
| active-candidate | 15,413 |
| restricted-candidate | 38 |
| excluded | 8,921 |
| exception-documented-exclude | 5 |
| **Total** | **24,377** |

| Metric | Count |
| --- | ---: |
| Verified official coords (exact + identity-corroborated) | **15,423** |
| Unresolved (27 unmatched + 1 leading-zero identity rejection) | **28** |
| Missing capacities (all PENDING excluded) | **21** |
| Fabricated / geocoded coords | **0** |
| Invented capacities | **0** |

## Implementation

- `lib/california-phase10-freshness.ts`
- `lib/california-phase10-readiness.ts`
- `lib/california-phase10-quality.ts`
- `scripts/california-phase10-freshness-readiness-run.mjs`
- Fixtures + `supabase/proposals/tests/california_phase10_freshness_readiness.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Boundaries

Development-only. No production, main, Supabase writes, California publication, owner-claim activation, auth/billing, or Design 2. WA/OR contracts preserved. No external CDSS email sent from this task.

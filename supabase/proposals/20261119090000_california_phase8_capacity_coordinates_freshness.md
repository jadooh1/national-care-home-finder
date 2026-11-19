# California Phase 8 — capacity, coordinates, and freshness (read-only)

California stays **unpublished**. Continues issue #131 after Phase 7 accounting/freshness (PR #150 / `a5569e30` on `development`).

Observed on **2026-11-19**.

## Objective

Complete facility-capacity verification, ArcGIS coordinate reconciliation for publication candidates, and official-data freshness reassessment over the same DownloadStateData accounting invariant (**24,377** rows). Do **not** publish California. Gate stays **blocked** without a verified authoritative ISO export date.

## Capacity

- Official DownloadStateData `Facility Capacity` column is present and is now preserved by the Transparency read-only parser (`facilityCapacity`).
- Quality buckets quantified separately for RCFE and ARF: missing / invalid / zero / negative / valid.
- Historical CHHS and ArcGIS CAPACITY comparisons are reported as inconsistencies only; official download values are **never** overwritten.

## Coordinates

- DownloadStateData still has no latitude/longitude columns.
- Official CDSS CCL ArcGIS coordinates are matched using exact licensing IDs.
- Leading zeros on download IDs are preserved; leading-zero → GIS integer collapse is reported separately and rejected when ambiguous.
- No fabricated coordinates and no unverified geocoding.
- Coverage is calculated for active-candidate and restricted-candidate cohorts.

## Freshness

Phase 8 reassesses official CDSS metadata/docs/API channels and explicitly distinguishes:

- official export dates
- filename MMDDYYYY stamps
- retrieval / observation timestamps

**Authoritative ISO export date remains null.** Publication gate stays **blocked**.

## Accounting invariant

Phase 7 exclusive buckets remain mandatory:

| Bucket | Count |
| --- | ---: |
| active-candidate | 15,413 |
| restricted-candidate | 38 |
| excluded | 8,921 |
| exception-documented-exclude | 5 |
| **Total** | **24,377** |

## Implementation

- `lib/california-transparency-download.ts` — preserve Facility Capacity
- `lib/california-phase8-capacity.ts`
- `lib/california-phase8-coordinates.ts`
- `lib/california-phase8-freshness.ts`
- `lib/california-phase8-quality.ts`
- `scripts/california-phase8-capacity-coordinates-freshness-run.mjs`
- Fixtures + `supabase/proposals/tests/california_phase8_capacity_coordinates_freshness.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Boundaries

Development-only. No production, main, Supabase writes, California publication, or owner-claim activation. WA/OR contracts preserved.

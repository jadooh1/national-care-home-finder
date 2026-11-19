# California Phase 9 — coordinates, missing capacity, and freshness (read-only)

California stays **unpublished**. Continues issue #131 after Phase 8 capacity/coordinates/freshness (PR #151 / `a0fa3a1` on `development`).

Observed on **2026-11-19**.

## Objective

Resolve California coordinate discrepancies with independent identity corroboration, audit the 21 missing Facility Capacity cells, and establish an evidence-based official-data freshness policy. Do **not** publish California. Gate stays **blocked** without a verified authoritative ISO export date.

## Coordinates

- DownloadStateData still has no latitude/longitude columns.
- Exact ArcGIS licensing-ID matches remain the primary official coordinate path (**14,059** / 15,451 candidates).
- Phase 8 leading-zero unique collapses (**1,365**) are re-checked with independent type-family + name/address/ZIP corroboration.
- Newly verified identity-corroborated leading-zero matches: **1,364**.
- Rejected ambiguous leading-zero identity: **1** (`011405838`, name divergence + ZIP mismatch).
- Unmatched candidates: **27** (of which **20** have unique address/name hits against a divergent GIS licensing ID — still rejected; coords not accepted).
- Exact-only and newly verified coverage are reported separately. No fabricated coordinates and no unverified geocoding.

## Missing capacity

- Official blanks preserved: **17 RCFE + 4 ARF = 21**.
- All 21 are `PENDING` + `excluded` (not publication candidates).
- FacilityDetail samples also show blank `CAPACITY` / `Pending` — documentation only; download values never overwritten.

## Freshness

Phase 9 deepens CDSS / CCLD / open-data probes (PIN 24-01, CCLD Data annual PDFs, Facility Search welcome, nested FacilityDetail, HTTP ETag, DCAT clocks).

**Authoritative ISO export date remains null.**

**Recommendation:** keep the publication gate **BLOCKED** under policy `require-official-iso-export-channel`. Filename MMDDYYYY (ISO candidate `2026-11-15`), retrieval timestamps, HTTP clocks, CHHS/DCAT metadata, GIS editingInfo, portal catalog updates, annual CCLD PDFs, and FacilityDetail license/visit dates are non-authoritative.

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

- `lib/california-phase9-coordinates.ts`
- `lib/california-phase9-capacity.ts`
- `lib/california-phase9-freshness.ts`
- `lib/california-phase9-quality.ts`
- `scripts/california-phase9-coordinates-freshness-run.mjs`
- Fixtures + `supabase/proposals/tests/california_phase9_coordinates_freshness.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Boundaries

Development-only. No production, main, Supabase writes, California publication, or owner-claim activation. WA/OR contracts preserved.

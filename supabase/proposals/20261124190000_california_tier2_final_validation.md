# California Tier 2 — final development validation (baseline `6a04300`)

## Scope

Validate the Tier 2 development map shipped in #219 / `6a04300` without repeating
roster audits. Development only. Public California `mapPath` remains null.

## Leading-zero identity validation (1,361)

Method: `assessCaliforniaPhase9IdentityCorroboration` against live ArcGIS
identity attributes (`NAME`, `RES_STREET_ADDR`, `RES_CITY`, `RES_ZIP_CODE`,
`FAC_TYPE_DESC`) and DownloadStateData roster fields.

| Outcome | Count |
| --- | ---: |
| Identity verified | 1,360 |
| Identity rejected | 1 |
| Ambiguous / missing GIS | 0 |

Rejected: `011405838` (ABLELIGHT, INC - MOWRY). Address matches GIS
`1335 MOWRY AVE` / Fremont, but name differs (`BETHESDA LUTHERAN COMMUNITIES-MOWRY`)
and ZIP differs (`94538` vs `94536`). Address alone without ZIP/name is
insufficient under Phase 9 rules — removed from map points.

## Stratified exact-ID plausibility

150 stratified exact matches (category × ZIP3): **150 pass / 0 fail**
(CA bounds, finite coords, GIS fixture drift ≤ 0.05 mi, type-family / ZIP checks).

## Unmatched (16)

Documented in
`supabase/proposals/fixtures/california-tier2-final-validation/unmatched-facilities.json`.
No coordinates invented.

## Final verified coverage

| Metric | Count |
| --- | ---: |
| Eligible | 15,435 |
| Exact + valid | 14,058 |
| Leading-zero identity verified | 1,360 |
| Verified official map points | **15,418 (99.89%)** |
| Unmatched | 16 |
| Leading-zero identity rejected | 1 |
| Fabricated / geocoded | 0 |

## Publication readiness

- Development map: **GO-with-verified-subset** (after this corrective PR)
- Public California map: **STOP** (`mapPath` null; owner WA-only)

## Corrective change

Remove rejected `011405838` from Tier 2 map points; record validation fixtures
and tests. No production, DB, auth, or billing changes.

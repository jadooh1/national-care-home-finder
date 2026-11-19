# California Phase 7 — accounting reconciliation and freshness audit (read-only)

California stays **unpublished**. Continues issue #131 after Phase 6 publication-gate evaluator (PR #149 / `2cca00b` on `development`).

Observed on **2026-11-19**.

## Objective

Resolve California’s five-record accounting discrepancy across all 24,377 DownloadStateData rows, enforce an automated mutually exclusive classification invariant, audit fail-closed gate coverage, and re-investigate official CDSS metadata/docs/API for an authoritative ISO export date. Do **not** publish California. Gate stays **blocked** without a verified ISO export date.

## Where the five records went

Phase 6 reported:

`active 15,413 + restricted 38 + excluded 8,921 = 24,372` against `24,377` rows (apparent gap of 5).

Those five rows are **not missing, invalid-without-trace, or duplicates**. They are the ARF rows Phase 6 diverted into the separate `exception` outcome bucket (exclude-* gate impacts) and then omitted from the three-bucket presentation sum:

| Facility Number | Gate impact | Download status / type | Would be without exception diversion |
| --- | --- | --- | --- |
| 374604731 | exclude-out-of-scope | LICENSED / ADULT DAY PROGRAM | excluded |
| 198601400 | exclude-ineligible-status | PENDING / ADULT RESIDENTIAL | excluded |
| 306006749 | exclude-withdrawn-mapping-gap | CLOSED / ADULT DAY PROGRAM | excluded |
| 306006799 | exclude-withdrawn-mapping-gap | CLOSED / ADULT DAY PROGRAM | excluded |
| 95354 | exclude-invalid-id | PENDING / ADULT RESIDENTIAL | excluded |

Document-only exception `366401835` remains an **active-candidate** under rules and is not part of the gap.

Corrected exclusive accounting:

| Bucket | Count |
| --- | ---: |
| active-candidate | 15,413 |
| restricted-candidate | 38 |
| excluded | 8,921 |
| exception-documented-exclude | 5 |
| **Total** | **24,377** |

## Exclusive-bucket invariant

Every input record belongs to exactly one of:

- `active-candidate`
- `restricted-candidate`
- `excluded`
- `exception-documented-exclude`

Automated invariant: bucket sum === row count. Fail-closed: no bucket yields `publicationCandidate=true` while California remains unpublished.

## Freshness / ISO export date

Phase 7 re-probed official channels. **Authoritative ISO export date remains null.** Rejected or absent:

- Download filename MMDDYYYY (`11152026` → candidate `2026-11-15`)
- Local download / observation timestamp
- HTTP `Date` / absent `Last-Modified`
- CSV `file_date` column (absent)
- FacilityDetail export/version fields (absent)
- Transparency OpenAPI/swagger discovery (404)
- CCLD PIN 24-01 (no ISO export field)
- CHHS `file_date` text `05252025`
- GIS / portal catalog update clocks

**Publication gate stays blocked.**

## Capacity / coordinates audit

Phase 6 claimed capacity was absent from DownloadStateData. Phase 7 live CSV headers show **`Facility Capacity` is present**; the Transparency core parser historically dropped it. Coordinates remain absent. Readiness matrix updated accordingly; capacity mapping/empty-cell policy remain blockers.

## Implementation

- `lib/california-phase7-accounting.ts`
- `lib/california-phase7-freshness.ts`
- `scripts/california-phase7-accounting-freshness-run.mjs`
- Fixtures + `supabase/proposals/tests/california_phase7_accounting_freshness.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Publication gate

Still **unpublished** / owner-claim ineligible. Primary blocker: no authoritative ISO export date. Additional blockers: coordinates absent; capacity parser gap; CLOSED↔Application Withdrawn mapping gap; roster-wide status unverified; invalid/exceptional IDs; sample insufficient.

## Boundaries

Development-only. No production, main, Supabase writes, California publication, or owner-claim activation. WA/OR contracts preserved.

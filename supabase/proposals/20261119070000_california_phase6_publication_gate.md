# California Phase 6 — publication-gate evaluator (read-only)

California stays **unpublished**. Continues issue #131 after Phase 5 status/eligibility rules (PR #148 / `ac53f8c` on `development`).

Observed on **2026-11-19**.

## Objective

Build a deterministic, read-only publication-gate evaluator over official CDSS DownloadStateData records. Enforce RCFE/ARF category and status eligibility, document exceptional IDs, produce exact candidate/exclusion counts, and keep the publication gate **blocked** when no authoritative ISO export date can be verified. Do **not** publish California.

## Gate rules

### Category

| Product | Eligible DownloadStateData Facility Type |
| --- | --- |
| RCFE | `RESIDENTIAL CARE ELDERLY`, `RCFE-CONTINUING CARE RETIREMENT COMMUNITY` (alias RCFE-CCRC) |
| ARF-family | `ADULT RESIDENTIAL`, `ENHANCED BEHAVIORAL SUPPORTS HOME - ARF` (EBSH-ARF), `ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS` (ARFPSHN), `COMMUNITY CRISIS HOME - ARF` (CCH-ARF) |

Exclude unknown/blank/non-residential (ADP, SRF, RCFCI, MFHV).

### Status

| Download status | Class |
| --- | --- |
| LICENSED | active candidate |
| ON PROBATION | restricted candidate |
| PENDING | ineligible |
| CLOSED | ineligible (may include Application Withdrawn mapping-gap) |

### Freshness

Publication requires a verified authoritative ISO export date from an official CDSS export-timestamp channel. Filename MMDDYYYY (`11152026` → candidate `2026-11-15`), CHHS `file_date` text `05252025`, HTTP Last-Modified (absent), and GIS edit clocks are **not** authoritative. **Current authoritative ISO export date: null → gate blocked.**

## Observed DownloadStateData counts (sha256 unchanged vs Phase 3/5)

| Metric | Count |
| --- | ---: |
| RCFE rows | 13,337 |
| ARF rows | 11,040 |
| Active candidates | 15,413 |
| Restricted candidates | 38 |
| Publication candidates if gate opened | 15,451 |
| Excluded | 8,921 |
| Exception outcomes | 5 |
| Invalid identifiers | 1 (`95354`) |
| Duplicate licenses | 0 |
| Missing addresses | 38 |
| Capacity missing from download | 24,377 (column absent) |
| Coordinates missing from download | 24,377 (column absent) |

RCFE candidates: 8,625 active + 25 restricted. ARF candidates: 6,788 active + 13 restricted.

## Exceptional IDs

| ID | Classification | Gate impact |
| --- | --- | --- |
| 366401835 | historical-data-defect | document-only; eligible if rules pass (active candidate) |
| 374604731 | possible-relicense | exclude-out-of-scope (ADP) |
| 198601400 | unusual-transition | exclude-ineligible-status (PENDING) |
| 306006749 | application-withdrawn-mapping-gap | exclude-withdrawn-mapping-gap |
| 306006799 | application-withdrawn-mapping-gap | exclude-withdrawn-mapping-gap |
| 95354 | invalid-identifier | exclude-invalid-id |

## Implementation

- `lib/california-phase6-publication-gate.ts`
- `lib/california-phase6-exceptions.ts`
- `scripts/california-phase6-publication-gate-run.mjs`
- Fixtures + `supabase/proposals/tests/california_phase6_publication_gate.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Publication gate

Still **unpublished** / owner-claim ineligible. Primary blocker: no authoritative ISO export date. Additional blockers: capacity/coordinates absent from download; CLOSED↔Application Withdrawn mapping gap; roster-wide status unverified; invalid/exceptional IDs; sample insufficient.

## Boundaries

Development-only. No production, main, Supabase writes, California publication, or owner-claim activation. WA/OR contracts preserved.

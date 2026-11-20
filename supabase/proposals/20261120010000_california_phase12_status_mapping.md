# California Phase 12 — status mapping and expanded disclosure verification

**Issue:** #131  
**Base:** `development` including Phase 11 merge `d168a65`  
**Scope:** Development-only, read-only. California remains unpublished. No production / main / Supabase writes / owner-claim activation. CDSS clarification already sent — **no duplicate inquiries**.

## Objective

1. Resolve or precisely document DownloadStateData `CLOSED` vs FacilityDetail `Application Withdrawn` mapping gaps from Phase 11.
2. Expand official disclosure-link verification with a larger rate-limited stratified sample.
3. Preserve readiness controls and keep the publication gate **BLOCKED**.

## Verified CLOSED ↔ Application Withdrawn interpretation

Official evidence (PIN 24-01-CCLD 4-value display domain, CCR Title 22 §80029, live FacilityDetail + DownloadStateData for all five Phase 11 gap IDs):

| Evidence | Finding |
| --- | --- |
| Exact facility identifiers | Match (including leading-zero `019201529`) |
| Closed / withdrawal dates | Download Closed Date = FacilityDetail DATECLOSED on all five |
| License First / Effective dates | Empty on all five withdrawn rows |
| Closed* controls | Non-empty License First Date + `Closed,*` FacilityDetail status |
| Timing difference? | **No** — dates align; not a stale-vs-live conflict |
| Closed* equivalence? | **No** — never invent; withdrawn ≠ formerly licensed closure |
| Treat as licensed? | **Never** — `withdrawn-ineligible` |

**Interpretation name:** `application-withdrawn-documented-coarsening`  
Download `CLOSED` is the coarse non-operating bucket (PIN domain). FacilityDetail retains the precise `Application Withdrawn` label for never-licensed applications. Relation classification: `documented-coarsening` (not `match` to Closed*).

Download-only CLOSED License First Date split (not FacilityDetail-verified statewide): empty **1,241** / with date **4,868** / total **6,109**.

## Disclosure-link expansion

Canonical FacDetail page/API patterns unchanged from Phase 11. Expanded stratified sample across licensed, probationary, closed, pending, withdrawn, leading-zero, and exceptional IDs. Exact denominators reported; **not** statewide coverage.

## Readiness / gate

Baseline preserved: **24,377** total; **15,451** active/restricted candidates; **15,423** verified coords; **28** unresolved; **21** missing capacities on excluded. Gate stays **BLOCKED**. California **unpublished**.

## Artifacts

- `lib/california-phase12-status-mapping.ts`
- `lib/california-phase12-disclosure-links.ts`
- `lib/california-phase12-sample.ts`
- `lib/california-phase12-readiness.ts`
- `lib/california-phase12-quality.ts`
- `scripts/california-phase12-status-mapping-run.mjs`
- Fixtures under `supabase/proposals/fixtures/california-phase12-status-mapping/`
- Tests: `supabase/proposals/tests/california_phase12_status_mapping.ts`

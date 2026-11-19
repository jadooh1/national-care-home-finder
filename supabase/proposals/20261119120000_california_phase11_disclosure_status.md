# California Phase 11 — disclosure links and licensing-status confidence (read-only)

California stays **unpublished**. Continues issue #131 after Phase 10 freshness/readiness (PR #153 / `d5eb472` on `development`).

Observed on **2026-11-19**.

## Objective

Verify official CDSS FacilityDetail / disclosure URL patterns for RCFE and ARF, and improve licensing-status confidence with a rate-limited stratified FacilityDetail sample against DownloadStateData — while awaiting CDSS’s response to the already-sent clarification email. Do **not** publish California. Do **not** weaken publication safeguards. Do **not** send duplicate CDSS inquiries. Gate stays **blocked**.

## Disclosure-link findings (bounded sample)

Canonical patterns (identical path for RCFE and ARF):

| Kind | Pattern | Canonical for publication? |
| --- | --- | --- |
| FacilityDetail page | `https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{facilityNumber}` | **Yes** |
| FacilityDetail API | `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facilityNumber}` | No (proof) |
| FacilityReports API | `…/FacilityReports/{facilityNumber}` | No (supporting) |
| Hash / FacDetailRewrite | SPA equivalents | No |

Read-only generator preserves exact 8–9 digit identifiers including leading zeros; invalid IDs are refuse-closed.

**Sample N = 20 (not statewide):**

| Class | Count |
| --- | ---: |
| working | **18**/20 |
| missing | **0**/20 |
| ambiguous | **1**/20 (truncated leading-zero request `15601219` → `015601219`) |
| invalid | **1**/20 (`95354`) |
| leading-zero exact working | **4** |

Do **not** claim statewide disclosure-link coverage from this sample. SPA page HTTP 200 alone is insufficient; FacilityDetail identity is required.

## Licensing-status findings (bounded sample)

Stratified FacilityDetail verification vs current DownloadStateData labels (active, probationary, closed, withdrawn, pending, exceptional). Current status is never inferred from historical CHHS rows.

**Sample N = 22 (not statewide):**

| Relation | Count |
| --- | ---: |
| match | **16**/22 |
| mapping-gap (CLOSED→Application Withdrawn) | **5**/22 |
| conflict | **0**/22 |
| missing | **0**/22 |
| inconclusive | **0**/22 |
| invalid-id | **1**/22 (`95354`) |

Sample results must not be extrapolated statewide. CLOSED↔Application Withdrawn mapping-gap remains documented.

## Publication-readiness / gate

**NOT publication-ready.** Gate **BLOCKED**. Baseline preserved:

| Metric | Count |
| --- | ---: |
| Official records | **24,377** |
| Active/restricted candidates | **15,451** |
| Verified official coords | **15,423** |
| Unresolved coords | **28** |
| Missing capacities (excluded PENDING) | **21** |

CDSS clarification: **sent-awaiting-response** (no duplicate inquiries).

## Implementation

- `lib/california-phase11-disclosure-links.ts`
- `lib/california-phase11-status-verification.ts`
- `lib/california-phase11-sample.ts`
- `lib/california-phase11-readiness.ts`
- `lib/california-phase11-quality.ts`
- `scripts/california-phase11-disclosure-status-run.mjs`
- Fixtures under `supabase/proposals/fixtures/california-phase11-disclosure-status/`
- Tests: `supabase/proposals/tests/california_phase11_disclosure_status.ts`

## Hard boundaries

Development-only. No production / main / Supabase writes / CA publication / owner claims / auth / billing / Design 2. No CDSS email send from this phase.

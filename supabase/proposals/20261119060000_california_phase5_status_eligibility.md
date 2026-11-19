# California Phase 5 — status discrepancies and RCFE/ARF eligibility (read-only)

California stays **unpublished**. Continues issue #131 after Phase 4 full reconciliation (PR #147 / `2ac88f63` on `development`).

Observed on **2026-11-19**.

## Objective

Resolve licensing-status discrepancies between historical CHHS and DownloadStateData, document FacilityDetail status subtypes (especially Application Withdrawn), and establish evidence-backed residential eligibility rules. Do **not** publish California.

## Official status definitions (sources)

| Label | Source | Meaning used here |
| --- | --- | --- |
| Licensed / LICENSED | PIN 24-01-CCLD display domain + FacilityDetail | Currently authorized to operate |
| Pending / PENDING | CDSS Transparency FAQ | Application in process; not yet licensed |
| On Probation / ON PROBATION / Probationary License | PIN + FAQ + FacilityDetail | May operate under probation terms |
| Closed / CLOSED + Closed* subtypes | PIN + FacilityDetail | No longer operating under that license record |
| Application Withdrawn | FacilityDetail + CCR Title 22 §80029 | Applicant withdrew application; **not** a Closed* licensed-facility closure |
| License Suspended / Revocation Action Pending | CDSS Transparency FAQ | Documented; not seen as DownloadStateData domain values |

PIN 24-01-CCLD: Transparency Site displays Licensed, Pending, Closed, or On Probation and retains about five years of facility information. DownloadStateData uses the coarse four-value domain; FacilityDetail returns finer labels.

## 2,520 historical-versus-download conflicts

Exact-ID status conflicts: **1,520 RCFE + 1,000 ARF = 2,520**.

| Classification | Count | Interpretation |
| --- | ---: | --- |
| expected-time-drift | 2,517 | Forward transitions between CHHS `file_date` `05252025` and download filename candidate `2026-11-15` |
| possible-relicense | 1 | `374604731` CLOSED→LICENSED with later license-first date; FacilityDetail = Licensed |
| unusual-transition | 1 | `198601400` LICENSED→PENDING; FacilityDetail = Pending (download current) |
| historical-data-defect | 1 | `366401835` historical status was date `9/2/1997`; FacilityDetail = Licensed |

Dominant transitions (time drift): LICENSED→CLOSED, PENDING→LICENSED, PENDING→CLOSED, LICENSED→ON PROBATION, ON PROBATION→LICENSED/CLOSED.

## FacilityDetail sample (bounded)

Coded sample verifies Application Withdrawn mapping gaps on both ARF and RCFE rows, Closed* subtypes (Licensee Initiated, Change of Ownership, Change of Location, Agency Initiated), and ON PROBATION → Probationary License. Invalid id `95354` remains not found. Sample is **not** roster-wide proof.

## Eligibility rules (evidence-backed)

### Status

- `Licensed` / download `LICENSED` → active candidate (category permitting)
- `Probationary License` / `ON PROBATION` → active-restricted
- `Pending` → ineligible
- `Closed*` → ineligible
- `Application Withdrawn` → withdrawn-ineligible; download `CLOSED` vs this label is a **mapping-gap**

### Category

RCFE eligible: `RESIDENTIAL CARE ELDERLY`, `RCFE-CONTINUING CARE RETIREMENT COMMUNITY` (13,325 rows). Blank type (12) ineligible until type proven.

ARF-family eligible: `ADULT RESIDENTIAL`, `ENHANCED BEHAVIORAL SUPPORTS HOME - ARF`, `ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS`, `COMMUNITY CRISIS HOME - ARF` (9,078).

Out of scope inside ARF download (CDSS adult facility definitions): ADP 1,381; SRF 559; RCFCI 16; MFHV 1; blank 5.

## Freshness / verified export

No authoritative ISO export date. Download headers lack `Last-Modified`. CSV body has no `file_date`. FacilityDetail has no export timestamp. CHHS `file_date` text `05252025` is not ISO. Filename `11152026` remains a candidate only.

## Implementation

- `lib/california-phase5-status-eligibility.ts`
- `lib/california-phase5-sample.ts`
- `scripts/california-phase5-status-eligibility-run.mjs`
- Fixtures + `supabase/proposals/tests/california_phase5_status_eligibility.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Publication gate

Still **unpublished** / owner-claim ineligible. Blockers: no ISO export date; roster-wide status unverified; CLOSED↔Application Withdrawn mapping; ARF category gating; invalid IDs; sample insufficient.

# California Phase 4 — full licensing-data reconciliation (read-only)

California stays **unpublished**. This report continues issue #131 after Phase 3 Transparency DownloadStateData verification (PR #146 / `d4605aba` on `development`).

Observed on **2026-11-19** from a network-enabled development environment.

## Official sources

| Source | Role |
| --- | --- |
| CDSS Transparency `DownloadStateData` | Preferred current-ish statewide RCFE/ARF roster (strings keep leading zeros) |
| CHHS `ccl-facilities` RCFE/ARF CSVs | Historical open-data baseline (`file_date` text `05252025`, not ISO) |
| ArcGIS `CDSS_CCL_Facilities` FeatureServer/0 | Supporting GIS attributes; integer `FAC_NBR` truncates zeros; `STATUS` undocumented |
| CDSS `FacilityDetail/{id}` | Per-facility current status proof for a bounded stratified sample only |

Filename stamp `11152026` → ISO **candidate** `2026-11-15` only. **Not adopted** as an authoritative export date.

## DownloadStateData verification (unchanged bytes vs Phase 3)

| File | Filename | Rows | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| RCFE | `ResidentialElderCareFacility11152026.csv` | 13,337 | 8,635,782 | `e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e` |
| ARF | `AdultResidentialFacilities11152026.csv` | 11,040 | 5,434,124 | `f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe` |

Integrity: **0 / 0** duplicate facility numbers; **0** RCFE↔ARF ID overlap; RCFE invalid IDs **0**; ARF invalid **`95354`** (ZIP-shifted). Leading zeros preserved (RCFE 1,130 rows). Blank addresses: RCFE **26** (all PENDING) / ARF **12**.

## Full-dataset reconciliation (exact counts)

### Historical CHHS vs DownloadStateData

Current CHHS CSVs already store 9-digit zero-padded facility numbers, so Phase 3’s “leading-zero representation” bucket collapses into exact matches on this run.

| Metric | RCFE | ARF |
| --- | ---: | ---: |
| Historical rows (denominator) | 12,522 | 10,498 |
| Download rows (denominator) | 13,337 | 11,040 |
| Exact ID matches | 11,292 | 9,754 |
| Leading-zero representation matches | 0 | 0 |
| Historical-only | 1,230 | 744 |
| Download-only | 2,045 | 1,286 |
| Status conflicts on exact matches | 1,520 | 1,000 |
| Historical LICENSED → download non-LICENSED | 795 | 508 |

Historical-only RCFE rows are overwhelmingly old `CLOSED` (1,225 / 1,230).

### Address / capacity anomalies

| Metric | RCFE | ARF |
| --- | ---: | ---: |
| Exact-ID address diffs (hist vs download) | 988 / 11,292 | 876 / 9,754 |
| City diffs | 25 / 11,292 | 18 / 9,754 |
| ZIP diffs | 20 / 11,292 | 42 / 9,754 |
| Capacity diffs (hist vs GIS, both present) | 158 / 7,746 | 231 / 7,523 |
| Download capacity column | **absent** | **absent** |

### ArcGIS vs DownloadStateData (category-filtered)

ArcGIS all-types count: **37,887**.

| Metric | RCFE-like GIS | ARF-like GIS |
| --- | ---: | ---: |
| GIS category rows | 8,639 | 6,806 |
| Exact ID matches to download | 7,866 | 6,207 |
| Leading-zero representation mismatches | 773 | 592 |
| Download missing even after collapse | 4,698 | 4,241 |
| Duplicate / invalid GIS IDs | 0 / 0 | 0 / 0 |
| Invalid coordinates in category | 0 | 0 |

### Category inconsistencies (publication gating candidates)

| File | Publishable-type rows | Other / blank |
| --- | ---: | ---: |
| RCFE | 13,325 | 12 blank |
| ARF | 9,078 | 1,962 (incl. ADULT DAY PROGRAM 1,381; SOCIAL REHABILITATION FACILITY 559) |

## Bounded FacilityDetail sample (not statewide)

Required IDs included: `011400493`, `306006749`, `95354`.

Coded Phase 4 sample (16 lookups, rate-limited): **13 match / 2 conflict / 1 invalid-download-id / 0 missing-live**.  
An exploratory expansion (32 lookups) reproduced the same two `Application Withdrawn` conflicts and invalid id.

| ID | Download | FacilityDetail | Relation |
| --- | --- | --- | --- |
| `011400493` | CLOSED | Closed, Licensee Initiated | match |
| `306006749` | CLOSED | Application Withdrawn | **conflict** |
| `306006799` | CLOSED | Application Withdrawn | **conflict** |
| `95354` | PENDING | (none) | invalid-download-id |

Sample verification is **insufficient** for publication.

## Publication-readiness requirements (all unmet except WA/OR preservation)

1. Reliable authoritative source **and** ISO export date
2. Roster-wide verified current status (not sample-only)
3. Unique valid facility identifiers (reject `95354` and peers)
4. Correct RCFE/ARF category gates
5. Reliable addresses **and** capacity (download lacks capacity/coords)
6. Verified disclosure link pattern for publish candidates
7. No Washington / Oregon regressions

**Gate result:** `publication: unpublished`, `ownerClaimEligible: false`. `californiaPhase4AllowsPublication()` is hard-`false`.

## Code on this branch

- `lib/california-phase4-reconciliation.ts`
- `lib/california-phase4-sample.ts`
- `scripts/california-phase4-reconciliation-run.mjs`
- Fixtures under `supabase/proposals/fixtures/california-phase4-reconciliation/`
- Tests: `supabase/proposals/tests/california_phase4_reconciliation.ts`
- CI step in `.github/workflows/pr-validation.yml`

## Remaining blockers

1. No authoritative ISO export date
2. Roster-wide current status unverified
3. CLOSED ↔ FacilityDetail subtype mapping gaps (`Application Withdrawn`)
4. ARF non-residential categories require gating
5. Invalid identifier rejection
6. Capacity/coordinates absent from preferred download roster
7. ArcGIS leading-zero truncation + undocumented STATUS
8. Sample results must not approve publication

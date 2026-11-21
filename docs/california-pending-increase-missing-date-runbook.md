# California Pending Increase + missing License First Date runbook

**Base:** `development` @ `84d9d15` (#200)  
**Observed:** 2026-11-21  
**Scope:** Development-only. Exclusions inactive. California unpublished.

## Fresh Transparency downloads

| File | Content-Disposition | As-of | Rows | sha256 |
| --- | --- | --- | ---: | --- |
| RCFE | `ResidentialElderCareFacility11152026.csv` | **2026-11-15** | 13,337 | `e7de7528…728e` |
| ARF | `AdultResidentialFacilities11152026.csv` | **2026-11-15** | 11,040 | `f2cf8a87…89fbe` |

Unchanged from #199. CDSS-confirmed filename/header as-of method used. No newer roster at observation time.

## 66 Licensed / Pending Increase

| Question | Finding |
| --- | --- |
| Download status | All **66** = `LICENSED` with non-empty License First Date + Facility Capacity |
| FacilityDetail status | Sample **22/22** still `Licensed/Pending Increase` (0 cleared to exact Licensed) |
| Existing license | **Recognized** — licensed facility with a pending capacity-increase overlay |
| Approved capacity | Download `Facility Capacity` = FacilityDetail `CAPACITY` on **10/10** compared samples |
| Proposed increase | **Not published** in Transparency Download or FacilityDetail (no proposed-capacity field) |
| Publication mapping | **Not approved** — keep offline listing-excluded |

## 14 missing License First Date

| Check | Result |
| --- | ---: |
| Still empty on Download | **14 / 14** |
| Cleared on Download | **0** |
| FacilityDetail `LICENSEFIRSTDATE` null | **14 / 14** |
| Both first + effective empty | **5** |
| First empty, effective present | **9** |

**Decision:** Never treat `LICENSEEFFECTIVEDATE` as License First Date without human approval. All 14 remain offline listing-excluded.

### Subclass A — both dates empty
`079201725`, `197610992`, `342701894`, `502701880`, `107209715`

### Subclass B — effective present only
`502701889`, `374605020`, `342701856`, `198604006`, `195850781`, `195850785`, `197611051`, `360951409`, `198320716`

## Decision matrix (summary)

| ID | Status |
| --- | --- |
| transparency-asof-revalidated | resolved-documented |
| pending-increase-existing-license | resolved-documented |
| pending-increase-approved-vs-proposed-capacity | resolved-documented |
| pending-increase-publication-mapping | **policy-pending** |
| missing-first-date-download-unchanged | resolved-documented |
| missing-first-date-facilitydetail-subclasses | resolved-documented |
| california-publication-still-stop | **open-blocker** |

## Remaining blockers

- California publication blocked / unpublished authorization  
- Exclusion policy inactive  
- Pending Increase mapping not approved for publication  
- Missing-date needs Download first date or human date-adoption rule  
- ArcGIS roster rejected  
- Separate publication approval  

## Reproduce

```bash
node --experimental-strip-types --test \
  supabase/proposals/tests/california_pending_increase_missing_date.ts
```

Dev preview: `/development/california-pending-missing`

## Restrictions

No production changes, DB writes, exclusion activation, California publication, or merge without approval.

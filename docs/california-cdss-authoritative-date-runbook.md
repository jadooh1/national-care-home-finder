# California CDSS authoritative as-of date runbook

**Base:** `development` @ `d10b287` (#198)  
**Observed:** 2026-11-21  
**Scope:** Development-only. California unpublished.

## Breakthrough

CDSS confirmed that the date in the official Transparency CSV **Content-Disposition filename/header** is the dataset as-of date.

## Independent validation (live)

| File | Content-Disposition | As-of ISO | Bytes | Rows | sha256 |
| --- | --- | --- | ---: | ---: | --- |
| RCFE | `ResidentialElderCareFacility11152026.csv` | **2026-11-15** | 8,635,782 | 13,337 | `e7de7528…728e` |
| ARF | `AdultResidentialFacilities11152026.csv` | **2026-11-15** | 5,434,124 | 11,040 | `f2cf8a87…89fbe` |

Dual-file concordance: **yes**. CSV column header row has no as-of field; the authoritative stamp is the HTTP filename/header.

## Strict validation rules

1. Disposition usable (`attachment; filename=…` or bare fixture `.csv`)  
2. Filename prefix matches RCFE/ARF download id  
3. Trailing MMDDYYYY calendar-valid  
4. RCFE and ARF ISO as-of dates identical  
5. CDSS confirmation flag true  

Only then: `adoptedAsOfIso` set for the **Transparency pathway**.

Still rejected: ArcGIS edit clocks, CHHS `file_date`, catalog timestamps, FAQ weekly cadence.

## Tier 1 reassessment (Transparency pathway)

| Item | Result |
| --- | --- |
| Freshness (Transparency CSV) | **Resolved** — as-of `2026-11-15` |
| Development preview Tier 1 | **GO** (offline otherwise-clear 15,363) |
| Public launch | **STOP** |
| ArcGIS roster pathway | **STOP** (unchanged) |
| Publication eligible | **0** |
| Exclusions activated | **No** |

### Resolved blockers
- `transparency-csv-missing-authoritative-asof-date`
- `filename-header-mmddyyyy-rejected-without-cdss-confirmation`

### Remaining blockers
- California publication blocked / unpublished authorization  
- Exclusion policy inactive  
- Status-conflict overlays unresolved for launch  
- ArcGIS rejected as roster + undocumented STATUS  
- Tier 2 licensing-coordinate approval  
- Separate publication approval  

## Reproduce

```bash
node --experimental-strip-types --test \
  supabase/proposals/tests/california_cdss_authoritative_date.ts \
  supabase/proposals/tests/california_transparency_tier1_eligibility.ts
```

## Guardrails

No production/`main`, Supabase writes, agency emails, California publication, or merge without approval. WA production, OR development, FL/OH restrictions preserved.

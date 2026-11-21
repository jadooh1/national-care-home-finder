# Florida Tier 1 eligibility verification

**Base:** `4d382d3c978c536035fd99a6ee6bc9d0a62a4666`  
**Observed:** 2026-11-21  
**Scope:** Development-only. Florida stays unpublished. Oregon restrictions preserved. No Supabase writes. Agency email draft only — not sent.

## Dataset scope

Full FloridaHealthFinder ALF comparison embed (ClientCode 11), **3,025** rows. Counts are full-dataset, not extrapolated from a sample.

## Tier 1 offline eligibility (preview)

| Rule | Decision |
| --- | --- |
| Primary identity | **LicenseID** (3,025 unique; Profile/`?LID=` verified) |
| Status include | **LICENSED** only (2,253) |
| Status exclude | IN REVIEW (645) and all other non-LICENSED statuses |
| Duplicate LicenseNumber `7622` | **Exclude both** rows (LICENSED LicenseID 979 + PROVISIONAL LicenseID 1005) |
| Blank State | **Exclude** 1 LICENSED row (LicenseID 524833) |
| Coordinates | **Not required** for Tier 1 |
| Inspection links | **Not required** for Tier 1 (prefix verified but optional) |
| AFCH | **Not merged** into ALF |

**Tier 1 offline eligible:** **2,251** / 3,025  
**Publication eligible / final public visibility:** **0** / false  

Arithmetic: `2253 − 1 (7622 LICENSED) − 1 (blank state) = 2251`.

## Remaining public-launch blockers

1. No authoritative ISO export/version stamp (page Date / nightly claim / Miami-Dade sample / DOH GIS 2013 rejected).  
2. `directoryContract("Florida")` remains `unpublished`; `floridaDirectoryReady() === false`.  
3. Separate human publication approval required.  

Status mapping and the 7622 collision are **resolved for preview** by explicit exclusion rules; written AHCA confirmation is still recommended before public launch (draft email in `lib/florida-tier1-launch.ts`, do not send from agents).

## Oregon preserved

- `publication: development`  
- `mapHref` null / refresh false  
- Owner claims WA-only  

## Preview & rollback

- Preview: `/development/florida-tier1`  
- Rollback: revert preview route; leave Florida unpublished; no DB rollback  

## Launch recommendation

**STOP for public launch.**  
**GO for development-only Tier 1 preview** of 2,251 offline candidates after CI.

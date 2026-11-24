# Texas Tier 1 — directory publication readiness (development-only)

## Verdict

**STOP** for Texas Tier 1 directory publication.

HHSC active ALF workbook inventory is verified (2,019 rows). Framework Tier 1
requirements are **not** met. This package does **not** publish Texas, invent
coordinates or ISO export dates, enable maps/owner claims, or change Washington /
California / Oregon / Design 2 / authentication / billing.

## Evidence reused

- HHSC ALF source discovery (`lib/texas-alf-directory.ts`, eligibility matrix,
  investigation readiness, disclosure investigation, source verification)
- Store report `docs/texas-assisted-living-source-discovery.md` (STOP; al.xlsx
  authoritative; as-of 11/19/2026 rejected; TULIP prefix unverified)
- Nationwide publication eligibility readiness (`lib/publication-eligibility-readiness.ts`)
- California / Oregon Tier 1 readiness patterns (controls + checklist + surface separation)

## Authoritative source

| Field | Value |
| --- | --- |
| Agency | Texas HHSC |
| Workbook | `https://apps.hhs.texas.gov/providers/directories/al.xlsx` (sheet `ALF_Directory`) |
| Capture | 2026-11-20; SHA-256 `7b83f02c…dce476` |
| Active as-of label | `11/19/2026` (not an ISO export stamp) |
| recordedExportDateIso | `null` |

## Counts and exclusions

| Bucket | Count |
| --- | --- |
| Active workbook rows | 2,019 |
| Type A / B / C | 335 / 1,676 / 8 |
| Unique Facility ID / License No | 2,019 / 2,019 |
| Blank physical address / capacity | 0 / 0 |
| Geo pairs / comma-only | 1,937 / 82 |
| Closure historical IDs (0 active overlap) | 1,515 |
| **publicationEligible** | **0** |

Type C (8) is legacy adult foster care — enumerated separately; not Washington AFH.
Comma-only Geo Location cells are never geocoded.

## Directory vs map

| Surface | Status |
| --- | --- |
| Directory | Unpublished evidence-only; no `/texas` route |
| Map | Disabled; Geo Location provenance undescribed |

## Outstanding directory blockers

1. No authoritative ISO export/version stamp
2. Facility Licensed=YES is workbook membership, not operating status
3. No verified Facility ID/License → TULIP detail URL prefix
4. Type A/B/C product taxonomy unapproved (not WA AFH)
5. Map geo source undescribed (separate from directory)
6. State authorization remains unpublished

## Controls

See `lib/texas-tier1-directory-readiness.ts`:
`publicPublicationAuthorized=false`, `texasPublished=false`, `texasDirectoryReady=false`,
`mapEnabled=false`, `stopGo=STOP`.

## Out of scope

No Supabase schema/data changes. No Washington / California / Oregon / Design 2 /
owner / auth / billing changes. No merge or production deploy from the agent.

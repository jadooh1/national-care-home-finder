# Florida AHCA source-date verification

**Base:** `1467525876470b320659b466f3d76276ccd5b297`  
**Observed:** 2026-11-21  
**Scope:** Development-only. Does not re-run the 3,025-facility investigation. Florida stays unpublished. No Supabase writes. Agency email draft only — not sent.

## Decision

| Gate | Result |
| --- | --- |
| Authoritative ISO export / version stamp | **Not found** |
| Nationwide policy allows Tier 1 without ISO? | **No** (needs ISO **or** documented policy exception + independent evidence) |
| Florida documented freshness exception? | **No** |
| Independent official currentness evidence? | **No** |
| **Public launch / Tier 1 freshness** | **STOP** |
| Offline Tier 1 candidates preserved | **2,251 / 3,025** |
| Publication eligible / finalPublicVisibility | **0** / false |

## Surfaces examined

- FloridaHealthFinder ALF embed (ClientCode 11) — no ISO stamp; HTTP `Last-Modified` absent; response `Date` rejected as clock.
- Consumer ALF guide — “updated nightly”; brochure “as of November 2024” / “last updated in 2025” rejected.
- FHF Go Live Date Table PDF — ALF column “Nightly” is a schedule, not an export stamp.
- Order Data / Data Dictionary — hospital/patient datasets, not the ALF licensing roster.
- AHCA Assisted Living Unit page — points to HealthFinder search; no dated statewide ALF bulk export.
- Miami-Dade sample XLSX — county mixed file; HTTP Last-Modified / filename date rejected.
- DOH GIS 2013 — unrelated / stale; rejected.

## Policy reading

`evaluateFreshness` in `lib/publication-eligibility.ts` accepts Tier 1 freshness only when:

1. `officialExportDateIso` is a valid source-issued calendar date, **or**
2. `freshnessPolicyDocumented && freshnessIndependentEvidence` with no rejected HTTP/page/retrieval/filename proxies.

Nightly-update marketing and approximate go-live schedules do **not** satisfy either path.

## Next step requiring human approval

Send (human only) the draft in `lib/florida-ahca-source-date.ts` (`FLORIDA_AHCA_SOURCE_DATE_EMAIL_DRAFT`, `doNotSend: true`) requesting a dated statewide ALF export or written version stamp matching the ClientCode 11 embed.

## Preview

`/development/florida-source-date` — robots disallow `/development`.

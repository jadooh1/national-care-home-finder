# California official disclosure-link verification

**Base:** `development` @ `f524b66` (#203)  
**Observed:** 2026-11-21  
**Scope:** Development-only. California unpublished. Exclusions inactive.

## Official URL patterns

| Kind | Pattern | Publishable? |
| --- | --- | --- |
| Facility detail page (canonical) | `carefacilitysearch/?Rewrite=FacDetail/{exactId}` | Yes (valid 8–9 digit IDs only) |
| FacilityDetail API | `transparencyapi/api/FacilityDetail/{exactId}` | Proof only |
| Report list | `transparencyapi/api/FacilityReports/{exactId}` | Metadata only |
| Report document (public HTML) | `FacilityReports?facNum={exactId}&inx={n}` | Yes |
| `REPORTPAGE` field | `http://www.fakeout.gov/...` | **Never** |

Leading zeros must be preserved exactly (`015601302`, not `15601302`). Invalid IDs (e.g. `95354`) generate **no** facility-specific link.

## Sample results (2026-11-21)

| ID | Role | API match | Reports | Document HTML |
| --- | --- | ---: | ---: | --- |
| 100400070 | control Licensed | yes | 17 | yes |
| 015601302 | leading-zero Licensed | yes | 13 | yes |
| 015601083 | leading-zero Pending Increase | yes | 57 | yes |
| 374604742 / 336426330 | Pending Increase | yes | 4 / 41 | yes |
| 079201725 | missing first date | yes | 3 | yes |
| 198320787 | provisional | yes | 9 | yes |
| 502701867 | prior conflict | yes | 1 | yes |
| 95354 | invalid | no | 0 | 404 |

FacDetail **page** URLs always return SPA shell HTTP 200 (even for invalid IDs). Correct facility is proven via FacilityDetail API exact ID match.

## Fallback proposal

Official CDSS Care Facility Search home + Download Data page — transparent, no invented facility URLs.

| Question | Answer |
| --- | --- |
| Satisfies offline Tier 1? | **Yes** (`disclosureRequired=false`) |
| Satisfies publication-acceptance facility-specific link? | **No** |
| Needs separate approval to replace FacDetail links? | **Yes** |

## Decision requiring approval

**`approve-cdss-search-fallback-as-sole-public-disclosure-link`** — Approve Search/Download as the *sole* public disclosure link instead of facility-specific FacDetail. **Recommendation: reject for publication**; keep FacDetail for valid IDs; use Search/Download as supplemental / offline fallback only.

## Reproduce

```bash
node --experimental-strip-types --test \
  supabase/proposals/tests/california_disclosure_link_verification.ts
```

Dev preview: `/development/california-disclosure-links`

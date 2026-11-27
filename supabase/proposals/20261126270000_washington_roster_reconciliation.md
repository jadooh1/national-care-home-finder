# Washington roster reconciliation + owner sign-in deep-link (development-only)

## Verdict

**CONDITIONAL** for Washington launch completion (pending production S5/S6
test-account secrets for agent re-execution).

### Human decisions (2026-11-26)

| Decision | Status |
| --- | --- |
| Retain **6,278** as authoritative published roster | **Approved** |
| Exclude unproven **8,177** from launch acceptance | **Approved** (document only; **no DB deletes**) |
| Defer live ArcGIS **6,296** refresh | **Approved** until independently validated |
| Controlled production S5/S6 with authorized test accounts | **Approved** — blocked in-agent until `NCHF_PROD_*` secrets exist |
| No production deploy / config / billing | **Held** |

Authoritative published roster remains **6,278** unique OP licenses. The reported
**8,177** total has **no authoritative provenance** and is **not** treated as
1,899 duplicates. Production directory and map both expose **6,278** with no
synthetic fixture. Live ArcGIS AF (`GDLArchiveDate IS NULL`) is **6,296**
(+18 net vs baseline) — refresh deferred.

## 8,177 reconciliation

| Claim | Evidence |
| --- | --- |
| Reported total | 8,177 (from launch-completion ask) |
| Authoritative listed | 6,278 (`wa_afh_published_20261109.csv`, `WASHINGTON_LISTED_COUNT`) |
| Arithmetic residual | 1,899 |
| Residual explained as duplicates? | **No** — no evidence |
| Residual explained as archived AF? | **No** — archived AF with non-null `GDLArchiveDate` is ~113,936 |
| Residual equals Georgia FACIDs? | Coincidence only (Georgia PCH+ALC = 1,899); not Washington |

## Live vs published (read-only ArcGIS, 2026-11-26)

| Bucket | Count |
| --- | ---: |
| Published baseline | 6,278 |
| Live AF archive-null | 6,296 |
| Only in live | 27 |
| Only in baseline | 9 |
| Net | +18 |

## Surface consistency

| Surface | Count |
| --- | ---: |
| Production `wa_dshs_listed_facilities` | 6,278 |
| Production `wa_afh_map_facilities` | 6,278 |
| Production synthetic fixture | 0 |
| Development listed view (incl. `…e2`) | 6,279 |
| Development map view | 6,278 |
| Public UI contract | 6,278 |

## Authenticated acceptance (development)

Disposable password grants for unapproved owner, approved owner, and independent
admin **PASS** (UUID match). Admin list/count RPCs succeed read-only. Mutating
listing-edit → publish → withdraw was previously **PASS** under #134 and was
**not** repeated. Production authenticated S5/S6 still needs production
credentials or an explicit waiver.

## Code change in this proposal

`/owner?mode=login` (and `tab=signin`) selects Sign in; `ownerSignInHref`
deep-links to login mode so returning owners are not stranded on Create account.

## Out of scope

No production deploy, roster refresh write, billing activation, Design 2 change,
or additional state publication.

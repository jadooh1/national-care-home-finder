# Pennsylvania Tier 1 — directory publication readiness (development-only)

## Verdict

**STOP** for Pennsylvania Tier 1 directory publication.

Official open-data roster re-verified at **989** rows (content sha256 unchanged
from the prior audit). Thirteen letter-only street exceptions are
**deterministically excluded**. `publicationEligible` remains **0**.

Pennsylvania stays unpublished. No production / WA / CA / OR / Design 2 / auth /
billing changes.

## Audit lineage

- 989-facility open-data audit and address ledger (PR **#65** / **#170** package)
- Note: GitHub **#63** was Michigan address work, not Pennsylvania

## Re-verify (2026-11-26)

| Check | Result |
| --- | --- |
| CSV sha256 | `c9172269…` (byte-identical to prior audit) |
| Rows / unique Object IDs | 989 / 989 |
| Usable streets | 976 |
| Letter-only exclusions | 13 (all ledger IDs present) |
| Capacity | 4–250; none under 4 |
| Catalog `rowsUpdatedAt` | `2026-11-22T06:04:51Z` (rejected as export date) |
| Prior catalog clock | `2026-11-08T06:09:03Z` |
| License / status columns | Absent |
| Facility-specific disclosure | Unverified |
| publicationEligible | **0** |

## Eligible facility counts

| Bucket | Count |
| --- | ---: |
| Roster inventory | 989 |
| Usable street (letter+digit) | 976 |
| Deterministic address exclusions | 13 |
| **publicationEligible** | **0** |

## Outstanding blockers

1. Object ID ≠ license number; no status column
2. No authoritative ISO export stamp (catalog clock ≠ content version)
3. No verified facility-specific disclosure permalink
4. Thirteen letter-only streets excluded (not corrected)
5. Georeferenced coords ≠ licensing map provenance
6. State authorization unpublished

## Controls

See `lib/pennsylvania-tier1-directory-readiness.ts`:
`stopGo=STOP`, `pennsylvaniaPublished=false`,
`addressExceptionsDeterministicallyExcluded=true`, `publicationEligible=0`.

# Oregon Tier 1 — finalize exact roster reconciliation (development-only)

## Verdict

**STOP** for street integration activation, directory row replacement, and Oregon
public publication.

Exact-ID reconciliation of the prior **1,584** development directory against the
latest **1,579** qualifying ODHS capture is **complete**. Street integration
remains prepared but **disabled**. Authoritative export freshness remains
unresolved pending ODHS confirmation.

Baseline: development merge `8b9fe10` (#227 street integration package).

## Verified exact-ID ledger

Authorized read-only development database comparison:

| Metric | Count |
| --- | ---: |
| Previous roster | 1,584 |
| Latest roster | 1,579 |
| Retained | 1,572 |
| Removed | 12 |
| Added | 7 |
| Net change | **−5** |
| Unresolved residual IDs | **0** |

Checksum: `1584 − 12 = 1572`; `1572 + 7 = 1579`; `1579 − 1584 = −5`.

This supersedes the prior offline reconstructed residual (`1581` / `3` unresolved).

## Removals (12) — ODHS 2026-11-26 classification

### Closed / 0 licensed beds (5)

`0000000196`, `0000000199`, `515716`, `5169225761`, `522195`

### Open / 0 licensed beds (7)

`0000000425`, `11419`, `11495`, `11569`, `523278`, `528272`, `566448`

All twelve remain AFH in the export and are outside the Open beds 1–5 acceptance rule.

## Additions (7) — newly qualifying Open AFH beds 1–5

| source_id | Beds | Status |
| --- | ---: | --- |
| `0000000408` | 4 | Open |
| `0000000708` | 5 | Open |
| `0000000713` | 5 | Open |
| `0000000731` | 5 | Open |
| `0000000733` | 4 | Open |
| `11561` | 4 | Open |
| `8001946102` | 5 | Open |

## Controls (unchanged defaults)

- `streetIntegrationActivated: false`
- `directoryRowReplacementAuthorized: false`
- `oregonPublished: false`
- `supabaseWrites: false`
- `geocodingEnabled: false`

## Outstanding blockers

1. Authoritative export freshness unresolved pending ODHS confirmation
2. Street integration prepared but not activated
3. Directory row replacement not authorized
4. State authorization remains development-only
5. Map disabled (separate)

## Out of scope

No database writes, street activation, public Oregon flip, production deploy,
geocoding, auth, or billing. Washington / California / Design 2 preserved.

## Next human actions

1. Confirm ODHS authoritative export freshness (do not invent ISO dates).
2. Authorize street activation only after freshness clears.
3. Authorize 1,584 → 1,579 row replacement as a separate approval.
4. Keep public Oregon publication as a further separate approval.

# Oregon Tier 1 — street address integration and 1584→1579 reconciliation

## Verdict

**STOP** for street integration activation, directory row replacement, and Oregon
public publication.

Official ODHS street addresses are **prepared** for all **1,579** qualifying
Open AFH (beds 1–5) rows from the 2026-11-26 dual-format capture. Integration
controls default **OFF** and are fully reversible. Authoritative export freshness
remains **unresolved** pending ODHS confirmation (no ISO stamp adopted).

Baseline: development merge `2d0d037`.

## Capture (unchanged hashes from #225)

| Artifact | Value |
| --- | --- |
| CSV | `Provider_Export_11-26-2026.csv` — SHA-256 `df843f71…` |
| Excel | `Provider_Export_11-26-2026.xlsx` — SHA-256 `036885f3…` |
| Qualifying accepted | **1,579** (CSV↔Excel parity) |
| Street present / blank | **1,579 / 0** |
| Prior directory accepted | **1,584** (not replaced) |
| Net delta | **−5** |
| `recordedExportDate` | `null` |

## Exact-ID reconciliation (1584 → 1579)

Offline package reconciles by exact `source_id` using:

1. Full qualifying fixture (`qualifying-1579.json`, 1,579 rows with streets)
2. Nov 13 LEAVE13 / NEW13 ledgers (same IDs as `oregon-roster-reconciliation`)
3. Count arithmetic against the stored directory size

### Removals (LEAVE13 — still non-qualifying on 2026-11-26)

| source_id | Current status / beds | Reason |
| --- | --- | --- |
| `0000000196` | Closed / 0 | closed-zero-beds |
| `0000000425` | Open / 0 | open-zero-beds |
| `11419` | Open / 0 | open-zero-beds |
| `11495` | Open / 0 | open-zero-beds |
| `11569` | Open / 0 | open-zero-beds |
| `528272` | Open / 0 | open-zero-beds |
| `566448` | Open / 0 | open-zero-beds |

### Additions (NEW13 — still in qualifying 1,579)

| source_id | Beds |
| --- | --- |
| `0000000408` | 4 |
| `0000000708` | 5 |
| `0000000731` | 5 |
| `0000000733` | 4 |
| `8001946102` | 5 |

### Capacity / licensing drift

| source_id | Note |
| --- | --- |
| `11561` | Prior open-zero ledger → now Open / **4** beds (in qualifying set) |
| `523278` | Newly observed Open / **0** beds (not in qualifying 1–5 set) |

### Arithmetic residual

```
reconstructed_prior ≈ 1579 − 5 (NEW13) + 7 (LEAVE13) = 1581
stored prior directory = 1584
unresolved exact IDs without dump = 3
```

The stored `oregon_odhs_afh_public` source_id list was **not** available offline
(anon/SSO blocked). Full residual exact-ID closure needs an authorized
development DB read.

## Reversible integration controls

Defaults (`lib/oregon-tier1-street-integration.ts`):

- `streetIntegrationPrepared: true`
- `streetIntegrationActivated: false`
- `directoryRowReplacementAuthorized: false`
- `oregonPublished: false`
- `mapEnabled: false`
- `supabaseWrites: false`
- `geocodingEnabled: false`

`activateOregonTier1StreetIntegration` may flip only the prepared→activated street
field contract in memory; it never authorizes row replacement, publication, map,
writes, or geocoding. `rollbackOregonTier1StreetIntegration` restores defaults.

## CSV / Excel consistency

- Fixture marks `excel_accepted: true` on all 1,579 qualifying rows.
- Capture SHA-256 values match `oregon-export-date` constants.
- Regression test re-checks live `/tmp/oregon-exports` dual-format dry-run parity
  when those files are present (CI uses fixture + hash constants).

## Outstanding blockers (STOP)

1. Authoritative export freshness unresolved pending ODHS confirmation
2. Street integration prepared but not activated
3. Directory row replacement not authorized
4. Prior directory 1,584 source_id dump unavailable offline
5. State authorization remains development-only
6. Map disabled (separate)

## Out of scope / preserved

No production deployment, public activation, Supabase writes, geocoding,
authentication, or billing changes. Washington public, California unpublished /
Design 2, and Oregon host-gated development layout are unchanged.

## Fixtures

- `supabase/proposals/fixtures/oregon-tier1-street-integration/qualifying-1579.json`
- `supabase/proposals/fixtures/oregon-tier1-street-integration/reconciliation-summary.json`

## Next human actions

1. Confirm ODHS authoritative export freshness policy (do not invent ISO dates).
2. Authorize a development read of the stored 1,584 `source_id` list for residual closure.
3. Authorize `streetIntegrationActivated` only after freshness + residual IDs clear.
4. Keep directory row replacement and public Oregon publication as separate approvals.

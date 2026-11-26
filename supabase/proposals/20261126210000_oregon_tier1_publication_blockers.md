# Oregon Tier 1 — resolve remaining publication blockers (development-only)

## Verdict

**STOP** for Oregon public Tier 1 publication.

Street **source** coverage is verified complete on the 2026-11-26 ODHS CSV/Excel
capture. ODHS daily-update confirmation is recorded. No ISO export stamp is
adopted. Oregon stays development-only / unpublished to production hosts.

## What changed vs #223

| Gate | #223 | This package |
| --- | --- | --- |
| Dual-format download | CSV historical only | CSV + Excel captured 2026-11-26 |
| Street in ODHS Address | Assumed available; public withheld | **1,579/1,579** qualifying rows non-blank (0 blank) |
| Freshness | No ISO; 24h notice rejected as date | ODHS daily confirmation recorded; still **not** an ISO stamp |
| Excel parser | Self-closing empty cells shifted beds | Fixed; CSV↔Excel accepted parity **1,579** |
| Public publication | STOP | STOP (unchanged) |

## Capture evidence

- CSV: `Provider_Export_11-26-2026.csv` (686,792 bytes, SHA-256 `df843f71…`)
- Excel: `Provider_Export_11-26-2026.xlsx` (431,323 bytes, SHA-256 `036885f3…`)
- Qualifying Open AFH beds 1–5: **1,579** (stored directory remains **1,584**; not refreshed)
- Open AFH zero beds: **24** (stored exclusions remain **20**)

Filename / HTTP Date / 24-hour notice are **not** adopted as `recordedExportDate`.

## Outstanding blockers

1. No authoritative ISO export/version stamp (daily confirmation ≠ ISO)
2. Street still withheld from public columns (source gate cleared)
3. Map disabled (separate)
4. State authorization remains development-only

## Out of scope

No Oregon public flip. No Washington / California / Design 2 / auth / billing /
production changes. No Supabase row refresh. No merge or deploy from the agent.

# Oregon adult foster home ingestion proposal

This proposal validates the official ODHS export. It does not download, store, or publish Oregon facility records.

## Source and scope

- Source: https://ltclicensing.oregon.gov/Providers
- Export: the ODHS CSV or Excel file with the fixed 13-column header.
- Accepted rows: `Type` is exactly `AFH` and `Status` is exactly `Open`.
- Public license label: `Oregon adult foster home`.
- Washington adult family homes are a different license and are not used for these rows.

## Public fields

An accepted row may later expose only:

- facility name
- city
- county
- license type
- status
- licensed beds
- official ODHS profile link, formed as `https://ltclicensing.oregon.gov/Providers/Details/` plus the preserved source ID

Street address, ZIP, phone, email, Medicaid, memory-care flag, vacancy, inspection reports, and resident information are not accepted output.

## Validation

- The header must match the official names and order. A mismatch accepts nothing.
- The source ID is kept as text, including leading zeros. It must be 1–32 letters or digits.
- The same source ID twice makes the dry run unacceptable and omits both rows.
- Licensed beds for an accepted home must be a whole number from 1 through 5. Zero, decimals, and larger numbers are rejected.
- Other license types and homes that are not Open are counted and omitted. They do not become Washington records.
- `lib/oregon-odhs-roster.ts` performs this dry run in memory. `persists_records`, `refresh_activated`, `audit_activated`, and `rollback_activated` are false.

## Inactive procedures

- Refresh: a later authorized run may replace only the Oregon adult-foster-home public set from a new acceptable dry run. No download or replacement is implemented.
- Audit: a later authorized run may record the export time, byte count, and SHA-256 before a load. No audit row is written.
- Rollback: a later authorized load must keep the previous Oregon public set until the new set is committed. This proposal changes no database.

## Acceptance criteria

1. The official header is required in full and in order for both CSV and Excel.
2. An open adult foster home keeps its source ID and official profile link.
3. Address, phone, email, ZIP, vacancy, inspections, and resident information are absent from the result.
4. Residential care, assisted living, nursing facilities, and closed homes are excluded.
5. Capacity outside 1–5, a missing city, county, or name, or an unsafe source ID excludes that row.
6. A duplicate source ID makes the dry run unacceptable.
7. The license label is `Oregon adult foster home`.
8. Refresh, audit, and rollback remain inactive.

## Tests

`supabase/proposals/tests/oregon_odhs_roster.ts` uses synthetic fixture rows only.

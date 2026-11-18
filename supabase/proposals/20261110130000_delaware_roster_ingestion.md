# Delaware assisted-living roster pilot

This is a preparation record. It does not load Supabase, publish Delaware, or change Washington, Oregon, or North Carolina rows.

## Source choice

Delaware is the second pilot. The authoritative page is the Division of Health Care Quality list of licensed assisted living facilities: `https://dhss.delaware.gov/dhcq/dhcq/licensed-assisted-living-facilities/`. The issuer is the Delaware Department of Health and Social Services, Division of Health Care Quality.

The saved page has 39 accordion records. Each has a facility name, one Address value, and a numeric License #. All 39 license numbers are unique. All 39 addresses end in DE and a ZIP code. One Beds cell is blank. There is no licensing-status column and no export date. Survey labels are inspection reports, not a facility status. Operator website links are not an official facility-disclosure record. The page itself is one list, so disclosure stays `generic-search` and unverified.

The Address label does not say whether the value is physical or mailing. It is stored in `unverified_address` with provenance `listed-address`. It is not copied into `physical_address`.

Neighborhood homes are described by the developmental-disabilities division as a service setting, not as a licensed roster with identifiers. Skilled nursing is a separate DHCQ list and is outside this pilot. Oklahoma was not selected. Its directory exposes a facility id that was not confirmed as a license, and its file path year is not an export date.

## Mapping

| Source | Roster field |
| --- | --- |
| License # | `license_identifier`, type `license` |
| Assisted-living list and license | `source_record_id` |
| Page issuer | Delaware Department of Health and Social Services, Division of Health Care Quality |
| Accordion heading | `facility_name` |
| Address | `unverified_address`, provenance `listed-address` |
| Page category | `original_category` Licensed Assisted Living Facility |

`official_export_date`, `original_status`, and `physical_address` stay null. `freshness_verified` and `disclosure_verified` stay false. Coordinates stay absent. `publication` is `unpublished`. The batch id is `delaware-dhcq-assisted-living-pilot-20261110`.

## Counts

| Result | Count | Evidence |
| --- | --- | --- |
| Accepted | 39 | Unique numeric license, facility name, and Delaware ZIP address |
| Rejected | 0 | No blank license, duplicate license, or non-Delaware address on the saved page |
| Unresolved address role | 39 | The label is Address, so the value is not stored as physical |
| Unresolved official export date | 39 | The page has no export date |
| Unresolved per-row status | 39 | The page has no status column |
| Unresolved facility-specific disclosure | 39 | The official record is one list page |
| Public rows | 0 | The load writes `unpublished` only |

## Safeguards

`scripts/nationwide/delaware_roster.py` loads accepted rows in one transaction. A repeated batch inserts nothing. A changed row rolls the transaction back. The default guard refuses every host except localhost.

`scripts/nationwide/delaware_development_adapter.py` is separate. It requires `NCHF_DE_DEVELOPMENT_EXECUTION` and an explicit target. It refuses a production host. It was not run against Supabase.

`supabase/proposals/20261110130000_delaware_roster_ingestion_ROLLBACK.sql` deletes only unpublished Delaware rows with the Delaware batch id. A North Carolina batch and every other state remain.

## Disposable validation

PostgreSQL 17 on `127.0.0.1` created the roster only inside the disposable database, added the batch column there, and ran the adapter. The synthetic row repeated without a duplicate, a changed name rolled back, and Delaware rollback left a North Carolina batch row, a Washington row, and an Oregon row in place. Washington and Oregon stand-in views were unchanged. No privilege was added for any role other than the local table owner. The saved official page produced `DE_OFFICIAL_READY 39 0 39` and `DELAWARE_ROSTER_PILOT_READY`. The cluster was removed.

## Outstanding risks

Development already contains 1,086 unpublished North Carolina rows. This pilot does not write to that database. A later development run still needs a separate authorization, and a session setting does not prove which database is connected. Delaware addresses are not verified as physical. Status, export date, and facility-specific disclosure remain absent, so the rows cannot be published. Delaware has no directory or map route.

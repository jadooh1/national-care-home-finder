# North Carolina roster ingestion pilot

This is a preparation record. It does not load Supabase, publish North Carolina, or change Washington or Oregon.

## Development roster inspection

Read-only session on the development pooler, login `postgres.ajjsyloyihcqdomywhik`, host `aws-1-us-west-2.pooler.supabase.com`. Inside the session, `current_user` is `postgres`. Migration `20261108221940` is present.

`public.nationwide_roster` exists, is owned by `postgres`, and has row level security enabled but not forced. It has no policies. The table has the proposal columns and the named checks for state, identifier type, certification versus license, address provenance, freshness, disclosure, classification, coordinates, and publication. The four partial unique indexes are present. `information_schema.role_table_grants` lists privileges only for `postgres`. `anon`, `authenticated`, and `service_role` are not grantees. `service_role` still has `rolbypassrls`, which does not by itself grant table access. The table has 0 rows. No `schema_migrations` row matched a nationwide name or a version at or after `20261110000000`.

The disposable test recreates that table from `supabase/proposals/20261110090000_nationwide_roster_development.sql`. That file remains a proposal. It refuses to run without its own authorization, and it refuses to run when the table already exists. This pilot does not execute it on Supabase.

## Source mapping

The previously saved official workbooks are the adult care home workbook and the family care home workbook from the Division of Health Service Regulation listings. They were not committed. Each title says the workbook is as of 10/2026. That label is not an ISO export date and is not stored. The listings-page label 10/28/2026 is also not stored. Expiry dates and star ratings are not a licensing status and are not stored.

| Source column | Roster field |
| --- | --- |
| License # | `license_identifier`, identifier type `license` |
| Workbook and license | `source_record_id` |
| Workbook issuer | North Carolina Department of Health and Human Services, Division of Health Service Regulation |
| DBA Name | `facility_name` |
| Site Address, Site City, Site State, Site Zip | `physical_address`, provenance `site-address` |
| Facility Address, Facility Address 2, Facility City, Facility State, Facility Zip | `mailing_address`, provenance `facility-address`, only when the text differs from the physical address |
| Workbook category | `original_category` of Adult Care Home or Family Care Home |

A facility address is never copied into the physical address. Adult facility-address states on the licensed rows are NC 526, SC 7, FL 5, GA 4, NJ 4, TX 3, WA 3, KY 3, OH 3, VA 2, CA 2, AZ 2, MD 1, and TN 1. Family facility-address states are NC 506, VA 7, and FL 7. Every accepted physical site state is NC.

Missing values stay null: `official_export_date`, `source_publication_date`, `retrieval_timestamp`, `original_status`, and `normalized_status`. `freshness_verified` is false. Disclosure is the generic star-rating search, `generic-search`, with `disclosure_verified` false. There is no facility-specific disclosure. Coordinates stay absent. `publication` is `unpublished`.

## Expected results

The workbooks contain 1,088 nonempty body rows.

| Result | Count | Evidence |
| --- | --- | --- |
| Accepted | 1,086 | 566 `HAL` adult care home licenses and 520 `FCL` family care home licenses. All 1,086 licenses are unique, and every accepted row has a facility name and a North Carolina site address. |
| Rejected | 2 | One unlabeled cell in each workbook, with no license, facility name, or site address. Reason: `not-a-facility-record`. |
| Unresolved official export date | 1,086 | The workbook label is not an ISO export date, so `official_export_date` is null. |
| Unresolved per-row status | 1,086 | Neither workbook has a status column, so `original_status` is null. |
| Unresolved facility-specific disclosure | 1,086 | The star search does not take a license number. Disclosure stays `generic-search` and unverified. |
| Public rows | 0 | The load writes `unpublished` only. North Carolina has no directory path. |

Of the accepted rows, 902 keep a distinct facility address as the mailing address. 184 facility addresses are omitted because the composed text is the same as the physical site address.

## Ingestion and rollback

`scripts/nationwide/north_carolina_roster.py` validates the local file, then loads accepted rows in one transaction. A repeated load inserts nothing and reports the rows already present. A changed existing row raises a conflict and rolls the transaction back. The script refuses a host other than localhost. It does not create roles or add privileges.

`supabase/proposals/20261110110000_north_carolina_roster_ingestion_ROLLBACK.sql` deletes only unpublished North Carolina rows. It refuses to run without `nchf.north_carolina_roster_rollback_authorization`. It leaves other states in place. A session setting is not proof of which database is connected.

## Disposable validation

PostgreSQL 17 on `127.0.0.1` validated the synthetic load, the idempotent repeat, the conflict rollback, the Washington row remaining after North Carolina rollback, unchanged stand-in Washington and Oregon views, and no privileges for any role other than the local table owner. The same run then loaded the official workbooks: 1,086 inserted, the repeat was already present, no public rows, and rollback removed only North Carolina. The validator printed `NC_OFFICIAL_READY 1086 2 902 184` and `NORTH_CAROLINA_ROSTER_PILOT_READY`. The cluster was removed. Supabase was not loaded.

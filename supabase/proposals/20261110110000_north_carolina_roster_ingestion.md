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

## Batch identifier

Development's existing `nationwide_roster` table has no batch column. `supabase/proposals/20261110120000_nationwide_roster_ingestion_batch.sql` proposes adding nullable `ingestion_batch_id`. It does not create the table, load rows, or add privileges. It is not applied. Its rollback drops the column only when no row has a batch id.

The pilot batch id is `north-carolina-dhhs-roster-pilot-20261110`. Every inserted pilot row stores that value. A repeated load of the same batch inserts nothing. A changed row, or the same license already stored under another batch, rolls the transaction back.

## Ingestion and rollback

`scripts/nationwide/north_carolina_roster.py` remains localhost-only unless a caller supplies another guard. It does not create roles or add privileges.

`scripts/nationwide/north_carolina_development_adapter.py` is the separate execution path. It runs only when `NCHF_NC_DEVELOPMENT_EXECUTION` is `authorize-development-north-carolina-roster-execution` and `NCHF_NC_EXECUTION_TARGET` is either `disposable` on localhost or `development` on `aws-1-us-west-2.pooler.supabase.com` as `postgres.ajjsyloyihcqdomywhik`. It refuses a production host. It was exercised on disposable PostgreSQL and was not run against Supabase.

`supabase/proposals/20261110110000_north_carolina_roster_ingestion_ROLLBACK.sql` deletes only unpublished North Carolina rows with the pilot batch id. Another North Carolina batch and every other state remain.

## Execution procedure

Do not run this until a person authorizes the development load itself.

1. Confirm the development server by its host, login, and migration `20261108221940`. Confirm `public.nationwide_roster` already exists. Do not recreate it.
2. In that confirmed session, set `nchf.nationwide_roster_batch_authorization` to `authorize-development-nationwide-roster-batch` and run the batch-column proposal. Confirm the column exists and that table privileges are unchanged.
3. Set `NCHF_NC_DEVELOPMENT_EXECUTION` and `NCHF_NC_EXECUTION_TARGET=development`, using the development pooler environment, then run the adapter against the local adult and family workbooks.
4. Expect 1,086 inserted rows, 2 rejected non-records, 902 mailing addresses, 184 omitted duplicate addresses, batch `north-carolina-dhhs-roster-pilot-20261110`, and no public rows.
5. A second run expects 0 inserted and 1,086 already present.
6. To undo it, set `nchf.north_carolina_roster_rollback_authorization` to `authorize-development-north-carolina-roster-rollback` and run the batch rollback. A session setting does not prove which database is connected.

## Disposable validation

PostgreSQL 17 on `127.0.0.1` applied the table proposal and the unapplied batch-column proposal. The adapter inserted the synthetic pilot batch, treated a repeat as already present, and rolled back a changed row without altering the stored name. Rollback removed only the pilot batch. An unrelated North Carolina row, a Washington row, and an Oregon row remained. Washington and Oregon stand-in views were unchanged. No privilege was added for any role other than the local table owner. The column rollback refused while a batch id was present. The official workbooks still produced `NC_OFFICIAL_READY 1086 2 902 184` and `NORTH_CAROLINA_ROSTER_PILOT_READY`. The cluster was removed. Supabase was not changed.

## Outstanding risks

The batch column is not on the development table yet, so the adapter cannot load development until that proposal is authorized and applied. The roster table is still absent from `schema_migrations`. `service_role` bypasses row security but has no table privilege. Official export date, per-row status, and facility-specific disclosure remain unresolved, so the rows stay unpublished. North Carolina has no directory or map route.

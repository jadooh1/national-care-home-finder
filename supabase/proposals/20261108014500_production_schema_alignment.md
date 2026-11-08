# Production schema alignment proposal

This change is a proposal. It was not applied to production or development.

## Verified production baseline

PostgreSQL 17.11 on project `yiehgstweswxjakbcdzc`: 8,121 facilities, 0 owner claims, 0 listing edits, 1 administrator, no `facilities.presence` column, no `submit_owner_claim(uuid, text)`, and one facilities SELECT policy named `Public read verified facilities` with predicate `record_status = 'verified'`. Verified and source-matched facilities are both 0.

Development row counts are not production expectations. The development directory count of 6,278 is not used.

Read-only inspection of the existing production views:

- `wa_dshs_listed_facilities` selects id, name, address, city, county, state, ZIP, license, capacity, and record status. It keeps Washington rows whose facility type is `AF` and whose trimmed license number matches `wa_dshs_license_comparison`. Its view option is `security_barrier=true`.
- `wa_afh_map_facilities` joins that directory view to `facilities` by id, adds latitude and longitude, and keeps latitude 45–50 and longitude −125 to −116.
- Both views grant `SELECT` to `anon`, `authenticated`, `service_role`, and `postgres`.

The proposal wraps those definitions. It does not replace them with the development source-matched views.

## What the proposal adds

On that baseline, one transaction adds nullable columns the reviewed policies need when they are absent: `presence`, `source_name`, `license_category`, `facility_type`, and `normalized_license_number` on `facilities`, plus `owner_claims.reviewed_at` and the listing-edit timestamps. It keeps `Public read verified facilities` and appends `presence is distinct from 'absent'`. It adds `facilities_public_read_wa_afh_source_matched` for anonymous and authenticated readers, and creates `submit_owner_claim(uuid, text)` for authenticated users. It does not write values into existing facility rows.

Existing `wa_dshs_listed_facilities` and `wa_afh_map_facilities` views keep their columns, options, and grants. Each definition gains a join that excludes `presence = 'absent'`. Current rows stay visible because the new presence values are null. The original definitions are stored for rollback. Views are created only when they are absent.

The post-check requires 8,121 facilities, 0 claims, 0 edits, 1 administrator, 0 verified, 0 source-matched, no presence values, and the same directory and map membership as before the transaction.

## What it leaves unchanged

It does not import facilities, delete rows, or change `record_status`. It does not replay Phase 5C through Phase 5I. It does not create market relations. A second run is a no-op when the aligned catalog and the audit row are already present.

## Backup

Before any later execution, a human takes a schema-only dump and a data dump of `facilities`, `owner_claims`, `listing_edits`, and `app_admins`, plus the facilities policy definitions. The transaction also stores the original verified predicate. This repository does not contain those dumps.

## Rollback

`20261108014500_production_schema_alignment_ROLLBACK.sql` restores the saved verified predicate and the saved directory and map definitions. It drops the policy, function, event table, and columns this proposal added. It stops if any facility, claim, edit, administrator, status, or presence value differs from the baseline, or if claim history exists.

## Execution stop conditions

The transaction stops if the project setting is not `yiehgstweswxjakbcdzc`, if the counts differ, if an unreviewed facilities policy exists, or if row level security or browser grants differ from the reviewed state. It also stops if an existing directory or map view does not read `facilities` or has no `id` column.

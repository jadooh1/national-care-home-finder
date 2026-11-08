# Production schema alignment proposal

This change is a proposal. It was not applied to production or development.

## Verified production baseline

PostgreSQL 17.11 on project `yiehgstweswxjakbcdzc`: 8,121 facilities, 0 owner claims, 0 listing edits, 1 administrator, no `facilities.presence` column, no `submit_owner_claim(uuid, text)`, and one facilities SELECT policy named `Public read verified facilities` with predicate `record_status = 'verified'`. Verified and source-matched facilities are both 0.

Development row counts are not production expectations. The development directory count of 6,278 is not used.

## What the proposal adds

On that baseline only, one transaction:

- adds nullable `facilities.presence` and a check for null, `active`, or `absent`, without writing a value onto existing rows
- keeps `Public read verified facilities` and appends `presence is distinct from 'absent'`
- adds `facilities_public_read_wa_afh_source_matched` for anonymous and authenticated readers, including the same presence exclusion
- creates `submit_owner_claim(uuid, text)` for authenticated users, excluding archived and ineligible facilities
- creates an empty `owner_claim_events` table when it is absent
- creates `wa_dshs_listed_facilities` and `wa_afh_map_facilities` only when both views are absent
- records the original verified predicate and the baseline counts in `nchf_production_schema_alignment_audit`

The post-check requires 8,121 facilities, 0 claims, 0 edits, 1 administrator, 0 verified, 0 source-matched, no presence values, and directory and map counts of 0.

## What it leaves unchanged

It does not import facilities, delete rows, or change `record_status`. It does not replay Phase 5C through Phase 5I. Those files are not idempotent and were not written for this production baseline. It does not create market relations. It does not replace a directory or map view that already exists. A second run is a no-op when the aligned catalog and the audit row are already present.

## Backup

Before any later execution, a human takes a schema-only dump and a data dump of `facilities`, `owner_claims`, `listing_edits`, and `app_admins`, plus the facilities policy definitions. The transaction also stores the original verified predicate. This repository does not contain those dumps.

## Rollback

`20261108014500_production_schema_alignment_ROLLBACK.sql` restores the saved verified predicate and drops the policy, function, views, event table, presence column, and audit table added by the proposal. It stops if any facility, claim, edit, administrator, status, or presence value differs from the baseline, or if claim history exists.

## Execution stop conditions

The transaction stops if the project setting is not `yiehgstweswxjakbcdzc`, if the counts differ, if an unreviewed facilities policy exists, if row level security or browser grants differ from the reviewed state, or if either family view already exists. Those stops require a separate decision. They are not permission to change production in this pull request.

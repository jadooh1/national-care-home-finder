# Nationwide ingestion framework

This proposal documents a shared loader for unpublished roster pilots. It does not change a database, grant a privilege, or publish a state.

The shared engine is `scripts/nationwide/roster_ingestion.py`. North Carolina and Delaware keep their own parsers and field mapping. Both call the same batch, conflict, identity, and rollback functions.

## Dependency order

Draft pull request #68 prepared the North Carolina pilot. Draft pull request #69 prepared the Delaware pilot on top of that work. This change follows both and does not merge either.

Development already holds 1,125 unpublished roster rows: 1,086 North Carolina and 39 Delaware. Public roster rows remain 0. Washington remains 6,278 listed and 6,278 mapped. Oregon remains 1,584 listed. This pull request does not write those rows again.

## Shared behavior

- A load runs in one transaction. A conflict or a tally mismatch raises an exception before commit, so the failed statement does not leave a partial batch.
- A repeated load of the same license, authority, and payload counts as already present and inserts nothing.
- A different facility name, address, provenance, category, batch, disclosure, publication, or coordinate source is a conflict. The stored row stays as it was.
- Unknown official export dates, licensing statuses, and facility-specific disclosures stay null or unverified. A generic search page is not treated as a verified disclosure.
- An unverified listed address is not copied into the physical address.
- Rollback deletes only unpublished rows for the named state and batch. Removing Delaware does not remove North Carolina.
- Every development import and rollback runs the identity preflight before a write. The preflight is part of the load itself, so an adapter cannot skip it.
- The development connection must be the development pooler host `aws-1-us-west-2.pooler.supabase.com`, port 5432, database `postgres`, login `postgres.ajjsyloyihcqdomywhik`, and `verify-full` TLS. The production host `us-west-1` and the production project login are refused before a connection is used for a write.
- The session check then requires `current_database()` and `current_user` to be `postgres`, migration `20261108221940` named `development_oregon_directory`, and the roster batch column. Session settings are not treated as proof of the database.
- Approved counts live in `supabase/proposals/baselines/20261110.1-development-roster.json`. The preflight reads that manifest and compares roster batches, publication, issuing authority, and protected directory counts. An import does not rewrite the file. Adding a state means adding one batch object and adjusting the totals in a reviewed manifest change. The shared engine does not need a new count constant for that state.
- The engine does not create roles and does not grant privileges.

## Validation

`supabase/proposals/tests/validate_roster_framework.py` applies the existing roster and batch proposals to disposable PostgreSQL, then loads both pilots. It checks a repeat import, a conflicting record, rollback isolation, and rejection of an unauthorized target. Official North Carolina workbooks and the Delaware HTML snapshot are included only when their local paths are supplied. Those files are not committed.

`supabase/proposals/tests/validate_development_identity.py` checks the session preflight on disposable PostgreSQL: the wrong database name, a missing migration, manifest mismatches, a new-state candidate that leaves the approved file unchanged, a repeated compatible import, and Delaware rollback isolation. It does not connect to Supabase. Unit tests cover a production target and a development import that has no authorization; both raise before a query is sent.

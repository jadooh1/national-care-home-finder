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
- The default database guard accepts only localhost. A development target is accepted only for the development pooler host and login, and only after the development migration marker, roster table, and batch column are present. Production host `us-west-1` and the production project login are refused.
- The engine does not create roles and does not grant privileges.

## Validation

`supabase/proposals/tests/validate_roster_framework.py` applies the existing roster and batch proposals to disposable PostgreSQL, then loads both pilots. It checks a repeat import, a conflicting record, rollback isolation, and rejection of an unauthorized target. Official North Carolina workbooks and the Delaware HTML snapshot are included only when their local paths are supplied. Those files are not committed.

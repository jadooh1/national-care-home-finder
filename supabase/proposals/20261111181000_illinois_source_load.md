# Illinois source load

Review plan only. This file does not authorize a database change.

The table proposal is `20261111180000_nationwide_source_record.sql`. The batch rollback is `20261111181000_illinois_source_rollback.sql`. The empty-table rollback is `20261111180000_nationwide_source_record_ROLLBACK.sql`. None of these files has been executed.

## Development changes that require a later authorization

1. On the development project only, set `nchf.nationwide_source_record_authorization` to `authorize-development-nationwide-source-record` and run the table proposal. The proposal refuses to run unless North Carolina remains 1,086, Delaware remains 39, public roster rows remain 0, both Washington relations remain 6,278, and Oregon remains 1,584.
2. Load the 502 Illinois source rows into `public.nationwide_source_record` with batch `illinois-idph-assisted-living-20261028`, extraction date `2026-10-28`, and SHA-256 `de048fc9f80c73615831dffedc01474c07c0cb59c8952e92d653f3f1727b907a`. `scripts/nationwide/illinois_source_loader.py` prepares that transaction. `dry_run` checks the workbook and refuses a batch that is already present. `execute` has no database connection of its own. A later authorization must set `NCHF_IL_EXECUTION_TARGET` to `development`, set `NCHF_IL_DEVELOPMENT_EXECUTION` to `authorize-development-illinois-source-load`, and pass an explicit development runner. The transaction checks the baselines, inserts only `nationwide_source_record`, and raises before commit unless the loaded batch is 502 unpublished rows with 17 expiration flags. If those checks fail, the transaction rolls back. The Illinois batch rollback remains the way to remove a committed batch.
3. Leave `public.nationwide_roster` unchanged. The existing pilot ingest still stores a null export date and still rejects a supplied date.
4. To remove the batch, set `nchf.illinois_source_rollback_authorization` to `authorize-development-illinois-source-rollback` and run the Illinois rollback. It deletes only unpublished Illinois rows in that batch, and only after the same baseline checks.
5. To drop the empty table, set `nchf.nationwide_source_record_rollback_authorization` to `authorize-development-nationwide-source-record-rollback` and run the table rollback.

## Row contents

Every candidate, including the 17 rows flagged `expiration-precedes-extract`, has `publication` `unpublished`. `original_status` and `normalized_status` stay null. The table constraint allows no other publication value and no assigned status. Facility ID and Licensee ID stay together in `original_identifiers`. The remaining official fields stay in `source_attributes`. Provenance is `DPH 26-2017`.

# Illinois source load

The development table proposal and the one-time source load have been executed. The rollback files have not.

The table proposal is `20261111180000_nationwide_source_record.sql`. The batch rollback is `20261111181000_illinois_source_rollback.sql`. The empty-table rollback is `20261111180000_nationwide_source_record_ROLLBACK.sql`.

## Development load verification

The approved transaction committed on development project `ajjsyloyihcqdomywhik` at loader commit `ca6ebc7`. The pre-load batch count was 0. The result was `INSERT 0 502` and `COMMIT`.

Independent verification after commit:

| Check | Result |
| --- | ---: |
| Illinois source rows | 502 |
| `expiration-precedes-extract` flags | 17 |
| Rows with a license status | 0 |
| Rows whose publication is not `unpublished` | 0 |
| Checksum or extraction-date mismatches | 0 |
| National roster rows | 1,125 |
| Public roster rows | 0 |
| North Carolina | 1,086 |
| Delaware | 39 |
| Washington directory and map | 6,278 each |
| Oregon directory | 1,584 |

The loader inserts only the columns in `SOURCE_RECORD_COLUMNS`. That insert committed, so the deployed table accepts the proposed projection. The transaction checks that the Illinois batch count is 0 before inserting. A second execution raises and rolls back, so it cannot add another copy. `nationwide_roster` was not modified.

## Publication readiness

Illinois stays unpublished. The source table accepts only `unpublished`, and both license-status columns must stay null. No directory or map route is open.

A later publication review requires all of the following:

- IDPH confirms the current license status of every Illinois record, including the 17 records flagged `expiration-precedes-extract`.
- That confirmed status is recorded through a later, separately authorized change. This table cannot store it.
- Facility-specific disclosure and source freshness are verified.
- Listed addresses remain unverified until a separate address review.
- Public roles remain without privileges on `nationwide_source_record`.

## Rollback

Both rollback files remain unauthorized. The batch rollback is the one that can remove the 502 rows. The empty-table rollback refuses while those rows remain. Either rollback still requires its own development authorization and the same Washington, Oregon, North Carolina, and Delaware baseline checks.

## Row contents

Every candidate, including the 17 rows flagged `expiration-precedes-extract`, has `publication` `unpublished`. `original_status` and `normalized_status` stay null. The table constraint allows no other publication value and no assigned status. Facility ID and Licensee ID stay together in `original_identifiers`. The remaining official fields stay in `source_attributes`. Provenance is `DPH 26-2017`.

# Nationwide 50-state compatibility audit

This is a read-only assessment. It does not ingest records, change a database, add a migration, or publish a state. Washington, Oregon, California, Michigan, and Pennsylvania keep their existing records. Missing coordinates do not by themselves make a directory incompatible.

Class A fits a directory contract that already exists. Class B can fit after a named structural adjustment. Class C has a major source-data or matching limitation. Class D does not have enough verified field evidence. Schema class is separate from publication. Only Washington is publication-ready.

## Matrix

| State | Class | Publication | Rows | License | Address | Status | Disclosure | ISO date | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alabama | C | unpublished | — | no | not verified | not verified | not verified | no | medium |
| Alaska | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Arizona | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Arkansas | C | unpublished | — | no | yes | not verified | not verified | no | medium |
| California | B | unpublished | 23020 | yes | yes | yes | no | no | high |
| Colorado | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Connecticut | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Delaware | B | unpublished | — | yes | yes | no | no | no | medium |
| Florida | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Georgia | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Hawaii | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Idaho | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Illinois | B | unpublished | 495 | yes | yes | no | no | no | high |
| Indiana | B | unpublished | — | yes | yes | no | no | no | medium |
| Iowa | B | unpublished | 335 | no | yes | no | no | no | high |
| Kansas | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Kentucky | B | unpublished | — | yes | yes | no | no | no | high |
| Louisiana | C | unpublished | — | no | yes | not verified | not verified | no | medium |
| Maine | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Maryland | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Massachusetts | C | unpublished | — | no | no | not verified | not verified | no | medium |
| Michigan | C | unpublished | 4480 | yes | no | yes | yes | no | high |
| Minnesota | C | unpublished | — | not verified | not verified | not verified | yes | no | high |
| Mississippi | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Missouri | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Montana | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Nebraska | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Nevada | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| New Hampshire | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| New Jersey | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| New Mexico | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| New York | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| North Carolina | B | unpublished | 1086 | yes | yes | no | no | no | high |
| North Dakota | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Ohio | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Oklahoma | B | unpublished | — | yes | yes | no | no | no | high |
| Oregon | A | development | 1584 | no | no | yes | yes | no | high |
| Pennsylvania | C | unpublished | 989 | no | yes | no | no | no | high |
| Rhode Island | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| South Carolina | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| South Dakota | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Tennessee | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Texas | C | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Utah | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Vermont | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Virginia | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Washington | A | public | 6278 | yes | yes | yes | yes | yes | high |
| West Virginia | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Wisconsin | C | unpublished | — | not verified | not verified | not verified | not verified | no | high |
| Wyoming | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |

Counts: A 2, B 8, C 19, D 21.

## Verified source inventory

Washington uses the DSHS adult family home listing, 6,278 rows, numeric license, address, status, beds, coordinates, disclosure link, and source date 2026-11-09. Oregon uses the ODHS provider export, 1,584 listed homes, source id, city, county, status, beds, and profile link. It has no public license number, street, ZIP, coordinates, or export date. California’s two files total 23,020 rows. Michigan’s file has 4,480 rows, a license, status, and a verified profile prefix, with most streets blank. Pennsylvania’s file has 989 rows and no license or status column.

North Carolina’s workbooks have 1,086 unique licenses and site addresses. Iowa’s file has 335 certification numbers and addresses. Illinois’s open-data listing has 495 licensed establishments with addresses; its portal time 2024-02-16 is not an export date, and 169 state values are blank. Kentucky’s PDF and Oklahoma’s PDF expose license or facility id, address, and capacity. Indiana’s HTML directory, posted 11/5/2026, and Delaware’s HTML listing expose license number and address. No row count was adopted for Kentucky, Oklahoma, Indiana, or Delaware.

The remaining C and D rows use only the source named in `lib/nationwide-compatibility.ts`. A dated file or search page without opened columns stays D. A search, mixed file, unreconciled pair of sources, or missing license or address stays C.

## Common limitations

- Status is often an expiration date, a page title, or absent. Those are not a per-row licensing status.
- A catalog timestamp, workbook month, path year, or “updated” label is not an ISO export date.
- Disclosure is often a search page rather than a facility prefix.
- Identifier shape differs: numeric license, alphanumeric license, certification number, object id, or an unverified provider number.
- HTML directories and generated spreadsheets are not stable delimited files.
- Mixed facility files and unreconciled PDF/GIS pairs cannot be matched without a new rule.
- Coordinates are optional for a directory. They matter only for a map.

## Proposed schema

Do not apply this. Add a later development-only roster contract beside the Washington and Oregon views. Suggested columns: state, source credential id as text, credential kind, category label, facility name, nullable site address, city, postal state, postal code, county, nullable capacity, nullable status text, nullable disclosure URL, source URL, nullable export date, nullable coordinates, and a coordinate source of licensing, georeferenced, or absent. Publication stays a separate control and defaults to unpublished.

Backward compatibility: do not alter `wa_dshs_listed_facilities`, `wa_afh_map_facilities`, or `or_odhs_listed_afh`, and do not change `/washington` or `/oregon`. Washington’s numeric license path and Oregon’s source-id path remain as they are.

Migration, when a person later approves a non-production change: create the new table only, load no production rows, and keep every new state unpublished. Tests should prove the existing Washington and Oregon counts and routes still match. Rollback is dropping that new table. This proposal contains no executable migration.

## Order and phases

Keep Washington public and Oregon on its development contract. The next structural candidates, still unpublished, are Illinois, North Carolina, Kentucky, and Oklahoma, then Indiana and Delaware once an HTML parser is specified, then California and Iowa once credential and status mapping is specified. Michigan, Pennsylvania, Wisconsin, and Minnesota stay behind their recorded blockers. Class D states need an official field check before any build.

Phase 1 is this assessment. Phase 2 is review of the additive roster shape. Phase 3 is one development-only state after a person approves the schema. No phase publishes a state, changes billing, or changes public analytics.

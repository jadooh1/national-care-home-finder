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
| Indiana | B | unpublished | 225 | yes | yes | no | no | no | high |
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
| Missouri | C | unpublished | 1102 | yes | yes | no | no | no | high |
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
| Texas | C | unpublished | 2016 | yes | yes | yes | no | no | high |
| Utah | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Vermont | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Virginia | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Washington | A | public | 6278 | yes | yes | yes | yes | yes | high |
| West Virginia | D | unpublished | — | not verified | not verified | not verified | not verified | no | medium |
| Wisconsin | C | unpublished | — | not verified | not verified | not verified | not verified | no | high |
| Wyoming | C | unpublished | — | yes | no | no | no | no | high |

Counts: A 2, B 8, C 21, D 19.

## Verified source inventory

Washington uses the DSHS adult family home listing, 6,278 rows, numeric license, address, status, beds, coordinates, disclosure link, and source date 2026-11-09. Oregon uses the ODHS provider export, 1,584 listed homes, source id, city, county, status, beds, and profile link. It has no public license number, street, ZIP, coordinates, or export date. California’s two files total 23,020 rows. Michigan’s file has 4,480 rows, a license, status, and a verified profile prefix, with most streets blank. Pennsylvania’s file has 989 rows and no license or status column.

North Carolina’s workbooks have 1,086 unique licenses and site addresses. Iowa’s file has 335 certification numbers and addresses. Illinois’s open-data listing has 495 licensed establishments with addresses; its portal time 2024-02-16 is not an export date, and 169 state values are blank. Kentucky’s PDF and Oklahoma’s PDF expose license or facility id, address, and capacity. Indiana’s HTML directory, posted 11/5/2026, has 225 facilities and a unique license number on each. That posted date is not an ISO export date, and the page has no status or facility disclosure link. Missouri’s DHSS long-term care directory has 1,102 rows, a license number, an address column, separate mailing columns, and capacity. Its facility numbers and license numbers are not unique, it mixes residential, assisted-living, and nursing levels, and its catalog time is not an export date. Wyoming’s November 2026 workbook was opened and mixes facility classes; no facility count was adopted. Texas’s active assisted-living workbook has 2,016 rows, a unique facility id, a unique license number, a physical address, and capacity. Its as-of label 11/12/2026 is not an ISO export date, and the TULIP detail route cannot be built from those identifiers. Delaware’s HTML listing exposes license number and address. No row count was adopted for Kentucky, Oklahoma, Delaware, or Wyoming.

The remaining C and D rows use only the source named in `lib/nationwide-compatibility.ts`. A dated file or search page without opened columns stays D. A search, mixed file, unreconciled pair of sources, or missing license or address stays C.

## Common limitations

- Status is often an expiration date, a page title, or absent. Those are not a per-row licensing status.
- A catalog timestamp, workbook month, path year, or “updated” label is not an ISO export date.
- Disclosure is often a search page rather than a facility prefix.
- Identifier shape differs: numeric license, alphanumeric license, certification number, object id, or an unverified provider number.
- HTML directories and generated spreadsheets are not stable delimited files.
- Mixed facility files and unreconciled PDF/GIS pairs cannot be matched without a new rule.
- Coordinates are optional for a directory. They matter only for a map.

## Field evidence

The matrix above is the state classification. Field evidence is recorded separately on each state in `lib/nationwide-compatibility.ts`. A field is `present`, `absent`, `rejected`, or `not-verified`, and each field has its own confidence. `not-verified` is low confidence. State class and publication do not change because a field is not verified.

Already recorded distinctions:

- Washington keeps a license, a physical address, licensing coordinates, a facility-specific disclosure link, and the official export date 2026-11-09.
- Oregon keeps a source id, not a public license. Its directory has no physical address and no coordinates, and its profile link is facility-specific. There is no official export date.
- California, Michigan, Illinois, Kentucky, Indiana, Delaware, and North Carolina have license identifiers. Oklahoma’s identifier is a facility id. Iowa’s identifier is a certification number. Pennsylvania’s object id is a source record id and is rejected as a regulatory identifier.
- Illinois, Kentucky, Oklahoma, Indiana, and Delaware have an address column whose role was not established. That value stays an unverified address. Missouri’s address column is separate from its mailing columns and is still not labeled physical. North Carolina’s site address, Iowa’s facility address, California’s licensing address, Pennsylvania’s street, and Washington’s street stay physical. Michigan’s supplemental column is rejected as a physical or mailing address. Wyoming’s workbook puts the name and physical address in one column, so no separate physical address was adopted.
- A portal time, catalog timestamp, workbook label, posted date, or path year is a retrieval timestamp or a source publication date. It is not an official export date and it does not verify freshness.
- Washington, Oregon, and Michigan have verified facility-specific disclosure links. North Carolina’s star search and the other state search pages are generic search pages. An unverified URL pattern is not a disclosure link.
- Original category and status stay beside any later normalized value. No normalized value is adopted in this proposal. Michigan’s undescribed category is not normalized.
- Coordinates stay optional. Washington’s are licensing coordinates. Pennsylvania’s and Iowa’s point fields are georeferenced and are rejected as licensing coordinates. No accuracy measure was adopted for any state.

## Proposed roster contract

Do not apply this. A later development-only roster contract would sit beside the Washington and Oregon views. One source row keeps these values separate:

| Group | Fields |
| --- | --- |
| Identity | Regulatory identifier, identifier type, issuing authority, and source record id |
| Address | Physical, mailing, supplemental, and unverified address values, each with provenance |
| Dates | Official export date, source publication date, retrieval timestamp, and freshness verification |
| Disclosure | Facility-specific link, generic search page, or unverified URL pattern |
| Classification | Original category, original status, optional normalized category, and optional normalized status |
| Location | Optional latitude and longitude, coordinate source, and coordinate accuracy |
| Publication | `public`, `development`, or `unpublished`, defaulting to unpublished |

Data-integrity rules reject an object id or certification stored as a license, a source record id collapsed into the regulatory identifier, a supplemental or unverified address copied into the physical address, an address with no provenance, a retrieval timestamp or non-ISO source publication date used as the official export date, freshness marked verified without an official export date, a normalized category or status without its original value, coordinates without a source or accuracy, and georeferenced coordinates used as a public map.

Publication safeguards: a row can be public only when publication is already `public`, the official export date is an ISO date, freshness is verified, and the disclosure kind is facility-specific. A generic search page or an unverified URL pattern cannot publish a row. A new state remains unpublished.

Backward compatibility: do not alter `wa_dshs_listed_facilities`, `wa_afh_map_facilities`, or `or_odhs_listed_afh`, and do not change `/washington` or `/oregon`. Washington’s numeric license path and Oregon’s source-id path remain as they are. The existing directory contracts stay the publication control. The new contract does not replace them.

The development-only SQL proposal is `supabase/proposals/20261110090000_nationwide_roster_development.sql`. It is not in `supabase/migrations`, it refuses to run without a later authorization, and it was not executed. A certification number is stored as a certification. It is not stored as a license. Rollback is `supabase/proposals/20261110090000_nationwide_roster_development_ROLLBACK.sql`, which drops only the new roster table.

Validation covers three groups. Data integrity covers the separations above. Publication safeguards cover the public-row rule. Backward compatibility covers the existing Washington and Oregon counts, routes, and the unchanged unpublished state of every other state.

## Order and phases

Keep Washington public and Oregon on its development contract. The next structural candidates, still unpublished, are Illinois, North Carolina, Kentucky, and Oklahoma, then Delaware once an HTML parser is specified, then California and Iowa once credential and status mapping is specified. Indiana’s 225-row directory stays unpublished until it has a per-row status, a facility disclosure link, and an ISO export date. Missouri stays unpublished: it still needs a per-row status, a facility disclosure link, an ISO export date, and a rule for rows that share a facility number or license number. Texas’s active workbook is the strongest assisted-living file verified so far and stays unpublished. Its as-of label is not an ISO export date, a license search does not create a disclosure address from the license number, and the closures PDF has no facility-id overlap with the active file. Wyoming’s mixed workbook is not that candidate. Michigan, Pennsylvania, Wisconsin, and Minnesota stay behind their recorded blockers. Class D states need an official field check before any build. The Kansas directory index returned HTTP 403, so its files remain unopened.

Phase 1 is this assessment and the roster contract. Phase 2 is review of that contract. Phase 3 is one development-only state after a person approves the schema. No phase publishes a state, changes billing, or changes public analytics.

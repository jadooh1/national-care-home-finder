# Illinois roster onboarding

Review only. This proposal does not load rows, change a database, publish a directory, or modify the official workbook.

## Provenance

- Authority: Illinois Department of Public Health
- FOIA response: DPH 26-2017
- Workbook: `3 liner with License-2026-10-28-16-16-10.xlsx`
- Extract timestamp: 2026-10-28 16:16:10 Central Standard Time
- SHA-256: `de048fc9f80c73615831dffedc01474c07c0cb59c8952e92d653f3f1727b907a`
- The workbook contains facility names, addresses, phone numbers, and licensee identifiers, so it stays outside git.

Verified from that file:

| Check | Result |
| --- | ---: |
| Facility records | 1,459 |
| Assisted Living/Shared Housing Establishment | 502 |
| Reported AL/SH units | 27,823 |
| Duplicate facility IDs within those 502 | 0 |
| Missing facility IDs within those 502 | 0 |
| AL/SH expirations before 2026-10-28 | 17 |
| Capacity total row | 1 |
| Additional non-facility row | 1 |

The other 957 facility records are 937 Long Term Care Facility rows and 20 Specialized Mental Health Rehabilitation Facility rows. They are counted and left out of this staging set. Their categories are not relabeled.

## Field mapping

The Assisted Living/Shared Housing category is preserved exactly as `Assisted Living/Shared Housing Establishment`. No separate assisted-living or shared-housing class is created.

| Official field | Nationwide roster field |
| --- | --- |
| Facility ID | `facility_identifier`, with `identifier_type` `facility-id` |
| Licensee ID | `source_record_id` as `idph-licensee:{id}` |
| Facility/Establishment Name | `facility_name` |
| Street, city, state, ZIP | `unverified_address`, provenance `idph-listed-address` |
| Facility Type | `original_category` and `normalized_category` |
| Extract date | `official_export_date` and `source_publication_date` |
| Issuing authority | Illinois Department of Public Health |

`physical_address` stays empty. `original_status` and `normalized_status` stay empty. `publication` stays `unpublished`. `freshness_verified` and `disclosure_verified` stay false. The FOIA workbook is not a public facility-specific disclosure page, so `disclosure_url` and `disclosure_kind` stay empty.

The 17 early expirations are a review flag, `expiration-precedes-extract`. They remain in the unpublished candidate set until IDPH confirms whether the license is expired, renewed, or otherwise still active. The flag is not written into `original_status`.

Rows with no facility ID and no facility type are excluded. One is the capacity total row, whose AL/SH unit cell equals 27,823. One other non-facility row has a numeric value in the effective-date column and no facility identity. Both stay out of ingestion.

## Onboarding manifest

`supabase/proposals/onboarding/illinois.json` is the reusable state record. Each future state uses the same fields: provenance, extraction date, validation counts, publication eligibility, and refresh monitoring. The profile records that state's authority, official categories, identifier type, capacity unit, status convention, and refresh schedule. Illinois is `ineligible` for publication. A manifest that says eligible while expiration flags remain is refused.

Official columns that the national roster does not store stay on `source_attributes` for the review record. The roster projection omits that object. The approved development baseline file is unchanged.

## Schema gaps

These are review findings, not changes to the roster table:

- The roster accepts one identifier type per row. Facility ID and Licensee ID are both present and unique for these 502 records, so Facility ID occupies the typed identifier and Licensee ID is retained in `source_record_id`.
- Reported AL/SH units, county, entity type, phone, fax, email, administrator, Medicaid, and CMS identifiers have no roster column. Units are validated and summed. Contact values are not copied into another field.
- Listed addresses are not treated as verified physical addresses.

## Proposed staging

A later development-only authorization would be required before any row is written. That later step would:

1. Confirm the connected database is the development project, outside this file.
2. Confirm `public.nationwide_roster` already exists and remains unpublished.
3. Load only the 502 projected roster rows, including the 17 flagged rows, with `publication` `unpublished`.
4. Leave Washington, Oregon, North Carolina, and Delaware rows unchanged.
5. Add no directory route, map route, grant, or public policy.

This pull request does not perform that load.

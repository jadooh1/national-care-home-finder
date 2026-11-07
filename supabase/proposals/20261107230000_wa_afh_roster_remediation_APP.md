# Washington AFH roster remediation

Review only. This proposal does not change development or production data.

The companion file `20261107230000_wa_afh_roster_remediation_REVIEW.sql` raises before any read or write. It is not a migration.

## Evidence

- Current official roster: `supabase/proposals/reports/wa_afh_official_roster.csv`
- Retrieval: 2026-11-07T22:49:17Z
- Filter: `FacilityType = 'AF' AND GDLArchiveDate IS NULL`
- Rows: 6,278, with 6,278 distinct license numbers
- Development comparison source: the authorized staged snapshot `scripts/dshs/output/wa_afh_normalized_20261104T172407Z.csv`, retrieved 2026-11-04T17:24:07Z, 6,265 rows
- Reconciliation: `supabase/proposals/reports/wa_afh_reconciliation_20261107.md` and `wa_afh_reconciliation_20261107.json`
- Exact one-to-one license matches: 6,261
- Address, city, county, and ZIP differences among those matches: 0
- A live `select` from `public.wa_dshs_listed_facilities` was not run for this proposal. The session had no development credential. The 6,265 figure is the staged snapshot that the Phase 4 audit matched to development, not a new database read on November 7.

On November 7, a public ArcGIS query for licenses 752686, 755649, 757132, and 758334, without the archive filter, returned historical rows only. Every returned row had a `GDLArchiveDate`. None is in the current roster. Facility status on those archived rows was `OP`. That shows they left the current locator. It does not show that the development rows should be deleted.

## Proposed additions

Add these 17 current-roster licenses if a later authorized script proves each one is absent. Values are copied from the November 7 CSV.

| License | Name | Address | City | County | ZIP | Capacity |
| --- | --- | --- | --- | --- | --- | --- |
| 759434 | Kalispell Kathy Golf Adult Family Home | 11516 N Kathy Dr | Spokane | Spokane | 99218 | 5 |
| 759435 | ADALENA 2 ADULT FAMILY HOME LLC | 6601 177th Street Ct E | Puyallup | Pierce | 98375 | 6 |
| 759436 | LYNNDALE ADULT FAMILY HOME LLC | 19024 75th Ave W | Lynnwood | Snohomish | 98036 | 6 |
| 759437 | Arise AFH 2 | 7817 48th Loop SE | Lacey | Thurston | 98503 | 6 |
| 759438 | Genesis Adult Family Home | 31813 10th Pl SW | Federal Way | King | 98023 | 6 |
| 759439 | GOLDENRISE HOUSE LLC | 7116 N Hamilton St | Spokane | Spokane | 99208 | 6 |
| 759440 | Grace Serenity LLC | 615 S Pineview Dr | Medical Lake | Spokane | 99022 | 6 |
| 759441 | ABUNDANT LIFE SENIOR CARE LLC | 18307 150th Ave SE | Renton | King | 98058 | 6 |
| 759442 | Our Nest Adult Family Home LLC | 8713 NE Mountview St | Vancouver | Clark | 98664 | 5 |
| 759443 | Unique Companions AFH LLC | 710 Roe St | Steilacoom | Pierce | 98388 | 5 |
| 759444 | Magnolia Woods AFH | 2216 48th Ave SW | Olympia | Thurston | 98512 | 6 |
| 759445 | Consonus Care Homes | 6559 Gleneagle Ave SW | Port Orchard | Kitsap | 98367 | 5 |
| 759446 | Joyful Harmony Adult Family Home | 1619 NE 129th Ave | Vancouver | Clark | 98684 | 6 |
| 759447 | NAOMI SAMUEL ADULT FAMILY HOME LLC | 20512 Poplar Way | Lynnwood | Snohomish | 98036 | 4 |
| 759448 | Serenity Prime Living LLC | 10317 117th Street Ct SW | Lakewood | Pierce | 98498 | 6 |
| 759449 | Evas Adult Family Home LLC | 16505 NE 98th St | Vancouver | Clark | 98682 | 6 |
| 759450 | Benevolent Adult Family Home 5 | 12432 44TH DR SE | Everett | Snohomish | 98208 | 6 |

A listed insert also needs the existing Washington `jurisdiction_id`, `source_name = 'wa_dshs_afh'`, `license_category = 'afh'`, `facility_type = 'AFH'`, `state_code = 'WA'`, `record_status = 'source_matched'`, `presence = 'active'`, and `normalized_license_number` equal to the license number. Do not invent a jurisdiction id or source hash. Stop if a required column has no source value.

## Coordinates for the 17 additions

On November 7, the same official layer returned one current row for each of the 17 licenses. Each row had `GDLArchiveDate` null, facility type `AF`, and the same street address as the roster CSV. All 17 latitude and longitude values fall inside the rectangle already used for Washington source points: latitude 45.580299 to 48.998467 and longitude -124.383814 to -117.047107.

| License | Latitude | Longitude |
| --- | --- | --- |
| 759434 | 47.761458 | -117.445549 |
| 759435 | 47.095314 | -122.341103 |
| 759436 | 47.826185 | -122.335297 |
| 759437 | 47.004401 | -122.773485 |
| 759438 | 47.316747 | -122.348995 |
| 759439 | 47.722817 | -117.398316 |
| 759440 | 47.567983 | -117.667972 |
| 759441 | 47.43857 | -122.14117 |
| 759442 | 45.629536 | -122.582972 |
| 759443 | 47.169515 | -122.585469 |
| 759444 | 47.004071 | -122.9288 |
| 759445 | 47.490167 | -122.697915 |
| 759446 | 45.63441 | -122.539854 |
| 759447 | 47.812461 | -122.279612 |
| 759448 | 47.151242 | -122.574821 |
| 759449 | 45.693026 | -122.502965 |
| 759450 | 47.884246 | -122.173071 |

An authorized script may copy a coordinate only when a new official read returns exactly one current row for that license, the address still matches, and both numbers pass the rectangle test. A missing, duplicate, non-numeric, or out-of-range value stays null. No coordinate is estimated from the address.

## Development-only licenses

Do not delete these rows. Keep `record_status = 'source_matched'` and the license number.

The family directory and map read `public.wa_dshs_listed_facilities` and `public.wa_afh_map_facilities`. Both views keep a row when `record_status = 'source_matched'`, and neither view checks `presence`. The ingest constraint already allows `presence` to be `active` or `absent`.

The proposed change sets `presence = 'absent'` on only these four licenses, then adds `presence is distinct from 'absent'` to both family views and to `nchf_phase5g_facility_is_listed`. Null and `active` rows stay visible. The four rows remain in `public.facilities`, so claims, listing edits, and audit history can still point at them. They no longer appear in family search, the facility profile, the ZIP map, or published owner text.

Owner and administrator name lookups use the same directory view. They will also stop offering these four licenses as current listings. Stored owner and administrator rows are not deleted.

| License | Development snapshot | Current roster |
| --- | --- | --- |
| 752686 | Magnolia Woods AFH, 2216 48th Ave SW, Olympia, Thurston, 98512, capacity 6 | No current row. Archived rows remain on the official layer. |
| 755649 | #Joysam AFH LLC, 710 Roe St, Steilacoom, Pierce, 98388, capacity 5 | No current row. Archived rows remain on the official layer. |
| 757132 | IMA HOUSE AND MEMORY CARE, LLC, 12432 44TH DR SE, Everett, Snohomish, 98208, capacity 6 | No current row. Archived rows remain on the official layer. |
| 758334 | Joy Bringers II AFH, 932 Military Rd E, Tacoma, Pierce, 98445, capacity 6 | No current row. Archived rows remain on the official layer. |

Three current licenses share an address and capacity with a development-only license. They stay separate records.

- 759444 and 752686 are both Magnolia Woods AFH at 2216 48th Ave SW, Olympia.
- 759443, Unique Companions AFH LLC, and 755649, #Joysam AFH LLC, are both at 710 Roe St, Steilacoom.
- 759450, Benevolent Adult Family Home 5, and 757132, IMA HOUSE AND MEMORY CARE, LLC, are both at 12432 44TH DR SE, Everett.

The shared address is not evidence that one license replaced the other. License 758334 has no matching address in the 17 additions.

## Proposed field corrections

Apply only if the stored development value still matches the snapshot.

| License | Field | Stored development value | November 7 roster |
| --- | --- | --- | --- |
| 759147 | licensed capacity | null | 6 |
| 759176 | licensed capacity | null | 2 |
| 757641 | licensed capacity | 6 | 8 |
| 754130 | canonical name | #1 Samantha & Yoanna's Care Home LLC | Harmony Senior Home LLC |

License 754130 still matches the roster on address, city, county, ZIP, and capacity. License 757641 still matches on name and location. The two null capacities are Ridgefield Adult Family Home-2 LLC and MARIA LOVING CARE LLC, both in Vancouver.

## Risks

- The live development table may no longer match the November 4 snapshot. The precheck below stops the change when the listed count is not 6,265 or a stored value differs.
- Setting `presence = 'absent'` without the view and helper filters would leave the four licenses in family search. Both changes have to land together.
- If an existing row has null `presence`, the filter keeps it. The precheck must count null, active, and absent values before changing the views.
- Market summary views are not defined in this repository. The authorized script must read their definitions and stop if they still count a `presence = 'absent'` facility.
- Adding a second license at the same address can look like a duplicate home. Both licenses are still distinct official numbers.
- A direct update of `canonical_name` or `licensed_capacity` is not blocked by owner publication. An approved listing edit or field lock for that column would make `ingest.publish_run` keep the old value. The authorized script must stop if such a lock exists.
- Replacing `nchf_phase5g_facility_is_listed` must keep its signature, definer rights, empty search path, and existing execute grants.

## Rollback

Do not delete the four development-only licenses as a rollback or as a forward action.

Restore their previous `presence` value. The November 4 publication plan stored `active` for a new source row. The authorized script must read and save the actual value before changing it, then restore that saved value.

Restore the previous definitions of `wa_dshs_listed_facilities`, `wa_afh_map_facilities`, and `nchf_phase5g_facility_is_listed` without the absence filter. Keep the function's existing privileges.

For the four field updates, restore the previous value: capacity null, null, and 6, and the previous name for license 754130. Clear a coordinate only when this change wrote it.

For the 17 additions, remove only a row that this change inserted, and only when that facility has no owner claim, listing edit, published owner text, or publication event. Stop if any of those rows exist.

## Validation before any later execution

Run these reads first and stop on any mismatch:

1. The session is the development database, not production.
2. `public.wa_dshs_listed_facilities` contains 6,265 rows.
3. Licenses 759434 through 759450 are absent.
4. Licenses 752686, 755649, 757132, and 758334 are present, are not deleted, and their current `presence` value is recorded for rollback.
5. License 759147 has null capacity, 759176 has null capacity, 757641 has capacity 6, and 754130 still has the stored name `#1 Samantha & Yoanna's Care Home LLC`.
6. No field lock or approved official-field edit protects those four changes.
7. The jurisdiction id comes from one existing `wa_dshs_afh` row or connector, and the unique source-license guard rejects a second copy of the same normalized license.
8. A fresh official read still returns one current coordinate for each of the 17 licenses, the address still matches, and every point is inside the Washington rectangle.
9. `facilities_presence_check` still allows only null, `active`, and `absent`.
10. Every family, market, and published-owner view that counts facilities is identified. A view that does not exclude `presence = 'absent'` stops the run.

After an authorized run, when the precheck found 6,265 listed rows and 6,265 mapped rows:

- `wa_dshs_listed_facilities` returns 6,278 rows.
- `wa_afh_map_facilities` returns 6,278 rows.
- The 17 new licenses are in both results, with the coordinates in the table above.
- The four archived licenses are still in `public.facilities` and are in neither family result.
- The four corrected fields match the November 7 roster.
- Owner and administrator tables have the same row counts as before the run.

If the live map count is not 6,265, the expected map count is that live count, minus the archived licenses that were mapped, plus the 17 verified coordinates. The directory expectation remains 6,278 only when the live listed count was 6,265.

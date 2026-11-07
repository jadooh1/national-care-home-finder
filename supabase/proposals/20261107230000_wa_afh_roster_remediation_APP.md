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

A listed insert also needs the existing Washington `jurisdiction_id`, `source_name = 'wa_dshs_afh'`, `license_category = 'afh'`, `facility_type = 'AFH'`, `state_code = 'WA'`, `record_status = 'source_matched'`, and `normalized_license_number` equal to the license number. Do not invent a jurisdiction id, source hash, or map coordinate. Stop if a required column has no source value. New rows would be absent from the map until a separate geocode review.

## Development-only licenses

Do not delete these rows in the proposed change.

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
- Keeping the four archived licenses means the directory can show 6,282 listed homes after the 17 additions, while the current roster has 6,278. The difference is those four licenses.
- Adding a second license at the same address can look like a duplicate home. Both licenses are still distinct official numbers.
- A direct update of `canonical_name` or `licensed_capacity` is not blocked by owner publication. An approved listing edit or field lock for that column would make `ingest.publish_run` keep the old value. The authorized script must stop if such a lock exists.
- No map coordinate is proposed. The 17 additions would not appear on the ZIP map.

## Rollback

Do not delete the four development-only licenses as a rollback or as a forward action.

For the four field updates, restore the previous value: capacity null, null, and 6, and the previous name for license 754130.

For the 17 additions, remove only a row that this change inserted, and only when that facility has no owner claim, listing edit, published owner text, or publication event. Stop if any of those rows exist.

## Validation before any later execution

Run these reads first and stop on any mismatch:

1. The session is the development database, not production.
2. `public.wa_dshs_listed_facilities` contains 6,265 rows.
3. Licenses 759434 through 759450 are absent.
4. Licenses 752686, 755649, 757132, and 758334 are present and are not deleted by the script.
5. License 759147 has null capacity, 759176 has null capacity, 757641 has capacity 6, and 754130 still has the stored name `#1 Samantha & Yoanna's Care Home LLC`.
6. No field lock or approved official-field edit protects those four changes.
7. The jurisdiction id comes from one existing `wa_dshs_afh` row or connector, and the unique source-license guard rejects a second copy of the same normalized license.

After an authorized run, the listed count should be 6,282. The 17 new licenses should match the table above. The four corrected fields should match the November 7 roster. The four development-only licenses should still be present. Owner and administrator tables should have the same row counts as before the run.

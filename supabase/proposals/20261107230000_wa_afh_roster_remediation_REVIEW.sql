-- Review only. This is not a migration and it is not authorized for execution.
-- Running this file stops before any read or write.

begin;

do $review_only$
begin
  raise exception using
    errcode = 'P0001',
    message = 'review only: Washington AFH roster remediation is not authorized for execution';
end
$review_only$;

rollback;

-- The statements below are documentation. They are not reached after the
-- exception above. A later authorized script must repeat the prechecks in
-- 20261107230000_wa_afh_roster_remediation_APP.md before using any of them.
--
-- Do not delete licenses 752686, 755649, 757132, or 758334.
-- Do not change license 752686 into license 759444.
--
-- Precheck, read only:
--   select count(*) from public.wa_dshs_listed_facilities;
--   Expected before any change: 6265, matching the 2026-11-04 development snapshot.
--   Stop if that count differs.
--
-- Proposed additions from the 2026-11-07T22:49:17Z roster, licenses 759434-759450.
-- Each insert must copy jurisdiction_id from the existing wa_dshs_afh connector
-- or from one existing listed row. Do not invent a jurisdiction id, source hash,
-- or coordinates. Stop if source_hash or another unpublished column is NOT NULL.
--
-- 759434 | Kalispell Kathy Golf Adult Family Home | 11516 N Kathy Dr | Spokane | Spokane | 99218 | 5
-- 759435 | ADALENA 2 ADULT FAMILY HOME LLC | 6601 177th Street Ct E | Puyallup | Pierce | 98375 | 6
-- 759436 | LYNNDALE ADULT FAMILY HOME LLC | 19024 75th Ave W | Lynnwood | Snohomish | 98036 | 6
-- 759437 | Arise AFH 2 | 7817 48th Loop SE | Lacey | Thurston | 98503 | 6
-- 759438 | Genesis Adult Family Home | 31813 10th Pl SW | Federal Way | King | 98023 | 6
-- 759439 | GOLDENRISE HOUSE LLC | 7116 N Hamilton St | Spokane | Spokane | 99208 | 6
-- 759440 | Grace Serenity LLC | 615 S Pineview Dr | Medical Lake | Spokane | 99022 | 6
-- 759441 | ABUNDANT LIFE SENIOR CARE LLC | 18307 150th Ave SE | Renton | King | 98058 | 6
-- 759442 | Our Nest Adult Family Home LLC | 8713 NE Mountview St | Vancouver | Clark | 98664 | 5
-- 759443 | Unique Companions AFH LLC | 710 Roe St | Steilacoom | Pierce | 98388 | 5
-- 759444 | Magnolia Woods AFH | 2216 48th Ave SW | Olympia | Thurston | 98512 | 6
-- 759445 | Consonus Care Homes | 6559 Gleneagle Ave SW | Port Orchard | Kitsap | 98367 | 5
-- 759446 | Joyful Harmony Adult Family Home | 1619 NE 129th Ave | Vancouver | Clark | 98684 | 6
-- 759447 | NAOMI SAMUEL ADULT FAMILY HOME LLC | 20512 Poplar Way | Lynnwood | Snohomish | 98036 | 4
-- 759448 | Serenity Prime Living LLC | 10317 117th Street Ct SW | Lakewood | Pierce | 98498 | 6
-- 759449 | Evas Adult Family Home LLC | 16505 NE 98th St | Vancouver | Clark | 98682 | 6
-- 759450 | Benevolent Adult Family Home 5 | 12432 44TH DR SE | Everett | Snohomish | 98208 | 6
--
-- Proposed updates, and only these columns:
--   759147 licensed_capacity null -> 6
--   759176 licensed_capacity null -> 2
--   757641 licensed_capacity 6 -> 8
--   754130 canonical_name -> 'Harmony Senior Home LLC'
--
-- Each update must first confirm the current development value named in the
-- application note. Stop if the stored value is already different.

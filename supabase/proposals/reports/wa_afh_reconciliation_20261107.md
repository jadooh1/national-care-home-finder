# Washington AFH roster reconciliation

Local files only. No database statement was run.

- Current DSHS roster: 6278 rows, retrieved 2026-11-07T22:49:17Z.
- Development snapshot: 6265 rows, retrieved 2026-11-04T17:24:07Z.
- The development figure is the authorized staged snapshot. A live read of public.wa_dshs_listed_facilities was not available in this session.
- Exact license matches: 6261.
- One-to-one license matches: 6261.
- DSHS-only licenses: 17.
- Development-only licenses: 4.
- Development rows with no licensed capacity: 2.

## Field differences among one-to-one matches

- name: 1
- address: 0
- city: 0
- county: 0
- zip: 0
- capacity: 3

## Development rows with no licensed capacity

- 759147: Ridgefield Adult Family Home-2 LLC (Vancouver)
- 759176: MARIA LOVING CARE LLC (Vancouver)

## DSHS-only licenses

- 759434: Kalispell Kathy Golf Adult Family Home (Spokane)
- 759435: ADALENA 2 ADULT FAMILY HOME LLC (Puyallup)
- 759436: LYNNDALE ADULT FAMILY HOME LLC (Lynnwood)
- 759437: Arise AFH 2 (Lacey)
- 759438: Genesis Adult Family Home (Federal Way)
- 759439: GOLDENRISE HOUSE LLC (Spokane)
- 759440: Grace Serenity LLC (Medical Lake)
- 759441: ABUNDANT LIFE SENIOR CARE LLC (Renton)
- 759442: Our Nest Adult Family Home LLC (Vancouver)
- 759443: Unique Companions AFH LLC (Steilacoom)
- 759444: Magnolia Woods AFH (Olympia)
- 759445: Consonus Care Homes (Port Orchard)
- 759446: Joyful Harmony Adult Family Home (Vancouver)
- 759447: NAOMI SAMUEL ADULT FAMILY HOME LLC (Lynnwood)
- 759448: Serenity Prime Living LLC (Lakewood)
- 759449: Evas Adult Family Home LLC (Vancouver)
- 759450: Benevolent Adult Family Home 5 (Everett)

## Development-only licenses

- 752686: Magnolia Woods AFH (Olympia)
- 755649: #Joysam AFH LLC (Steilacoom)
- 757132: IMA HOUSE AND MEMORY CARE, LLC (Everett)
- 758334: Joy Bringers II AFH (Tacoma)

## Evidence-backed corrections

No database row was changed. These are the differences a later authorized refresh would have to account for.

- License 759147, Ridgefield Adult Family Home-2 LLC, has no development capacity. The November 7 roster records capacity 6.
- License 759176, MARIA LOVING CARE LLC, has no development capacity. The November 7 roster records capacity 2.
- License 757641 matches on name, address, city, county, and ZIP. Development capacity is 6 and the November 7 roster records 8.
- License 754130 matches on address, city, county, ZIP, and capacity. Development name is "#1 Samantha & Yoanna's Care Home LLC" and the November 7 roster name is "Harmony Senior Home LLC".
- Seventeen licenses, 759434 through 759450, are on the November 7 roster and are absent from the development snapshot.
- Four development licenses are absent from the November 7 roster: 752686, 755649, 757132, and 758334.
- License 752686 and license 759444 are both named Magnolia Woods AFH in Olympia. They remain separate licenses. The shared name and city do not establish that one replaced the other.
- Among the 6,261 one-to-one matches, address, city, county, and ZIP showed no difference after comparing case, spacing, a trailing "County" word, and the first five ZIP digits. The development corrected address, city, and ZIP were also checked before an address, city, or ZIP difference was counted.

Every field difference is in wa_afh_reconciliation_20261107.json.

# Washington ZIP market income — development proposal

This proposal is ready for review. Do not apply it until a person authorizes that exact action on the development project `ajjsyloyihcqdomywhik`. It does not change production, the published facility rows, or the approved baseline.

## Objects

- `public.wa_zip_market_census_staging` — one row per Washington-intersecting 2020 ZCTA. It stores public ACS aggregates only.
- `public.wa_zip_market_income` — `security_invoker` view. A full outer join keeps every staged ZCTA and every normalized published facility ZIP.

The view reads `postal_code` and `licensed_capacity` from the existing `public.wa_dshs_listed_facilities` view. It does not update stored postal codes. Five digits stay as five digits, nine digits use the first five, and `NNNNN-NNNN` uses the first five. Any other postal code fails reconciliation.

Census-only ZCTAs have facility counts of zero. Facility-only prefixes remain, with census fields null. `age_70_plus` is the sum of ages 70–79, 80–84, and 85+ and is null when any of those bands is null. `households_100k_plus_pct` is null when the household total is null or zero. Both period columns are `2020–2024`.

## Census source

The review file is `supabase/proposals/data/wa_zip_market_census_2020_2024.csv`: 606 rows, SHA-256 `520fee7e98d958541b6de3c652798745c6c3ad62f8cbe048db87247263e727d6`.

`scripts/dshs/wa_zip_market_census.py` rebuilds it from the local files validated on 2026-11-11:

| File | SHA-256 |
| --- | --- |
| `acsdt5y2024-b01001.dat` | `1637b18a96881b81e050df1cd3d5ac38a33208b9b69b40e1dbeb3c4e13718f0e` |
| `acsdt5y2024-b19001.dat` | `1af421b3b9d0f85dbd938cd518ad5d01c693fa2870f24e1089552ea5c1e6683f` |
| `acsdt5y2024-b19013.dat` | `b25a176b0e6c339b6f3a2a0d3d8446bf06f5f080b4395993ec9a8313efb1c229` |
| `tab20_zcta520_county20_natl.txt` | `3ed41278d637dc249e0323306f68be8a6c234e3090f4de88ef328dee71aeaaaf` |

Sources: the 2024 ACS five-year table-based summary files at `https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/5YRData/` and the 2020 ZCTA-county relationship file at `https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt`.

A ZCTA is included when any related county GEOID starts with `53`. All 606 are present in B01001, B19001, and B19013. Four also intersect another state: `83856`, `99033`, `99128`, and `99362`. Their estimates describe the whole ZCTA.

Unavailable estimates (`-666666666`) and unavailable or jammed margins (`-222222222`, `-333333333`) are stored as null. A median of `2499` (`$2,500 or less`) is stored as null. A median of `250001` is preserved so the application can show `$250,000+`. The three Washington top-coded medians use the jammed-margin code, so their margin is null.

## Permissions

`anon`, `authenticated`, and, when the role exists, `service_role` receive `SELECT` only, and only after reconciliation succeeds. `PUBLIC` keeps no privileges. There is no insert, update, or delete grant.

## Development transaction

Run this only on development, in one transaction, after approval. Set the counts before the checks:

```sql
begin;
\i supabase/proposals/20261111013000_wa_zip_market_income.sql
\copy public.wa_zip_market_census_staging from 'supabase/proposals/data/wa_zip_market_census_2020_2024.csv' with (format csv, header true)
select set_config('nchf.wa_market_expected_facilities', '6278', false);
select set_config('nchf.wa_market_expected_zctas', '606', false);
\i supabase/proposals/tests/wa_zip_market_income_checks.sql
commit;
```

The checks refuse to continue when either count setting is missing, any published postal code cannot be normalized, the staged row count is not 606, the summed facility count is not 6,278, a staged or facility ZIP is absent from the view, the columns differ from the demographics page, or `security_invoker` is off. A failure rolls the transaction back.

## Rollback

```sql
\i supabase/proposals/20261111013000_wa_zip_market_income_rollback.sql
```

That drops `public.wa_zip_market_income` and then `public.wa_zip_market_census_staging`. It does not change `public.wa_dshs_listed_facilities` or `public.facilities`.

# Washington market summary views

This proposal does not create the views. Their definitions cannot be recovered from the repository or from the live development catalog. No SQL was executed for this review.

## Evidence

The city page reads `wa_city_market_summary` and asks for `county_name`, `city_name`, `total_afhs`, `homes_with_capacity`, and `known_licensed_beds`. The county page reads `wa_county_market_summary` and asks for `county_name`, `total_afhs`, `cities_represented`, `homes_with_capacity`, and `known_licensed_beds`.

The city page says a city name that occurs in more than one county stays in separate groups. Its source note names DSHS-matched directory records and existing geographic county assignments. The county page says county assignments come from geographic points and Washington county boundaries, and that ZIP Census estimates are not aggregated because they can cross county boundaries. The label for `homes_with_capacity` is “Homes with recorded capacity.” The label for `known_licensed_beds` is “Recorded licensed beds.”

Commit `39fcd9a` added the city page and commit `c44ed8b` added the county page. Neither commit added SQL. Commit `ae95045` records that `wa_zip_market_income`, `wa_county_market_summary`, and `wa_city_market_summary` were not in the development database and were not defined in the repository. That execution script does not create them. It rejects a market relation that reads `public.facilities` without excluding `presence = 'absent'`.

`wa_zip_market_income` was defined later by `supabase/proposals/20261111013000_wa_zip_market_income.sql` in commit `4d325e9`. That proposal uses `security_invoker = true`. A later read-only catalog check of the development project found the live view with `security_barrier = true` and `security_invoker = false`, and `SELECT` for `anon` and `authenticated`. That ZIP definition does not group by city or county.

`public.wa_dshs_listed_facilities` and `public.wa_afh_map_facilities` are `security_invoker = true`. They expose the public directory and map columns from `public.facilities` for matched Washington adult family homes. They are not city or county aggregates.

## Why no restore script is included

A later read-only inspection is recorded in `supabase/proposals/20261113230000_wa_market_summary_source.md`. The listed directory view has county text on every row, and there is still no county-boundary relation for the geographic assignment named by the county page. City spelling is not a canonical key, and `cities_represented` depends on that key. This file still does not create the views. The calculation rules for null capacity, blank city or county, duplicate identifiers, `presence = 'absent'`, licensing status, and row security are proposed in that source note and were not applied.

## Security requirements for a later definition

Any later view must be reviewed before it is applied.

- Use `security_invoker = true` unless a separate approval chooses owner execution. Owner execution can count rows that row security would hide from `anon`.
- Grant `SELECT` only to `anon` and `authenticated` if the columns are the same public aggregates the pages already request. Do not grant `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`. Do not grant the view to `service_role` without a separate reason.
- Exclude `presence = 'absent'` when the view reads `public.facilities` directly. Reading only `wa_dshs_listed_facilities` is safe on that point only after that view itself excludes absent rows.
- Return only the columns named above. Do not add address, license number, name, phone, or coordinates.
- Do not change `wa_zip_market_income`, the directory views, or facility rows in the same statement.

## Approval needed

Do not apply a `CREATE VIEW` until a person supplies the original definition or explicitly approves a new one. That approval has to name the source relation, the grouping keys, the treatment of nulls, the absent-row rule, and the security-invoker choice.

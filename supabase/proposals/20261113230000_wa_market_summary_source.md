# Washington market summary source

Do not execute this design. It does not create `wa_city_market_summary` or `wa_county_market_summary`. No schema, grant, or row change was made. The statements below are the review contract and the checks a person can run before any later approval.

The original view definitions are still absent from the repository and from the development catalog. This file records the source that does exist, the calculation rules that follow from it, and the city grouping key that does not.

## Verified source

Development project `ajjsyloyihcqdomywhik`, read-only. `public.wa_city_market_summary` and `public.wa_county_market_summary` are not relations. No relation outside `pg_catalog` and `information_schema` has a name containing county, boundary, ZCTA, or geometry. There is no county-boundary relation and no separate geographic-assignment table.

`public.facilities` has `city`, `county`, `latitude`, `longitude`, `licensed_capacity`, `license_status`, `presence`, and `record_status`. It has row security enabled. It has no geometry column.

`public.wa_dshs_listed_facilities` is `security_invoker = true`. Its live predicate is:

- `source_name = 'wa_dshs_afh'`
- `license_category = 'afh'`
- `facility_type = 'AFH'`
- `state_code = 'WA'`
- `record_status = 'source_matched'`
- normalized license present and not blank
- `license_number` matches `^[0-9]{1,20}$`
- `presence IS DISTINCT FROM 'absent'`

The view does not mention `license_status`. It does not expose coordinates.

`public.wa_afh_map_facilities` is also `security_invoker = true`. It requires the same source, type, state, `source_matched`, and `presence IS DISTINCT FROM 'absent'`, plus non-null latitude, longitude, and postal code. It does not apply the license-number predicate. Today the two views contain the same facility ids: 6,278 on each side, 0 only in the directory, 0 only on the map, and 0 city or county text mismatches. The predicates can diverge later. The directory page and the city-page source note both refer to the matched directory, so the summary source is `public.wa_dshs_listed_facilities`, not the map view and not `public.facilities` directly.

`public.wa_zip_market_income` remains a different aggregate. Its proposal in commit `4d325e9` groups normalized ZIP codes from `wa_dshs_listed_facilities` and uses `count(licensed_capacity)` and `coalesce(sum(licensed_capacity), 0)`. The live ZIP view is `security_barrier = true` and `security_invoker = false`. That execution mode is not the mode proposed here.

## What the facility rows already contain

Counts are for the listed view unless noted. No facility name, address, or license number is part of this record.

| Check | Result |
| --- | ---: |
| Listed rows and distinct facility ids | 6,278 and 6,278 |
| Blank city, blank county | 0 and 0 |
| Distinct raw city, trimmed city, case-folded city | 300, 281, 175 |
| Distinct county, case-folded county | 35 and 35 |
| County values outside the 39 Washington county names | 0 |
| Official county names with no listed row | 4 |
| Rows whose city differs from its trimmed value | 38, in 19 county-and-trimmed-city groups |
| Same county and case-folded city with more than one spelling | 105 groups, 212 spellings, 6,078 rows |
| Case-folded city keys that occur in more than one county | 6 |
| Null, negative, or zero licensed capacity | 0, 0, and 0 |
| Minimum, maximum, and sum of licensed capacity | 2, 8, and 36,521 |
| Duplicate normalized license groups in the matched active population | 0 |
| `presence = 'absent'` and `record_status = 'source_matched'` on `facilities` | 5, and 0 of those ids are in the listed view |
| Blank presence and `record_status = 'inactive'` | 1, excluded by `source_matched` |
| `license_status` `OP` and blank, among active source-matched rows | 6,261 and 17 |
| Active source-matched rows missing a point | 0 |
| `anon` listed rows and map rows | 6,278 and 6,278 |

County text is a reliable grouping key for the published directory. Every listed row has a non-blank county, the 35 values are a subset of the 39 Washington county names, and the map view stores the same text for the same ids. The county page's sentence about points and county boundaries describes a join that cannot be reconstructed. The points exist on the facility row. The boundary side does not exist. Grouping the stored county text summarizes the directory. It does not recompute a spatial assignment.

City text is populated and is not a canonical key. Trimming changes 19 groups. Case-folding collapses 281 trimmed spellings to 175 keys, and 6,078 of the 6,278 rows sit in a county group that has more than one spelling. There is no preferred-spelling column and no city-boundary relation. The city page comment says to fetch 327 groups. None of 300, 281, or 175 is 327. Six city keys occur in more than one county, so a city summary that ignored county would merge places the city page keeps separate.

`cities_represented` uses that same unresolved city key. The other county measures do not.

## Proposed calculation rules

These rules apply only to a later definition that a person approves. They are the directory's current behavior, plus the ZIP aggregate's capacity arithmetic. They are not a recovered view.

- Source relation: `public.wa_dshs_listed_facilities`.
- County grouping key: `county`, exact text. Established.
- City grouping key: not established. A later approval must choose raw `city`, `btrim(city)`, or a canonical spelling, and must keep county in the key. Until that choice, do not create either view. `cities_represented` waits on the same choice.
- Missing or invalid capacity. Use `count(licensed_capacity)` for homes with recorded capacity and `coalesce(sum(licensed_capacity), 0)` for recorded beds, matching the ZIP proposal. Null capacity counts in `total_afhs` and in neither capacity measure. Do not apply a bed cap. The published maximum is 8, so a 1-to-6 rule would drop homes the directory lists. No listed row is null, negative, or zero today.
- Missing city or county. Do not emit a group whose key is null or blank. A blank city drops that row from a city summary only. A blank county drops it from both. The current listed view has neither.
- Duplicate facility identifiers. The listed view is one row per `id`, and the matched active population has no duplicate normalized license. A later definition groups those rows directly. A validation query must fail the review if `count(*)` differs from `count(distinct id)`.
- `presence = 'absent'`. The listed view already applies `presence IS DISTINCT FROM 'absent'`. The summary reads that view and does not read `public.facilities` directly. The 5 absent source-matched rows stay out.
- Unknown or historical licensing status. The listed view does not mention `license_status`. The only observed values on the active source-matched rows are `OP` and blank, and the 17 blank rows are inside the 6,278. There is no historical status value in this population. The summary does not add a status filter and does not treat blank as historical.
- Rows hidden by row security. Create the view `with (security_invoker = true)` so the caller is subject to the same policies as the directory. Both public `SELECT` policies on `facilities` mention presence, record status, and absent. `anon` currently sees all 6,278 listed rows, the same count as the table owner. Owner execution, which is how the live ZIP view is set, is not proposed. Grant `SELECT` only to `anon` and `authenticated`. Do not grant `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`. Do not grant `service_role`.

The city page reads `county_name`, `city_name`, `total_afhs`, `homes_with_capacity`, and `known_licensed_beds`. The county page reads `county_name`, `total_afhs`, `cities_represented`, `homes_with_capacity`, and `known_licensed_beds`. A view that omitted `cities_represented` or chose a city spelling would not be this contract.

## Review-only design

The county totals that do not depend on city spelling are:

```sql
select
  county as county_name,
  count(*)::integer as total_afhs,
  count(licensed_capacity)::integer as homes_with_capacity,
  coalesce(sum(licensed_capacity), 0)::integer as known_licensed_beds
from public.wa_dshs_listed_facilities
where nullif(btrim(county), '') is not null
group by county
order by county;
```

That select is not a view. It has no `cities_represented` column because that column needs the city key. There is no city select here for the same reason.

Validation queries for a later review:

```sql
select count(*) as listed_rows, count(distinct id) as distinct_ids
from public.wa_dshs_listed_facilities;

select count(*) as absent_still_listed
from public.facilities f
where f.presence = 'absent'
  and exists (
    select 1 from public.wa_dshs_listed_facilities l where l.id = f.id
  );

select
  count(*) filter (where city is null or btrim(city) = '') as blank_city,
  count(*) filter (where county is null or btrim(county) = '') as blank_county,
  count(*) filter (where licensed_capacity is null) as null_capacity,
  count(*) filter (where licensed_capacity < 0) as negative_capacity,
  count(distinct city) as raw_city_values,
  count(distinct btrim(city)) as trimmed_city_values,
  count(distinct lower(btrim(city))) as folded_city_values
from public.wa_dshs_listed_facilities;
```

`absent_still_listed` must be 0 while the listed view keeps `presence IS DISTINCT FROM 'absent'`. `listed_rows` must equal `distinct_ids`. A difference between `raw_city_values`, `trimmed_city_values`, and `folded_city_values` means the city key is still unresolved.

## Dependencies

- The listed view continues to exclude `presence IS DISTINCT FROM 'absent'` and to require `record_status = 'source_matched'`.
- The summary is not created in the same statement as a change to `wa_zip_market_income`, the directory views, or facility rows.
- No boundary import, placeholder view, or invented city or county assignment is part of this design.

## Approval required

One approval is required before either view can be created: a person chooses the city grouping key and accepts these calculation rules, `security_invoker = true`, and `SELECT` for `anon` and `authenticated` only. That approval is for a new definition. It is not a restoration.

No approval is requested to import county boundaries, to change facility rows, to alter the ZIP view, or to create a view that still lacks the city key.

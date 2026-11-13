# Search and owner dashboard reliability

This review does not change facility records, grants, or publication. City and county comparison remain blocked by development read access.

## What worked

On the development application, Washington directory search returned listings, a ZIP query returned matches, and an unmatched term showed the empty state. Opening `/washington?city=Yakima&county=Yakima` filled both filters and returned listings. An unknown license profile showed the not-found state. The official DSHS locator link remained the public locator.

A signed-out visit to the owner dashboard and to listing proposals returned to the owner sign-in page. The password-recovery form opened and was not submitted. Desktop width showed the Washington navigation. A narrow width kept it behind the Washington menu.

The current map source reads a `zip` query through `washingtonZipFromSearch`. ZIP market income requests on the development host returned HTTP 200.

## City and county comparison

The city page shows “City market data could not be loaded. Check access to wa_city_market_summary.” The county page shows “County comparison data could not be loaded. Check the database view and read permissions.” Both messages are shown only when that page’s Supabase query returns an error. The pages do not turn that error into an empty successful comparison.

`wa_city_market_summary` and `wa_county_market_summary` are not defined in this repository. The same development host can read `wa_dshs_listed_facilities` and `wa_zip_market_income`. The failure is development read access to the two summary views. No grant or schema change was made.

## Boundary

Washington remains the public directory. Oregon remains on its development directory. No owner authorization, audit, billing, or analytics behavior was changed.

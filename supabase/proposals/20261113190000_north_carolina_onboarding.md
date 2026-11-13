# North Carolina onboarding assessment

North Carolina stays unpublished. This review reads the official adult care home and family care home workbooks and the star-rating search. It does not import rows, rewrite a field, or create an export date.

## Verified source evidence

On November 13, 2026, the licensed-facilities page at https://info.ncdhhs.gov/dhsr/reports.htm still listed both workbooks as updated `10/28/2026`. The page says the listings may be updated at different times. It does not give a daily, weekly, or monthly cadence. The adult workbook file clock was `Wed, 28 Oct 2026 17:10:30 GMT`. The family workbook file clock was `Wed, 28 Oct 2026 17:10:29 GMT`. Each workbook title says `As of 10/2026`.

The adult workbook has 566 `HAL` licenses. The family workbook has 520 `FCL` licenses. All 1,086 licenses are unique, including across the two files. Each licensed row has a facility name, county, site address, site city, site state `NC`, and a five-digit site ZIP. Adult rows span 96 counties. Family rows span 64 counties. One unlabeled row in each workbook has no license, name, or site address.

Adult bed counts run from 9 through 201. Family bed counts stay inside 2 through 6. Those ranges match the Adult Care Licensure Section description of adult care homes as 7 or more beds and family care homes as 2 through 6 beds. No licensed row has a bed count outside its workbook range.

902 licensed rows have a facility address that differs from the site address. 184 facility addresses repeat the site address. Adult facility-address states remain NC 526, SC 7, FL 5, GA 4, NJ 4, TX 3, WA 3, KY 3, OH 3, VA 2, CA 2, AZ 2, MD 1, and TN 1. Family facility-address states remain NC 506, VA 7, and FL 7. The facility address stays separate from the site address.

The star-rating search posts by county, city, or name to `results.asp`. It has no license field. One county result page linked each row to `facility.asp?fid=` plus a 6-digit identifier. None of those identifiers matched a license number. One facility page returned HTTP 200 and displayed a license number, site address, county, and capacity. Its penalty table has a column named Current Status. That column is not a licensing-status field in either workbook.

## Uncertain records

27 star values are `N/A`. Five expiry dates fall before November 13, 2026: one adult row and four family rows. The original star text and expiry text stay in place. They are not converted into a closed, expired, or active status.

The overnight-respite listing and the special-care-unit workbook were not adopted. No count from either list is recorded.

## Publication

A statewide directory would need a current per-row licensing status, an authoritative ISO export date, and a facility link that can be built from the license number. None of those is present. No coordinate column is present, so no map is supported. Publication-eligible records: 0. Washington and Oregon are unchanged. North Carolina has no public directory path and no map path.

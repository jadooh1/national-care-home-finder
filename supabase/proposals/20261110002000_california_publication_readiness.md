# California publication readiness

California stays unpublished. This check classifies the official rows already validated in memory. It does not rewrite a category, status, state, ZIP, or file date, and it does not store facility rows.

## Exceptions left as published by CDSS

Residential Care Facilities for the Elderly has one row with a blank `facility_type`. Its status is `PENDING` and its state is `CA`. Its ZIP is present. The blank category is not filled in.

Adult Residential Facilities has one row that fails three checks at once. Its original category is `ADULT RESIDENTIAL`, its original status is `9/2/1997`, its original state is `92354`, and its ZIP is not five digits. Those values stay as published. The row is excluded because the status is not one of the four official statuses.

## Eligibility

A row can be counted as eligible for a later directory only when its original category is one of the categories named below, its original status is `LICENSED`, `CLOSED`, `PENDING`, or `ON PROBATION`, its state is `CA`, its ZIP is five digits, and its license number, name, and address are present. Eligible rows are still not published.

Residential-care categories counted: `RESIDENTIAL CARE ELDERLY` and `RCFE-CONTINUING CARE RETIREMENT COMMUNITY`.

Adult-residential categories counted: `ADULT RESIDENTIAL`, `ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS`, `COMMUNITY CRISIS HOME - ARF`, and `ENHANCED BEHAVIORAL SUPPORTS HOME - ARF`.

These adult-residential categories are excluded because their original text names a different license category: `ADULT DAY PROGRAM`, `SOCIAL REHABILITATION FACILITY`, and `RESIDENTIAL FACILITY CHRONICALLY ILL`.

Every current official row was passed through this rule. The rows were not stored.

Residential care: 12,522 rows. Eligible: 12,521. Of those, 7,939 are `LICENSED`, 3,821 are `CLOSED`, 738 are `PENDING`, and 23 are `ON PROBATION`. Excluded: 1, the blank category. Unresolved exceptions: 1 blank category, no unrecognized status, no unexpected state, and no non-five-digit ZIP.

Adult residential: 10,498 rows. Eligible: 8,610. Of those, 6,332 are `LICENSED`, 1,840 are `CLOSED`, 429 are `PENDING`, and 9 are `ON PROBATION`. Excluded: 1,888. Of the excluded rows, 1,887 have a category that is not an adult-residential category, and 1 is the shifted row. Unresolved exceptions on that one row: unrecognized status, unexpected state, and a ZIP that is not five digits.

No export date is created. Eligible is a count for a later decision. It does not publish closed, pending, or licensed homes.

## Disclosure

The CDSS facility-search welcome page is https://www.cdss.ca.gov/inforesources/community-care-licensing/facility-search-welcome. That page links to the facility-search application at https://www.ccld.dss.ca.gov/carefacilitysearch/. On November 9, 2026 that application returned HTTP 503. Neither page provides a verified per-facility profile URL, so no disclosure link is recorded.

## Remaining blockers

There are no coordinate columns. The raw file dates `5252025` and `05252025` are not ISO export dates. Catalog timestamps are not an export date. Address and contact fields remain withheld. Washington and Oregon are unchanged.

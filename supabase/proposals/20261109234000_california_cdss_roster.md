# California CDSS source validation

This check reads the shape of the official California Department of Social Services community-care licensing files. It does not download, store, or publish facility rows. California stays unpublished. No coordinate is created, and no raw file date is converted into an export date.

## Source

- Dataset: https://data.chhs.ca.gov/dataset/ccl-facilities
- Resources checked: Residential Care Facilities for the Elderly (`744d1583-f9eb-45b6-b0f8-b9a9dab936a6`) and Adult Residential Facilities (`9f5d1d00-6b24-4f44-a158-9cbe4b43f117`)
- Official columns: facility type, facility number, facility name, licensee, administrator, telephone, address, city, state, ZIP, county, regional office, capacity, status, license first date, closed date, and file date
- There is no latitude or longitude column
- No per-facility disclosure link is recorded

## Observations from count-only queries

These figures describe the files at the time of this review. They are not a stored directory.

Residential Care Facilities for the Elderly: 12,522 rows. Categories are `RESIDENTIAL CARE ELDERLY` (12,389), `RCFE-CONTINUING CARE RETIREMENT COMMUNITY` (132), and one blank category. Statuses are `LICENSED` (7,939), `CLOSED` (3,821), `PENDING` (739), and `ON PROBATION` (23). Every state value is `CA`. License numbers, names, addresses, cities, and ZIP codes have no nulls. Duplicate license numbers: 0. Every `file_date` value is the raw text `5252025`.

Adult Residential Facilities: 10,498 rows. The file is not limited to adult residential homes. Its categories are `ADULT RESIDENTIAL` (8,329), `ADULT DAY PROGRAM` (1,343), `SOCIAL REHABILITATION FACILITY` (527), `ENHANCED BEHAVIORAL SUPPORTS HOME - ARF` (127), `ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS` (117), `COMMUNITY CRISIS HOME - ARF` (38), and `RESIDENTIAL FACILITY CHRONICALLY ILL` (17). Statuses are `LICENSED` (7,622), `CLOSED` (2,354), `PENDING` (511), `ON PROBATION` (10), and one value `9/2/1997`. State values are `CA` (10,497) and one value `92354`. License numbers, names, addresses, cities, and ZIP codes have no nulls. Duplicate license numbers: 0. Every `file_date` value is the raw text `05252025`.

The two raw file dates are not ISO dates. This check does not rewrite either value as `2025-05-25` and does not store an export date.

## Normalization

`lib/state-source-validation.ts` checks a supplied table in memory. A matching header keeps each row's original license category, license number, source URL, resource name, and official field text. It reports duplicate license numbers, blank identifiers, names, addresses, and categories, statuses outside the four observed official statuses, and state values other than `CA`. It collects raw file dates without parsing them. `recorded_export_date` stays null, `directory_ready` stays false, and refresh stays off.

Washington's directory and map, and Oregon's directory without a map, are unchanged.

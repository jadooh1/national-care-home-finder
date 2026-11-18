# Nationwide state onboarding

This framework records publication controls for the states already implemented and for the next candidate. It does not download a directory into the repository, invent a coordinate, or record an export date that the official file does not contain. Washington, Oregon, and California keep their current publication behavior.

## Shared controls

Each state profile has licensing categories, one official source, a freshness field, a disclosure rule, and a publication control of `public`, `development`, or `unpublished`.

Public publication is permitted only when the control is already `public`, at least one category is eligible, the source uses HTTPS, a recorded `YYYY-MM-DD` export date is present, a verified disclosure prefix is present, and the blocker list is empty. Oregon remains `development`. California and Michigan remain `unpublished`, so the gate stays closed for both.

## Reference implementations

Washington is the public reference. Its source is the DSHS adult family home locator, its recorded source date remains November 9, 2026, and its disclosure prefix remains the existing DSHS services link. Its map path is unchanged.

Oregon is the development reference. The accepted ODHS provider export still has no coordinate columns and no recorded export date. Its existing blockers stay in place. Its directory is still limited to the development host.

California is the unpublished reference for more than one licensing category. Residential care facilities for the elderly and adult residential facilities stay separate. No per-facility disclosure prefix is recorded. The earlier structural counts are not repeated here.

## Next candidate: Michigan

Michigan is the next candidate because Licensing and Regulatory Affairs publishes a single comma-delimited file of adult foster care homes and homes for the aged, a column key for that file, and a public facility-profile path. New York's Department of Health has retired its standalone Adult Care Facility Directory and now splits adult care facilities across two health-facility datasets. That joined catalog is a weaker fit for this architecture.

The Michigan file URL is https://documents.apps.lara.state.mi.us/bchs/afc_sw.txt. The column key is https://www.michigan.gov/lara/bureau-list/bchs/adult/online-lookups/adult-foster-care-record-description. The file has no header. All 4,480 rows had 31 positional fields. The record key names those fields and does not include latitude or longitude.

The key describes seven type codes: AF family home, AS small group, AM medium group, AL large group, AG congregate, AI county infirmary, and AH home for the aged. The file also contains 234 rows whose type code is `XH`. That code is not in the key. All 234 have status `EXEMPT` and a blank license date. Their original values are not corrected. The other 4,246 rows use a described type code.

Observed status text is `REGULAR` 4,001, `TEMPORARY` 181, `1ST PROVISIONAL` 62, `EXEMPT` 234, and `NONE` 2. The download page calls the file a list of open facilities. That label is not treated as an availability claim, and a described row is not an available placement.

The record key says license dates use `ccyy/mm/dd`. The file values do not. 4,246 values are eight digits and 234 are blank. Neither shape is recorded as an export date. The response header `Last-Modified: Mon, 09 Nov 2026 03:38:41 GMT` is a file server clock, and the page's daily-update notice is not an export date.

4,373 ZIP values have five digits and 107 have nine digits. Those values are unchanged. Street address, telephone, and licensee fields are present in the file and are not accepted public output.

The public search application at https://adultfostercare.apps.lara.state.mi.us/ links each facility to `/Home/FacilityProfile/` plus the license number. One profile path returned HTTP 200. The framework can build that URL only for an 11-character license shape. No individual facility URL is stored, and the verified prefix does not open publication while the freshness and data-quality blockers remain.

Michigan has no directory path and is not linked from the home page.

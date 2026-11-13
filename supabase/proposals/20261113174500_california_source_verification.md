# California official-source verification

California stays unpublished. This check records the official facility-search route and the export-date evidence that is still missing. It does not store facility rows, rewrite a source value, or open a public directory.

## Export date

The dataset https://data.chhs.ca.gov/dataset/ccl-facilities still says `Data as of 05252025`. Its metadata time is still `2025-11-06T23:26:08.051889`. The residential-care resource time is still `2025-05-27T23:43:15.194749`, and the adult-residential resource time is still `2025-05-27T23:42:09.892479`. The packaged download time `2025-11-06T23:26:07.854281` is the same catalog update, not an export date.

The residential-care datastore still has one `file_date` value, `5252025`, on all 12,522 rows. The adult-residential datastore still has one `file_date` value, `05252025`, on all 10,498 rows. Neither value is an ISO date. The field list has no URL column, and the field notes are empty. `recorded_export_date` stays null.

## Facility link

The facility-search application at https://www.ccld.dss.ca.gov/carefacilitysearch/ publishes its own route `/FacDetail/{facNumber}` in `javascript/transparencyApp.js`. Its configuration names the detail API `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/`. A direct `/FacDetail/{facNumber}` request is redirected by that host to `https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{facNumber}`. The application reads that `Rewrite` value and opens the same route. The welcome page links only to the application root.

One licensed residential-care row and one licensed adult-residential row from the open data were checked against that API on November 13, 2026. Both returned the same facility number and the same facility category. Neither live status text was `LICENSED`: the residential-care example returned `Closed, Change of Ownership`, and the adult-residential example returned `Closed, Licensee Initiated`. A request for facility number `0` did not return a facility record. A licensed continuing-care example uses an 8-digit facility number in the open data; its live request did not complete, so that length is not treated as a separate verification. The link builder accepts only an 8-digit or 9-digit facility number without a leading zero.

The link identifies the official facility number. It does not confirm the open-data status, and this review does not list facilities.

## Excluded records

The files have not gained another category column. The 1,887 rows in another license category stay excluded because their original category text is not an adult-residential category. The one blank residential-care category and the one shifted adult-residential row still have facility numbers, but their original category, status, state, and ZIP are not rewritten. No previously excluded row becomes eligible.

## Publication

Washington stays public. Oregon stays on its development directory. California has no directory path and no map path. The remaining blockers are the missing ISO export date, the unconfirmed live status, the blank category, the shifted row, and the other fields that are still withheld.

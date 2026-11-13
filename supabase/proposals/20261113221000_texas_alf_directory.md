# Texas assisted-living directory verification

Read on 2026-11-13. This records official source checks. It does not ingest rows, change a database, add a route, or publish Texas. Washington stays public. Oregon stays on its development contract.

## Decision

Texas cannot be published. The active-license workbook is the strongest assisted-living file opened so far, and it still fails the publication requirements: there is no authoritative ISO export date, and a facility-specific disclosure page cannot be built from the facility id or license number in the file.

## Active-license workbook

Source: `https://apps.hhs.texas.gov/providers/directories/al.xlsx`

The response was HTTP 200, content type spreadsheet, 574,050 bytes. `Last-Modified` was `Fri, 13 Nov 2026 14:07:19 GMT`. That file-server clock is not an export date. The sheet is `ALF_Directory`. Its title says the directory is assisted living facility providers with an active license as of `11/12/2026`. That label is not an ISO export date.

Below the title there are 2,016 data rows. Every row has program type Assisted Living. Service type is TYPE B on 1,672 rows, TYPE A on 336, and TYPE C on 8. Facility id and license number are present, numeric, and unique on all 2,016 rows. Physical address, city, state, ZIP, and total licensed capacity are present on all 2,016 rows. Capacity is numeric and no capacity is zero. ZIP is five digits on 2,006 rows and nine digits on 10. The state cell is `TX` on 1,522 rows and `TEXAS` on 494.

`Facility Licensed` is `YES` on all 2,016 rows. That flag does not distinguish closed or expired records inside this file. `Facility Certified` is `NO` on 2,015 rows and `YES` on 1. License effective and expiration dates are Excel serials on 2,015 rows and blank on 1 row each. Those are per-facility license dates, not the file’s export date. Initial license date is blank on 445 rows. An Alzheimer certificate number is present on 736 rows. No Salesforce-style account id appears in the workbook.

`Geo Location` is a decimal pair on 1,938 rows and a single comma on 78 rows. A comma is not a coordinate. The column does not state a coordinate source or accuracy, so the pairs are not accepted as licensing coordinates and cannot publish a map.

The workbook has no facility URL. The public search is `https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-search`. The observed detail route is `https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-detail` with an account-id parameter. That account id is not a workbook column, so neither the facility id nor the license number can form a disclosure link.

## Closures

Source: `https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf`

The response was HTTP 200, content type PDF. `Last-Modified` was `Mon, 09 Nov 2026 15:31:49 GMT`. That file-server clock is not an export date. Reconstructed text has 1,510 facility-id labels, 1,510 distinct six-digit facility ids, and service labels that also total 1,510: TYPE A 788, TYPE B 511, TYPE C 189, and TYPE E 22. Date-shaped tokens total 1,644, so no closure date was adopted from those tokens. Exact comparison of the facility ids found 0 ids in both the closures PDF and the 2,016-row active workbook. The closures file therefore does not mark an active row closed, and it does not supply the active rows' operating status.

## Publication requirements

`publicPublicationPermitted` requires public publication, an eligible category, an HTTPS source, an ISO export date, a verified facility disclosure prefix, and no blockers. Texas remains unpublished. The as-of label and both file clocks are rejected as the export date. The disclosure function returns null for an identifier. No directory or map route was added.

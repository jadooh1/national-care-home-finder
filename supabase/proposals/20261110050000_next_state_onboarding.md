# Next-state onboarding

Michigan's unresolved supplemental-address interpretation and undescribed XH classification remain official-source blockers. Those two checks are closed. They are not repeated here.

Washington, Oregon, California, and Michigan keep their current publication behavior. The next candidate stays unpublished.

## Review

Three official sources were compared.

Pennsylvania ranks first and is the selected candidate. The Department of Human Services publishes one comma-delimited personal-care-home file at https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD. The file has 989 rows. Every row is type PERSONAL CARE HOMES, program office ADULT RESIDENTIAL FACILITY, and state PA. All 989 ZIP values have five digits. Street text with both a letter and a digit is present on 976 rows. The other 13 street values are letters only and are not corrected. Every row has a latitude and longitude together with an accuracy code, so those coordinates are georeferenced portal values and are not accepted as licensing coordinates. The file has no per-facility disclosure URL. The provider directory at https://www.humanservices.dhs.pa.gov/human_service_provider_directory/ is a search. The portal field rowsUpdatedAt was observed as 2026-11-08T06:09:03Z. That catalog timestamp is not recorded as an export date. Publication-eligible records: 0.

Wisconsin ranks second and is not selected. The consumer directory is a PDF that labels a facility address and a mailing address separately. Its extracted text contains 1,980 distinct parenthetical identifiers and no date phrase. A separate Department of Health Services GIS layer contains 2,203 adult family home features, no blank address, city, or ZIP, no editing timestamp, and 9 features without a license number. The PDF count and the GIS count are not reconciled, so the GIS layer is not the accepted directory. One-bed and two-bed homes are county-regulated and are outside that state directory.

Minnesota ranks third and is not selected. The DHS Licensing Information Lookup can post back a CSV and links a profile at Details.aspx. One response contained 1,148 profile links. The rendered results summary said 1,149 licenses, 1,025 active and 124 non-active. Those figures are not reconciled. The response had no Last-Modified header, and the CSV is not a stable file URL.

Pennsylvania has no directory path and is not linked from the home page.

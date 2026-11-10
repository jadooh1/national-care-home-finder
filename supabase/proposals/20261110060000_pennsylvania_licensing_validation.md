# Pennsylvania licensing validation

This check reads the official Department of Human Services personal-care-home file in memory. It does not store facility rows, rewrite original fields, treat a georeferenced point as a licensing coordinate, or record an export date. Pennsylvania stays unpublished. Washington, Oregon, California, and Michigan keep their current publication behavior.

## File

The source is https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD. It has 989 rows. Every row is type PERSONAL CARE HOMES, program office ADULT RESIDENTIAL FACILITY, and state PA. Every ZIP has five digits. Every object identifier is a unique six-digit value. The column description calls that value an object identification. The file has no license-number column, so the object identifier is not a license number.

The file has no per-row status column. The words Licensed and Current in the dataset title are not a status definition, and a checked row is not an available placement.

Twenty-five names occur on more than one row, covering 66 rows. Fifteen street, city, and ZIP combinations occur on more than one row: one group repeats a name and 14 groups use different names. Those rows keep their original object identifiers.

## Addresses

976 street values contain both a letter and a digit. 13 street values are letters only and remain unresolved. Six of those 13 have text in the column described as Street Additional Information. Seven name a street and have a blank additional-information column, so they have no house number. The additional-information column is not copied into the street column.

Observed capacity runs from 4 to 250. No capacity is below 4. A capacity is not an availability claim. No phone value is blank. Phone and capacity are not accepted public output.

## Coordinates, disclosure, and freshness

Every row has latitude, longitude, and an accuracy code. The official accuracy description says 5 is an interpolated house, 4 is a street centroid, 3 is a ZIP+4 centroid, 1 is a ZIP centroid, and X is an intersection. The observed counts are 975, 4, 2, 7, and 1. Those points are georeferenced. Verified licensing coordinates: 0. No map is published.

The human services provider directory lists PERSONAL CARE HOMES as a service and can show inspection history for a facility license number. That license number is not in this file, so no disclosure prefix is verified. The directory page says the website is refreshed daily. That notice is not an export date for this file.

The portal field rowsUpdatedAt remains 2026-11-08T06:09:03Z. It is a catalog timestamp, not an export date. Publication-eligible records: 0.

Pennsylvania has no directory path and is not linked from the home page.

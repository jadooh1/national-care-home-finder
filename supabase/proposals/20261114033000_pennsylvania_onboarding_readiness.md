# Pennsylvania onboarding readiness

Pennsylvania stays unpublished. This review uses the recorded 989-row personal-care-home file. It does not download that file again, store rows, or copy street-additional text into the street.

## Recorded file

Every row is type PERSONAL CARE HOMES, program office ADULT RESIDENTIAL FACILITY, and state PA. Every ZIP has five digits. Every object identifier is a unique six-digit value. The file describes that value as an object identification. It has no license-number column and no per-row status column. The words Licensed and Current in the dataset title are not a status. Publication-eligible rows remain 0.

976 streets contain a letter and a digit. 13 streets are letters only. Six of those 13 have text in Street Additional Information, and seven name a street with no house number. The additional-information text stays in its original column.

## Contract blockers

The object identifier is a source record id. It is not `facilities.id` and it is not a license number. Status is absent. The catalog time `2026-11-08T06:09:03Z` and the provider directory's daily-refresh notice are not an ISO export date. No facility-specific disclosure link is recorded. The provider directory can show inspection history for a license number, and that license number is not in this file.

A letter-only street is not a usable address. A usable street still does not make the row eligible for publication while the identifier, status, date, and disclosure blockers remain.

## Coordinates

All 989 rows have a georeferenced point and an accuracy code: 975 interpolated houses, 4 street centroids, 2 ZIP+4 centroids, 7 ZIP centroids, and 1 intersection. Those points are not licensing coordinates. Verified licensing coordinates remain 0. They are not suitable for a Pennsylvania map. No map is published.

Phone and capacity stay optional. They are not accepted public output, and they are not publication blockers.

Washington, Oregon, and California keep their current publication behavior. Pennsylvania has no directory path, no map path, and no owner-claim eligibility.

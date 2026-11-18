# California source freshness and publication readiness

California stays unpublished. This review records official catalog and service metadata. It does not import facility rows, rewrite a status, or create an export date.

## Verified source evidence

The open-data package `ccl-facilities` was read again on November 13, 2026. Its notes describe the Community Care Licensing Division and do not state an update cadence. `accrual_periodicity` is the text `other`. `temporal_coverage` remains the text `Data as of 05252025`. The residential-care and adult-residential resources still show catalog modification times of `2025-05-27T23:43:15.194749` and `2025-05-27T23:42:09.892479`. Package metadata was last modified at `2025-11-06T23:26:08.051889`. Field notes for `file_date` and `facility_status` are empty. `related_resources` and `secondary_sources` are empty.

A second published package, `community-care-licensing-facilities`, points at the ArcGIS view `Master_CCL_County_Intersect_2023`. Its `accrual_periodicity` is `other` and its `temporal_coverage` is `Other`. The service reports `hasStaticData` true. Its data last-edit clock is `2026-11-12T16:42:49.900Z`. The item modified clock is `2026-07-22T16:01:38Z`. The view definition keeps rows whose latitude text is not `0`, whose program type is not `CHILDRENS RESIDE`, and whose facility type description is not `FAMILY DAY CARE`. The published item snippet says the view excludes the Children's Residential Program and family child care homes. `STATUS` is an integer field, and the layer metadata publishes no coded domain for it. The layer has no `file_date` field.

The HTML dataset pages returned HTTP 403 and were not requested again.

## Historical or potentially stale data

The open-data file-date text, the temporal-coverage phrase, the May 2025 resource clocks, the November 2025 package clock, the GIS data-edit clock, the GIS item clock, and the layer name `Master_CCL_County_Intersect_2023` are catalog or service labels. None is adopted as an authoritative export date.

## Confirmed status conflicts

Two completed comparisons remain conflicts. One open-data `LICENSED` residential-care record had live status `Closed, Change of Ownership`. One open-data `LICENSED` adult-residential record had live status `Closed, Licensee Initiated`. Both facility numbers and categories matched.

## Missing or inconclusive live verification

Seven live requests timed out and were not repeated: six representative closed, pending, and on-probation rows, plus one additional probe. The earlier eight-digit continuing-care check was not completed. An empty live status and an unavailable response stay inconclusive. They are not recorded as closure.

## Publication policy

An open-data `LICENSED` value is historical file text. It is not a current placement. A record can be represented as currently active only when an authoritative ISO export date has been adopted and a completed live response identifies the same facility number with the exact status `Licensed`. No authoritative export date is recorded, so that representation stays closed. A live `Licensed` label by itself does not publish the row. Confirmed closure text does not publish the row. The integer GIS status is not a bulk licensing vocabulary.

Washington and Oregon are unchanged. California has no public directory path and no map path.

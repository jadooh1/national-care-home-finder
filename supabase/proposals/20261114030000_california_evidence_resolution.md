# California evidence resolution

California stays unpublished. This review uses the catalog metadata, facility-search welcome page, and facility-detail application notes already recorded through November 13, 2026. It does not download the open-data files, request the facility-detail API again, or repeat the datastore query that returned HTTP 500.

## Export date

The reviewed `ccl-facilities` metadata does not publish an ISO export date. `accrual_periodicity` is `other`. `temporal_coverage` is the text `Data as of 05252025`. The field notes for `file_date` and `facility_status` are empty. The raw file dates `5252025` and `05252025`, the catalog clocks, and the GIS edit clock were already rejected. The facility-detail response dates already reviewed are license, closure, and visit dates, not a file export date.

## Current status source

The facility-search application reads one facility from `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facilityNumber}`. That shows how the page is built. It is not an official statement that this endpoint is the current licensing-status source for the whole file. The welcome page says the search covers licensed facilities and that a facility must provide its current licensing information on request. It does not name this API or an export date.

## Names and street addresses

The page displays `FACILITYNAME` and `STREETADDRESS`. That display is not enough to accept either value. No reviewed CDSS document says the live name replaces the open-data name. `STREETADDRESS` is not a location when it is blank, `See FAQs`, or `Unavailable`. The one completed adult-residential response had address fields present, and that response was not classified against those placeholders. The residential-care query was not completed.

## Gaps

The remaining gaps are external. No reviewed source publishes an ISO export date or documents the detail API as the file-level status source. Names and usable streets cannot be accepted from the evidence already on hand.

No implementation change can close those gaps. The publication rules stay fail closed. Further requests to the facility-detail API, the failed residential-care datastore query, the seven timed-out requests, or the full open-data download are not useful for this question.

Washington and Oregon are unchanged. California has no public directory path and no owner-claim eligibility.

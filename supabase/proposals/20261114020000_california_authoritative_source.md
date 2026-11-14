# California authoritative source

California stays unpublished. This review uses the official facility-detail endpoint already identified on November 13, 2026. It does not download the open-data files again, repeat the seven timed-out requests, or insert records.

## Authoritative endpoint

The CDSS facility-search application reads current facility information from `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facilityNumber}`. The facility-specific page is `https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{facilityNumber}`. The page displays `FACILITYNUMBER`, `STATUS`, `STREETADDRESS`, `CITY`, and `ZIPCODE`. `REPORTDATE` belongs to inspection reports, not to a facility export date. The page removes the location tab when `STREETADDRESS` is `See FAQs` or `Unavailable`.

The open-data `LICENSED` value remains historical file text. It is not the current status.

## Recheck

One adult-residential facility number was read from the existing licensed open-data query and requested once. The response was HTTP 200. The category matched adult residential, the facility number was present, and the status text was one of the two previously recorded closure conflicts. It was not the live label `Licensed`. The response included street, city, and ZIP fields, and none of its date fields was an ISO date. No address and no date were adopted.

The same residential-care query returned HTTP 500 from the open-data datastore. It was not repeated. The earlier residential-care conflict remains the last completed observation for that file. The seven timed-out requests were not repeated.

## What can be established

The stable official identifier is `FACILITYNUMBER`. The facility-specific page above can be built from that identifier. Neither fact makes the row public.

An accepted address is not established. The official page uses `STREETADDRESS`, and that value is not a location when it is blank, `See FAQs`, or `Unavailable`. The other address field returned by the API is not the field the page displays.

A reliable source date is not established. The checked date fields were not ISO dates, and a license or visit date would not by itself be an export date for the file.

## Remaining publication steps

1. Record an authoritative ISO export date, or record an official statement that this detail endpoint is the current status source for the whole file.
2. Retry the residential-care sample only after the open-data query no longer returns HTTP 500.
3. Classify `STREETADDRESS` against the page's placeholder values before any address is accepted.
4. Leave `FACILITYNUMBER` and the facility page unpublished until the status and date blockers are resolved.

Washington and Oregon are unchanged. California has no public directory path, no map path, and no owner-claim eligibility.

# California publication acceptance

California stays unpublished. These rules describe when a row could meet the facility contract. They do not accept a row, insert it, or adopt an address, date, or disclosure link.

## Mandatory field rules

An official facility identifier is `FACILITYNUMBER`. It is an 8-digit or 9-digit number without a leading zero. The live identifier must match the original facility number. Any other shape fails.

The current status is the `STATUS` text from `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facilityNumber}` only when that response is HTTP 200, the identifier matches, and the status text is present. The only publication status is the live label `Licensed`, and it must agree with the original open-data status. A timeout, an HTTP 500 response, an empty status, or a conflict fails closed. The open-data word `LICENSED` is not the current status.

A street is usable only when `STREETADDRESS` is present and is neither `See FAQs` nor `Unavailable`. City must be present, and ZIP must be five digits. The API field `DOADDRESS` is not the address the official page displays.

The only source date that can pass is an authoritative ISO export date recorded for the file. A raw file date, catalog timestamp, license date, visit date, or inspection `REPORTDATE` does not pass. No authoritative export date is recorded, so this rule stays closed.

The facility-specific disclosure link is `https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{facilityNumber}` for a valid facility number. A search page or a different URL fails. Forming the link does not publish the row.

Residential-care categories are `RESIDENTIAL CARE ELDERLY` and `RCFE-CONTINUING CARE RETIREMENT COMMUNITY`. Adult-residential categories are `ADULT RESIDENTIAL`, `ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS`, `COMMUNITY CRISIS HOME - ARF`, and `ENHANCED BEHAVIORAL SUPPORTS HOME - ARF`. The live facility type must match the original category. A blank category, another license category, or the shifted row fails.

## Mandatory unresolved requirements

These block publication even when the field rules above would pass:

- The row has no `facilities.id`.
- No facility-name field is accepted. The original name stays unchanged.
- No authoritative ISO export date is recorded.

## Optional

Coordinates are optional. The open-data files have no coordinate columns. Their absence is not a publication failure, and their presence would not accept a row.

## Fail closed

The two recorded conflicts stay conflicts: open-data `LICENSED` against live `Closed, Change of Ownership`, and open-data `LICENSED` against live `Closed, Licensee Initiated`. The residential-care recheck that returned HTTP 500 and the seven timed-out requests stay inconclusive. None of those results becomes a licensed, addressed, or published row.

Washington and Oregon are unchanged. California has no public directory path and no owner-claim eligibility.

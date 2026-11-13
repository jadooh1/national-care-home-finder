# Oregon provider-export date

Oregon stays on its development directory. This check reads the official ODHS provider export. It does not replace the 1,584 stored rows, adopt an export date, or send a message to ODHS.

## What the source says

The licensed long-term care search at https://ltclicensing.oregon.gov/ says: "Information is updated every 24 hours." The provider list can export CSV or Excel from `POST /Providers/Export`. On November 13, 2026 the unfiltered CSV response was `text/csv`, with `Content-Disposition` filename `Provider_Export_11-13-2026.csv`. The response had no `Last-Modified` header. Its `Date` header was `Fri, 13 Nov 2026 19:10:26 GMT`.

The file has the same 13 columns already accepted by the directory contract. None of those columns is a snapshot date, an effective date, or an export timestamp. The filename date and the response clock are the time of the download. The 24-hour sentence is an update frequency. None of those values is an ISO export date.

## Identifiers, status, and profiles

The file contains 4,755 data rows and 4,755 unique source IDs. Status is `Open` on 2,307 rows and `Closed` on 2,448 rows. Three IDs contain a character outside letters and digits. None of those three is an open adult foster home. The existing profile path remains `https://ltclicensing.oregon.gov/Providers/Details/` plus the preserved source ID. No new link pattern is recorded.

## Comparison with the development directory

The stored directory still has 1,584 accepted open adult foster homes and leaves out 20 open homes with 0 licensed beds. This later file has 1,606 open adult foster homes: 1,582 with 1 through 5 beds and 24 with 0 beds. The stored counts are not changed.

## Missing evidence

The export does not provide an authoritative data-effective date. A clarification can be requested from the contact published at https://ltclicensing.oregon.gov/Contact for questions about application use, policies, and corrections to general provider information: `(503) 373-2227` and `ltclicensing.web@odhsoha.oregon.gov`. Public-records requests are directed to https://www.oregon.gov/odhs/pages/records-requests.aspx. No message was sent.

Washington and the other state directories are unchanged.

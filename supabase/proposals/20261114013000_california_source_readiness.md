# California source-data readiness

California stays unpublished. This review uses the completed CDSS counts, status reconciliation, and facility contract. It does not download the source again, insert rows, or adopt an export date, address, coordinate, or disclosure URL.

## Verified

The open-data package `ccl-facilities` has 21,131 structurally eligible rows: 12,521 residential-care rows and 8,610 adult-residential rows. Another 1,889 rows stay out: 1 blank category, 1,887 other license categories, and 1 shifted row. The raw file-date text is `5252025` for residential care and `05252025` for adult residential facilities. Neither is an ISO export date.

Two completed live comparisons remain conflicts. One open-data `LICENSED` residential-care row had live status `Closed, Change of Ownership`. One open-data `LICENSED` adult-residential row had live status `Closed, Licensee Initiated`. Seven later live requests timed out and stay inconclusive. The open-data files have no coordinate columns. No disclosure URL is adopted.

## Normalization

A read-only adapter keeps the original facility number, category, status, file date, address text, and source URL. It does not copy those values into an accepted facility id, name, address, or license. Export date, disclosure URL, latitude, and longitude stay null. The result is never stored and cannot make a row public or eligible for an owner claim.

## Publication blockers

These remain required before a California row can meet the facility contract:

- No `facilities.id` exists for these rows.
- Name, address, and facility number are not accepted contract fields.
- No facility type is accepted for publication.
- Open-data status is historical file text, and the two confirmed live conflicts remain.
- No authoritative ISO export date is recorded.
- No profile URL is adopted. A detail route observed for two examples did not confirm the open-data status.

## Optional

Missing coordinates are recorded and are not a publication blocker. The open-data files do not contain coordinate columns, and no coordinates are created.

Washington and Oregon are unchanged. California has no public directory path and no map path.

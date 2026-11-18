# California status reconciliation

California stays unpublished. This check separates the open-data status from the live facility-search status. It does not rewrite either value, import facility rows, or create an export date.

## Official interpretation

The facility detail page at the CDSS search application displays `STATUS` as published by `https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/{facNumber}`. The page template gives four relevant readings:

- `Licensed` is the licensed label.
- `Pending` is shown as not licensed yet.
- `Probation` is the probation label.
- Any status containing `Closed` is shown as closed. The words after the comma stay with the live status.

An empty status is hidden. It is not shown as closed. `Probationary License` is a different label and is not treated as `Probation`.

## Reconciliation

A row is compared only by its official facility number. The original open-data status and the live status are both retained. The result is one of four classes:

- `match`: the identifier matched and the live label agrees with the rule above.
- `conflict`: the identifier matched and both statuses are present, but they do not agree.
- `missing`: the response did not identify the requested facility number.
- `inconclusive`: the response was unavailable, forbidden, timed out, or had no live status.

A historical `LICENSED` value is never classified as currently active, including when the live label is `Licensed`. Confirmed closure requires the matched live status to contain `Closed`. Unavailable data is not recorded as closure.

## Evidence

The earlier residential-care example was open-data `LICENSED` and live `Closed, Change of Ownership`. The earlier adult-residential example was open-data `LICENSED` and live `Closed, Licensee Initiated`. Both are conflicts with confirmed closure text. A request for facility number `0` did not identify a facility.

On November 13, 2026, one closed, one pending, and one on-probation row was requested for each of the two facility files. All six detail requests timed out with no response body. One further probe of the same API also timed out. No HTTP 403 was received, and the timed-out requests were not repeated. Those six rows stay inconclusive.

## Publication

Washington and Oregon are unchanged. California still has no directory path, no map path, and no ISO export date. The live status can identify a conflict or a closure label, but it does not make a facility available.

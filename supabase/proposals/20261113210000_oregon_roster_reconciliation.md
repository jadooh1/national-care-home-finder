# Oregon provider roster reconciliation

This comparison does not add, delete, or reclassify Oregon records. It does not adopt an export date. The November 13 filename and the download clock are not a data-effective date.

## Evidence

The comparison key is the official ODHS `ID`, kept as text. Acceptance uses the existing rule: type `AFH`, status `Open`, a source ID of 1–32 letters or digits, and licensed beds from 1 through 5.

The CSV retrieval used for this comparison is `Provider_Export_11-13-2026.csv`, 686,812 bytes, SHA-256 `604cd4270f23c016ff4007dba6b5702fd2ade659005008d9155beb02c8c37cda`. That length and the recorded row counts match the earlier November 13 retrieval. The earlier temporary file had already been removed, so byte identity with that first download was not rechecked by hash. This file has the same 13 columns and no date column. Its HTTP `Date` is the time of this retrieval.

The development directory was read from `public.oregon_odhs_afh_public`: 1,584 distinct source IDs, all `Open`, licensed beds 1 through 5. The read did not write the database. The 20 previously excluded zero-bed identifiers were not retained, so they cannot be matched one by one.

## Results

- Present in both: 1,584. Every accepted directory identifier is still in the export.
- Missing from the latest export: none.
- Newly qualifying: 5. Source IDs `0000000408` (4 beds), `0000000708` (5), `0000000731` (5), `0000000733` (4), and `8001946102` (5).
- Open/Closed changes: one. Source ID `0000000196` changed from `Open` with 4 beds to `Closed` with 0 beds.
- Licensed-capacity changes: 9.
  - `0000000196`: 4 to 0, now Closed.
  - `0000000425`: 5 to 0, still Open.
  - `11419`: 5 to 0, still Open.
  - `11495`: 5 to 0, still Open.
  - `11548`: 3 to 5, still Open.
  - `11569`: 4 to 0, still Open.
  - `3539207808`: 5 to 4, still Open.
  - `528272`: 3 to 0, still Open.
  - `566448`: 4 to 0, still Open.
- Zero-bed changes: the six still-open capacity changes above now have 0 beds. Eighteen open zero-bed IDs are absent from the accepted directory: `000000`, `0000000409`, `10587`, `11556`, `11561`, `11565`, `502387`, `509882`, `522543`, `524037`, `527722`, `528283`, `529483`, `6287256704`, `7392968117`, `7642079071`, `7717640833`, and `AF273488`. The current open zero-bed count is 24, compared with 20 excluded when the directory was stored.
- Duplicate source IDs: none. Repeated IDs with inconsistent type, beds, or status: none.
- Three export IDs fall outside the accepted identifier pattern. None is in the directory, and none qualifies.

## Why 1,582 and 1,584 differ

The latest export has 1,582 qualifying open adult foster homes. The directory still has 1,584 accepted records.

Of the stored records, 1,577 still qualify. Seven no longer qualify: the six homes now open with 0 beds, and the one home now closed with 0 beds. Five qualifying homes were not in the accepted directory. Two capacity changes stay inside 1 through 5 beds and remain qualifying.

`1,577 + 7 = 1,584` and `1,577 + 5 = 1,582`. The directory counts stay 1,584 accepted records and 20 excluded zero-bed records.

## Boundary

Oregon remains on the development directory. Washington and the other state implementations are unchanged. No message was sent to ODHS. Replacing the stored records would be a separate decision.

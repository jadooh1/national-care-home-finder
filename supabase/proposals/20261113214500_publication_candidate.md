# Publication candidate: Missouri long-term care directory

Read on 2026-11-13. This records a source comparison. It does not ingest rows, change a database, add a route, or publish a state. Washington stays public. Oregon stays on its development contract. Missouri and Wyoming stay unpublished.

## Decision

Missouri is the strongest newly reviewed candidate. The Department of Health and Senior Services publishes a downloadable long-term care directory with a license number, a facility number, an address column, separate mailing-address columns, city, ZIP, county, numeric capacity, and per-facility license effective and expiration dates. That coverage is stronger than Wyoming’s mixed workbook. Missouri is not publication-ready.

## Missouri

Source page: `https://data.mo.gov/Health/LTC-DIRECTORY/fenu-sipv`

Metadata: `https://data.mo.gov/api/views/fenu-sipv.json`

Inspection search: `https://healthapps.dhss.mo.gov/showmeltc/default.aspx`

The dataset description says the directory contains long-term care facilities licensed by the Section for Long-Term Care Regulation, including residential care, assisted living, intermediate care, and skilled nursing. The query on 2026-11-13 returned 1,102 rows.

| Level code | Rows |
| --- | ---: |
| ALF | 60 |
| ALF** | 271 |
| RCF | 166 |
| RCF* | 103 |
| ICF | 18 |
| SNF | 484 |

The four residential and assisted-living codes total 600 rows. Intermediate care and skilled nursing total 502 rows. The `*` and `**` suffixes are source codes. Their meanings were not adopted. No normalized category was adopted.

Field coverage on all 1,102 rows: license number, address, city, ZIP, capacity, license effective date, and license expiration were present. The portal also has separate facility mailing address, mailing city, and mailing ZIP columns. The primary address column is named `address`. It is not labeled physical, so the physical role stays unverified. There is no coordinate column.

Identity is not one row per facility. The 1,102 rows contain 987 distinct facility numbers and 1,096 distinct license numbers. Neither value is a unique row key.

There is no operating-status column. The `certification` column is not a status: 618 values are blank and 3 are `PEND`. The remaining values are certification identifiers and were not copied here. Per-facility effective and expiration dates are license dates. They are not the file’s export date.

The metadata `rowsUpdatedAt` converts to `2026-11-04T18:30:08Z`. That is a catalog timestamp. It is not an authoritative ISO export date.

The Show Me Long Term Care page is a county, city, and ZIP search that posts back to the same page. No facility-specific inspection or disclosure route was published there. A disclosure URL cannot be built from a license number.

Blockers: no per-row operating status, catalog timestamp is not an export date, no facility-specific disclosure link, facility number is not unique, license number is not unique, and the file mixes residential, assisted-living, and nursing levels.

## Wyoming

Directory page: `https://health.wyo.gov/aging/hls/healthcare-facility-directory/`

Workbook: `https://health.wyo.gov/wp-content/uploads/2026/11/2026-2027-Facility-Directory.xlsx`

The workbook response was HTTP 200. Its `Last-Modified` value was `Mon, 02 Nov 2026 14:45:09 GMT`. That file-server clock is not an export date. The sheet mixes facility classes. The `ALF` type code appears 31 times. The name and physical address share one column. There is no status column and no facility URL. No facility count was adopted from the sheet. Wyoming is not the candidate.

## Kansas

The adult-care-home directory index returned HTTP 403 on 2026-11-13. Its files were not opened. Kansas stays unverified.

## Publication

`publicPublicationPermitted` remains false for Missouri and Wyoming. No directory or map route was added. No coordinates, statuses, capacities, or disclosure links were invented.

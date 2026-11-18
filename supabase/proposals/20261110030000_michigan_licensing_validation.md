# Michigan licensing validation

This check reads the official LARA adult foster care and home-for-the-aged file in memory. It does not store facility rows, assign a category to an undescribed type code, infer a coordinate, or record an export date. Michigan stays unpublished. Washington, Oregon, and California keep their current publication behavior.

## File

The file is https://documents.apps.lara.state.mi.us/bchs/afc_sw.txt. The column key is the LARA adult foster care record description. The response observed during this check was 1,030,479 bytes, `Content-Type: text/plain`, and `Last-Modified: Mon, 09 Nov 2026 03:38:41 GMT`. That header is a file server clock. The page also says the file is updated daily. Neither statement is an export date.

All 4,480 rows had 31 positional fields and no header. State text was `MI` on every row. Names and cities were present on every row. No license identifier was blank or duplicated. Every identifier was two letters and nine digits, and those two letters matched the row's type code.

## Types and statuses

The record key describes AF, AS, AM, AL, AG, AI, and AH. Those codes account for 4,246 rows. The other 234 rows use `XH`. That code is not in the key. All 234 have status `EXEMPT` and blank effective and expiration dates. Their original type code is preserved, and no category name is assigned.

Observed status text is `REGULAR` 4,001, `TEMPORARY` 181, `1ST PROVISIONAL` 62, `EXEMPT` 234, and `NONE` 2. The record key names the status column and does not define these values. They are not treated as availability.

Every capacity value was numeric. No AF, AS, AM, AL, AG, or AI row fell outside the numeric range printed in the record key. AH and XH have no numeric range in that key. A capacity match is not an availability claim.

## Profile paths

The public search application builds `/Home/FacilityProfile/` plus the license identifier. All 4,480 identifiers match that shape. One path for each observed type code, including `XH`, was requested and returned HTTP 200. The remaining profile paths were not requested, and no individual facility URL is stored.

## Address and ZIP

The supplemental-address column contains letter-and-digit text on 4,460 rows, letter-only text on 19 rows, and digit-only text on 1 row. The street-address column is blank on 4,423 rows and contains letter-and-digit text on 57 rows. The supplemental value is not copied into the street column. Eight telephone values are blank. Address, telephone, and licensee fields are not accepted public output.

4,373 ZIP values have five digits and 107 have nine digits. `normalizedZip` returns the original five digits, or the first five digits of a nine-digit value. Any other shape returns null. The function does not write back to the source value.

## Freshness

4,246 rows have eight-digit effective and expiration values. Those effective values have 763 distinct texts, and the expiration values have 777. The 234 blank pairs are the `XH` rows. No value used the record key's `ccyy/mm/dd` slash form, and no value was an ISO date. No export date is recorded.

Michigan has no directory path and is not linked from the home page.

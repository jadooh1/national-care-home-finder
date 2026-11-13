# Indiana residential care directory

Indiana stays unpublished. This check counts the official HTML directory. It does not store facility rows, treat the posted date as an export date, or open a directory path.

## Source

The Indiana Department of Health page is https://www.in.gov/health/reports/QAMIS/resdir/wdirRes.htm. It was read on November 13, 2026. The response had no Last-Modified header. The page says it was posted to the web on `11/5/2026`. That text is not an ISO date, and the HTTP date of the read is not an export date. `recorded_export_date` stays null.

## What the page contains

The directory has 225 facility blocks. Each block has one license number, and all 225 values are unique. The license text uses the shape `99-999999-9`. Every block has a license expiration. 171 expirations use a one-digit month and 54 use a two-digit month. None is an ISO date. One administrator value is blank. Telephone and fax text is present on every block and is not accepted as a public field.

225 lines contain both a letter and a digit and no comma, which is the street line, and three blocks have one extra line of that kind. 225 lines are a city and a five-digit ZIP. Those city lines do not include a state abbreviation. The page does not label the lines as a physical address or a mailing address, so the address role stays unverified.

The page has no status label, no bed label, no county label, and no coordinate columns. Its only links are the directory index, the department reports page, and a top-of-page link. A license number does not form a facility disclosure URL.

## Publication

Washington stays public. Oregon stays on its development directory. Indiana has no directory path and no map path. Publication still requires an authoritative ISO export date, a per-row licensing status, and a facility-specific disclosure link.

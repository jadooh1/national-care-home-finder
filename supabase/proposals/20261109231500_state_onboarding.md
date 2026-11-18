# State onboarding assessment

This assessment records what official sources were checked. It does not download, store, or publish facility rows, coordinates, or an export date. Oregon's map and refresh stay disabled. California stays unpublished. Washington's directory, map, and DSHS links are unchanged.

## Oregon

The accepted ODHS provider export, from https://ltclicensing.oregon.gov/Providers, still has no Latitude or Longitude columns and no recorded export date.

ODHS also publishes a point layer, "APD Facilities by Type," at the Office of Business Intelligence feature service. Its description says the layer queries `licensing.webFACILITY` and that the table is updated daily. The attribute list has no Latitude or Longitude columns. It does include street address, phone, email, and owner fields. Those fields are not accepted public output. The service edit time observed during this review was 2026-10-27T02:31:01.960Z. That is a GIS service clock, not a licensing export date, and it is not stored as one.

The layer's facility display values are Nursing Facility, Assisted Living Facility, Residential Care Facility, and Adult Foster Home. Its status values include Active, Pending, Unlicensed, and several closed statuses. It does not use the provider export's Open status. A count-only query returned 3,907 adult foster home points and 1,583 points with status Active. The verified development directory remains 1,584 open homes. Those counts were not reconciled, and no facility rows were downloaded.

Oregon's map stays off because the accepted export has no coordinates, the GIS layer is a different dataset, its active count does not match the directory, its edit time is not an export date, and plotting its geometry would publish street locations.

## California

The California Department of Social Services publishes Community Care Licensing facilities at https://data.chhs.ca.gov/dataset/ccl-facilities. The package metadata clock observed during this review was 2025-11-06T23:26:08.051889. The Residential Care Facilities for the Elderly and Adult Residential Facilities files each carried a catalog modification time of 2025-05-27. Those clocks are not a recorded licensing export date. The files also contain a `file_date` column, and no value from that column was read.

A field-only query, with zero facility rows saved, showed the same columns on both files: facility type, number, name, licensee, administrator, telephone, address, city, state, ZIP, county, regional office, capacity, status, license first date, closed date, and file date. Neither file has a latitude or longitude column. The field query reported 12,522 residential care facilities for the elderly and 10,498 adult residential facilities. Those totals are catalog counts, not an accepted directory.

The residential care facility for the elderly and the adult residential facility are the candidate types for a later decision. Child care centers, family child care homes, 24-hour residential care for children, foster family agencies, and home care organizations are outside this directory. Address, telephone, licensee, and administrator values are present in the open data and are not accepted public output.

The Department's facility-search welcome page, https://www.cdss.ca.gov/inforesources/community-care-licensing/facility-search-welcome, says the search covers licensed facilities throughout California and keeps five years of facility information. It also says a facility must provide its current licensing information on request. The older search host `www.ccld.dss.ca.gov/carefacilitysearch/` returned HTTP 503 during this review, so no per-facility disclosure link is adopted.

California remains unpublished. Its map and refresh stay disabled.

## Gate

A candidate map can be described as ready only when official coordinate columns exist, a recorded `YYYY-MM-DD` export date matches the offered date, there are no duplicate source ids, and there are no blockers. Refresh execution stays off even then. This proposal writes no audit row and changes no database.

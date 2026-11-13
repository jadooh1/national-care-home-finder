# Publication blocker evidence

Michigan and Pennsylvania stay unpublished. This check reads the official field key and the official directory pages. It does not recount source files, copy an address, invent a status, or create a disclosure link.

## Michigan supplemental address

The LARA adult foster care record description pairs column E with `Facility Supplemental Address`, column F with `Street Address`, and column Y with `Licensee Address`. Column Z is `Licensee Supplemental Address`. The key names those fields and does not say that the facility supplemental field is a physical location, a mailing address, or a unit line. The words physical and mailing do not appear in that description.

The supplemental column stays separate from the street column. `supplementalAddressRole` returns null. Michigan remains blocked on `supplemental-address-is-not-defined-as-a-physical-or-mailing-address`, and publication-eligible rows stay 0.

## Pennsylvania disclosure

The Department of Human Services provider directory is a search form. Its result route is `Home/HumanServicesProviderDirectorySearchResult`. The directory page and the licensed-facilities spatial search page do not publish a facility-number route, a license-number route, or an inspection-detail route. The open-data object id remains a source record id, not a license number, so it cannot be joined to a facility page that the directory does not name.

`pennsylvaniaDisclosureUrl` returns null for every source record id. The daily-refresh sentence on the directory remains a refresh notice, not an export date. Pennsylvania remains blocked on `no-per-facility-disclosure-link-is-recorded`.

## Publication

Washington stays public. Oregon stays on its development directory. No directory path or map path is added.

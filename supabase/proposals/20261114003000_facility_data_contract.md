# Facility data contract

This is an application contract. It does not add a table, change `facilities`, or load California or Oregon rows. Washington’s public directory, owner facility read, and owner eligibility stay on their current fields. No other state becomes public or eligible for an owner claim.

## Contract

A facility record keeps these values separate:

| Field | Meaning |
| --- | --- |
| Facility ID | `facilities.id` when the row already exists there. A source id is not copied into this field. |
| State | Two-letter postal code. |
| Name | Official facility name already accepted for that state. |
| Address | Street, city, county, and postal code. A city or county does not fill a missing street. |
| License | Official license number. A source id or facility number is not stored here unless that state already treats it as the license. |
| Status | The status value already stored for that state. Historical file text stays unreliable. |
| Source attribution | Source name, source URL, and official export date. A missing date stays null. |
| Disclosure link | An official facility-specific URL already produced for that state. An unadopted route stays null. |
| Coordinates | Latitude and longitude only when the accepted source has both. Otherwise both stay null. |

Publication on this contract is `public` only for Washington. Owner claims stay limited to `ENABLED_OWNER_FACILITY_STATES`, which is Washington only.

## Washington

The listed directory already supplies `id`, `canonical_name`, `address_line1`, `city`, `county`, `state_code`, `postal_code`, `license_number`, and `record_status`. The map read also supplies `latitude` and `longitude`. The source name remains `wa_dshs_afh`. The source URL and export date remain the existing DSHS locator and `2026-11-09`. The disclosure link remains `washingtonDisclosureUrl`. A listed row that does not include coordinates records them as unavailable; it does not receive invented coordinates.

## Oregon

The development directory is unchanged and is still not an owner-claim source. This contract does not publish it.

| Field | Recorded state |
| --- | --- |
| Facility ID | Absent. The public row key is `source_id`, not `facilities.id`. |
| Name | Present as `facility_name`. |
| Address | Street and postal code are absent. City and county are present and are not copied into the street. |
| License | Absent. Oregon has no public license number. |
| Status | Present as `Open` on rows the current directory accepts. |
| Source attribution | The ODHS provider search URL is present. No export date is recorded. |
| Disclosure link | Present as the existing ODHS profile URL. |
| Coordinates | Absent. The accepted export has no coordinate columns. |

## California

California stays unpublished. No California value is copied into `facilities`.

| Field | Recorded state |
| --- | --- |
| Facility ID | Absent. Open-data rows are not `facilities.id` values. |
| Name | Present in `facility_name` and not accepted into this contract. |
| Address | Present in `facility_address` and not accepted. |
| License | Present in `facility_number` and not accepted as a stored license. |
| Status | Unreliable. `LICENSED` is historical file text, confirmed live conflicts remain, and no authoritative ISO export date is recorded. |
| Source attribution | The CDSS open-data package URL is present. No export date is recorded. |
| Disclosure link | Unreliable. No profile URL is adopted. A detail route was observed for one residential-care example and one adult-residential example, and the open-data status was not confirmed. |
| Coordinates | Absent. The open-data files have no coordinate columns. |

## Validation

The contract reports missing street addresses, duplicate license numbers inside one state, state codes outside the fifty postal codes, and coordinates that are missing or not finite. Blank licenses are not duplicates. The same license in two states is not a duplicate. These findings do not rewrite Washington rows.

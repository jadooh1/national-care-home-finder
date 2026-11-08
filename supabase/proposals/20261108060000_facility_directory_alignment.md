# Facility directory alignment

This proposal is not applied. It records the read-only production census taken after the owner and administrator functions were present, and it prepares the only data change that census supports.

The file does not set `nchf.facility_alignment_authorization` or `nchf.facility_alignment_target`. A later human sets those to `authorize-facility-alignment` and `yiehgstweswxjakbcdzc` before running it. Any other target is refused. A second run is a no-op once the audit row and the reviewed counts are present. Rollback restores the 6,231 aligned rows to `unverified`, clears the three source columns, restores the previous `AFH` eligibility predicate, and does not delete facilities.

## Production census

Read-only transaction on PostgreSQL 17.11. All ten owner and administrator functions are installed, along with `listing_edit_events`, `published_owner_listings`, `wa_afh_published_owner_content`, and `nchf_owner_admin_surface_audit`.

| Set | Count |
| --- | ---: |
| Facilities | 8,121 |
| Directory `wa_dshs_listed_facilities` | 6,231 |
| Map `wa_afh_map_facilities` | 6,231 |
| License comparison rows, all distinct and all present on a facility | 6,231 |
| Outside the directory | 1,890 |
| Eligible after this proposal | 6,231 |
| Unmatched | 1,890 |
| Ambiguous | 0 |
| Duplicate license keys | 0 |
| `source_matched` now | 0 |
| `verified` now | 0 |
| Owner claims and listing edits | 0 |

Every facility is Washington, type `AF`, numeric license, unique license, null presence, and `unverified`. The three source columns are null on all 8,121 rows. There is no reserved test home.

The 1,890-row gap is not a type, state, or presence difference. All 1,890 are `AF` and Washington, and none of their licenses appear in `wa_dshs_license_comparison`. None of them share a license with a directory row. They stay `unverified`.

## Type mismatch

The live directory and map require `facility_type = 'AF'` plus a comparison-list license. `submit_owner_claim` and `nchf_owner_admin_facility_is_listed` require `facility_type = 'AFH'` and `record_status = 'source_matched'`. Changing `AF` to `AFH` would remove the 6,231 directory rows. This proposal does not change `facility_type`. It fills `source_name`, `license_category`, and `normalized_license_number` and sets `record_status` to `source_matched` only for the 6,231 directory rows, then changes the claim, listing, and published-content predicates from `AFH` to `AF` plus directory membership.

Development was not used as the census. Its catalog is a different shape: 6,284 facilities, all `AFH`, 6,278 directory rows, and no license-comparison table. The proposal was run there twice and refused both times before any write, first for the missing authorization settings and then because the owner-function baseline is absent. A rolled-back development transaction changed one listed row from `AFH` to `AF` and that row left both the directory and the map; restoring `AFH` brought it back. The alignment update matched zero development rows. Anonymous role could not update a facility or submit a claim. After rollback the development counts were unchanged: 6,284 facilities, 6,278 directory rows, 6,278 map rows, 3 owner claims, and 0 `AF` rows.

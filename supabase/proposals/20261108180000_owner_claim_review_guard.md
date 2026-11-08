# Owner-claim review guard

Production read on 2026-11-08, after the facility alignment:

| Check | Result |
|---|---|
| Facilities / `source_matched` / unverified / type `AF` | 8,121 / 6,231 / 1,890 / 8,121 |
| Directory / map | 6,231 / 6,231 |
| Owner claims / listing edits | 0 / 0 |
| `submit_owner_claim` requires `AF` and directory membership | yes |
| Listing submit and publish call `nchf_owner_admin_facility_is_listed` | yes |
| Anonymous execute on claim, listing, and the helper | denied, denied, denied |

`admin_approve_owner_claim` on production still approves any pending claim, does not stop a second approval for the same facility, and does not write `owner_claim_events`. The production unique index `owner_claims_one_active_per_user_facility` limits only one active claim per person and facility. A different person can still be approved for the same home. Development has the extra unique index `owner_claims_one_approved_claim_per_facility`, which production does not. `admin_reject_owner_claim` rejects a pending claim and also does not write an event. Development already has the guarded functions. A rolled-back development session accepted an eligible `AFH` claim, rejected an unverified facility and a production-shaped `AF` facility, approved the eligible claim, stored a listing edit, and left counts at 6,284 facilities, 3 claims, and 3 listing edits.

The forward proposal replaces only those two review functions. It does not change facility rows or the new eligibility rule. The administrator notice that said approval grants no listing access is corrected in the same change: an approved claim is what allows a listing proposal.

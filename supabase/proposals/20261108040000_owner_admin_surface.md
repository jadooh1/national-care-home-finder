# Owner and administrator surface

This proposal is not applied. It adds the ten functions and two relations the deployed owner and administrator screens call, plus the publication tables those functions need. It does not modify facility rows or record status.

The file does not set `nchf.owner_admin_surface_authorization` or `nchf.owner_admin_surface_target`. A later human sets those to `authorize-owner-admin-surface` and `yiehgstweswxjakbcdzc` before running it. Any other target is refused. A second run is a no-op. Rollback drops only the objects this proposal created, and only while the new tables are empty.

Anonymous roles receive no execute privilege and no write privilege on the new tables. Administrator list, publish, and withdraw functions require an `app_admins` row and reject self-review. Listing submission uses the same source-matched AFH predicate as `submit_owner_claim`.

## Claim eligibility dry run

`20261108040000_claim_eligibility_dry_run.sql` is read only. On a disposable classifier fixture it returns 0 claim-eligible, 1 unique directory home, 1 unmatched home, and 2 ambiguous homes.

The last completed production read, before this proposal, showed 8,121 facilities, 6,231 directory rows, 0 `source_matched`, and 0 `verified`. All 8,121 rows were type `AF` with null presence. That leaves 1,890 facilities outside the directory. The duplicate-license portion of those directory rows was not measured again for this proposal. No production classification is included.

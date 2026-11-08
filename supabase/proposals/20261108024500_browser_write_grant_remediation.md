# Browser write grant remediation

This change is a proposal. It was not applied to production or development.

Production schema alignment stopped before creating its audit table because `anon` and `authenticated` hold table write grants. This proposal removes only those confirmed grants. It does not change the alignment guard, policies, functions, views, or facility rows.

## Confirmed grants

On project `yiehgstweswxjakbcdzc`:

- `anon` and `authenticated` have `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`, and `MAINTAIN` on `public.facilities`.
- Both roles have those same seven privileges on `public.owner_claims`.
- `authenticated` has `INSERT` on `public.listing_edits`.

`SELECT` on `public.facilities` stays. The alignment run had already accepted the baseline of 8,121 facilities, 0 claims, 0 listing edits, 1 administrator, 0 verified, 0 source-matched, and facilities row level security enabled without force.

## Effective browser access

Facilities row level security is enabled and the reviewed policy is a `SELECT` policy. A browser `INSERT`, `UPDATE`, or `DELETE` on `public.facilities` is already denied by that policy. `TRUNCATE` is not limited by that policy. `anon` can truncate `public.owner_claims`. `REFERENCES`, `TRIGGER`, and `MAINTAIN` are browser write-related privileges and are revoked with the others.

`INSERT`, `UPDATE`, and `DELETE` on `public.owner_claims`, and `INSERT` on `public.listing_edits`, are direct browser writes. Owner claims, listing edits, and administrator actions in the application call `SECURITY DEFINER` functions. Those functions run as their owner and do not need these browser table grants. The functions are not created by this proposal. Revoking the grants does not remove `SELECT` and does not change `public.app_admins`.

## Permission change

The transaction revokes:

- `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`, and `MAINTAIN` on `public.facilities` from `anon` and `authenticated`
- those same seven privileges on `public.owner_claims` from `anon` and `authenticated`
- `INSERT` on `public.listing_edits` from `authenticated`

It stops if any other browser write grant is present, if only some of these grants are present, or if the target is not `yiehgstweswxjakbcdzc`. A second run is a no-op after the audit row exists. Rollback restores this exact set and only while the baseline counts still match.

## Execution

Do not run this from the pull request. A later human approval sets `nchf.browser_write_remediation_authorization` and `nchf.browser_write_remediation_target` for one transaction. This repository does not set those values.

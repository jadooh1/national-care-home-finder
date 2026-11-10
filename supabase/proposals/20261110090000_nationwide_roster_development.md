# Development-only nationwide roster proposal

This proposal is not applied. It prepares one additive table, `public.nationwide_roster`, for a later development-only review. It does not load rows, alter `wa_dshs_listed_facilities`, `wa_afh_map_facilities`, or `or_odhs_listed_afh`, publish a state, or change billing or public analytics.

The forward file is `supabase/proposals/20261110090000_nationwide_roster_development.sql`. The rollback file is `supabase/proposals/20261110090000_nationwide_roster_development_ROLLBACK.sql`. Neither file is in `supabase/migrations`. Both refuse to run unless a later session sets a separate authorization value. That value does not prove which database is connected.

## Record rules

A certification number is accepted only as a certification. The license identifier stays empty on that row. A license row cannot also hold a certification number. An object id and a source id stay in the source-record field and cannot fill the license or certification fields. A facility id stays in its own field.

An address value requires provenance for its own role. A mailing, supplemental, or unverified value cannot be copied into the physical address.

`official_export_date` and `source_publication_date` are PostgreSQL `date` columns, so an impossible calendar date is rejected. Freshness can be verified only when an official export date is present. A retrieval timestamp is a separate `timestamptz`.

A facility-specific disclosure link requires a URL and recorded verification evidence. `disclosure_verified` stays false unless that evidence is stored. A URL by itself does not verify the link and cannot make a row public. A generic search page or an unverified URL pattern cannot make a row public. A normalized category or status requires the original value. Coordinates are optional. When present, they need a source, an accuracy value, and a range. Georeferenced coordinates cannot be used on a public row. Publication defaults to `unpublished`.

The same identifier value can be stored for different issuing authorities, different identifier types, or different states. The same state, issuing authority, identifier type, and identifier value cannot be stored twice.

Row level security is enabled and no public policy is created.

## Execution plan

Do not run this plan until a person authorizes that exact development action.

1. Confirm the connection is the development project by its server identity. Do not treat a session setting as that proof. Do not use the production project.
2. Confirm the Washington and Oregon directory relations and their current counts before any statement from this proposal.
3. In that same development session, set `nchf.nationwide_roster_authorization` to `authorize-development-nationwide-roster`.
4. Run the forward proposal file.
5. Run the validation procedure below.
6. Leave the table empty. Do not publish a state.

## Validation procedure

After a future authorized run, and before any roster row is loaded:

- `public.nationwide_roster` exists, row level security is on, and the table has no rows.
- `anon` and `authenticated` have no privileges on it.
- The Washington listed count and the Oregon listed count are unchanged.
- No directory or map path was added.
- A rolled-back probe rejects a certification stored in `license_identifier`, a date of `2026-02-31`, a public row with a generic search disclosure, and a supplemental address copied into the physical address.
- A rolled-back probe accepts a certification row whose license identifier is null and whose publication is `unpublished`.
- The probe transaction is rolled back, so the table remains empty.

## Rollback

Set `nchf.nationwide_roster_rollback_authorization` to `authorize-development-nationwide-roster-rollback` in a confirmed development session, then run the rollback file. That authorization drops `public.nationwide_roster` only when the table is empty. If the table contains rows, the same session must also set `nchf.nationwide_roster_populated_rollback_authorization` to `authorize-development-nationwide-roster-populated-rollback`. Without that second value, rollback stops and the rows remain. Washington and Oregon relations stay in place.

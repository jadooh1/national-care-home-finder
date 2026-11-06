# Phase 5A application change proposal

No application source change is proposed in this phase.

The directory page, facility detail page, owner search, and administrator facility lookup already select columns by name. PostgreSQL will append `state_code`, `postal_code`, `licensed_capacity`, and `record_status` to `wa_dshs_listed_facilities`. After the development database change is authorized and applied, these existing selects match the view:

- `app/washington/page.tsx` selects `id, canonical_name, address_line1, city, county, state_code, postal_code, license_number, licensed_capacity, record_status`.
- `app/washington/[license]/page.tsx` selects that same list.
- `app/owner/dashboard/page.tsx` selects `id, canonical_name, address_line1, city, county, license_number`.
- `app/admin/claims/page.tsx` selects `id, canonical_name, license_number, city`.
- `app/owner/listing-edits/page.tsx` and `app/admin/listing-edits/page.tsx` select `id, canonical_name, license_number`.

`lib/supabase.ts` continues to use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. This proposal does not add a service-role key, a new client, or a server route. Direct reads of `public.facilities` by the public roles are limited to the directory and map columns. `source_hash` and `public_phone` are not among them. Rollback is a security downgrade: restoring the original table-level `SELECT` makes every facilities column readable again for the roles that held that grant, including `source_hash` and `public_phone`. The rollback script refuses unless the same session sets `nchf.phase5a_rollback_authorization` to `authorize-directory-visibility-select-downgrade`. That setting is a separate authorization from applying the forward script.

These application gaps stay outside Phase 5A:

- The detail page still queries `wa_dshs_disclosure_links`, which is absent. The page already ignores that error and uses the constructed DSHS disclosure URL.
- License status, geocode accuracy, and the October 23, 2026 footer date are unchanged.
- The map page select list is unchanged. The database view gains the published-source filter, keeps `security_invoker=true`, and still exposes the columns that page already requests.

No application file is modified by this proposal.

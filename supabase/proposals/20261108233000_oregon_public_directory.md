# Oregon public directory proposal

This proposal is not applied. It adds one read-only view on the development project. It does not copy rows into `public.facilities`, grant access to `public.oregon_odhs_afh_public`, or change the Washington directory, map, or owner functions.

## Application behavior

`/oregon` and `/oregon/[sourceId]` read `or_odhs_listed_afh` only when the configured Supabase host is `ajjsyloyihcqdomywhik.supabase.co`. Every other host, including production, keeps Oregon as a homepage label and does not query the view. The pages do not call `development_list_oregon_afh`.

The view returns only `source_id`, `facility_name`, `city`, `county`, `license_type`, `status`, `licensed_beds`, and `official_profile_url`. Licensed beds stay a licensed size from 1 to 5. The pages say those beds are not vacancies, and that 20 open homes recorded with 0 licensed beds are left out. No export date is stored, and the pages do not claim the list is live.

## Proposed database change

Apply `20261108233000_oregon_public_directory.sql` only on development project `ajjsyloyihcqdomywhik`, and only while that database still has 6,284 Washington adult family homes and the Oregon table still has the accepted 1,584-row set.

The view uses `security_barrier` and `security_invoker = false`. `SELECT` is granted to `anon` and `authenticated`. `PUBLIC` and `service_role` receive no privilege on the view. The base table grants stay revoked.

## Rollback

```sql
drop view if exists public.or_odhs_listed_afh;
```

Rollback removes the public view only. It does not drop `public.oregon_odhs_afh_public` or `public.development_list_oregon_afh`.

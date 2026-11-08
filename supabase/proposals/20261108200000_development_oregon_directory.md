# Development Oregon directory proposal

This proposal is not applied. It adds one read function for administrators on the development project. It does not grant `anon`, `authenticated`, or `service_role` access to `public.oregon_odhs_afh_public`, and it does not publish Oregon homes on the Washington directory, map, or homepage.

## Application behavior

`/development/oregon` calls `development_list_oregon_afh` only when the configured Supabase host is `ajjsyloyihcqdomywhik.supabase.co` and a session exists. Every other host, including production, renders a withheld notice and does not call the database. The homepage does not link to the page. The page is marked `noindex`.

Returned rows must still match the eight approved fields and the existing ODHS rules. A row with an extra field, a Washington adult family home label, a closed status, or licensed beds outside 1–5 is discarded in the browser before display.

## Proposed database change

Apply `20261108200000_development_oregon_directory.sql` only on development project `ajjsyloyihcqdomywhik`, and only while that database still has 6,284 Washington adult family homes and the Oregon table still has exactly the eight approved columns.

The function is `security definer` with an empty search path. It raises `administrator required` unless `auth.uid()` is in `public.app_admins`. Execute is granted to `authenticated` and revoked from `public`, `anon`, and `service_role`. The table grants stay unchanged.

## Rollback

```sql
drop function if exists public.development_list_oregon_afh(text, text, text, integer, integer);
```

Rollback removes the read function only. It does not drop `public.oregon_odhs_afh_public`.

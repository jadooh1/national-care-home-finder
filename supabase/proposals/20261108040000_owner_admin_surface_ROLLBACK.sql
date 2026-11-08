-- Rolls back only the objects this proposal created, and only while those
-- new tables are still empty. It does not delete facility, claim, or edit rows.

do $rollback$
begin
  if current_setting('nchf.owner_admin_surface_authorization', true)
       is distinct from 'authorize-owner-admin-surface'
     or current_setting('nchf.owner_admin_surface_target', true)
       is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'owner admin surface target is not the reviewed production project';
  end if;
  if to_regclass('public.nchf_owner_admin_surface_audit') is null then
    raise exception 'owner admin surface audit is absent';
  end if;
  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.listing_edit_events) <> 0
     or (select count(*) from public.published_owner_listings) <> 0
     or (select count(*) from public.published_owner_listing_events) <> 0 then
    raise exception 'refusing rollback because owner admin rows exist';
  end if;

  drop view if exists public.wa_afh_published_owner_content;
  drop function if exists public.submit_listing_edit(uuid, text, text);
  drop function if exists public.admin_list_owner_claims(integer, uuid);
  drop function if exists public.admin_list_listing_edits(integer, timestamptz, uuid, text);
  drop function if exists public.admin_count_listing_edits();
  drop function if exists public.admin_publish_listing_edit(uuid);
  drop function if exists public.admin_withdraw_published_owner_listing(uuid, text);
  drop function if exists public.admin_list_owner_publication_events(integer, timestamptz, uuid);
  drop function if exists public.owner_list_listing_edits(integer, timestamptz, uuid);
  drop function if exists public.owner_list_listing_edit_events(integer, timestamptz, uuid);
  drop function if exists public.owner_list_publication_history(integer, timestamptz, uuid);
  drop table if exists public.published_owner_listing_events;
  drop table if exists public.published_owner_listings;
  drop table if exists public.listing_edit_events;
  drop function if exists public.nchf_owner_admin_facility_is_listed(uuid);
  drop function if exists public.nchf_owner_admin_publication_guard();
  drop table if exists public.nchf_owner_admin_surface_audit;

  if to_regprocedure('public.submit_owner_claim(uuid, text)') is null
     or to_regprocedure('public.admin_approve_owner_claim(uuid)') is null then
    raise exception 'rollback removed an existing claim function';
  end if;
end;
$rollback$;

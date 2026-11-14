-- REVIEW ONLY. Do not apply this file to Supabase.
-- The development database already has an owner-scoped view. Production does not.
-- This proposal adds that view for a later production review. It does not restore
-- select on wa_afh_published_owner_content, and it does not change billing,
-- subscriptions, claims, proposals, publications, or administrator review functions.

do $preflight$
begin
  if current_setting('nchf.owner_listing_authorization', true) is distinct from 'review-owner-listing-read' then
    raise exception 'owner listing proposal requires review authorization';
  end if;
  if current_setting('nchf.owner_listing_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'owner listing proposal refuses this database target';
  end if;
  if to_regprocedure('public.nchf_phase5g_facility_is_listed(uuid)') is not null then
    raise exception 'owner listing proposal refuses the development listing function';
  end if;
  if to_regclass('public.wa_afh_claimed_owner_content') is not null then
    raise exception 'owner listing proposal refuses an existing claimed view';
  end if;
  if to_regclass('public.published_owner_listings') is null
     or to_regclass('public.facilities') is null
     or to_regclass('public.owner_claims') is null
     or to_regclass('public.app_admins') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null
     or to_regclass('public.wa_afh_published_owner_content') is null then
    raise exception 'owner listing proposal is missing a required relation';
  end if;
end;
$preflight$;

create view public.wa_afh_claimed_owner_content
with (security_barrier = true, security_invoker = false) as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where exists (
    select 1
    from public.facilities as facility
    where facility.id = content.facility_id
      and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
      and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'::text
      and facility.source_name = 'wa_dshs_afh'::text
      and facility.license_category = 'afh'::text
      and facility.facility_type = 'AF'::text
      and facility.state_code = 'WA'::text
      and facility.record_status = 'source_matched'::text
      and facility.normalized_license_number = btrim(facility.license_number)
      and facility.license_number ~ '^[0-9]{1,20}$'::text
      and facility.presence is distinct from 'absent'::text
      and exists (
        select 1
        from public.wa_dshs_listed_facilities as listed
        where listed.id = facility.id
      )
  )
  and (
    exists (
      select 1
      from public.owner_claims as claim
      where claim.facility_id = content.facility_id
        and claim.claimant_user_id = auth.uid()
        and claim.verification_status = 'approved'
    )
    or exists (
      select 1
      from public.app_admins as admin_row
      where admin_row.user_id = auth.uid()
    )
  )
offset 0;

revoke all on table public.wa_afh_claimed_owner_content from public, anon, authenticated;
revoke all on table public.wa_afh_published_owner_content from public, anon, authenticated;

do $service_role$
begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    revoke all on table public.wa_afh_claimed_owner_content from service_role;
    revoke all on table public.wa_afh_published_owner_content from service_role;
  end if;
end;
$service_role$;

grant select on table public.wa_afh_claimed_owner_content to authenticated;

do $permissions$
declare
  role_name text;
  privilege text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if has_table_privilege(role_name, 'public.wa_afh_published_owner_content', 'SELECT') then
      raise exception 'owner listing proposal left the ungated view readable';
    end if;
  end loop;
  if has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'owner listing proposal exposed claimed text to anonymous visitors';
  end if;
  if not has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'owner listing proposal did not grant the claimed view';
  end if;
  foreach privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
    if has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', privilege)
       or has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', privilege) then
      raise exception 'owner listing proposal left a write privilege on the claimed view';
    end if;
  end loop;
end;
$permissions$;

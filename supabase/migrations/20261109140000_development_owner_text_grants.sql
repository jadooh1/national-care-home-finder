-- Versioned record of the development owner-text grant change.
-- This does not edit an earlier migration. It does not drop publication rows,
-- audit events, claims, or official records. It refuses the production project.
-- This pull request does not apply the file.

do $preflight$
begin
  if current_setting('nchf.billing_environment', true) is distinct from 'development' then
    raise exception 'owner text grant change requires nchf.billing_environment=development';
  end if;
  if current_setting('nchf.supabase_project_ref', true) = 'yiehgstweswxjakbcdzc' then
    raise exception 'refusing the production project';
  end if;
  if to_regclass('public.wa_afh_published_owner_content') is null
     or to_regclass('public.published_owner_listing_events') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null then
    raise exception 'owner text grant change is missing a required relation';
  end if;
end;
$preflight$;

revoke all on table public.wa_afh_published_owner_content from public, anon, authenticated;

create or replace view public.wa_afh_claimed_owner_content
with (security_barrier = true, security_invoker = false) as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where public.nchf_phase5g_facility_is_listed(content.facility_id)
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
  );

revoke all on table public.wa_afh_claimed_owner_content from public, anon, authenticated;
grant select on table public.wa_afh_claimed_owner_content to authenticated;

do $guard$
begin
  if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'owner text remains readable without an approved claim';
  end if;
  if not has_table_privilege('anon', 'public.wa_dshs_listed_facilities', 'SELECT') then
    raise exception 'official directory is no longer public';
  end if;
  if not has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'an approved owner cannot read claimed owner text';
  end if;
end;
$guard$;

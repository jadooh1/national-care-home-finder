-- Development-only application of the archived-facility read and claim guard.
-- This file does not set its own authorization. Run it only against
-- project ajjsyloyihcqdomywhik, and only in one transaction with the
-- migration supabase/migrations/20261107234500_absent_facility_public_read.sql.
-- It does not delete facilities or owner claims.
--
--   set nchf.absent_visibility_authorization = 'authorize-development-absent-visibility';
--   set nchf.absent_visibility_target = 'ajjsyloyihcqdomywhik';

begin;

do $guard$
declare
  listed_count bigint;
  mapped_count bigint;
  claim_count bigint;
begin
  if current_setting('nchf.absent_visibility_authorization', true)
     is distinct from 'authorize-development-absent-visibility' then
    raise exception 'archived visibility change was not authorized in this session';
  end if;
  if current_setting('nchf.absent_visibility_target', true)
     is distinct from 'ajjsyloyihcqdomywhik' then
    raise exception 'archived visibility target is not the development project';
  end if;
  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into mapped_count from public.wa_afh_map_facilities;
  if listed_count <> 6278 or mapped_count <> 6278 then
    raise exception 'live public counts are listed % and mapped %, expected 6278 and 6278',
      listed_count, mapped_count;
  end if;
  select count(*) into claim_count from public.owner_claims;
  perform set_config('nchf.absent_visibility_claim_count', claim_count::text, true);
  perform set_config('nchf.absent_visibility_edit_count', (select count(*)::text from public.listing_edits), true);
  perform set_config('nchf.absent_visibility_admin_count', (select count(*)::text from public.app_admins), true);
end
$guard$;

\ir ../migrations/20261107234500_absent_facility_public_read.sql

do $verify$
declare
  listed_count bigint;
  mapped_count bigint;
  hidden bigint;
  visible_correction bigint;
begin
  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into mapped_count from public.wa_afh_map_facilities;
  if listed_count <> 6278 or mapped_count <> 6278 then
    raise exception 'post-check counts are listed % and mapped %, expected 6278 and 6278',
      listed_count, mapped_count;
  end if;
  if (select count(*)::text from public.owner_claims)
       is distinct from current_setting('nchf.absent_visibility_claim_count')
     or (select count(*)::text from public.listing_edits)
       is distinct from current_setting('nchf.absent_visibility_edit_count')
     or (select count(*)::text from public.app_admins)
       is distinct from current_setting('nchf.absent_visibility_admin_count') then
    raise exception 'owner, edit, or administrator counts changed';
  end if;

  set local role anon;
  select count(*) into hidden
  from public.facilities
  where license_number in ('752686', '755649', '757132', '758334');
  select count(*) into visible_correction
  from public.facilities
  where license_number = '759147';
  reset role;
  if hidden <> 0 or visible_correction <> 1 then
    raise exception 'public read hid a current home or still exposes an archived license';
  end if;
end
$verify$;

commit;

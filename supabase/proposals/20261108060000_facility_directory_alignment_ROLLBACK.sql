-- Rolls back only the source columns and eligibility predicate added by
-- 20261108060000_facility_directory_alignment.sql. It does not delete facilities.

do $rollback$
declare
  restored_rows integer;
begin
  if current_setting('nchf.facility_alignment_authorization', true)
       is distinct from 'authorize-facility-alignment'
     or current_setting('nchf.facility_alignment_target', true)
       is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'facility alignment target is not the reviewed production project';
  end if;
  if to_regclass('public.nchf_facility_alignment_audit') is null then
    raise exception 'facility alignment audit is absent';
  end if;
  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.published_owner_listings) <> 0
     or (select count(*) from public.wa_dshs_listed_facilities) <> 6231 then
    raise exception 'refusing rollback because owner alignment rows exist';
  end if;

  update public.facilities as facility
  set source_name = null,
      license_category = null,
      normalized_license_number = null,
      record_status = 'unverified'
  where facility.facility_type = 'AF'
    and facility.record_status = 'source_matched'
    and facility.source_name = 'wa_dshs_afh'
    and facility.license_category = 'afh'
    and exists (
      select 1
      from public.wa_dshs_listed_facilities as listed
      where listed.id = facility.id
    );
  get diagnostics restored_rows = row_count;
  if restored_rows <> 6231 then
    raise exception 'facility alignment rollback restored an unexpected number of rows';
  end if;

  create or replace function public.submit_owner_claim(p_facility_id uuid, p_evidence_notes text)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
  as $fn$
  declare
    v_actor uuid;
    v_notes text;
    v_claim uuid;
  begin
    v_actor := auth.uid();
    if v_actor is null then
      raise exception 'authentication required';
    end if;
    if not exists (
      select 1
      from auth.users as account
      where account.id = v_actor
        and account.email_confirmed_at is not null
    ) then
      raise exception 'confirmed email required';
    end if;
    v_notes := pg_catalog.btrim(p_evidence_notes);
    if v_notes is null
       or pg_catalog.char_length(v_notes) < 15
       or pg_catalog.char_length(v_notes) > 1500 then
      raise exception 'evidence notes must be 15 to 1500 characters';
    end if;
    if p_facility_id = '00000000-0000-4000-8000-000000000002'::uuid
       or not exists (
         select 1
         from public.facilities as facility
         where facility.id = p_facility_id
           and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
           and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
           and facility.source_name = 'wa_dshs_afh'
           and facility.license_category = 'afh'
           and facility.facility_type = 'AFH'
           and facility.state_code = 'WA'
           and facility.record_status = 'source_matched'
           and facility.normalized_license_number is not null
           and pg_catalog.btrim(facility.normalized_license_number, E' \t\r\n') <> ''
           and facility.license_number ~ '^[0-9]{1,20}$'
           and facility.presence is distinct from 'absent'
       ) then
      raise exception 'facility is not eligible';
    end if;
    if exists (
      select 1
      from public.owner_claims as claim
      where claim.facility_id = p_facility_id
        and claim.claimant_user_id = v_actor
        and claim.verification_status in ('pending', 'approved')
    ) then
      raise exception 'an open claim already exists';
    end if;
    insert into public.owner_claims (
      facility_id, claimant_user_id, verification_status, evidence_notes, reviewed_at
    ) values (
      p_facility_id, v_actor, 'pending', v_notes, null
    )
    returning id into v_claim;
    insert into public.owner_claim_events (
      claim_id, facility_id, actor_user_id, event_type, from_status, to_status
    ) values (
      v_claim, p_facility_id, v_actor, 'submitted', null, 'pending'
    );
    return v_claim;
  end;
  $fn$;

  create or replace function public.nchf_owner_admin_facility_is_listed(p_facility_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select exists (
      select 1
      from public.facilities as facility
      where facility.id = p_facility_id
        and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
        and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
        and facility.source_name = 'wa_dshs_afh'
        and facility.license_category = 'afh'
        and facility.facility_type = 'AFH'
        and facility.state_code = 'WA'
        and facility.record_status = 'source_matched'
        and facility.normalized_license_number is not null
        and pg_catalog.btrim(facility.normalized_license_number, E' \t\r\n') <> ''
        and facility.license_number ~ '^[0-9]{1,20}$'
        and facility.presence is distinct from 'absent'
    );
  $fn$;

  create or replace view public.wa_afh_published_owner_content
  with (security_barrier = true) as
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
      and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
      and facility.source_name = 'wa_dshs_afh'
      and facility.license_category = 'afh'
      and facility.facility_type = 'AFH'
      and facility.state_code = 'WA'
      and facility.record_status = 'source_matched'
      and facility.normalized_license_number is not null
      and pg_catalog.btrim(facility.normalized_license_number, E' \t\r\n') <> ''
      and facility.license_number ~ '^[0-9]{1,20}$'
      and facility.presence is distinct from 'absent'
  );

  drop table public.nchf_facility_alignment_audit;

  if (select count(*) from public.facilities where record_status = 'unverified') <> 8121
     or (select count(*) from public.facilities where source_name is null) <> 8121
     or (select count(*) from public.facilities where facility_type = 'AF') <> 8121
     or (select count(*) from public.wa_dshs_listed_facilities) <> 6231
     or (select count(*) from public.wa_afh_map_facilities) <> 6231 then
    raise exception 'facility alignment rollback changed directory membership';
  end if;
end;
$rollback$;

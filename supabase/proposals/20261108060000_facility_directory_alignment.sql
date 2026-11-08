-- Proposal only. This file does not set its authorization settings.
-- It does not change facility_type, presence, directory membership, or map membership.
-- A later human applies it only after setting both settings for the reviewed production project.

do $proposal$
declare
  updated_rows integer;
  claim_body text;
  helper_body text;
  view_body text;
  aligned boolean;
begin
  if current_setting('nchf.facility_alignment_authorization', true)
       is distinct from 'authorize-facility-alignment'
     or current_setting('nchf.facility_alignment_target', true)
       is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'facility alignment target is not the reviewed production project';
  end if;

  if to_regclass('public.facilities') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null
     or to_regclass('public.wa_afh_map_facilities') is null
     or to_regclass('public.wa_dshs_license_comparison') is null
     or to_regprocedure('public.submit_owner_claim(uuid, text)') is null
     or to_regprocedure('public.nchf_owner_admin_facility_is_listed(uuid)') is null
     or to_regclass('public.wa_afh_published_owner_content') is null then
    raise exception 'facility alignment requires the reviewed directory and owner functions';
  end if;

  claim_body := pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure);
  helper_body := pg_get_functiondef('public.nchf_owner_admin_facility_is_listed(uuid)'::regprocedure);
  view_body := pg_get_viewdef('public.wa_afh_published_owner_content'::regclass, true);
  aligned := to_regclass('public.nchf_facility_alignment_audit') is not null
    and (select count(*) from public.facilities) = 8121
    and (select count(*) from public.wa_dshs_listed_facilities) = 6231
    and (select count(*) from public.wa_afh_map_facilities) = 6231
    and (select count(*) from public.facilities where facility_type = 'AF') = 8121
    and (select count(*) from public.facilities where facility_type = 'AFH') = 0
    and (select count(*) from public.facilities where record_status = 'source_matched') = 6231
    and (select count(*) from public.facilities where record_status = 'unverified') = 1890
    and (select count(*) from public.facilities where record_status = 'verified') = 0
    and (select count(*) from public.facilities where source_name = 'wa_dshs_afh' and record_status = 'source_matched') = 6231
    and (select count(*) from public.facilities where source_name is null and record_status = 'unverified') = 1890
    and position('facility.facility_type = ''AF''' in claim_body) > 0
    and position('facility.facility_type = ''AFH''' in claim_body) = 0
    and position('wa_dshs_listed_facilities' in claim_body) > 0
    and position('facility.facility_type = ''AF''' in helper_body) > 0
    and position('facility.facility_type = ''AFH''' in helper_body) = 0
    and position('facility_type = ''AF''' in view_body) > 0
    and position('facility_type = ''AFH''' in view_body) = 0;
  if aligned then
    return;
  end if;
  if to_regclass('public.nchf_facility_alignment_audit') is not null then
    raise exception 'partial facility alignment is present';
  end if;

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.wa_dshs_listed_facilities) <> 6231
     or (select count(*) from public.wa_afh_map_facilities) <> 6231
     or (select count(*) from public.wa_dshs_license_comparison) <> 6231
     or (select count(distinct btrim(license_number)) from public.wa_dshs_license_comparison) <> 6231
     or (
       select count(*)
       from public.wa_dshs_license_comparison as comparison
       where not exists (
         select 1
         from public.facilities as facility
         where btrim(facility.license_number) = btrim(comparison.license_number)
       )
     ) <> 0
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.published_owner_listings) <> 0
     or (select count(*) from public.facilities where facility_type = 'AF') <> 8121
     or (select count(*) from public.facilities where facility_type = 'AFH') <> 0
     or (select count(*) from public.facilities where state_code = 'WA') <> 8121
     or (select count(*) from public.facilities where record_status = 'unverified') <> 8121
     or (select count(*) from public.facilities where record_status = 'source_matched') <> 0
     or (select count(*) from public.facilities where record_status = 'verified') <> 0
     or (select count(*) from public.facilities where presence is null) <> 8121
     or (select count(*) from public.facilities where source_name is null) <> 8121
     or (select count(*) from public.facilities where license_category is null) <> 8121
     or (select count(*) from public.facilities where normalized_license_number is null) <> 8121
     or (select count(*) from public.facilities where license_number ~ '^[0-9]{1,20}$') <> 8121
     or (select count(*) from public.facilities where id = '00000000-0000-4000-8000-000000000002') <> 0
     or (select count(*) from public.facilities where canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL') <> 0 then
    raise exception 'facility alignment counts are not the reviewed baseline';
  end if;

  if exists (
    select 1
    from (
      select btrim(license_number) as license_key
      from public.facilities
      group by btrim(license_number)
      having count(*) > 1
    ) as shared_license
  ) then
    raise exception 'duplicate facility licenses are present';
  end if;

  if (
    select count(*)
    from public.facilities as facility
    where not exists (
      select 1
      from public.wa_dshs_listed_facilities as listed
      where listed.id = facility.id
    )
  ) <> 1890
  or (
    select count(*)
    from public.facilities as facility
    where not exists (
      select 1 from public.wa_dshs_listed_facilities as listed where listed.id = facility.id
    )
    and exists (
      select 1
      from public.wa_dshs_license_comparison as comparison
      where btrim(comparison.license_number) = btrim(facility.license_number)
    )
  ) <> 0 then
    raise exception 'facility alignment outside-directory evidence changed';
  end if;

  update public.facilities as facility
  set source_name = 'wa_dshs_afh',
      license_category = 'afh',
      normalized_license_number = btrim(facility.license_number),
      record_status = 'source_matched'
  where facility.facility_type = 'AF'
    and facility.state_code = 'WA'
    and facility.record_status = 'unverified'
    and facility.presence is distinct from 'absent'
    and facility.license_number ~ '^[0-9]{1,20}$'
    and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
    and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
    and exists (
      select 1
      from public.wa_dshs_listed_facilities as listed
      where listed.id = facility.id
    );
  get diagnostics updated_rows = row_count;
  if updated_rows <> 6231 then
    raise exception 'facility alignment changed an unexpected number of rows';
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
           and facility.facility_type = 'AF'
           and facility.state_code = 'WA'
           and facility.record_status = 'source_matched'
           and facility.normalized_license_number = btrim(facility.license_number)
           and facility.license_number ~ '^[0-9]{1,20}$'
           and facility.presence is distinct from 'absent'
           and exists (
             select 1
             from public.wa_dshs_listed_facilities as listed
             where listed.id = facility.id
           )
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
        and facility.facility_type = 'AF'
        and facility.state_code = 'WA'
        and facility.record_status = 'source_matched'
        and facility.normalized_license_number = btrim(facility.license_number)
        and facility.license_number ~ '^[0-9]{1,20}$'
        and facility.presence is distinct from 'absent'
        and exists (
          select 1
          from public.wa_dshs_listed_facilities as listed
          where listed.id = facility.id
        )
    );
  $fn$;

  create or replace view public.wa_afh_published_owner_content
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
      and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
      and facility.source_name = 'wa_dshs_afh'
      and facility.license_category = 'afh'
      and facility.facility_type = 'AF'
      and facility.state_code = 'WA'
      and facility.record_status = 'source_matched'
      and facility.normalized_license_number = btrim(facility.license_number)
      and facility.license_number ~ '^[0-9]{1,20}$'
      and facility.presence is distinct from 'absent'
      and exists (
        select 1
        from public.wa_dshs_listed_facilities as listed
        where listed.id = facility.id
      )
  );

  create table public.nchf_facility_alignment_audit (
    alignment_name text primary key,
    directory_rows integer not null,
    unmatched_rows integer not null,
    ambiguous_rows integer not null,
    duplicate_license_keys integer not null,
    applied_at timestamptz not null default pg_catalog.clock_timestamp()
  );
  alter table public.nchf_facility_alignment_audit enable row level security;
  revoke all on table public.nchf_facility_alignment_audit from public, anon, authenticated;
  create policy nchf_facility_alignment_audit_no_browser_access
    on public.nchf_facility_alignment_audit
    for all
    to anon, authenticated
    using (false)
    with check (false);
  insert into public.nchf_facility_alignment_audit (
    alignment_name, directory_rows, unmatched_rows, ambiguous_rows, duplicate_license_keys
  ) values ('20261108060000', 6231, 1890, 0, 0);

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.facilities where facility_type = 'AF') <> 8121
     or (select count(*) from public.facilities where facility_type = 'AFH') <> 0
     or (select count(*) from public.facilities where record_status = 'source_matched') <> 6231
     or (select count(*) from public.facilities where record_status = 'unverified') <> 1890
     or (select count(*) from public.facilities where record_status = 'verified') <> 0
     or (select count(*) from public.wa_dshs_listed_facilities) <> 6231
     or (select count(*) from public.wa_afh_map_facilities) <> 6231
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0 then
    raise exception 'facility alignment changed facility type or directory membership';
  end if;
end;
$proposal$;

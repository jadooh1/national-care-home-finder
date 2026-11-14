-- Restore the inlined development eligibility checks and remove the seam.
-- This does not restore a production AF predicate, reopen a view, or delete
-- claims, proposals, publications, subscriptions, or audit events.

begin;

do $preflight$
begin
  if current_setting('nchf.billing_environment', true) is distinct from 'development' then
    raise exception 'owner eligibility rollback requires nchf.billing_environment=development';
  end if;
  if current_setting('nchf.supabase_project_ref', true) = 'yiehgstweswxjakbcdzc' then
    raise exception 'refusing the production project';
  end if;
  if to_regprocedure('public.nchf_owner_facility_eligible(uuid)') is null
     or pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
        not like '%nchf_owner_facility_eligible%' then
    raise exception 'owner eligibility seam is not the installed development check';
  end if;
end;
$preflight$;

create or replace function public.nchf_phase5g_facility_is_listed(p_facility_id uuid)
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
  );
$fn$;

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

create or replace function public.submit_listing_edit(
  p_facility_id uuid,
  p_field_name text,
  p_proposed_value text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_text text;
  v_edit uuid;
  v_type text;
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
  if p_field_name not in ('description', 'services', 'amenities') then
    raise exception 'field is not allowed';
  end if;
  v_text := pg_catalog.btrim(p_proposed_value);
  if v_text is null
     or pg_catalog.char_length(v_text) < 1
     or pg_catalog.char_length(v_text) > 2000 then
    raise exception 'proposed text must be 1 to 2000 characters';
  end if;
  if p_facility_id = '00000000-0000-4000-8000-000000000002'::uuid
     or not exists (
       select 1
       from public.facilities as facility
       where facility.id = p_facility_id
         and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
         and facility.source_name = 'wa_dshs_afh'
         and facility.license_category = 'afh'
         and facility.facility_type = 'AFH'
         and facility.state_code = 'WA'
         and facility.record_status = 'source_matched'
         and facility.normalized_license_number is not null
         and pg_catalog.btrim(facility.normalized_license_number, E' \t\r\n') <> ''
         and facility.license_number ~ '^[0-9]{1,20}$'
     ) then
    raise exception 'facility is not eligible';
  end if;
  if not exists (
    select 1
    from public.owner_claims as claim
    where claim.facility_id = p_facility_id
      and claim.claimant_user_id = v_actor
      and claim.verification_status = 'approved'
  ) then
    raise exception 'approved claim required';
  end if;
  select type_row.typname
    into v_type
  from pg_catalog.pg_attribute as attribute
  join pg_catalog.pg_type as type_row
    on type_row.oid = attribute.atttypid
  where attribute.attrelid = 'public.listing_edits'::regclass
    and attribute.attname = 'proposed_value';
  if v_type = 'jsonb' then
    execute
      'insert into public.listing_edits (
         facility_id, submitted_by_user_id, field_name, proposed_value, review_status, reviewed_at
       ) values ($1, $2, $3, pg_catalog.to_jsonb($4::text), ''pending'', null)
       returning id'
      into v_edit
      using p_facility_id, v_actor, p_field_name, v_text;
  else
    insert into public.listing_edits (
      facility_id, submitted_by_user_id, field_name, proposed_value, review_status, reviewed_at
    ) values (
      p_facility_id, v_actor, p_field_name, v_text, 'pending', null
    )
    returning id into v_edit;
  end if;
  insert into public.listing_edit_events (
    edit_id, facility_id, actor_user_id, event_type, from_status, to_status
  ) values (
    v_edit, p_facility_id, v_actor, 'submitted', null, 'pending'
  );
  return v_edit;
end;
$fn$;

drop function public.nchf_owner_facility_eligible(uuid);

do $guard$
begin
  if to_regprocedure('public.nchf_owner_facility_eligible(uuid)') is not null
     or pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
        like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
        not like '%facility_type = ''AFH''%' then
    raise exception 'owner eligibility rollback did not restore the development predicate';
  end if;
end;
$guard$;

commit;

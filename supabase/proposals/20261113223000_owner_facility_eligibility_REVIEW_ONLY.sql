-- Development-only owner eligibility seam. Do not apply to production.
-- Washington remains the only enabled state. This does not import facilities,
-- publish owner text, change subscriptions, or replace a production AF view.

begin;

do $preflight$
declare
  listed text;
  claim_fn text;
  edit_fn text;
begin
  if current_setting('nchf.billing_environment', true) is distinct from 'development' then
    raise exception 'owner eligibility seam requires nchf.billing_environment=development';
  end if;
  if current_setting('nchf.supabase_project_ref', true) = 'yiehgstweswxjakbcdzc' then
    raise exception 'refusing the production project';
  end if;
  if to_regprocedure('public.nchf_phase5g_facility_is_listed(uuid)') is null
     or to_regprocedure('public.submit_owner_claim(uuid, text)') is null
     or to_regprocedure('public.submit_listing_edit(uuid, text, text)') is null then
    raise exception 'owner eligibility seam is missing a development function';
  end if;
  if to_regprocedure('public.nchf_owner_facility_eligible(uuid)') is not null then
    raise exception 'owner eligibility seam already exists';
  end if;
  listed := pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure);
  claim_fn := pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure);
  edit_fn := pg_get_functiondef('public.submit_listing_edit(uuid, text, text)'::regprocedure);
  if listed not like '%facility_type = ''AFH''%'
     or listed like '%nchf_owner_facility_eligible%'
     or claim_fn not like '%facility_type = ''AFH''%'
     or edit_fn not like '%facility_type = ''AFH''%' then
    raise exception 'refusing to replace a non-development eligibility predicate';
  end if;
  if listed ~ 'facility_type = ''AF''([^H]|$)'
     or claim_fn ~ 'facility_type = ''AF''([^H]|$)'
     or edit_fn ~ 'facility_type = ''AF''([^H]|$)' then
    raise exception 'refusing to change the production AF predicate';
  end if;
end;
$preflight$;

create function public.nchf_owner_facility_eligible(p_facility_id uuid)
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

revoke all on function public.nchf_owner_facility_eligible(uuid) from public, anon, authenticated;

create or replace function public.nchf_phase5g_facility_is_listed(p_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select public.nchf_owner_facility_eligible(p_facility_id);
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
  if not public.nchf_owner_facility_eligible(p_facility_id) then
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
  if not public.nchf_owner_facility_eligible(p_facility_id) then
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

do $guard$
begin
  if has_function_privilege('anon', 'public.nchf_owner_facility_eligible(uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.nchf_owner_facility_eligible(uuid)', 'EXECUTE')
     or has_function_privilege('public', 'public.nchf_owner_facility_eligible(uuid)', 'EXECUTE') then
    raise exception 'owner eligibility seam is executable by a browser role';
  end if;
  if not has_function_privilege('authenticated', 'public.submit_owner_claim(uuid, text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.submit_listing_edit(uuid, text, text)', 'EXECUTE')
     or not has_function_privilege('anon', 'public.nchf_phase5g_facility_is_listed(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.nchf_phase5g_facility_is_listed(uuid)', 'EXECUTE') then
    raise exception 'existing eligibility execution privileges changed';
  end if;
end;
$guard$;

commit;

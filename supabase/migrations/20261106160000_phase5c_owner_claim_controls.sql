-- Phase 5C owner-claim controls.
-- Implements accepted database proposal Revision 3.
-- Do not apply this file to production.
-- Do not apply it to the development Supabase project until a later,
-- separate approval. Isolated tests use a disposable local database.

begin;

do $precheck$
declare
  signature text;
  index_definition text;
  inherited_privilege boolean;
begin
  if to_regclass('public.owner_claims') is null
     or to_regclass('public.listing_edits') is null
     or to_regclass('public.facilities') is null
     or to_regclass('public.app_admins') is null
     or to_regclass('auth.users') is null
     or to_regprocedure('auth.uid()') is null then
    raise exception 'required owner-claim relations or auth.uid() are missing';
  end if;

  if not exists (select 1 from pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception 'anon and authenticated roles are required';
  end if;

  if to_regclass('public.owner_claim_events') is not null
     or to_regclass('public.listing_edit_events') is not null
     or to_regclass('public.nchf_phase5c_privilege_snapshot') is not null then
    raise exception 'phase 5c relations already exist';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name = 'evidence_notes'
      and udt_name <> 'text'
  ) or exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing_edits'
      and column_name = 'proposed_value'
      and udt_name not in ('text', 'jsonb')
  ) then
    raise exception 'sensitive columns are not text, or proposed_value is not text or jsonb';
  end if;

  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name in ('id', 'facility_id', 'claimant_user_id', 'verification_status', 'evidence_notes')
      and (
        (column_name = 'id' and udt_name = 'uuid')
        or (column_name = 'facility_id' and udt_name = 'uuid')
        or (column_name = 'claimant_user_id' and udt_name = 'uuid')
        or (column_name = 'verification_status' and udt_name = 'text')
        or (column_name = 'evidence_notes' and udt_name = 'text')
      )
  ) <> 5 or (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing_edits'
      and column_name in (
        'id', 'facility_id', 'submitted_by_user_id', 'field_name', 'proposed_value', 'review_status'
      )
  ) <> 6 or (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'facilities'
      and column_name in (
        'id', 'canonical_name', 'source_name', 'license_category', 'facility_type',
        'state_code', 'record_status', 'normalized_license_number', 'license_number'
      )
  ) <> 9 then
    raise exception 'required claim, edit, or facility columns are missing';
  end if;

  if exists (
    select 1
    from public.owner_claims
    group by facility_id
    having count(*) filter (where verification_status = 'approved') > 1
  ) then
    raise exception 'refusing: a facility already has more than one approved claim';
  end if;

  with recursive inherited as (
    select oid, rolname
    from pg_roles
    where rolname in ('anon', 'authenticated')
    union
    select parent.oid, parent.rolname
    from inherited
    join pg_auth_members as membership
      on membership.member = inherited.oid
    join pg_roles as parent
      on parent.oid = membership.roleid
  )
  select exists (
    select 1
    from inherited
    join pg_class as relation
      on relation.relnamespace = 'public'::regnamespace
     and relation.relname in ('owner_claims', 'listing_edits')
    cross join lateral aclexplode(relation.relacl) as acl
    where inherited.rolname not in ('anon', 'authenticated')
      and acl.grantee = inherited.oid
      and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'TRUNCATE')
    union all
    select 1
    from inherited
    join pg_class as relation
      on relation.relnamespace = 'public'::regnamespace
     and relation.relname in ('owner_claims', 'listing_edits')
    join pg_attribute as attribute
      on attribute.attrelid = relation.oid
     and attribute.attnum > 0
     and not attribute.attisdropped
    cross join lateral aclexplode(attribute.attacl) as acl
    where inherited.rolname not in ('anon', 'authenticated')
      and acl.grantee = inherited.oid
      and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
  ) into inherited_privilege;

  if inherited_privilege then
    raise exception 'refusing: anon or authenticated inherits a role with privileges on owner_claims or listing_edits';
  end if;

  select pg_catalog.pg_get_function_identity_arguments(proc.oid)
    into signature
  from pg_proc as proc
  join pg_namespace as schema
    on schema.oid = proc.pronamespace
  where schema.nspname = 'public'
    and proc.proname = 'admin_approve_owner_claim';
  if found and signature !~ '^[^,]*uuid$' then
    raise exception 'admin_approve_owner_claim has an unexpected signature';
  end if;

  select pg_catalog.pg_get_function_identity_arguments(proc.oid)
    into signature
  from pg_proc as proc
  join pg_namespace as schema
    on schema.oid = proc.pronamespace
  where schema.nspname = 'public'
    and proc.proname = 'admin_reject_owner_claim';
  if found and signature !~ '^[^,]*uuid$' then
    raise exception 'admin_reject_owner_claim has an unexpected signature';
  end if;

  select pg_catalog.pg_get_function_identity_arguments(proc.oid)
    into signature
  from pg_proc as proc
  join pg_namespace as schema
    on schema.oid = proc.pronamespace
  where schema.nspname = 'public'
    and proc.proname = 'admin_review_listing_edit';
  if found and signature !~ '^[^,]*uuid,\s*[^,]*text$' then
    raise exception 'admin_review_listing_edit has an unexpected signature';
  end if;

  select pg_catalog.pg_get_indexdef(index_class.oid)
    into index_definition
  from pg_class as index_class
  join pg_namespace as schema
    on schema.oid = index_class.relnamespace
  where schema.nspname = 'public'
    and index_class.relname = 'owner_claims_one_approved_claim_per_facility';
  if found and (
    index_definition not like '%UNIQUE INDEX%'
    or index_definition not like '%(facility_id)%'
    or index_definition not like '%approved%'
  ) then
    raise exception 'owner_claims_one_approved_claim_per_facility does not match the required unique index';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name = 'id'
      and column_default is null
  ) then
    alter table public.owner_claims alter column id set default pg_catalog.gen_random_uuid();
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing_edits'
      and column_name = 'id'
      and column_default is null
  ) then
    alter table public.listing_edits alter column id set default pg_catalog.gen_random_uuid();
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name = 'reviewed_at'
  ) then
    alter table public.owner_claims add column reviewed_at timestamptz;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing_edits'
      and column_name = 'created_at'
  ) then
    alter table public.listing_edits add column created_at timestamptz;
    alter table public.listing_edits
      alter column created_at set default pg_catalog.clock_timestamp();
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing_edits'
      and column_name = 'reviewed_at'
  ) then
    alter table public.listing_edits add column reviewed_at timestamptz;
  end if;
end
$precheck$;

do $capture$
begin
  create temp table nchf_cap_table_grant (
    relation_name text not null,
    grantee_name text not null,
    privilege_type text not null
  ) on commit drop;

  create temp table nchf_cap_column_grant (
    relation_name text not null,
    grantee_name text not null,
    privilege_type text not null,
    column_name text not null
  ) on commit drop;

  create temp table nchf_cap_policy (
    relation_name text not null,
    policy_name text not null,
    policy_command text not null,
    policy_roles text not null,
    policy_qual text,
    policy_with_check text,
    browser_only boolean not null
  ) on commit drop;

  create temp table nchf_cap_function (
    function_name text not null,
    function_identity text,
    function_definition text,
    function_existed boolean not null
  ) on commit drop;

  create temp table nchf_cap_default (
    grantee_name text not null,
    privilege_type text not null
  ) on commit drop;

  create temp table nchf_cap_index (
    created_by_migration boolean not null
  ) on commit drop;

  insert into nchf_cap_table_grant (relation_name, grantee_name, privilege_type)
  select relation.relname,
         case when acl.grantee = 0 then 'PUBLIC' else role_row.rolname end,
         acl.privilege_type
  from pg_class as relation
  cross join lateral aclexplode(relation.relacl) as acl
  left join pg_roles as role_row
    on role_row.oid = acl.grantee
  where relation.relnamespace = 'public'::regnamespace
    and relation.relname in ('owner_claims', 'listing_edits')
    and (acl.grantee = 0 or role_row.rolname in ('anon', 'authenticated'));

  insert into nchf_cap_column_grant (relation_name, grantee_name, privilege_type, column_name)
  select relation.relname,
         case when acl.grantee = 0 then 'PUBLIC' else role_row.rolname end,
         acl.privilege_type,
         attribute.attname
  from pg_class as relation
  join pg_attribute as attribute
    on attribute.attrelid = relation.oid
   and attribute.attnum > 0
   and not attribute.attisdropped
  cross join lateral aclexplode(attribute.attacl) as acl
  left join pg_roles as role_row
    on role_row.oid = acl.grantee
  where relation.relnamespace = 'public'::regnamespace
    and relation.relname in ('owner_claims', 'listing_edits')
    and (acl.grantee = 0 or role_row.rolname in ('anon', 'authenticated'));

  insert into nchf_cap_policy (
    relation_name, policy_name, policy_command, policy_roles, policy_qual, policy_with_check, browser_only
  )
  select relation.relname,
         policy.polname,
         case policy.polcmd
           when 'r' then 'select'
           when 'a' then 'insert'
           when 'w' then 'update'
           when 'd' then 'delete'
           else 'all'
         end,
         case
           when policy.polroles = '{}'::oid[] then 'PUBLIC'
           else (
             select pg_catalog.string_agg(pg_catalog.quote_ident(role_row.rolname), ', ' order by role_row.rolname)
             from pg_roles as role_row
             where role_row.oid = any (policy.polroles)
           )
         end,
         pg_catalog.pg_get_expr(policy.polqual, policy.polrelid),
         pg_catalog.pg_get_expr(policy.polwithcheck, policy.polrelid),
         policy.polroles = '{}'::oid[]
         or (
           exists (
             select 1
             from pg_roles as role_row
             where role_row.oid = any (policy.polroles)
               and role_row.rolname in ('anon', 'authenticated')
           )
           and not exists (
             select 1
             from pg_roles as role_row
             where role_row.oid = any (policy.polroles)
               and role_row.rolname not in ('anon', 'authenticated')
           )
         )
  from pg_policy as policy
  join pg_class as relation
    on relation.oid = policy.polrelid
  where relation.relnamespace = 'public'::regnamespace
    and relation.relname in ('owner_claims', 'listing_edits');

  insert into nchf_cap_function (function_name, function_identity, function_definition, function_existed)
  select expected.name,
         pg_catalog.pg_get_function_identity_arguments(proc.oid),
         case when proc.oid is null then null else pg_catalog.pg_get_functiondef(proc.oid) end,
         proc.oid is not null
  from (
    values
      ('admin_approve_owner_claim'),
      ('admin_reject_owner_claim'),
      ('admin_review_listing_edit')
  ) as expected(name)
  left join pg_proc as proc
    on proc.proname = expected.name
   and proc.pronamespace = 'public'::regnamespace;

  insert into nchf_cap_default (grantee_name, privilege_type)
  select case when acl.grantee = 0 then 'PUBLIC' else role_row.rolname end,
         acl.privilege_type
  from pg_default_acl as defaults
  cross join lateral aclexplode(defaults.defaclacl) as acl
  left join pg_roles as role_row
    on role_row.oid = acl.grantee
  where defaults.defaclnamespace = 'public'::regnamespace
    and defaults.defaclobjtype = 'r'
    and defaults.defaclrole = (select oid from pg_roles where rolname = current_user)
    and (acl.grantee = 0 or role_row.rolname in ('anon', 'authenticated'));

  insert into nchf_cap_index (created_by_migration)
  select to_regclass('public.owner_claims_one_approved_claim_per_facility') is null;
end
$capture$;

create function public.nchf_phase5c_snapshot_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $guard$
begin
  if tg_op = 'INSERT' then
    if pg_catalog.current_setting('nchf.phase5c_snapshot_write', true) is distinct from 'capture' then
      raise exception 'privilege snapshot is closed';
    end if;
    return new;
  end if;
  raise exception 'privilege snapshot cannot be modified';
end;
$guard$;

create function public.submit_owner_claim(p_facility_id uuid, p_evidence_notes text)
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

create function public.submit_listing_edit(
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
  from pg_attribute as attribute
  join pg_type as type_row
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

create function public.admin_list_owner_claims()
returns table (
  id uuid,
  facility_id uuid,
  claimant_user_id uuid,
  verification_status text,
  evidence_notes text,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select claim.id,
         claim.facility_id,
         claim.claimant_user_id,
         claim.verification_status,
         claim.evidence_notes,
         claim.reviewed_at
  from public.owner_claims as claim
  order by claim.id desc
  limit 100;
end;
$fn$;

create function public.admin_list_listing_edits()
returns table (
  id uuid,
  facility_id uuid,
  submitted_by_user_id uuid,
  field_name text,
  proposed_value text,
  review_status text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select edit.id,
         edit.facility_id,
         edit.submitted_by_user_id,
         edit.field_name,
         edit.proposed_value::text,
         edit.review_status,
         edit.created_at,
         edit.reviewed_at
  from public.listing_edits as edit
  order by edit.created_at desc nulls last, edit.id desc
  limit 100;
end;
$fn$;

create or replace function public.admin_approve_owner_claim(p_claim_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_facility uuid;
  v_claimant uuid;
  v_status text;
begin
  v_actor := auth.uid();
  if v_actor is null or not exists (
    select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
  ) then
    raise exception 'administrator required';
  end if;
  select claim.facility_id, claim.claimant_user_id, claim.verification_status
    into v_facility, v_claimant, v_status
  from public.owner_claims as claim
  where claim.id = p_claim_id;
  if not found then
    raise exception 'claim was not found';
  end if;
  if v_claimant = v_actor then
    raise exception 'self-review is not allowed';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_facility::text, 0));
  perform 1
  from public.owner_claims as claim
  where claim.facility_id = v_facility
  for update;
  select claim.verification_status
    into v_status
  from public.owner_claims as claim
  where claim.id = p_claim_id;
  if v_status is distinct from 'pending' then
    raise exception 'claim is not pending';
  end if;
  if exists (
    select 1
    from public.owner_claims as claim
    where claim.facility_id = v_facility
      and claim.verification_status = 'approved'
      and claim.id is distinct from p_claim_id
  ) then
    raise exception 'another approved claim exists for this facility';
  end if;
  update public.owner_claims
  set verification_status = 'approved',
      reviewed_at = pg_catalog.clock_timestamp()
  where id = p_claim_id;
  insert into public.owner_claim_events (
    claim_id, facility_id, actor_user_id, event_type, from_status, to_status
  ) values (
    p_claim_id, v_facility, v_actor, 'approved', 'pending', 'approved'
  );
  return true;
end;
$fn$;

create or replace function public.admin_reject_owner_claim(p_claim_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_facility uuid;
  v_claimant uuid;
  v_status text;
begin
  v_actor := auth.uid();
  if v_actor is null or not exists (
    select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
  ) then
    raise exception 'administrator required';
  end if;
  select claim.facility_id, claim.claimant_user_id, claim.verification_status
    into v_facility, v_claimant, v_status
  from public.owner_claims as claim
  where claim.id = p_claim_id
  for update;
  if not found then
    raise exception 'claim was not found';
  end if;
  if v_claimant = v_actor then
    raise exception 'self-review is not allowed';
  end if;
  if v_status is distinct from 'pending' then
    raise exception 'claim is not pending';
  end if;
  update public.owner_claims
  set verification_status = 'rejected',
      reviewed_at = pg_catalog.clock_timestamp()
  where id = p_claim_id;
  insert into public.owner_claim_events (
    claim_id, facility_id, actor_user_id, event_type, from_status, to_status
  ) values (
    p_claim_id, v_facility, v_actor, 'rejected', 'pending', 'rejected'
  );
  return true;
end;
$fn$;

create or replace function public.admin_review_listing_edit(p_edit_id uuid, p_decision text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_facility uuid;
  v_submitter uuid;
  v_status text;
begin
  v_actor := auth.uid();
  if v_actor is null or not exists (
    select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
  ) then
    raise exception 'administrator required';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision is not allowed';
  end if;
  select edit.facility_id, edit.submitted_by_user_id, edit.review_status
    into v_facility, v_submitter, v_status
  from public.listing_edits as edit
  where edit.id = p_edit_id
  for update;
  if not found then
    raise exception 'listing edit was not found';
  end if;
  if v_submitter = v_actor then
    raise exception 'self-review is not allowed';
  end if;
  if v_status is distinct from 'pending' then
    raise exception 'proposal is not pending';
  end if;
  update public.listing_edits
  set review_status = p_decision,
      reviewed_at = pg_catalog.clock_timestamp()
  where id = p_edit_id;
  insert into public.listing_edit_events (
    edit_id, facility_id, actor_user_id, event_type, from_status, to_status
  ) values (
    p_edit_id, v_facility, v_actor, p_decision, 'pending', p_decision
  );
  return true;
end;
$fn$;

-- Privilege application continues in the next statement of this transaction.

do $apply$
declare
  saved_default record;
  policy_row record;
  rel_name text;
  col_name text;
  checksum text;
  browser_still_privileged boolean;
begin
  execute 'alter default privileges in schema public revoke all on tables from anon, authenticated, public';

  create table public.nchf_phase5c_privilege_snapshot (
    id bigint generated always as identity primary key,
    snapshot_checksum text not null,
    section text not null,
    relation_name text,
    grantee_name text,
    privilege_type text,
    column_name text,
    policy_name text,
    policy_command text,
    policy_roles text,
    policy_qual text,
    policy_with_check text,
    function_name text,
    function_identity text,
    function_definition text,
    function_existed boolean,
    created_by_migration boolean,
    captured_line text not null
  );
  revoke all on table public.nchf_phase5c_privilege_snapshot from anon, authenticated, public;
  alter table public.nchf_phase5c_privilege_snapshot enable row level security;
  create trigger nchf_phase5c_snapshot_no_write
    before insert or update or delete
    on public.nchf_phase5c_privilege_snapshot
    for each row
    execute function public.nchf_phase5c_snapshot_guard();
  create trigger nchf_phase5c_snapshot_no_truncate
    before truncate
    on public.nchf_phase5c_privilege_snapshot
    for each statement
    execute function public.nchf_phase5c_snapshot_guard();

  create temp table nchf_cap_line (
    section text not null,
    relation_name text,
    grantee_name text,
    privilege_type text,
    column_name text,
    policy_name text,
    policy_command text,
    policy_roles text,
    policy_qual text,
    policy_with_check text,
    function_name text,
    function_identity text,
    function_definition text,
    function_existed boolean,
    created_by_migration boolean,
    captured_line text not null
  ) on commit drop;

  insert into nchf_cap_line (
    section, relation_name, grantee_name, privilege_type, captured_line
  )
  select 'table_grant', grant_row.relation_name, grant_row.grantee_name, grant_row.privilege_type,
         'table_grant|' || grant_row.relation_name || '|' || grant_row.grantee_name || '|' || grant_row.privilege_type
  from nchf_cap_table_grant as grant_row;

  insert into nchf_cap_line (
    section, relation_name, grantee_name, privilege_type, column_name, captured_line
  )
  select 'column_grant', grant_row.relation_name, grant_row.grantee_name, grant_row.privilege_type, grant_row.column_name,
         'column_grant|' || grant_row.relation_name || '|' || grant_row.grantee_name || '|' || grant_row.privilege_type || '|' || grant_row.column_name
  from nchf_cap_column_grant as grant_row;

  insert into nchf_cap_line (
    section, relation_name, policy_name, policy_command, policy_roles, policy_qual,
    policy_with_check, created_by_migration, captured_line
  )
  select 'policy', policy_source.relation_name, policy_source.policy_name, policy_source.policy_command, policy_source.policy_roles, policy_source.policy_qual,
         policy_source.policy_with_check, policy_source.browser_only,
         'policy|' || policy_source.relation_name || '|' || policy_source.policy_name || '|' || policy_source.policy_command || '|'
           || policy_source.policy_roles || '|' || coalesce(policy_source.policy_qual, '') || '|' || coalesce(policy_source.policy_with_check, '')
           || '|' || policy_source.browser_only::text
  from nchf_cap_policy as policy_source;

  insert into nchf_cap_line (
    section, function_name, function_identity, function_definition, function_existed, captured_line
  )
  select 'review_function', function_name, function_identity, function_definition, function_existed,
         'review_function|' || function_name || '|' || function_existed::text || '|'
           || coalesce(function_definition, '')
  from nchf_cap_function;

  insert into nchf_cap_line (section, grantee_name, privilege_type, captured_line)
  select 'default_acl', grantee_name, privilege_type,
         'default_acl|' || grantee_name || '|' || privilege_type
  from nchf_cap_default;

  insert into nchf_cap_line (section, created_by_migration, captured_line)
  select 'approved_index', created_by_migration,
         'approved_index|' || created_by_migration::text
  from nchf_cap_index;

  insert into nchf_cap_line (section, captured_line)
  values ('marker', 'marker|phase5c|revision=3');

  select pg_catalog.md5(pg_catalog.string_agg(captured_line, E'\n' order by captured_line))
    into checksum
  from nchf_cap_line;

  perform pg_catalog.set_config('nchf.phase5c_snapshot_write', 'capture', true);
  insert into public.nchf_phase5c_privilege_snapshot (
    snapshot_checksum, section, relation_name, grantee_name, privilege_type, column_name,
    policy_name, policy_command, policy_roles, policy_qual, policy_with_check,
    function_name, function_identity, function_definition, function_existed,
    created_by_migration, captured_line
  )
  select checksum, captured.section, captured.relation_name, captured.grantee_name, captured.privilege_type, captured.column_name,
         captured.policy_name, captured.policy_command, captured.policy_roles, captured.policy_qual, captured.policy_with_check,
         captured.function_name, captured.function_identity, captured.function_definition, captured.function_existed,
         captured.created_by_migration, captured.captured_line
  from nchf_cap_line as captured;
  perform pg_catalog.set_config('nchf.phase5c_snapshot_write', '', true);

  create table public.owner_claim_events (
    id uuid primary key default pg_catalog.gen_random_uuid(),
    claim_id uuid not null references public.owner_claims (id),
    facility_id uuid not null references public.facilities (id),
    actor_user_id uuid not null,
    event_type text not null,
    from_status text,
    to_status text not null,
    created_at timestamptz not null default pg_catalog.clock_timestamp(),
    constraint owner_claim_events_no_sensitive_text check (event_type <> 'evidence_notes')
  );
  create table public.listing_edit_events (
    id uuid primary key default pg_catalog.gen_random_uuid(),
    edit_id uuid not null references public.listing_edits (id),
    facility_id uuid not null references public.facilities (id),
    actor_user_id uuid not null,
    event_type text not null,
    from_status text,
    to_status text not null,
    created_at timestamptz not null default pg_catalog.clock_timestamp(),
    constraint listing_edit_events_no_sensitive_text check (event_type <> 'proposed_value')
  );

  for saved_default in
    select distinct privilege_type, grantee_name
    from nchf_cap_default
  loop
    if saved_default.privilege_type not in (
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
    ) or saved_default.grantee_name not in ('anon', 'authenticated', 'PUBLIC') then
      raise exception 'captured default privilege is not restorable';
    end if;
    execute format(
      'alter default privileges in schema public grant %s on tables to %s',
      saved_default.privilege_type,
      case when saved_default.grantee_name = 'PUBLIC' then 'public' else saved_default.grantee_name end
    );
  end loop;

  foreach rel_name in array ARRAY['owner_claims', 'listing_edits', 'owner_claim_events', 'listing_edit_events']::text[]
  loop
    execute format('revoke all on table public.%I from anon, authenticated, public', rel_name);
    execute format('revoke truncate on table public.%I from anon, authenticated, public', rel_name);
    for col_name in
      select attribute.attname
      from pg_attribute as attribute
      where attribute.attrelid = format('public.%I', rel_name)::regclass
        and attribute.attnum > 0
        and not attribute.attisdropped
    loop
      execute format(
        'revoke all (%I) on table public.%I from anon, authenticated, public',
        col_name,
        rel_name
      );
    end loop;
  end loop;

  for policy_row in
    select policy_source.relation_name, policy_source.policy_name
    from nchf_cap_policy as policy_source
    where policy_source.browser_only
  loop
    execute format('drop policy %I on public.%I', policy_row.policy_name, policy_row.relation_name);
  end loop;

  if exists (
    select 1
    from pg_policy as policy
    join pg_class as relation
      on relation.oid = policy.polrelid
    where relation.relnamespace = 'public'::regnamespace
      and relation.relname in ('owner_claims', 'listing_edits')
      and (
        policy.polroles = '{}'::oid[]
        or exists (
          select 1
          from pg_roles as role_row
          where role_row.oid = any (policy.polroles)
            and role_row.rolname in ('anon', 'authenticated')
        )
      )
  ) then
    raise exception 'a browser policy remains on owner_claims or listing_edits';
  end if;

  create policy owner_claims_select_claimant
    on public.owner_claims
    for select
    to authenticated
    using (claimant_user_id = auth.uid());
  create policy listing_edits_select_submitter
    on public.listing_edits
    for select
    to authenticated
    using (submitted_by_user_id = auth.uid());

  alter table public.owner_claim_events enable row level security;
  alter table public.listing_edit_events enable row level security;
  create policy owner_claim_events_select_claimant
    on public.owner_claim_events
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.owner_claims as claim
        where claim.id = owner_claim_events.claim_id
          and claim.claimant_user_id = auth.uid()
      )
    );
  create policy listing_edit_events_select_submitter
    on public.listing_edit_events
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.listing_edits as edit
        where edit.id = listing_edit_events.edit_id
          and edit.submitted_by_user_id = auth.uid()
      )
    );

  if to_regclass('public.owner_claims_one_approved_claim_per_facility') is null then
    create unique index owner_claims_one_approved_claim_per_facility
      on public.owner_claims (facility_id)
      where verification_status = 'approved';
  end if;

  if to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is not null then
    execute 'revoke all on table public.nchf_phase5a_facilities_acl_snapshot from anon, authenticated, public';
    execute 'alter table public.nchf_phase5a_facilities_acl_snapshot enable row level security';
    execute $phase5a$
      create or replace function public.nchf_phase5a_snapshot_guard()
      returns trigger
      language plpgsql
      security definer
      set search_path = ''
      as $body$
      begin
        raise exception 'phase 5a recovery rows cannot be modified';
      end;
      $body$
    $phase5a$;
    execute 'revoke all on function public.nchf_phase5a_snapshot_guard() from public, anon, authenticated';
    if not exists (
      select 1 from pg_trigger
      where tgrelid = 'public.nchf_phase5a_facilities_acl_snapshot'::regclass
        and tgname = 'nchf_phase5a_snapshot_no_write'
        and not tgisinternal
    ) then
      create trigger nchf_phase5a_snapshot_no_write
        before update or delete
        on public.nchf_phase5a_facilities_acl_snapshot
        for each row
        execute function public.nchf_phase5a_snapshot_guard();
    end if;
    if not exists (
      select 1 from pg_trigger
      where tgrelid = 'public.nchf_phase5a_facilities_acl_snapshot'::regclass
        and tgname = 'nchf_phase5a_snapshot_no_truncate'
        and not tgisinternal
    ) then
      create trigger nchf_phase5a_snapshot_no_truncate
        before truncate
        on public.nchf_phase5a_facilities_acl_snapshot
        for each statement
        execute function public.nchf_phase5a_snapshot_guard();
    end if;
  end if;

  revoke all on function public.nchf_phase5c_snapshot_guard() from public, anon, authenticated;
  revoke all on function public.submit_owner_claim(uuid, text) from public, anon, authenticated;
  revoke all on function public.submit_listing_edit(uuid, text, text) from public, anon, authenticated;
  revoke all on function public.admin_list_owner_claims() from public, anon, authenticated;
  revoke all on function public.admin_list_listing_edits() from public, anon, authenticated;
  revoke all on function public.admin_approve_owner_claim(uuid) from public, anon, authenticated;
  revoke all on function public.admin_reject_owner_claim(uuid) from public, anon, authenticated;
  revoke all on function public.admin_review_listing_edit(uuid, text) from public, anon, authenticated;

  grant execute on function public.submit_owner_claim(uuid, text) to authenticated;
  grant execute on function public.submit_listing_edit(uuid, text, text) to authenticated;
  grant execute on function public.admin_list_owner_claims() to authenticated;
  grant execute on function public.admin_list_listing_edits() to authenticated;
  grant execute on function public.admin_approve_owner_claim(uuid) to authenticated;
  grant execute on function public.admin_reject_owner_claim(uuid) to authenticated;
  grant execute on function public.admin_review_listing_edit(uuid, text) to authenticated;

  grant select (
    id, facility_id, claimant_user_id, verification_status, reviewed_at
  ) on table public.owner_claims to authenticated;
  grant select (
    id, facility_id, submitted_by_user_id, field_name, review_status, created_at, reviewed_at
  ) on table public.listing_edits to authenticated;
  grant select (
    id, claim_id, facility_id, actor_user_id, event_type, from_status, to_status, created_at
  ) on table public.owner_claim_events to authenticated;
  grant select (
    id, edit_id, facility_id, actor_user_id, event_type, from_status, to_status, created_at
  ) on table public.listing_edit_events to authenticated;

  select exists (
    select 1
    from (values ('anon'), ('authenticated'), ('public')) as browser(role_name)
    cross join (
      values
        ('public.owner_claims'),
        ('public.listing_edits'),
        ('public.owner_claim_events'),
        ('public.listing_edit_events'),
        ('public.nchf_phase5c_privilege_snapshot')
    ) as relation(name)
    where has_table_privilege(browser.role_name, relation.name, 'INSERT')
       or has_table_privilege(browser.role_name, relation.name, 'UPDATE')
       or has_table_privilege(browser.role_name, relation.name, 'DELETE')
       or has_table_privilege(browser.role_name, relation.name, 'TRUNCATE')
       or (
         relation.name = 'public.nchf_phase5c_privilege_snapshot'
         and has_table_privilege(browser.role_name, relation.name, 'SELECT')
       )
       or (
         browser.role_name <> 'authenticated'
         and relation.name in (
           'public.owner_claims',
           'public.listing_edits',
           'public.owner_claim_events',
           'public.listing_edit_events'
         )
         and has_table_privilege(browser.role_name, relation.name, 'SELECT')
       )
  ) into browser_still_privileged;
  if browser_still_privileged
     or has_table_privilege('authenticated', 'public.owner_claims', 'SELECT')
     or has_column_privilege('authenticated', 'public.owner_claims', 'evidence_notes', 'SELECT')
     or has_column_privilege('authenticated', 'public.listing_edits', 'proposed_value', 'SELECT')
     or has_column_privilege('anon', 'public.owner_claims', 'evidence_notes', 'INSERT')
     or has_column_privilege('public', 'public.listing_edits', 'proposed_value', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.owner_claims', 'verification_status', 'SELECT')
     or not has_column_privilege('authenticated', 'public.owner_claim_events', 'event_type', 'SELECT') then
    raise exception 'browser privileges were not reduced to the approved column list';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('owner_claim_events', 'listing_edit_events')
      and column_name in ('evidence_notes', 'proposed_value')
  ) then
    raise exception 'event tables contain a sensitive column';
  end if;
end
$apply$;

commit;

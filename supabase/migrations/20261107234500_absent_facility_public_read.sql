-- Exclude presence = 'absent' from public facility reads and new owner claims.
-- Existing facility, claim, and claim-event rows are not deleted or updated.

do $policy$
declare
  policy_name text;
  current_expression text;
  other_public text;
begin
  foreach policy_name in array array[
    'facilities_public_read_wa_afh_source_matched',
    'Public read verified facilities'
  ]
  loop
    select pg_catalog.pg_get_expr(policy.polqual, policy.polrelid)
      into current_expression
    from pg_catalog.pg_policy as policy
    where policy.polrelid = 'public.facilities'::regclass
      and policy.polname = policy_name
      and policy.polcmd = 'r';
    if current_expression is null then
      raise exception 'public facility read policy is missing: %', policy_name;
    end if;
    if policy_name = 'facilities_public_read_wa_afh_source_matched' then
      if pg_catalog.strpos(pg_catalog.lower(current_expression), 'source_matched') = 0
         or pg_catalog.strpos(pg_catalog.lower(current_expression), 'wa_dshs_afh') = 0
         or pg_catalog.strpos(pg_catalog.lower(current_expression), 'license_number') = 0 then
        raise exception 'public facility read policy does not match the reviewed predicate: %', policy_name;
      end if;
    elsif pg_catalog.strpos(pg_catalog.lower(current_expression), 'verified') = 0
          or pg_catalog.strpos(pg_catalog.lower(current_expression), 'source_matched') > 0 then
      raise exception 'verified public read policy does not match the reviewed predicate';
    end if;
  end loop;

  select pg_catalog.string_agg(policy.polname, ', ' order by policy.polname)
    into other_public
  from pg_catalog.pg_policy as policy
  where policy.polrelid = 'public.facilities'::regclass
    and policy.polcmd = 'r'
    and policy.polname not in (
      'facilities_public_read_wa_afh_source_matched',
      'Public read verified facilities'
    )
    and (
      policy.polroles = '{0}'
      or 0 = any (policy.polroles)
      or (select role_row.oid from pg_catalog.pg_roles as role_row where role_row.rolname = 'anon') = any (policy.polroles)
      or (select role_row.oid from pg_catalog.pg_roles as role_row where role_row.rolname = 'authenticated') = any (policy.polroles)
    )
    and pg_catalog.strpos(pg_catalog.lower(coalesce(pg_catalog.pg_get_expr(policy.polqual, policy.polrelid), ''::text)), 'absent') = 0;
  if other_public is not null then
    raise exception 'another public read policy still exposes archived facilities: %', other_public;
  end if;

  foreach policy_name in array array[
    'facilities_public_read_wa_afh_source_matched',
    'Public read verified facilities'
  ]
  loop
    select pg_catalog.pg_get_expr(policy.polqual, policy.polrelid)
      into current_expression
    from pg_catalog.pg_policy as policy
    where policy.polrelid = 'public.facilities'::regclass
      and policy.polname = policy_name
      and policy.polcmd = 'r';
    if pg_catalog.strpos(pg_catalog.lower(current_expression), 'absent') = 0 then
      execute format(
        'alter policy %I on public.facilities using ((%s) and presence is distinct from %L)',
        policy_name,
        current_expression,
        'absent'
      );
    end if;
  end loop;
end
$policy$;

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
         and facility.presence is distinct from 'absent'
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

do $grants$
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc as proc
    where proc.oid = 'public.submit_owner_claim(uuid, text)'::regprocedure
      and proc.prosecdef
      and proc.proacl is not null
      and pg_catalog.strpos(proc.prosrc, 'presence is distinct from ''absent''') > 0
      and pg_catalog.strpos(proc.prosrc, '00000000-0000-4000-8000-000000000002') > 0
      and not exists (
        select 1
        from pg_catalog.aclexplode(proc.proacl) as acl
        where acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
      and exists (
        select 1
        from pg_catalog.unnest(proc.proconfig) as setting
        where pg_catalog.split_part(setting, '=', 1) = 'search_path'
          and pg_catalog.btrim(pg_catalog.split_part(setting, '=', 2), '"') = ''
      )
      and pg_catalog.has_function_privilege('authenticated', proc.oid, 'EXECUTE')
      and not pg_catalog.has_function_privilege('anon', proc.oid, 'EXECUTE')
  ) then
    raise exception 'owner claim eligibility lost its signature, definer, empty search_path, or execute grants';
  end if;
end
$grants$;

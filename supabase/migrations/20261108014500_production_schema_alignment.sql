-- Production schema alignment proposal. Do not apply this file.
-- It does not import, delete, or reclassify facility rows.
-- The execution wrapper must already have started one transaction.
-- Required session settings, which this file does not set:
--   nchf.production_schema_alignment_authorization = authorize-production-schema-alignment
--   nchf.production_schema_alignment_target = yiehgstweswxjakbcdzc

do $alignment$
declare
  facility_count bigint;
  claim_count bigint;
  edit_count bigint;
  admin_count bigint;
  verified_count bigint;
  source_matched_count bigint;
  policy_count bigint;
  verified_expr text;
  verified_command "char";
  source_expr text;
  presence_exists boolean;
  function_exists boolean;
  source_policy_exists boolean;
  audit_exists boolean;
  directory_exists boolean;
  map_exists boolean;
  listed_count bigint;
  mapped_count bigint;
  visible_count bigint;
  claim_id_default text;
  function_oid oid;
  created_events boolean := false;
  created_directory boolean := false;
  created_map boolean := false;
  added_source_name boolean := false;
  added_license_category boolean := false;
  added_facility_type boolean := false;
  added_normalized_license boolean := false;
  added_claim_reviewed_at boolean := false;
  added_edit_created_at boolean := false;
  added_edit_reviewed_at boolean := false;
  directory_before bigint := 0;
  map_before bigint := 0;
  anon_directory_before bigint := 0;
  anon_map_before bigint := 0;
  directory_viewdef text := '';
  map_viewdef text := '';
  directory_options text := '';
  map_options text := '';
begin
  if pg_catalog.current_setting('nchf.production_schema_alignment_authorization', true)
     is distinct from 'authorize-production-schema-alignment' then
    raise exception 'production schema alignment authorization is missing';
  end if;
  if pg_catalog.current_setting('nchf.production_schema_alignment_target', true)
     is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'production schema alignment target is not the reviewed production project';
  end if;

  if to_regclass('public.facilities') is null
     or to_regclass('public.owner_claims') is null
     or to_regclass('public.listing_edits') is null
     or to_regclass('public.app_admins') is null
     or to_regprocedure('auth.uid()') is null
     or to_regclass('auth.users') is null then
    raise exception 'required production relations are missing';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception 'anon and authenticated roles are required';
  end if;

  lock table public.facilities, public.owner_claims, public.listing_edits, public.app_admins
    in share row exclusive mode;

  select count(*) into facility_count from public.facilities;
  select count(*) into claim_count from public.owner_claims;
  select count(*) into edit_count from public.listing_edits;
  select count(*) into admin_count from public.app_admins;
  select count(*) filter (where record_status = 'verified') into verified_count from public.facilities;
  select count(*) filter (where record_status = 'source_matched') into source_matched_count from public.facilities;

  if facility_count <> 8121 then
    raise exception 'facility count is not the reviewed production baseline';
  end if;
  if claim_count <> 0 or edit_count <> 0 or admin_count <> 1
     or verified_count <> 0 or source_matched_count <> 0 then
    raise exception 'production claim, edit, admin, or status counts are not the reviewed baseline';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'public.facilities'::regclass
      and relrowsecurity
      and not relforcerowsecurity
  ) then
    raise exception 'facilities row level security is not in the reviewed state';
  end if;
  if not has_table_privilege('anon', 'public.facilities', 'SELECT')
     or not has_table_privilege('authenticated', 'public.facilities', 'SELECT') then
    raise exception 'public select grant is missing; this proposal does not grant it';
  end if;
  if has_table_privilege('anon', 'public.facilities', 'INSERT')
     or has_table_privilege('anon', 'public.facilities', 'UPDATE')
     or has_table_privilege('anon', 'public.facilities', 'DELETE')
     or has_table_privilege('authenticated', 'public.facilities', 'INSERT')
     or has_table_privilege('authenticated', 'public.facilities', 'UPDATE')
     or has_table_privilege('authenticated', 'public.facilities', 'DELETE')
     or has_table_privilege('anon', 'public.owner_claims', 'INSERT')
     or has_table_privilege('authenticated', 'public.owner_claims', 'INSERT')
     or has_table_privilege('anon', 'public.listing_edits', 'INSERT')
     or has_table_privilege('authenticated', 'public.listing_edits', 'INSERT') then
    raise exception 'browser write grants are outside this proposal and were not changed';
  end if;

  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'facilities'
      and column_name in ('id', 'canonical_name', 'record_status', 'license_number')
  ) <> 4 or (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name in (
        'id', 'facility_id', 'claimant_user_id', 'verification_status', 'evidence_notes'
      )
  ) <> 5 then
    raise exception 'required facility or claim columns are missing';
  end if;

  select column_default into claim_id_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'owner_claims'
    and column_name = 'id';

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'facilities' and column_name = 'presence'
  ) into presence_exists;
  function_exists := to_regprocedure('public.submit_owner_claim(uuid, text)') is not null;
  source_policy_exists := exists (
    select 1 from pg_policy
    where polrelid = 'public.facilities'::regclass
      and polname = 'facilities_public_read_wa_afh_source_matched'
  );
  audit_exists := to_regclass('public.nchf_production_schema_alignment_audit') is not null;
  directory_exists := to_regclass('public.wa_dshs_listed_facilities') is not null;
  map_exists := to_regclass('public.wa_afh_map_facilities') is not null;

  select count(*) into policy_count
  from pg_policy
  where polrelid = 'public.facilities'::regclass;

  select policy.polcmd, pg_catalog.pg_get_expr(policy.polqual, policy.polrelid)
    into verified_command, verified_expr
  from pg_policy as policy
  where policy.polrelid = 'public.facilities'::regclass
    and policy.polname = 'Public read verified facilities';
  if verified_command is distinct from 'r'
     or verified_expr is null
     or position('verified' in verified_expr) = 0
     or position('source_matched' in verified_expr) > 0 then
    raise exception 'verified public read policy does not match the reviewed predicate';
  end if;

  if presence_exists or function_exists or source_policy_exists or audit_exists then
    if not (presence_exists and function_exists and source_policy_exists and audit_exists
            and directory_exists and map_exists and policy_count = 2) then
      raise exception 'partial production alignment is present';
    end if;
    if position('absent' in verified_expr) = 0 then
      raise exception 'verified public read policy does not exclude archived facilities';
    end if;
    select pg_catalog.pg_get_expr(policy.polqual, policy.polrelid) into source_expr
    from pg_policy as policy
    where policy.polrelid = 'public.facilities'::regclass
      and policy.polname = 'facilities_public_read_wa_afh_source_matched';
    if source_expr is null
       or position('source_matched' in source_expr) = 0
       or position('absent' in source_expr) = 0
       or position('wa_dshs_afh' in source_expr) = 0 then
      raise exception 'source-matched public read policy does not match the reviewed predicate';
    end if;
    select pg_catalog.rtrim(pg_catalog.pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true), E' \t\r\n;'),
           pg_catalog.rtrim(pg_catalog.pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true), E' \t\r\n;')
      into directory_viewdef, map_viewdef;
    if position('absent' in directory_viewdef) = 0
       or position('absent' in map_viewdef) = 0 then
      raise exception 'partial production alignment is present';
    end if;
    select count(*) into directory_before from public.wa_dshs_listed_facilities;
    select count(*) into map_before from public.wa_afh_map_facilities;
    execute 'set local role anon';
    select count(*) into anon_directory_before from public.wa_dshs_listed_facilities;
    select count(*) into anon_map_before from public.wa_afh_map_facilities;
    execute 'reset role';
  else
    if exists (
      select 1
      from pg_policy as policy
      where policy.polrelid = 'public.facilities'::regclass
        and policy.polname is distinct from 'Public read verified facilities'
    ) then
      raise exception 'unreviewed facility policy';
    end if;
    if policy_count <> 1 or position('absent' in verified_expr) > 0 then
      raise exception 'verified public read policy does not match the reviewed predicate';
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'facilities' and column_name = 'source_name'
    ) then
      alter table public.facilities add column source_name text;
      added_source_name := true;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'facilities' and column_name = 'license_category'
    ) then
      alter table public.facilities add column license_category text;
      added_license_category := true;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'facilities' and column_name = 'facility_type'
    ) then
      alter table public.facilities add column facility_type text;
      added_facility_type := true;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'facilities' and column_name = 'normalized_license_number'
    ) then
      alter table public.facilities add column normalized_license_number text;
      added_normalized_license := true;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'owner_claims' and column_name = 'reviewed_at'
    ) then
      alter table public.owner_claims add column reviewed_at timestamptz;
      added_claim_reviewed_at := true;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'listing_edits' and column_name = 'created_at'
    ) then
      alter table public.listing_edits add column created_at timestamptz;
      alter table public.listing_edits alter column created_at set default pg_catalog.clock_timestamp();
      added_edit_created_at := true;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'listing_edits' and column_name = 'reviewed_at'
    ) then
      alter table public.listing_edits add column reviewed_at timestamptz;
      added_edit_reviewed_at := true;
    end if;
    if claim_id_default is null then
      alter table public.owner_claims alter column id set default pg_catalog.gen_random_uuid();
    end if;

    if directory_exists then
      if not exists (
        select 1
        from pg_rewrite as rewrite
        join pg_depend as depend on depend.objid = rewrite.oid
        where rewrite.ev_class = 'public.wa_dshs_listed_facilities'::regclass
          and depend.refobjid = 'public.facilities'::regclass
      ) or not exists (
        select 1 from pg_attribute
        where attrelid = 'public.wa_dshs_listed_facilities'::regclass
          and attname = 'id' and not attisdropped
      ) then
        raise exception 'directory view cannot be preserved';
      end if;
      select pg_catalog.pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true)
        into directory_viewdef;
      directory_viewdef := pg_catalog.rtrim(directory_viewdef, E' \t\r\n;');
      select coalesce(pg_catalog.array_to_string(relation.reloptions, ','), '')
        into directory_options
      from pg_class as relation
      where relation.oid = 'public.wa_dshs_listed_facilities'::regclass;
      select count(*) into directory_before from public.wa_dshs_listed_facilities;
      execute 'set local role anon';
      select count(*) into anon_directory_before from public.wa_dshs_listed_facilities;
      execute 'reset role';
    end if;
    if map_exists then
      if not exists (
        select 1
        from pg_rewrite as rewrite
        join pg_depend as depend on depend.objid = rewrite.oid
        where rewrite.ev_class = 'public.wa_afh_map_facilities'::regclass
          and depend.refobjid = 'public.facilities'::regclass
      ) or not exists (
        select 1 from pg_attribute
        where attrelid = 'public.wa_afh_map_facilities'::regclass
          and attname = 'id' and not attisdropped
      ) then
        raise exception 'map view cannot be preserved';
      end if;
      select pg_catalog.pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true)
        into map_viewdef;
      map_viewdef := pg_catalog.rtrim(map_viewdef, E' \t\r\n;');
      select coalesce(pg_catalog.array_to_string(relation.reloptions, ','), '')
        into map_options
      from pg_class as relation
      where relation.oid = 'public.wa_afh_map_facilities'::regclass;
      select count(*) into map_before from public.wa_afh_map_facilities;
      execute 'set local role anon';
      select count(*) into anon_map_before from public.wa_afh_map_facilities;
      execute 'reset role';
    end if;

    alter table public.facilities add column presence text;
    alter table public.facilities
      add constraint facilities_presence_check
      check (presence is null or presence in ('active', 'absent'));

    execute 'alter policy ' || pg_catalog.quote_ident('Public read verified facilities')
      || ' on public.facilities using ((' || verified_expr
      || ') and presence is distinct from ' || pg_catalog.quote_literal('absent') || ')';

    create policy facilities_public_read_wa_afh_source_matched
      on public.facilities
      for select
      to anon, authenticated
      using (
        source_name = 'wa_dshs_afh'
        and license_category = 'afh'
        and facility_type = 'AFH'
        and state_code = 'WA'
        and record_status = 'source_matched'
        and normalized_license_number is not null
        and pg_catalog.btrim(normalized_license_number, E' \t\r\n') <> ''
        and license_number ~ '^[0-9]{1,20}$'
        and presence is distinct from 'absent'
      );

    if to_regclass('public.owner_claim_events') is null then
      created_events := true;
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
      alter table public.owner_claim_events enable row level security;
      revoke all on table public.owner_claim_events from public, anon, authenticated;
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
      grant select (id, claim_id, event_type, to_status, created_at)
        on table public.owner_claim_events to authenticated;
    elsif exists (select 1 from public.owner_claim_events)
       or (
         select count(*)
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'owner_claim_events'
           and column_name in ('id', 'claim_id', 'facility_id', 'actor_user_id', 'event_type', 'to_status')
       ) <> 6 then
      raise exception 'owner_claim_events already has rows or does not match the reviewed shape';
    end if;

    execute $create_claim$
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
      $fn$
    $create_claim$;

    revoke all on function public.submit_owner_claim(uuid, text) from public, anon, authenticated;
    grant execute on function public.submit_owner_claim(uuid, text) to authenticated;

    if directory_exists then
      if position('absent' in directory_viewdef) = 0 then
        execute 'create or replace view public.wa_dshs_listed_facilities '
          || case when directory_options = '' then '' else 'with (' || directory_options || ') ' end
          || 'as select listed.* from (' || directory_viewdef
          || ') as listed join public.facilities as facility on facility.id = listed.id '
          || 'where facility.presence is distinct from ' || pg_catalog.quote_literal('absent');
      end if;
    else
      created_directory := true;
      execute $create_directory$
        create view public.wa_dshs_listed_facilities
        with (security_invoker = true) as
        select id,
               canonical_name,
               address_line1,
               city,
               county,
               license_number,
               state_code,
               postal_code,
               licensed_capacity,
               record_status
        from public.facilities
        where source_name = 'wa_dshs_afh'
          and license_category = 'afh'
          and facility_type = 'AFH'
          and state_code = 'WA'
          and record_status = 'source_matched'
          and normalized_license_number is not null
          and pg_catalog.btrim(normalized_license_number, E' \t\r\n') <> ''
          and license_number ~ '^[0-9]{1,20}$'
          and presence is distinct from 'absent'
      $create_directory$;
      revoke all on table public.wa_dshs_listed_facilities from public, anon, authenticated;
      grant select on table public.wa_dshs_listed_facilities to anon, authenticated;
    end if;

    if map_exists then
      if position('absent' in map_viewdef) = 0 then
        execute 'create or replace view public.wa_afh_map_facilities '
          || case when map_options = '' then '' else 'with (' || map_options || ') ' end
          || 'as select listed.* from (' || map_viewdef
          || ') as listed join public.facilities as facility on facility.id = listed.id '
          || 'where facility.presence is distinct from ' || pg_catalog.quote_literal('absent');
      end if;
    else
      created_map := true;
      execute $create_map$
        create view public.wa_afh_map_facilities
        with (security_invoker = true) as
        select id,
               canonical_name,
               address_line1,
               city,
               county,
               state_code,
               postal_code,
               license_number,
               licensed_capacity,
               latitude,
               longitude
        from public.facilities
        where state_code = 'WA'
          and latitude is not null
          and longitude is not null
          and postal_code is not null
          and facility_type = 'AFH'
          and source_name = 'wa_dshs_afh'
          and record_status = 'source_matched'
          and presence is distinct from 'absent'
      $create_map$;
      revoke all on table public.wa_afh_map_facilities from public, anon, authenticated;
      grant select on table public.wa_afh_map_facilities to anon, authenticated;
    end if;

    create table public.nchf_production_schema_alignment_audit (
      alignment_name text primary key,
      verified_policy_expression text not null,
      facility_count integer not null,
      claim_count integer not null,
      edit_count integer not null,
      admin_count integer not null,
      created_owner_claim_events boolean not null,
      created_directory boolean not null,
      created_map boolean not null,
      added_source_name boolean not null,
      added_license_category boolean not null,
      added_facility_type boolean not null,
      added_normalized_license boolean not null,
      added_claim_reviewed_at boolean not null,
      added_edit_created_at boolean not null,
      added_edit_reviewed_at boolean not null,
      directory_viewdef text not null,
      map_viewdef text not null,
      directory_options text not null,
      map_options text not null,
      created_at timestamptz not null default pg_catalog.clock_timestamp()
    );
    alter table public.nchf_production_schema_alignment_audit enable row level security;
    revoke all on table public.nchf_production_schema_alignment_audit from public, anon, authenticated;
    insert into public.nchf_production_schema_alignment_audit (
      alignment_name, verified_policy_expression, facility_count, claim_count, edit_count, admin_count,
      created_owner_claim_events, created_directory, created_map,
      added_source_name, added_license_category, added_facility_type, added_normalized_license,
      added_claim_reviewed_at, added_edit_created_at, added_edit_reviewed_at,
      directory_viewdef, map_viewdef, directory_options, map_options
    ) values (
      '20261108014500', verified_expr, facility_count, claim_count, edit_count, admin_count,
      created_events, created_directory, created_map,
      added_source_name, added_license_category, added_facility_type, added_normalized_license,
      added_claim_reviewed_at, added_edit_created_at, added_edit_reviewed_at,
      directory_viewdef, map_viewdef, directory_options, map_options
    );
  end if;

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.app_admins) <> 1
     or (select count(*) filter (where record_status = 'verified') from public.facilities) <> 0
     or (select count(*) filter (where record_status = 'source_matched') from public.facilities) <> 0
     or exists (select 1 from public.facilities where presence is not null) then
    raise exception 'production rows changed during schema alignment';
  end if;

  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into mapped_count from public.wa_afh_map_facilities;
  if listed_count is distinct from directory_before
     or mapped_count is distinct from map_before then
    raise exception 'directory view membership changed';
  end if;

  select proc.oid into function_oid
  from pg_proc as proc
  where proc.oid = 'public.submit_owner_claim(uuid, text)'::regprocedure
    and proc.prosecdef
    and proc.proacl is not null
    and pg_catalog.strpos(proc.prosrc, 'presence is distinct from ''absent''') > 0
    and pg_catalog.strpos(proc.prosrc, '00000000-0000-4000-8000-000000000002') > 0
    and exists (
      select 1
      from pg_catalog.unnest(proc.proconfig) as config
      where split_part(config, '=', 1) = 'search_path'
        and split_part(config, '=', 2) in ('', '""')
    )
    and not exists (
      select 1
      from pg_catalog.aclexplode(proc.proacl) as acl
      where acl.grantee = 0
        and acl.privilege_type = 'EXECUTE'
    );
  if function_oid is null
     or has_function_privilege('anon', function_oid, 'EXECUTE')
     or not has_function_privilege('authenticated', function_oid, 'EXECUTE') then
    raise exception 'submit_owner_claim does not match the reviewed security shape';
  end if;

  execute 'set local role anon';
  select count(*) into visible_count from public.facilities;
  if visible_count <> 0
     or (select count(*) from public.wa_dshs_listed_facilities) is distinct from anon_directory_before
     or (select count(*) from public.wa_afh_map_facilities) is distinct from anon_map_before then
    raise exception 'anonymous role can read facilities outside the reviewed baseline';
  end if;
  execute 'reset role';
end;
$alignment$;

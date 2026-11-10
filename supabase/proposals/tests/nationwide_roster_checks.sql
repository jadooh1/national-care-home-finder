-- Disposable-database checks for the nationwide roster proposal.
-- This file does not connect to Supabase and it does not keep inserted rows.

begin;

do $checks$
declare
  preserved text;
  current_definition text;
  relation_name text;
begin
  foreach relation_name in array ARRAY['wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh']
  loop
    select definition into preserved
      from nchf_roster_fixture.preserved
      where name = relation_name;
    select pg_get_viewdef(format('public.%I', relation_name)::regclass, true) into current_definition;
    if preserved is distinct from current_definition then
      raise exception 'FAIL % definition changed', relation_name;
    end if;
    if (select relation_acl from nchf_roster_fixture.preserved where name = relation_name)
       is distinct from (
         select cls.relacl::text
         from pg_class as cls
         join pg_namespace as namespace on namespace.oid = cls.relnamespace
         where namespace.nspname = 'public' and cls.relname = relation_name
       ) then
      raise exception 'FAIL % privileges changed', relation_name;
    end if;
  end loop;

  foreach relation_name in array ARRAY['anon', 'authenticated', 'service_role']
  loop
    if has_table_privilege(relation_name, 'public.nationwide_roster', 'SELECT')
       or has_table_privilege(relation_name, 'public.nationwide_roster', 'INSERT')
       or has_table_privilege(relation_name, 'public.nationwide_roster', 'UPDATE')
       or has_table_privilege(relation_name, 'public.nationwide_roster', 'DELETE')
       or has_table_privilege(relation_name, 'public.nationwide_roster', 'TRUNCATE')
       or has_table_privilege(relation_name, 'public.nationwide_roster', 'REFERENCES')
       or has_table_privilege(relation_name, 'public.nationwide_roster', 'TRIGGER') then
      raise exception 'FAIL % retains a nationwide_roster privilege', relation_name;
    end if;
  end loop;

  if (select count(*) from public.nationwide_roster) <> 0 then
    raise exception 'FAIL roster was not empty before the checks';
  end if;

  insert into public.nationwide_roster (
    state_name, license_identifier, identifier_type, issuing_authority, facility_name
  ) values
    ('Iowa', 'ID-1', 'license', 'Agency A', 'Example one'),
    ('Iowa', 'ID-1', 'license', 'Agency B', 'Example two'),
    ('Oregon', 'ID-1', 'license', 'Agency A', 'Example three');

  insert into public.nationwide_roster (
    state_name, certification_identifier, identifier_type, issuing_authority, facility_name
  ) values (
    'Iowa', 'ID-1', 'certification', 'Agency A', 'Example certification'
  );

  begin
    insert into public.nationwide_roster (
      state_name, license_identifier, identifier_type, issuing_authority, facility_name
    ) values (
      'Iowa', 'ID-1', 'license', 'Agency A', 'Example duplicate'
    );
    raise exception 'FAIL duplicate identifier was accepted';
  exception
    when unique_violation then
      null;
  end;

  begin
    insert into public.nationwide_roster (
      state_name, license_identifier, identifier_type, issuing_authority, facility_name,
      disclosure_url, disclosure_kind
    ) values (
      'Iowa', 'ID-2', 'license', 'Agency A', 'Example url only',
      'https://example.gov/facility/example', 'facility-specific'
    );
    raise exception 'FAIL a URL was accepted as a verified facility disclosure';
  exception
    when check_violation then
      null;
  end;

  begin
    insert into public.nationwide_roster (
      state_name, license_identifier, identifier_type, issuing_authority, facility_name,
      disclosure_url, disclosure_kind, disclosure_verified
    ) values (
      'Iowa', 'ID-3', 'license', 'Agency A', 'Example unverified flag',
      'https://example.gov/facility/example', 'facility-specific', true
    );
    raise exception 'FAIL disclosure verification was accepted without evidence';
  exception
    when check_violation then
      null;
  end;

  insert into public.nationwide_roster (
    state_name, license_identifier, identifier_type, issuing_authority, facility_name,
    disclosure_url, disclosure_kind, disclosure_verified, disclosure_verification_evidence
  ) values (
    'Iowa', 'ID-4', 'license', 'Agency A', 'Example verified',
    'https://example.gov/facility/example', 'facility-specific', true, 'recorded review'
  );

  begin
    insert into public.nationwide_roster (
      state_name, license_identifier, identifier_type, issuing_authority, facility_name,
      official_export_date, freshness_verified, disclosure_url, disclosure_kind,
      publication
    ) values (
      'Iowa', 'ID-5', 'license', 'Agency A', 'Example public url',
      '2026-11-09', true, 'https://example.gov/facility/example', 'facility-specific',
      'public'
    );
    raise exception 'FAIL a public row was accepted without disclosure verification';
  exception
    when check_violation then
      null;
  end;

  insert into public.nationwide_roster (
    state_name, license_identifier, identifier_type, issuing_authority, facility_name,
    official_export_date, freshness_verified, disclosure_url, disclosure_kind,
    disclosure_verified, disclosure_verification_evidence, publication
  ) values (
    'Iowa', 'ID-6', 'license', 'Agency A', 'Example public verified',
    '2026-11-09', true, 'https://example.gov/facility/example', 'facility-specific',
    true, 'recorded review', 'public'
  );

  if (select count(*) from public.nationwide_roster) <> 6 then
    raise exception 'FAIL expected rows were not stored';
  end if;
end
$checks$;

rollback;

select 'NATIONWIDE_ROSTER_CHECKS_READY' as status;

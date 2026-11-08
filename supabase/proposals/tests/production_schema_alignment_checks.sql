-- Disposable PostgreSQL proof for the production schema-alignment proposal.
begin;

\ir production_schema_alignment_fixture.sql

create temp table nchf_production_view_snapshot as
select relation.relname::text as view_name,
       pg_catalog.pg_get_viewdef(relation.oid, true) as viewdef,
       coalesce(pg_catalog.array_to_string(relation.reloptions, ','), '') as reloptions,
       coalesce((
         select pg_catalog.string_agg(roles.rolname || '=' || acl.privilege_type, ',' order by roles.rolname, acl.privilege_type)
         from pg_catalog.aclexplode(relation.relacl) as acl
         join pg_catalog.pg_roles as roles on roles.oid = acl.grantee
       ), '') as grants,
       (
         select pg_catalog.string_agg(attribute.attname, ',' order by attribute.attnum)
         from pg_catalog.pg_attribute as attribute
         where attribute.attrelid = relation.oid
           and attribute.attnum > 0
           and not attribute.attisdropped
       ) as columns
from pg_catalog.pg_class as relation
where relation.oid in (
  'public.wa_dshs_listed_facilities'::regclass,
  'public.wa_afh_map_facilities'::regclass
);

select set_config('nchf.production_schema_alignment_authorization', 'authorize-production-schema-alignment', true);
select set_config('nchf.production_schema_alignment_target', 'yiehgstweswxjakbcdzc', true);

\ir ../../migrations/20261108014500_production_schema_alignment.sql
\ir ../../migrations/20261108014500_production_schema_alignment.sql

savepoint visibility_probe;

do $probe$
declare
  eligible uuid := '00000000-0000-4000-8000-000000000101';
  archived uuid := '00000000-0000-4000-8000-000000000102';
  verified_current uuid := '00000000-0000-4000-8000-000000000103';
  verified_archived uuid := '00000000-0000-4000-8000-000000000104';
  listed_current uuid := '00000000-0000-4000-8000-000000000105';
  listed_archived uuid := '00000000-0000-4000-8000-000000000106';
  listed_outside uuid := '00000000-0000-4000-8000-000000000107';
  unclassified uuid;
  new_claim uuid;
  directory_def text;
  map_def text;
  directory_options text;
begin
  select pg_catalog.pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true),
         coalesce(pg_catalog.array_to_string(relation.reloptions, ','), '')
    into directory_def, directory_options
  from pg_catalog.pg_class as relation
  where relation.oid = 'public.wa_dshs_listed_facilities'::regclass;
  select pg_catalog.pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) into map_def;
  if position('security_barrier=true' in directory_options) = 0
     or position('absent' in directory_def) = 0
     or position('wa_dshs_license_comparison' in directory_def) = 0
     or position('AF' in directory_def) = 0
     or position('absent' in map_def) = 0
     or position('wa_dshs_listed_facilities' in map_def) = 0
     or exists (
       select 1
       from nchf_production_view_snapshot as snapshot
       join pg_catalog.pg_class as relation
         on relation.relname = snapshot.view_name
        and relation.relnamespace = 'public'::regnamespace
       where coalesce((
         select pg_catalog.string_agg(roles.rolname || '=' || acl.privilege_type, ',' order by roles.rolname, acl.privilege_type)
         from pg_catalog.aclexplode(relation.relacl) as acl
         join pg_catalog.pg_roles as roles on roles.oid = acl.grantee
       ), '') is distinct from snapshot.grants
          or (
            select pg_catalog.string_agg(attribute.attname, ',' order by attribute.attnum)
            from pg_catalog.pg_attribute as attribute
            where attribute.attrelid = relation.oid
              and attribute.attnum > 0
              and not attribute.attisdropped
          ) is distinct from snapshot.columns
     ) then
    raise exception 'FAIL production view options, columns, or grants changed';
  end if;

  select id into unclassified
  from public.facilities
  where record_status = 'unclassified'
    and facility_type = 'AF'
  limit 1;
  insert into public.facilities (
    id, canonical_name, address_line1, city, county, state_code, postal_code,
    license_number, licensed_capacity, record_status, latitude, longitude,
    source_name, license_category, facility_type, normalized_license_number, presence
  ) values
    (eligible, 'Synthetic eligible home', '2 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000001', 6, 'source_matched', 47.0, -122.0, 'wa_dshs_afh', 'afh', 'AFH', '9000000001', null),
    (archived, 'Synthetic archived home', '3 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000002', 6, 'source_matched', 47.1, -122.1, 'wa_dshs_afh', 'afh', 'AFH', '9000000002', 'absent'),
    (verified_current, 'Synthetic verified home', '4 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000003', 6, 'verified', 47.2, -122.2, null, null, 'AFH', null, 'active'),
    (verified_archived, 'Synthetic verified archive', '5 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000004', 6, 'verified', 47.3, -122.3, null, null, 'AFH', null, 'absent'),
    (listed_current, 'Synthetic listed home', '6 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000005', 6, 'unclassified', 47.4, -122.4, null, null, 'AF', null, null),
    (listed_archived, 'Synthetic listed archive', '7 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000006', 6, 'unclassified', 47.5, -122.5, null, null, 'AF', null, 'absent'),
    (listed_outside, 'Synthetic listed outside map', '8 Example St', 'Example', 'Example', 'WA', '98001',
     '9000000007', 6, 'unclassified', 40.0, -122.6, null, null, 'AF', null, null);
  insert into public.wa_dshs_license_comparison (license_number)
  values ('9000000005'), ('9000000006'), (' 9000000007 ');

  execute 'set local role anon';
  if (select count(*) from public.facilities where id = verified_current) <> 1
     or (select count(*) from public.facilities where id = verified_archived) <> 0
     or (select count(*) from public.facilities where id = eligible) <> 1
     or (select count(*) from public.facilities where id = archived) <> 0
     or (select count(*) from public.facilities where id = unclassified) <> 0
     or (select count(*) from public.facilities where id = listed_current) <> 0
     or (select count(*) from public.wa_dshs_listed_facilities where id = unclassified) <> 1
     or (select count(*) from public.wa_dshs_listed_facilities where id = listed_current) <> 1
     or (select count(*) from public.wa_dshs_listed_facilities where id = listed_archived) <> 0
     or (select count(*) from public.wa_dshs_listed_facilities where id = listed_outside) <> 1
     or (select count(*) from public.wa_dshs_listed_facilities where id = eligible) <> 0
     or (select count(*) from public.wa_afh_map_facilities where id = unclassified) <> 1
     or (select count(*) from public.wa_afh_map_facilities where id = listed_current) <> 1
     or (select count(*) from public.wa_afh_map_facilities where id = listed_archived) <> 0
     or (select count(*) from public.wa_afh_map_facilities where id = listed_outside) <> 0
     or (select count(*) from public.wa_afh_map_facilities where id = eligible) <> 0 then
    raise exception 'FAIL public read, directory, or map visibility';
  end if;
  execute 'reset role';
  execute 'set local role service_role';
  if (select count(*) from public.wa_dshs_listed_facilities where id = listed_current) <> 1
     or (select count(*) from public.wa_afh_map_facilities where id = listed_current) <> 1 then
    raise exception 'FAIL service role cannot read the preserved views';
  end if;
  execute 'reset role';

  execute 'set local role authenticated';
  begin
    perform public.submit_owner_claim(unclassified, 'synthetic evidence notes');
    raise exception 'FAIL ineligible claim was accepted';
  exception
    when others then
      if sqlerrm is distinct from 'facility is not eligible' then
        raise;
      end if;
  end;
  begin
    perform public.submit_owner_claim(archived, 'synthetic evidence notes');
    raise exception 'FAIL archived claim was accepted';
  exception
    when others then
      if sqlerrm is distinct from 'facility is not eligible' then
        raise;
      end if;
  end;
  new_claim := public.submit_owner_claim(eligible, 'synthetic evidence notes');
  execute 'reset role';
  if new_claim is null
     or (select count(*) from public.owner_claims where verification_status = 'pending') <> 1
     or (select count(*) from public.owner_claim_events where claim_id = new_claim) <> 1 then
    raise exception 'FAIL legitimate claim was not recorded';
  end if;
  execute 'set local role anon';
  begin
    perform public.submit_owner_claim(eligible, 'synthetic evidence notes');
    raise exception 'FAIL anon executed submit_owner_claim';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';
end;
$probe$;

rollback to savepoint visibility_probe;

\ir ../../migrations/20261108014500_production_schema_alignment.sql

do $after_probe$
begin
  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or exists (select 1 from public.facilities where presence is not null) then
    raise exception 'FAIL probe changed the baseline rows';
  end if;
end;
$after_probe$;

\ir ../20261108014500_production_schema_alignment_ROLLBACK.sql

do $after_rollback$
declare
  policy_expr text;
  directory_def text;
  map_def text;
begin
  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.app_admins) <> 1
     or (select count(*) from public.wa_dshs_listed_facilities) <> 8121
     or (select count(*) from public.wa_afh_map_facilities) <> 8121
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'facilities'
         and column_name in ('presence', 'source_name', 'license_category', 'normalized_license_number')
     )
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'owner_claims' and column_name = 'reviewed_at'
     )
     or to_regprocedure('public.submit_owner_claim(uuid, text)') is not null
     or to_regclass('public.nchf_production_schema_alignment_audit') is not null then
    raise exception 'FAIL rollback did not restore the fixture';
  end if;
  if exists (
    select 1
    from nchf_production_view_snapshot as snapshot
    join pg_catalog.pg_class as relation
      on relation.relname = snapshot.view_name
     and relation.relnamespace = 'public'::regnamespace
    where pg_catalog.pg_get_viewdef(relation.oid, true) is distinct from snapshot.viewdef
       or coalesce(pg_catalog.array_to_string(relation.reloptions, ','), '') is distinct from snapshot.reloptions
       or coalesce((
         select pg_catalog.string_agg(roles.rolname || '=' || acl.privilege_type, ',' order by roles.rolname, acl.privilege_type)
         from pg_catalog.aclexplode(relation.relacl) as acl
         join pg_catalog.pg_roles as roles on roles.oid = acl.grantee
       ), '') is distinct from snapshot.grants
       or (
         select pg_catalog.string_agg(attribute.attname, ',' order by attribute.attnum)
         from pg_catalog.pg_attribute as attribute
         where attribute.attrelid = relation.oid
           and attribute.attnum > 0
           and not attribute.attisdropped
       ) is distinct from snapshot.columns
  ) then
    raise exception 'FAIL existing views were not restored';
  end if;
  select pg_catalog.pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true) into directory_def;
  select pg_catalog.pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) into map_def;
  if position('absent' in directory_def) > 0 or position('absent' in map_def) > 0
     or position('wa_dshs_license_comparison' in directory_def) = 0
     or position('wa_dshs_listed_facilities' in map_def) = 0
     or position('security_barrier=true' in (
       select coalesce(pg_catalog.array_to_string(relation.reloptions, ','), '')
       from pg_catalog.pg_class as relation
       where relation.oid = 'public.wa_dshs_listed_facilities'::regclass
     )) = 0 then
    raise exception 'FAIL restored views lost the production definition';
  end if;
  select pg_catalog.pg_get_expr(policy.polqual, policy.polrelid) into policy_expr
  from pg_policy as policy
  where policy.polrelid = 'public.facilities'::regclass
    and policy.polname = 'Public read verified facilities';
  if policy_expr is null
     or position('verified' in policy_expr) = 0
     or position('absent' in policy_expr) > 0
     or position('source_matched' in policy_expr) > 0
     or (select count(*) from pg_policy where polrelid = 'public.facilities'::regclass) <> 1 then
    raise exception 'FAIL verified policy was not restored: %', policy_expr;
  end if;
end;
$after_rollback$;

rollback;

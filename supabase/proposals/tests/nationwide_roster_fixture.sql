-- Empty directory stand-ins for a disposable database. No facility rows are loaded.

create schema if not exists nchf_roster_fixture;

create view public.wa_dshs_listed_facilities as
  select 0::integer as preserved_count
  where false;

create view public.wa_afh_map_facilities as
  select 0::integer as preserved_count
  where false;

create view public.or_odhs_listed_afh as
  select 0::integer as preserved_count
  where false;

create table nchf_roster_fixture.preserved (
  name text primary key,
  definition text not null,
  relation_acl text
);

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$roles$;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

grant select on
  public.wa_dshs_listed_facilities,
  public.wa_afh_map_facilities,
  public.or_odhs_listed_afh
  to anon, authenticated;

insert into nchf_roster_fixture.preserved (name, definition, relation_acl)
select cls.relname, pg_get_viewdef(cls.oid, true), cls.relacl::text
from pg_class as cls
join pg_namespace as namespace on namespace.oid = cls.relnamespace
where namespace.nspname = 'public'
  and cls.relname in ('wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh');

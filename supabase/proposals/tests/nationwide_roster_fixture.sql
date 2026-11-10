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
  definition text not null
);

insert into nchf_roster_fixture.preserved (name, definition)
select cls.relname, pg_get_viewdef(cls.oid, true)
from pg_class as cls
join pg_namespace as namespace on namespace.oid = cls.relnamespace
where namespace.nspname = 'public'
  and cls.relname in ('wa_dshs_listed_facilities', 'wa_afh_map_facilities', 'or_odhs_listed_afh');

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$roles$;

create table public.fixture_wa_facilities (
  postal_code text,
  licensed_capacity integer
);

create view public.wa_dshs_listed_facilities as
select postal_code, licensed_capacity
from public.fixture_wa_facilities;

grant select on table public.wa_dshs_listed_facilities to anon, authenticated;

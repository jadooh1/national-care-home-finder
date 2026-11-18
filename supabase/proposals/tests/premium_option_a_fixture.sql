-- Disposable fixture for the Option A premium ledger. Not a migration.

create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant anon, authenticated to current_user;
grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table public.published_owner_listings (
  facility_id uuid not null,
  field_name text not null,
  published_value text not null,
  published_at timestamptz not null,
  primary key (facility_id, field_name)
);

insert into public.published_owner_listings (facility_id, field_name, published_value, published_at) values
  ('00000000-0000-4000-8000-0000000000f1', 'description', 'Owner description for the premium check.', '2026-11-09T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000f2', 'services', 'Owner services without a subscription.', '2026-11-09T00:00:00Z');

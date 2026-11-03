-- REVIEW-ONLY PROPOSAL. This file is not a migration.
-- Do not move it into supabase/migrations.
-- Do not execute it without a separate authorization and a verified
-- development-database target. It must not be applied to production
-- from this pull request.
--
-- Proposed state, already represented in development and restated here
-- for review:
-- 1. public.wa_dshs_listed_facilities and public.wa_afh_map_facilities
--    stay readable by anon and authenticated, with table and column
--    write privileges removed from PUBLIC, anon, and authenticated.
-- 2. public.owner_claims keeps one pending or approved claim per
--    facility and claimant.
--
-- public.facilities and every other view are intentionally untouched.
-- security_invoker views depend on underlying table privileges.

revoke insert, update, delete, truncate, references, trigger
  on table public.wa_dshs_listed_facilities,
           public.wa_afh_map_facilities
  from public, anon, authenticated;

grant select
  on table public.wa_dshs_listed_facilities,
           public.wa_afh_map_facilities
  to anon, authenticated;

-- Column write privileges are INSERT, UPDATE, and REFERENCES.
-- DELETE, TRUNCATE, and TRIGGER exist only at table level and are
-- revoked above.
do $$
declare
  relation_name text;
  column_name text;
begin
  foreach relation_name in array array[
    'wa_dshs_listed_facilities',
    'wa_afh_map_facilities'
  ]
  loop
    if to_regclass(format('public.%I', relation_name)) is null then
      raise exception
        'Refusing to continue: public.% does not exist on this target.',
        relation_name;
    end if;

    for column_name in
      select attribute.attname
      from pg_attribute as attribute
      join pg_class as relation
        on relation.oid = attribute.attrelid
      join pg_namespace as schema
        on schema.oid = relation.relnamespace
      where schema.nspname = 'public'
        and relation.relname = relation_name
        and attribute.attnum > 0
        and not attribute.attisdropped
      order by attribute.attnum
    loop
      execute format(
        'revoke insert (%1$I), update (%1$I), references (%1$I) on table public.%2$I from public, anon, authenticated',
        column_name,
        relation_name
      );
    end loop;
  end loop;
end
$$;

do $$
declare
  duplicate_pairs bigint;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name = 'facility_id'
      and is_nullable = 'NO'
  ) then
    raise exception
      'Refusing to create the claim index: public.owner_claims.facility_id must exist and be NOT NULL.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_claims'
      and column_name = 'claimant_user_id'
      and is_nullable = 'NO'
  ) then
    raise exception
      'Refusing to create the claim index: public.owner_claims.claimant_user_id must exist and be NOT NULL.';
  end if;

  select count(*)
    into duplicate_pairs
  from (
    select facility_id, claimant_user_id
    from public.owner_claims
    where verification_status in ('pending', 'approved')
    group by facility_id, claimant_user_id
    having count(*) > 1
  ) as duplicate_claims;

  if duplicate_pairs > 0 then
    raise exception
      'Refusing to create owner_claims_one_active_claim_per_user_facility: % duplicate pending or approved facility and user pairs exist.',
      duplicate_pairs;
  end if;

  execute $index$
    create unique index if not exists owner_claims_one_active_claim_per_user_facility
      on public.owner_claims (facility_id, claimant_user_id)
      where verification_status in ('pending', 'approved')
  $index$;
end
$$;

-- REVIEW-ONLY PROPOSAL. This file is not a migration.
-- Do not move it into supabase/migrations.
-- Do not execute it without a separate authorization and a verified
-- development-database target. It must not be applied to production
-- from this pull request.
--
-- Previously applied and verified in development:
-- 1. Table-level INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and
--    TRIGGER were revoked from anon and authenticated on
--    public.wa_dshs_listed_facilities and public.wa_afh_map_facilities.
-- 2. SELECT remains granted to anon and authenticated on those two views.
-- 3. The unique partial index
--    owner_claims_one_active_claim_per_user_facility was verified on
--    public.owner_claims (facility_id, claimant_user_id)
--    WHERE verification_status IN ('pending', 'approved').
--
-- Additional proposed changes, not yet applied or verified:
-- 1. Revoke those same table-level write privileges from PUBLIC.
-- 2. Revoke column-level INSERT, UPDATE, and REFERENCES from PUBLIC,
--    anon, and authenticated on every column of those two views.
--
-- public.facilities and every other view are intentionally untouched.
-- security_invoker views depend on underlying table privileges.

-- Restates the verified anon and authenticated table-level revocations.
-- The PUBLIC revocation in this statement is proposed and has not been
-- applied or verified.
revoke insert, update, delete, truncate, references, trigger
  on table public.wa_dshs_listed_facilities,
           public.wa_afh_map_facilities
  from public, anon, authenticated;

-- Restates the verified SELECT grants.
grant select
  on table public.wa_dshs_listed_facilities,
           public.wa_afh_map_facilities
  to anon, authenticated;

-- Proposed and not yet applied or verified.
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
  existing_index oid;
  existing_kind "char";
  claims_relation oid;
  key_columns text[];
  predicate_text text;
  normalized_predicate text;
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

  select pg_class.oid, pg_class.relkind
    into existing_index, existing_kind
  from pg_class
  join pg_namespace
    on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relname = 'owner_claims_one_active_claim_per_user_facility';

  if existing_index is not null then
    if existing_kind <> 'i' then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility exists but is not an index.';
    end if;

    select pg_class.oid
      into claims_relation
    from pg_class
    join pg_namespace
      on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = 'owner_claims';

    select coalesce(
             array_agg(attribute.attname order by key_column.ordinality),
             '{}'::text[]
           )
      into key_columns
    from pg_index as index_row
    cross join lateral unnest(index_row.indkey::smallint[])
      with ordinality as key_column(attnum, ordinality)
    join pg_attribute as attribute
      on attribute.attrelid = index_row.indrelid
     and attribute.attnum = key_column.attnum
    where index_row.indexrelid = existing_index
      and key_column.ordinality <= index_row.indnkeyatts
      and key_column.attnum > 0;

    select pg_get_expr(index_row.indpred, index_row.indrelid)
      into predicate_text
    from pg_index as index_row
    where index_row.indexrelid = existing_index;

    -- pg_get_expr deparses IN ('pending', 'approved') with casts that
    -- depend on the column type. Remove those casts before comparing.
    normalized_predicate := regexp_replace(
      lower(coalesce(predicate_text, '')),
      '::[a-z0-9_ ]+(\[\])?',
      '',
      'g'
    );
    normalized_predicate := regexp_replace(normalized_predicate, '\s+', '', 'g');
    normalized_predicate := translate(normalized_predicate, '()', '');

    if claims_relation is null
      or not exists (
        select 1
        from pg_index as index_row
        where index_row.indexrelid = existing_index
          and index_row.indrelid = claims_relation
          and index_row.indisunique
          and index_row.indisvalid
          and index_row.indisready
          and index_row.indislive
          and not index_row.indisprimary
          and index_row.indexprs is null
          and index_row.indnkeyatts = 2
          and index_row.indnatts = 2
          and index_row.indpred is not null
      )
      or key_columns is distinct from array['facility_id', 'claimant_user_id']
      or normalized_predicate is distinct from
        'verification_status=anyarray[''pending'',''approved'']'
    then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility exists but does not match the verified unique partial index on (facility_id, claimant_user_id) where verification_status in (''pending'', ''approved''). Existing predicate: %',
        coalesce(predicate_text, '<none>');
    end if;
  else
    execute $index$
      create unique index owner_claims_one_active_claim_per_user_facility
        on public.owner_claims (facility_id, claimant_user_id)
        where verification_status in ('pending', 'approved')
    $index$;
  end if;
end
$$;

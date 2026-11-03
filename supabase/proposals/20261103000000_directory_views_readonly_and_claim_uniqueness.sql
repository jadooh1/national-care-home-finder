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
  status_type_oid oid;
  status_category "char";
  status_type text;
  sample_values text;
  verification_query text;
  predicate_matches boolean;
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

    if claims_relation is null then
      raise exception
        'Refusing to continue: public.owner_claims does not exist on this target.';
    end if;

    if not exists (
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
    ) then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility is not a valid, ready, live unique partial index on public.owner_claims.';
    end if;

    select coalesce(
             array_agg(attribute.attname order by key_column.ordinality),
             '{}'::text[]
           )
      into key_columns
    from pg_index as index_row
    cross join lateral generate_series(1, index_row.indnkeyatts) as key_column(ordinality)
    join pg_attribute as attribute
      on attribute.attrelid = index_row.indrelid
     and attribute.attnum = index_row.indkey[key_column.ordinality]
    where index_row.indexrelid = existing_index
      and index_row.indkey[key_column.ordinality] > 0;

    if key_columns is distinct from array['facility_id', 'claimant_user_id'] then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility key columns are %, not (facility_id, claimant_user_id).',
        key_columns;
    end if;

    select pg_get_expr(index_row.indpred, index_row.indrelid)
      into predicate_text
    from pg_index as index_row
    where index_row.indexrelid = existing_index;

    if predicate_text is null then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility has no partial predicate.';
    end if;

    -- Compare the stored predicate by evaluation. This accepts any
    -- equivalent spelling of pending and approved, and it rejects a
    -- predicate that disagrees on any sample value.
    select attribute.atttypid,
           typ.typcategory,
           format_type(attribute.atttypid, attribute.atttypmod)
      into status_type_oid, status_category, status_type
    from pg_attribute as attribute
    join pg_type as typ
      on typ.oid = attribute.atttypid
    where attribute.attrelid = claims_relation
      and attribute.attname = 'verification_status'
      and attribute.attnum > 0
      and not attribute.attisdropped;

    if status_type is null then
      raise exception
        'Refusing to continue: public.owner_claims.verification_status does not exist, so the claim index predicate cannot be verified.';
    end if;

    if status_category = 'E' then
      select string_agg(
               format('(%L::%s)', enum_label.enumlabel, status_type),
               ', ' order by enum_label.enumsortorder
             )
        into sample_values
      from pg_enum as enum_label
      where enum_label.enumtypid = status_type_oid;
    elsif status_category = 'S' then
      select string_agg(
               format('(%L::%s)', literal.value, status_type),
               ', ' order by literal.ordinality
             )
        into sample_values
      from (
        values
          (1, 'pending'),
          (2, 'approved'),
          (3, 'rejected'),
          (4, 'denied'),
          (5, 'revoked'),
          (6, 'PENDING'),
          (7, 'Approved'),
          (8, 'pending '),
          (9, '')
      ) as literal(ordinality, value);
    else
      raise exception
        'Refusing to continue: public.owner_claims.verification_status has type %, which this proposal does not use for predicate verification.',
        status_type;
    end if;

    if sample_values is null then
      raise exception
        'Refusing to continue: no verification_status sample values are available to verify the claim index predicate.';
    end if;

    sample_values := sample_values || format(', (NULL::%s)', status_type);
    verification_query := replace(
      $query$
        select coalesce(bool_and(
                 predicate_result is not distinct from
                 (verification_status in ('pending', 'approved'))
               ), false)
        from (
          select sample.verification_status,
                 (__PREDICATE__) as predicate_result
          from (values __SAMPLES__) as sample(verification_status)
        ) as checks
      $query$,
      '__SAMPLES__',
      sample_values
    );
    verification_query := replace(
      verification_query,
      '__PREDICATE__',
      predicate_text
    );

    begin
      execute verification_query into predicate_matches;
    exception
      when others then
        raise exception
          'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility predicate could not be verified. Existing predicate: %',
          predicate_text;
    end;

    if predicate_matches is not true then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility predicate does not represent verification_status in (''pending'', ''approved''). Existing predicate: %',
        predicate_text;
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

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
  expected_predicate text;
  probe_index regclass;
  index_access_method name;
  nulls_not_distinct boolean;
  key_subscript integer;
  key_attnum smallint;
  key_opclass oid;
  key_collation oid;
  key_name name;
  key_type oid;
  column_collation oid;
  lookup_type oid;
  base_type oid;
  type_kind "char";
  opclass_count integer;
  opclass_depth integer;
  default_opclass oid;
  expected_name name;
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

  -- Reject a non-btree index before any query plans a scan of owner_claims.
  -- PostgreSQL validates the index access method while planning that scan.
  select pg_class.oid, pg_class.relkind
    into existing_index, existing_kind
  from pg_class
  join pg_namespace
    on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relname = 'owner_claims_one_active_claim_per_user_facility';

  if existing_kind = 'i' then
    select access_method.amname
      into index_access_method
    from pg_class as index_relation
    join pg_am as access_method
      on access_method.oid = index_relation.relam
    where index_relation.oid = existing_index;

    if index_access_method is distinct from 'btree' then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility uses access method %, not btree.',
        coalesce(index_access_method, '<unknown>');
    end if;
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

    -- indkey is an int2vector whose subscripts start at 0. Subscript 0
    -- is the first key column. Every key position is retained so an
    -- expression key cannot shift the remaining names into place.
    select coalesce(
             array_agg(
               coalesce(attribute.attname, '<expression>')
               order by key_subscript.subscript
             ),
             '{}'::text[]
           )
      into key_columns
    from pg_index as index_row
    cross join lateral generate_series(0, index_row.indnkeyatts - 1) as key_subscript(subscript)
    left join pg_attribute as attribute
      on attribute.attrelid = index_row.indrelid
     and attribute.attnum = index_row.indkey[key_subscript.subscript]
     and attribute.attnum > 0
     and not attribute.attisdropped
    where index_row.indexrelid = existing_index;

    if key_columns is distinct from array['facility_id', 'claimant_user_id'] then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility key columns are %, not (facility_id, claimant_user_id).',
        key_columns;
    end if;

    -- Unique enforcement must be the default B-tree equality semantics:
    -- btree access method, the default operator class for each column
    -- type, the column's own collation, and distinct nulls. A missing
    -- or ambiguous catalog answer stops the proposal.
    select access_method.amname
      into index_access_method
    from pg_class as index_relation
    join pg_am as access_method
      on access_method.oid = index_relation.relam
    where index_relation.oid = existing_index;

    if index_access_method is distinct from 'btree' then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility uses access method %, not btree.',
        coalesce(index_access_method, '<unknown>');
    end if;

    begin
      execute
        'select indnullsnotdistinct from pg_index where indexrelid = $1'
        into nulls_not_distinct
        using existing_index;
    exception
      when others then
        raise exception
          'Refusing to continue: null-distinct uniqueness behavior could not be verified for public.owner_claims_one_active_claim_per_user_facility.';
    end;

    if nulls_not_distinct is distinct from false then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility does not use default null-distinct unique comparisons.';
    end if;

    -- indclass and indcollation are oidvectors. Like indkey, their
    -- subscripts start at 0.
    for key_subscript in 0..1 loop
      select index_row.indkey[key_subscript],
             index_row.indclass[key_subscript],
             index_row.indcollation[key_subscript]
        into key_attnum, key_opclass, key_collation
      from pg_index as index_row
      where index_row.indexrelid = existing_index;

      expected_name := case key_subscript
        when 0 then 'facility_id'
        else 'claimant_user_id'
      end;

      if key_attnum is null or key_attnum <= 0 then
        raise exception
          'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility key % is an expression, not %.',
          key_subscript,
          expected_name;
      end if;

      select attribute.attname,
             attribute.atttypid,
             attribute.attcollation
        into key_name, key_type, column_collation
      from pg_attribute as attribute
      where attribute.attrelid = claims_relation
        and attribute.attnum = key_attnum
        and attribute.attnum > 0
        and not attribute.attisdropped;

      if key_name is distinct from expected_name
        or key_type is null
        or key_collation is distinct from column_collation then
        raise exception
          'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility key % does not match % with its column collation.',
          key_subscript,
          expected_name;
      end if;

      default_opclass := null;
      lookup_type := key_type;
      opclass_depth := 0;
      while lookup_type is not null and lookup_type <> 0 loop
        opclass_depth := opclass_depth + 1;
        if opclass_depth > 8 then
          raise exception
            'Refusing to continue: default btree operator class lookup did not finish for %.',
            expected_name;
        end if;
        select count(*)
          into opclass_count
        from pg_opclass as operator_class
        join pg_am as access_method
          on access_method.oid = operator_class.opcmethod
        where operator_class.opcintype = lookup_type
          and access_method.amname = 'btree'
          and operator_class.opcdefault;

        if opclass_count > 1 then
          raise exception
            'Refusing to continue: more than one default btree operator class exists for %.',
            lookup_type::regtype;
        elsif opclass_count = 1 then
          select operator_class.oid
            into default_opclass
          from pg_opclass as operator_class
          join pg_am as access_method
            on access_method.oid = operator_class.opcmethod
          where operator_class.opcintype = lookup_type
            and access_method.amname = 'btree'
            and operator_class.opcdefault;
          exit;
        end if;

        select typ.typtype, typ.typbasetype
          into type_kind, base_type
        from pg_type as typ
        where typ.oid = lookup_type;

        if type_kind = 'd'
          and base_type is not null
          and base_type <> 0 then
          lookup_type := base_type;
        else
          lookup_type := null;
        end if;
      end loop;

      if default_opclass is null
        or key_opclass is distinct from default_opclass then
        raise exception
          'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility key % does not use the default btree operator class for %.',
          expected_name,
          coalesce(key_type::regtype::text, '<unknown>');
      end if;
    end loop;

    select pg_get_expr(index_row.indpred, index_row.indrelid)
      into predicate_text
    from pg_index as index_row
    where index_row.indexrelid = existing_index;

    if predicate_text is null then
      raise exception
        'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility has no partial predicate.';
    end if;

    if not exists (
      select 1
      from pg_attribute as attribute
      where attribute.attrelid = claims_relation
        and attribute.attname = 'verification_status'
        and attribute.attnum > 0
        and not attribute.attisdropped
    ) then
      raise exception
        'Refusing to continue: public.owner_claims.verification_status does not exist, so the claim index predicate cannot be verified.';
    end if;

    -- Identity is established by asking PostgreSQL to record the
    -- intended predicate on a temporary copy of the column definitions
    -- and comparing that canonical expression with the existing one.
    -- A different spelling is rejected even if it might be semantically
    -- similar. Sample values are not treated as proof. The temporary
    -- objects are not created in public and are removed before success.
    if to_regclass('pg_temp.owner_claims_predicate_probe') is not null
      or to_regclass('pg_temp.owner_claims_predicate_probe_idx') is not null then
      raise exception
        'Refusing to continue: a predicate probe object already exists in this session.';
    end if;

    begin
      execute 'create temp table owner_claims_predicate_probe (like public.owner_claims)';
      execute $probe$
        create index owner_claims_predicate_probe_idx
          on pg_temp.owner_claims_predicate_probe (verification_status)
          where verification_status in ('pending', 'approved')
      $probe$;

      probe_index := to_regclass('pg_temp.owner_claims_predicate_probe_idx');
      if probe_index is null then
        raise exception
          'Refusing to continue: the canonical predicate probe index was not created.';
      end if;

      select pg_get_expr(index_row.indpred, index_row.indrelid)
        into expected_predicate
      from pg_index as index_row
      where index_row.indexrelid = probe_index;

      if expected_predicate is null
        or predicate_text is distinct from expected_predicate then
        raise exception
          'Refusing to continue: public.owner_claims_one_active_claim_per_user_facility predicate does not canonically match verification_status in (''pending'', ''approved''). Existing predicate: %. Canonical predicate: %',
          predicate_text,
          coalesce(expected_predicate, '<none>');
      end if;

      execute 'drop table pg_temp.owner_claims_predicate_probe';
    exception
      when others then
        -- This handler creates a subtransaction, so a failed probe rolls
        -- back its temporary table instead of leaving it behind.
        raise;
    end;
  else
    execute $index$
      create unique index owner_claims_one_active_claim_per_user_facility
        on public.owner_claims using btree (facility_id, claimant_user_id)
        where verification_status in ('pending', 'approved')
    $index$;
  end if;
end
$$;

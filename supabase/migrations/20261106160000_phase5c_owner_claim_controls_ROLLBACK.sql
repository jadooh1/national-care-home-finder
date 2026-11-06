-- Phase 5C rollback. This restores captured browser privileges and is a
-- security downgrade. It refuses to run unless the session sets
-- nchf.phase5c_rollback_authorization to
-- authorize-owner-claim-direct-insert-downgrade.
-- It does not delete claim rows, edit rows, facility rows, or Phase 5A
-- recovery rows, and it does not disable row-level security on either
-- snapshot. Do not run it against production or the development project
-- without a separate approval. Isolated tests are the only intended caller.

begin;

do $rollback$
declare
  recomputed text;
  stored_min text;
  stored_max text;
  grant_row record;
  policy_row record;
  function_row record;
  claim_events bigint := 0;
  edit_events bigint := 0;
  policy_sql text;
  rel_name text;
  col_name text;
begin
  if pg_catalog.current_setting('nchf.phase5c_rollback_authorization', true)
     is distinct from 'authorize-owner-claim-direct-insert-downgrade' then
    raise exception 'rollback refused without authorization';
  end if;
  if to_regclass('public.nchf_phase5c_privilege_snapshot') is null then
    raise exception 'rollback refused because the privilege snapshot is missing';
  end if;

  select pg_catalog.md5(pg_catalog.string_agg(captured_line, E'\n' order by captured_line)),
         min(snapshot_checksum),
         max(snapshot_checksum)
    into recomputed, stored_min, stored_max
  from public.nchf_phase5c_privilege_snapshot;

  if recomputed is null
     or recomputed is distinct from stored_min
     or stored_min is distinct from stored_max then
    raise exception 'rollback refused because the privilege snapshot checksum does not match';
  end if;

  foreach rel_name in array ARRAY['owner_claims', 'listing_edits']::text[]
  loop
    execute format('revoke all on table public.%I from anon, authenticated, public', rel_name);
    for col_name in
      select attribute.attname
      from pg_attribute as attribute
      where attribute.attrelid = format('public.%I', rel_name)::regclass
        and attribute.attnum > 0
        and not attribute.attisdropped
    loop
      execute format(
        'revoke all (%I) on table public.%I from anon, authenticated, public',
        col_name,
        rel_name
      );
    end loop;
  end loop;

  for grant_row in
    select captured.relation_name, captured.grantee_name, captured.privilege_type
    from public.nchf_phase5c_privilege_snapshot as captured
    where captured.section = 'table_grant'
  loop
    if grant_row.relation_name not in ('owner_claims', 'listing_edits')
       or grant_row.grantee_name not in ('anon', 'authenticated', 'PUBLIC')
       or grant_row.privilege_type not in (
         'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
       ) then
      raise exception 'rollback refused an unexpected table privilege';
    end if;
    execute format(
      'grant %s on table public.%I to %s',
      grant_row.privilege_type,
      grant_row.relation_name,
      case when grant_row.grantee_name = 'PUBLIC' then 'public' else grant_row.grantee_name end
    );
  end loop;

  for grant_row in
    select captured.relation_name, captured.grantee_name, captured.privilege_type, captured.column_name
    from public.nchf_phase5c_privilege_snapshot as captured
    where captured.section = 'column_grant'
  loop
    if grant_row.relation_name not in ('owner_claims', 'listing_edits')
       or grant_row.grantee_name not in ('anon', 'authenticated', 'PUBLIC')
       or grant_row.privilege_type not in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
       or grant_row.column_name !~ '^[A-Za-z_][A-Za-z0-9_]*$' then
      raise exception 'rollback refused an unexpected column privilege';
    end if;
    execute format(
      'grant %s (%I) on table public.%I to %s',
      grant_row.privilege_type,
      grant_row.column_name,
      grant_row.relation_name,
      case when grant_row.grantee_name = 'PUBLIC' then 'public' else grant_row.grantee_name end
    );
  end loop;

  drop policy if exists owner_claims_select_claimant on public.owner_claims;
  drop policy if exists listing_edits_select_submitter on public.listing_edits;

  for policy_row in
    select captured.relation_name, captured.policy_name, captured.policy_command, captured.policy_roles, captured.policy_qual, captured.policy_with_check
    from public.nchf_phase5c_privilege_snapshot as captured
    where captured.section = 'policy'
      and captured.created_by_migration
  loop
    if policy_row.relation_name not in ('owner_claims', 'listing_edits')
       or policy_row.policy_command not in ('select', 'insert', 'update', 'delete', 'all')
       or policy_row.policy_roles !~ '^(PUBLIC|[A-Za-z_][A-Za-z0-9_]*(,\s[A-Za-z_][A-Za-z0-9_]*)*)$'
       or coalesce(policy_row.policy_qual, '') ~ ';'
       or coalesce(policy_row.policy_with_check, '') ~ ';'
       or policy_row.policy_name !~ '^[A-Za-z_][A-Za-z0-9_]*$' then
      raise exception 'rollback refused an unexpected policy';
    end if;
    if exists (
      select 1
      from pg_policy as policy
      join pg_class as relation
        on relation.oid = policy.polrelid
      where relation.relnamespace = 'public'::regnamespace
        and relation.relname = policy_row.relation_name
        and policy.polname = policy_row.policy_name
    ) then
      continue;
    end if;
    policy_sql := format(
      'create policy %I on public.%I for %s to %s',
      policy_row.policy_name,
      policy_row.relation_name,
      policy_row.policy_command,
      policy_row.policy_roles
    );
    if policy_row.policy_qual is not null then
      policy_sql := policy_sql || format(' using (%s)', policy_row.policy_qual);
    elsif policy_row.policy_command in ('select', 'update', 'delete', 'all') then
      policy_sql := policy_sql || ' using (true)';
    end if;
    if policy_row.policy_with_check is not null then
      policy_sql := policy_sql || format(' with check (%s)', policy_row.policy_with_check);
    elsif policy_row.policy_command in ('insert', 'update', 'all') then
      policy_sql := policy_sql || ' with check (true)';
    end if;
    execute policy_sql;
  end loop;

  for function_row in
    select captured.function_name, captured.function_definition, captured.function_existed
    from public.nchf_phase5c_privilege_snapshot as captured
    where captured.section = 'review_function'
  loop
    if function_row.function_name not in (
      'admin_approve_owner_claim',
      'admin_reject_owner_claim',
      'admin_review_listing_edit'
    ) then
      raise exception 'rollback refused an unexpected function';
    end if;
    if function_row.function_existed then
      if function_row.function_definition is null
         or function_row.function_definition !~ (
           '^CREATE OR REPLACE FUNCTION public\.' || function_row.function_name || '\('
         ) then
        raise exception 'rollback refused an unexpected function body';
      end if;
      execute function_row.function_definition;
    else
      execute format('drop function if exists public.%I(uuid)', function_row.function_name);
      execute format('drop function if exists public.%I(uuid, text)', function_row.function_name);
    end if;
  end loop;

  drop function if exists public.submit_owner_claim(uuid, text);
  drop function if exists public.submit_listing_edit(uuid, text, text);
  drop function if exists public.admin_list_owner_claims();
  drop function if exists public.admin_list_listing_edits();

  if exists (
    select 1
    from public.nchf_phase5c_privilege_snapshot as captured
    where captured.section = 'approved_index'
      and captured.created_by_migration
  ) then
    drop index if exists public.owner_claims_one_approved_claim_per_facility;
  end if;

  if to_regclass('public.owner_claim_events') is not null then
    select count(*) into claim_events from public.owner_claim_events;
  end if;
  if to_regclass('public.listing_edit_events') is not null then
    select count(*) into edit_events from public.listing_edit_events;
  end if;
  if claim_events = 0 and edit_events = 0 then
    drop table if exists public.owner_claim_events;
    drop table if exists public.listing_edit_events;
  end if;

  if to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is not null
     and not (
       select relrowsecurity
       from pg_class
       where oid = 'public.nchf_phase5a_facilities_acl_snapshot'::regclass
     ) then
    raise exception 'rollback would have left phase 5a recovery without row-level security';
  end if;
  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.nchf_phase5c_privilege_snapshot'::regclass
  ) then
    raise exception 'rollback would have left the phase 5c snapshot without row-level security';
  end if;
end
$rollback$;

commit;

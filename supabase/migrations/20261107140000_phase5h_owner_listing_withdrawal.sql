-- Phase 5H proposal. This file is not applied by an agent.
-- Official DSHS facility columns stay unchanged. Withdrawal removes the
-- current public owner text and appends an audit event; it never updates
-- or deletes audit rows.

do $preflight$
begin
  if to_regclass('public.published_owner_listings') is null
     or to_regclass('public.published_owner_listing_events') is null
     or to_regprocedure('public.admin_publish_listing_edit(uuid)') is null
     or to_regprocedure('public.admin_list_listing_edits()') is null
     or to_regprocedure('public.admin_list_owner_claims()') is null
     or to_regprocedure('public.nchf_phase5g_publication_event_guard()') is null then
    raise exception 'owner withdrawal requires the existing publication controls';
  end if;
end;
$preflight$;

alter table public.published_owner_listing_events
  drop constraint published_owner_listing_events_type_check;

alter table public.published_owner_listing_events
  add constraint published_owner_listing_events_type_check
  check (event_type in ('published', 'withdrawn'));

create function public.admin_withdraw_published_owner_listing(p_facility_id uuid, p_field_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_current_id uuid;
  v_source uuid;
  v_value text;
  v_submitter uuid;
begin
  v_actor := auth.uid();
  if v_actor is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = v_actor
  ) then
    raise exception 'administrator required';
  end if;
  if p_facility_id is null
     or p_field_name is null
     or p_field_name not in ('description', 'services', 'amenities') then
    raise exception 'field is not allowed';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_facility_id::text, 0)
  );
  select content.id, content.source_edit_id, content.published_value
    into v_current_id, v_source, v_value
  from public.published_owner_listings as content
  where content.facility_id = p_facility_id
    and content.field_name = p_field_name
  for update;
  if not found then
    raise exception 'published owner text was not found';
  end if;
  select edit.submitted_by_user_id
    into v_submitter
  from public.listing_edits as edit
  where edit.id = v_source;
  if v_submitter = v_actor then
    raise exception 'self-review is not allowed';
  end if;
  insert into public.published_owner_listing_events (
    facility_id, field_name, source_edit_id, actor_user_id, event_type,
    previous_value, published_value
  ) values (
    p_facility_id, p_field_name, v_source, v_actor, 'withdrawn', v_value, v_value
  );
  delete from public.published_owner_listings
  where id = v_current_id;
  return true;
end;
$fn$;

drop function public.admin_list_owner_claims();

create function public.admin_list_owner_claims(
  p_limit integer default 20,
  p_before_id uuid default null
)
returns table (
  id uuid,
  facility_id uuid,
  claimant_user_id uuid,
  verification_status text,
  evidence_notes text,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select claim.id,
         claim.facility_id,
         claim.claimant_user_id,
         claim.verification_status,
         claim.evidence_notes,
         claim.reviewed_at
  from public.owner_claims as claim
  where p_before_id is null
     or claim.id < p_before_id
  order by claim.id desc
  limit v_limit;
end;
$fn$;

drop function public.admin_list_listing_edits();

create function public.admin_list_listing_edits(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  facility_id uuid,
  submitted_by_user_id uuid,
  field_name text,
  proposed_value text,
  review_status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  field_published boolean,
  current_publication boolean,
  current_published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select edit.id,
         edit.facility_id,
         edit.submitted_by_user_id,
         edit.field_name,
         edit.proposed_value::text,
         edit.review_status,
         edit.created_at,
         edit.reviewed_at,
         exists (
           select 1
           from public.published_owner_listings as content
           where content.facility_id = edit.facility_id
             and content.field_name = edit.field_name
         ),
         exists (
           select 1
           from public.published_owner_listings as content
           where content.facility_id = edit.facility_id
             and content.field_name = edit.field_name
             and content.source_edit_id = edit.id
         ),
         (
           select content.published_at
           from public.published_owner_listings as content
           where content.facility_id = edit.facility_id
             and content.field_name = edit.field_name
             and content.source_edit_id = edit.id
         )
  from public.listing_edits as edit
  where p_before is null
     or (edit.created_at, edit.id) < (p_before, p_before_id)
  order by edit.created_at desc, edit.id desc
  limit v_limit;
end;
$fn$;

drop function public.admin_list_published_owner_listings();

create function public.admin_list_published_owner_listings(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  facility_id uuid,
  field_name text,
  source_edit_id uuid,
  published_by_user_id uuid,
  published_value text,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select content.id,
         content.facility_id,
         content.field_name,
         content.source_edit_id,
         content.published_by_user_id,
         content.published_value,
         content.published_at
  from public.published_owner_listings as content
  where p_before is null
     or (content.published_at, content.id) < (p_before, p_before_id)
  order by content.published_at desc, content.id desc
  limit v_limit;
end;
$fn$;

drop function public.admin_list_owner_publication_events();

create function public.admin_list_owner_publication_events(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  facility_id uuid,
  field_name text,
  source_edit_id uuid,
  actor_user_id uuid,
  event_type text,
  previous_value text,
  published_value text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select event_row.id,
         event_row.facility_id,
         event_row.field_name,
         event_row.source_edit_id,
         event_row.actor_user_id,
         event_row.event_type,
         event_row.previous_value,
         event_row.published_value,
         event_row.created_at
  from public.published_owner_listing_events as event_row
  where p_before is null
     or (event_row.created_at, event_row.id) < (p_before, p_before_id)
  order by event_row.created_at desc, event_row.id desc
  limit v_limit;
end;
$fn$;

create function public.owner_list_listing_edits(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  facility_id uuid,
  field_name text,
  review_status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  v_actor := auth.uid();
  if v_actor is null then
    return;
  end if;
  return query
  select edit.id,
         edit.facility_id,
         edit.field_name,
         edit.review_status,
         edit.created_at
  from public.listing_edits as edit
  where edit.submitted_by_user_id = v_actor
    and (
      p_before is null
      or (edit.created_at, edit.id) < (p_before, p_before_id)
    )
  order by edit.created_at desc, edit.id desc
  limit v_limit;
end;
$fn$;

create function public.owner_list_listing_edit_events(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  edit_id uuid,
  event_type text,
  from_status text,
  to_status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  v_actor := auth.uid();
  if v_actor is null then
    return;
  end if;
  return query
  select event_row.id,
         event_row.edit_id,
         event_row.event_type,
         event_row.from_status,
         event_row.to_status,
         event_row.created_at
  from public.listing_edit_events as event_row
  where exists (
    select 1
    from public.listing_edits as edit
    where edit.id = event_row.edit_id
      and edit.submitted_by_user_id = v_actor
  )
    and (
      p_before is null
      or (event_row.created_at, event_row.id) < (p_before, p_before_id)
    )
  order by event_row.created_at desc, event_row.id desc
  limit v_limit;
end;
$fn$;

create function public.owner_list_publication_history(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  facility_id uuid,
  field_name text,
  event_type text,
  previous_value text,
  published_value text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_limit integer;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  v_actor := auth.uid();
  if v_actor is null then
    return;
  end if;
  return query
  select event_row.id,
         event_row.facility_id,
         event_row.field_name,
         event_row.event_type,
         event_row.previous_value,
         event_row.published_value,
         event_row.created_at
  from public.published_owner_listing_events as event_row
  where exists (
    select 1
    from public.owner_claims as claim
    where claim.facility_id = event_row.facility_id
      and claim.claimant_user_id = v_actor
      and claim.verification_status = 'approved'
  )
    and (
      p_before is null
      or (event_row.created_at, event_row.id) < (p_before, p_before_id)
    )
  order by event_row.created_at desc, event_row.id desc
  limit v_limit;
end;
$fn$;

revoke all on function public.admin_withdraw_published_owner_listing(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_list_owner_claims(integer, uuid) from public, anon, authenticated;
revoke all on function public.admin_list_listing_edits(integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.admin_list_published_owner_listings(integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.admin_list_owner_publication_events(integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.owner_list_listing_edits(integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.owner_list_listing_edit_events(integer, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.owner_list_publication_history(integer, timestamptz, uuid) from public, anon, authenticated;

grant execute on function public.admin_withdraw_published_owner_listing(uuid, text) to authenticated;
grant execute on function public.admin_list_owner_claims(integer, uuid) to authenticated;
grant execute on function public.admin_list_listing_edits(integer, timestamptz, uuid) to authenticated;
grant execute on function public.admin_list_published_owner_listings(integer, timestamptz, uuid) to authenticated;
grant execute on function public.admin_list_owner_publication_events(integer, timestamptz, uuid) to authenticated;
grant execute on function public.owner_list_listing_edits(integer, timestamptz, uuid) to authenticated;
grant execute on function public.owner_list_listing_edit_events(integer, timestamptz, uuid) to authenticated;
grant execute on function public.owner_list_publication_history(integer, timestamptz, uuid) to authenticated;

do $grants$
declare
  browser_still_privileged boolean;
begin
  select
    exists (
      select 1
      from pg_catalog.pg_proc as proc
      where proc.oid = any (array[
        'public.admin_withdraw_published_owner_listing(uuid, text)'::regprocedure,
        'public.admin_list_owner_claims(integer, uuid)'::regprocedure,
        'public.admin_list_listing_edits(integer, timestamptz, uuid)'::regprocedure,
        'public.admin_list_published_owner_listings(integer, timestamptz, uuid)'::regprocedure,
        'public.admin_list_owner_publication_events(integer, timestamptz, uuid)'::regprocedure,
        'public.owner_list_listing_edits(integer, timestamptz, uuid)'::regprocedure,
        'public.owner_list_listing_edit_events(integer, timestamptz, uuid)'::regprocedure,
        'public.owner_list_publication_history(integer, timestamptz, uuid)'::regprocedure
      ])
        and (
          proc.proacl is null
          or exists (
            select 1
            from pg_catalog.aclexplode(proc.proacl) as acl
            where acl.grantee = 0
              and acl.privilege_type = 'EXECUTE'
          )
          or has_function_privilege('anon', proc.oid, 'EXECUTE')
          or not has_function_privilege('authenticated', proc.oid, 'EXECUTE')
        )
    )
    or has_table_privilege('anon', 'public.published_owner_listings', 'DELETE')
    or has_table_privilege('authenticated', 'public.published_owner_listings', 'DELETE')
    or has_table_privilege('anon', 'public.published_owner_listing_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.published_owner_listing_events', 'SELECT')
    or exists (
      select 1
      from pg_catalog.pg_class as relation
      cross join lateral pg_catalog.aclexplode(relation.relacl) as acl
      where (
        relation.oid = 'public.published_owner_listings'::regclass
        and acl.grantee = 0
        and acl.privilege_type = 'DELETE'
      ) or (
        relation.oid = 'public.published_owner_listing_events'::regclass
        and acl.grantee = 0
        and acl.privilege_type = 'SELECT'
      )
    )
  into browser_still_privileged;
  if browser_still_privileged then
    raise exception 'owner withdrawal privileges were not limited to administrators and the caller';
  end if;
end;
$grants$;

-- Phase 5I proposal. This file is not applied by an agent.
-- It does not change facilities, publication rows, or audit rows.

do $preflight$
begin
  if to_regprocedure('public.admin_list_listing_edits(integer, timestamptz, uuid)') is null then
    raise exception 'listing edit status filter requires the existing administrator list';
  end if;
end;
$preflight$;

drop function public.admin_list_listing_edits(integer, timestamptz, uuid);

create function public.admin_list_listing_edits(
  p_limit integer default 20,
  p_before timestamptz default null,
  p_before_id uuid default null,
  p_status text default null
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
  v_status text;
begin
  v_limit := coalesce(p_limit, 20);
  if v_limit < 1 or v_limit > 50 then
    raise exception 'page size must be 1 to 50';
  end if;
  if (p_before is null) is distinct from (p_before_id is null) then
    raise exception 'page cursor is incomplete';
  end if;
  v_status := lower(btrim(p_status));
  if v_status is null or v_status = '' or v_status = 'all' then
    v_status := null;
  elsif v_status not in ('pending', 'approved', 'rejected') then
    raise exception 'status is not allowed';
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
  where (v_status is null or edit.review_status = v_status)
    and (
      p_before is null
      or (edit.created_at, edit.id) < (p_before, p_before_id)
    )
  order by edit.created_at desc, edit.id desc
  limit v_limit;
end;
$fn$;

create function public.admin_count_listing_edits()
returns table (
  review_status text,
  proposal_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select status.name,
         (
           select count(*)
           from public.listing_edits as edit
           where edit.review_status = status.name
         )
  from (
    values ('pending'::text), ('approved'::text), ('rejected'::text)
  ) as status(name)
  order by case status.name
    when 'pending' then 1
    when 'approved' then 2
    else 3
  end;
end;
$fn$;

revoke all on function public.admin_list_listing_edits(integer, timestamptz, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_count_listing_edits() from public, anon, authenticated;

grant execute on function public.admin_list_listing_edits(integer, timestamptz, uuid, text) to authenticated;
grant execute on function public.admin_count_listing_edits() to authenticated;

do $grants$
declare
  browser_still_privileged boolean;
begin
  select exists (
    select 1
    from pg_catalog.pg_proc as proc
    where proc.oid = any (array[
      'public.admin_list_listing_edits(integer, timestamptz, uuid, text)'::regprocedure,
      'public.admin_count_listing_edits()'::regprocedure
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
  into browser_still_privileged;
  if browser_still_privileged then
    raise exception 'proposal status filter privileges were not limited to administrators';
  end if;
end;
$grants$;

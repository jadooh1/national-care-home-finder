-- Phase 5G proposal. This file is not applied by an agent.
-- Official DSHS facility columns stay unchanged. Approved owner text is
-- copied into a separate publication record only by an administrator who
-- did not submit that proposal.

do $preflight$
begin
  if to_regclass('public.facilities') is null
     or to_regclass('public.listing_edits') is null
     or to_regclass('public.app_admins') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null
     or to_regprocedure('public.admin_review_listing_edit(uuid, text)') is null then
    raise exception 'owner publication requires the existing directory and review controls';
  end if;
end;
$preflight$;

create table public.published_owner_listings (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  field_name text not null,
  published_value text not null,
  source_edit_id uuid not null references public.listing_edits (id),
  published_by_user_id uuid not null,
  published_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint published_owner_listings_field_name_check
    check (field_name in ('description', 'services', 'amenities')),
  constraint published_owner_listings_value_length_check
    check (
      pg_catalog.char_length(published_value) between 1 and 2000
    ),
  constraint published_owner_listings_one_current_field
    unique (facility_id, field_name)
);

create table public.published_owner_listing_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  field_name text not null,
  source_edit_id uuid not null references public.listing_edits (id),
  actor_user_id uuid not null,
  event_type text not null,
  previous_value text,
  published_value text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint published_owner_listing_events_type_check
    check (event_type = 'published'),
  constraint published_owner_listing_events_field_name_check
    check (field_name in ('description', 'services', 'amenities')),
  constraint published_owner_listing_events_value_length_check
    check (
      pg_catalog.char_length(published_value) between 1 and 2000
      and (
        previous_value is null
        or pg_catalog.char_length(previous_value) between 1 and 2000
      )
    )
);

create index published_owner_listing_events_facility_idx
  on public.published_owner_listing_events (facility_id, field_name, created_at);

create function public.nchf_phase5g_publication_event_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  raise exception 'publication audit rows cannot be changed';
end;
$fn$;

create trigger published_owner_listing_events_no_write
  before update or delete
  on public.published_owner_listing_events
  for each row
  execute function public.nchf_phase5g_publication_event_guard();

create trigger published_owner_listing_events_no_truncate
  before truncate
  on public.published_owner_listing_events
  for each statement
  execute function public.nchf_phase5g_publication_event_guard();

create function public.nchf_phase5g_facility_is_listed(p_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from public.facilities as facility
    where facility.id = p_facility_id
      and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
      and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
      and facility.source_name = 'wa_dshs_afh'
      and facility.license_category = 'afh'
      and facility.facility_type = 'AFH'
      and facility.state_code = 'WA'
      and facility.record_status = 'source_matched'
      and facility.normalized_license_number is not null
      and pg_catalog.btrim(facility.normalized_license_number, E' \t\r\n') <> ''
      and facility.license_number ~ '^[0-9]{1,20}$'
  );
$fn$;

create view public.wa_afh_published_owner_content
with (security_barrier = true, security_invoker = false) as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where public.nchf_phase5g_facility_is_listed(content.facility_id);

create function public.admin_publish_listing_edit(p_edit_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_facility uuid;
  v_submitter uuid;
  v_field text;
  v_status text;
  v_type text;
  v_text text;
  v_current_id uuid;
  v_current_value text;
  v_current_source uuid;
begin
  v_actor := auth.uid();
  if v_actor is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = v_actor
  ) then
    raise exception 'administrator required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(coalesce(p_edit_id::text, ''), 0)
  );
  select edit.facility_id, edit.submitted_by_user_id, edit.field_name, edit.review_status
    into v_facility, v_submitter, v_field, v_status
  from public.listing_edits as edit
  where edit.id = p_edit_id
  for update;
  if not found then
    raise exception 'listing edit was not found';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_facility::text, 0)
  );
  if v_submitter = v_actor then
    raise exception 'self-review is not allowed';
  end if;
  if v_status is distinct from 'approved' then
    raise exception 'proposal is not approved';
  end if;
  if v_field not in ('description', 'services', 'amenities') then
    raise exception 'field is not allowed';
  end if;
  select type_row.typname
    into v_type
  from pg_catalog.pg_attribute as attribute
  join pg_catalog.pg_type as type_row
    on type_row.oid = attribute.atttypid
  where attribute.attrelid = 'public.listing_edits'::regclass
    and attribute.attname = 'proposed_value'
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if v_type = 'jsonb' then
    execute
      'select pg_catalog.btrim(edit.proposed_value #>> ''{}'')
       from public.listing_edits as edit
       where edit.id = $1'
      into v_text
      using p_edit_id;
  elsif v_type = 'text' then
    select pg_catalog.btrim(edit.proposed_value)
      into v_text
    from public.listing_edits as edit
    where edit.id = p_edit_id;
  else
    raise exception 'proposed text is not available';
  end if;
  if v_text is null
     or pg_catalog.char_length(v_text) < 1
     or pg_catalog.char_length(v_text) > 2000 then
    raise exception 'proposed text must be 1 to 2000 characters';
  end if;
  if not public.nchf_phase5g_facility_is_listed(v_facility) then
    raise exception 'facility is not eligible';
  end if;
  if not exists (
    select 1
    from public.owner_claims as claim
    where claim.facility_id = v_facility
      and claim.claimant_user_id = v_submitter
      and claim.verification_status = 'approved'
  ) then
    raise exception 'approved claim required';
  end if;
  select content.id, content.published_value, content.source_edit_id
    into v_current_id, v_current_value, v_current_source
  from public.published_owner_listings as content
  where content.facility_id = v_facility
    and content.field_name = v_field
  for update;
  if found and v_current_source = p_edit_id and v_current_value = v_text then
    return true;
  end if;
  insert into public.published_owner_listing_events (
    facility_id, field_name, source_edit_id, actor_user_id, event_type,
    previous_value, published_value
  ) values (
    v_facility, v_field, p_edit_id, v_actor, 'published', v_current_value, v_text
  );
  if v_current_id is null then
    insert into public.published_owner_listings (
      facility_id, field_name, published_value, source_edit_id, published_by_user_id
    ) values (
      v_facility, v_field, v_text, p_edit_id, v_actor
    );
  else
    update public.published_owner_listings
    set published_value = v_text,
        source_edit_id = p_edit_id,
        published_by_user_id = v_actor,
        published_at = pg_catalog.clock_timestamp()
    where id = v_current_id;
  end if;
  return true;
end;
$fn$;

create function public.admin_list_published_owner_listings()
returns table (
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
begin
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select content.facility_id,
         content.field_name,
         content.source_edit_id,
         content.published_by_user_id,
         content.published_value,
         content.published_at
  from public.published_owner_listings as content
  order by content.published_at desc, content.id desc
  limit 100;
end;
$fn$;

create function public.admin_list_owner_publication_events()
returns table (
  id uuid,
  facility_id uuid,
  field_name text,
  source_edit_id uuid,
  actor_user_id uuid,
  previous_value text,
  published_value text,
  created_at timestamptz
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
  select event_row.id,
         event_row.facility_id,
         event_row.field_name,
         event_row.source_edit_id,
         event_row.actor_user_id,
         event_row.previous_value,
         event_row.published_value,
         event_row.created_at
  from public.published_owner_listing_events as event_row
  order by event_row.created_at desc, event_row.id desc
  limit 100;
end;
$fn$;

revoke all on table public.published_owner_listings from public, anon, authenticated;
revoke all on table public.published_owner_listing_events from public, anon, authenticated;
revoke all on table public.wa_afh_published_owner_content from public, anon, authenticated;
revoke all on function public.nchf_phase5g_facility_is_listed(uuid) from public, anon, authenticated;
revoke all on function public.nchf_phase5g_publication_event_guard() from public, anon, authenticated;
revoke all on function public.admin_publish_listing_edit(uuid) from public, anon, authenticated;
revoke all on function public.admin_list_published_owner_listings() from public, anon, authenticated;
revoke all on function public.admin_list_owner_publication_events() from public, anon, authenticated;

alter table public.published_owner_listings enable row level security;
alter table public.published_owner_listing_events enable row level security;

create policy published_owner_listings_select_listed
  on public.published_owner_listings
  for select
  to anon, authenticated
  using (public.nchf_phase5g_facility_is_listed(facility_id));

grant select (
  facility_id, field_name, published_value, published_at
) on table public.published_owner_listings to anon, authenticated;
grant execute on function public.nchf_phase5g_facility_is_listed(uuid) to anon, authenticated;
grant select on table public.wa_afh_published_owner_content to anon, authenticated;
grant execute on function public.admin_publish_listing_edit(uuid) to authenticated;
grant execute on function public.admin_list_published_owner_listings() to authenticated;
grant execute on function public.admin_list_owner_publication_events() to authenticated;

do $grants$
declare
  browser_still_privileged boolean;
begin
  select
    exists (
      select 1
      from (values ('anon'), ('authenticated')) as browser(role_name)
      where has_table_privilege(browser.role_name, 'public.published_owner_listings', 'INSERT')
         or has_table_privilege(browser.role_name, 'public.published_owner_listings', 'UPDATE')
         or has_table_privilege(browser.role_name, 'public.published_owner_listings', 'DELETE')
         or has_table_privilege(browser.role_name, 'public.published_owner_listings', 'TRUNCATE')
         or has_table_privilege(browser.role_name, 'public.published_owner_listing_events', 'SELECT')
         or has_table_privilege(browser.role_name, 'public.published_owner_listing_events', 'INSERT')
         or has_table_privilege(browser.role_name, 'public.published_owner_listing_events', 'UPDATE')
         or has_table_privilege(browser.role_name, 'public.published_owner_listing_events', 'DELETE')
         or has_column_privilege(browser.role_name, 'public.published_owner_listings', 'published_by_user_id', 'SELECT')
         or has_column_privilege(browser.role_name, 'public.published_owner_listings', 'source_edit_id', 'SELECT')
         or not has_column_privilege(browser.role_name, 'public.published_owner_listings', 'published_value', 'SELECT')
    )
    or exists (
      select 1
      from pg_catalog.pg_class as relation
      cross join lateral pg_catalog.aclexplode(relation.relacl) as acl
      where relation.oid = any (array[
        'public.published_owner_listings'::regclass,
        'public.published_owner_listing_events'::regclass
      ])
        and acl.grantee = 0
        and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
    )
    or exists (
      select 1
      from pg_catalog.pg_class as relation
      where relation.oid = any (array[
        'public.published_owner_listings'::regclass,
        'public.published_owner_listing_events'::regclass
      ])
        and relation.relacl is null
    )
    or exists (
      select 1
      from pg_catalog.pg_proc as proc
      where proc.oid = any (array[
        'public.admin_publish_listing_edit(uuid)'::regprocedure,
        'public.admin_list_published_owner_listings()'::regprocedure,
        'public.admin_list_owner_publication_events()'::regprocedure,
        'public.nchf_phase5g_publication_event_guard()'::regprocedure,
        'public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure
      ])
        and (
          proc.proacl is null
          or exists (
            select 1
            from pg_catalog.aclexplode(proc.proacl) as acl
            where acl.grantee = 0
              and acl.privilege_type = 'EXECUTE'
          )
        )
    )
    or has_function_privilege('anon', 'public.admin_publish_listing_edit(uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.admin_publish_listing_edit(uuid)', 'EXECUTE')
  into browser_still_privileged;
  if browser_still_privileged then
    raise exception 'owner publication privileges were not limited to public text and administrator execution';
  end if;
end;
$grants$;

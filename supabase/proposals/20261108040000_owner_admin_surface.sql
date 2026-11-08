-- Proposal only. This file does not set its authorization settings and does
-- not change facility rows, directory membership, or record status.
-- A later human applies it only after setting both settings for the
-- reviewed production project.

do $proposal$
declare
  complete boolean;
  any_present boolean;
  any_missing boolean;
begin
  if current_setting('nchf.owner_admin_surface_authorization', true)
       is distinct from 'authorize-owner-admin-surface'
     or current_setting('nchf.owner_admin_surface_target', true)
       is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'owner admin surface target is not the reviewed production project';
  end if;

  if to_regclass('public.facilities') is null
     or to_regclass('public.owner_claims') is null
     or to_regclass('public.listing_edits') is null
     or to_regclass('public.app_admins') is null
     or to_regprocedure('public.submit_owner_claim(uuid, text)') is null
     or to_regprocedure('public.admin_approve_owner_claim(uuid)') is null
     or to_regprocedure('public.admin_reject_owner_claim(uuid)') is null
     or to_regprocedure('public.admin_review_listing_edit(uuid, text)') is null then
    raise exception 'owner admin surface requires the aligned claim and review functions';
  end if;

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.app_admins) <> 1
     or (select count(*) filter (where record_status = 'verified') from public.facilities) <> 0
     or (select count(*) filter (where record_status = 'source_matched') from public.facilities) <> 0 then
    raise exception 'owner admin surface counts are not the reviewed baseline';
  end if;

  complete := to_regclass('public.nchf_owner_admin_surface_audit') is not null
    and to_regclass('public.listing_edit_events') is not null
    and to_regclass('public.published_owner_listings') is not null
    and to_regclass('public.published_owner_listing_events') is not null
    and to_regclass('public.wa_afh_published_owner_content') is not null
    and to_regprocedure('public.submit_listing_edit(uuid, text, text)') is not null
    and to_regprocedure('public.admin_list_owner_claims(integer, uuid)') is not null
    and to_regprocedure('public.admin_list_listing_edits(integer, timestamptz, uuid, text)') is not null
    and to_regprocedure('public.admin_count_listing_edits()') is not null
    and to_regprocedure('public.admin_publish_listing_edit(uuid)') is not null
    and to_regprocedure('public.admin_withdraw_published_owner_listing(uuid, text)') is not null
    and to_regprocedure('public.admin_list_owner_publication_events(integer, timestamptz, uuid)') is not null
    and to_regprocedure('public.owner_list_listing_edits(integer, timestamptz, uuid)') is not null
    and to_regprocedure('public.owner_list_listing_edit_events(integer, timestamptz, uuid)') is not null
    and to_regprocedure('public.owner_list_publication_history(integer, timestamptz, uuid)') is not null;
  if complete then
    return;
  end if;

  any_present := to_regclass('public.nchf_owner_admin_surface_audit') is not null
    or to_regclass('public.listing_edit_events') is not null
    or to_regclass('public.published_owner_listings') is not null
    or to_regclass('public.published_owner_listing_events') is not null
    or to_regclass('public.wa_afh_published_owner_content') is not null
    or to_regprocedure('public.submit_listing_edit(uuid, text, text)') is not null
    or to_regprocedure('public.admin_list_owner_claims(integer, uuid)') is not null
    or to_regprocedure('public.admin_list_listing_edits(integer, timestamptz, uuid, text)') is not null
    or to_regprocedure('public.admin_count_listing_edits()') is not null
    or to_regprocedure('public.admin_publish_listing_edit(uuid)') is not null
    or to_regprocedure('public.admin_withdraw_published_owner_listing(uuid, text)') is not null
    or to_regprocedure('public.admin_list_owner_publication_events(integer, timestamptz, uuid)') is not null
    or to_regprocedure('public.owner_list_listing_edits(integer, timestamptz, uuid)') is not null
    or to_regprocedure('public.owner_list_listing_edit_events(integer, timestamptz, uuid)') is not null
    or to_regprocedure('public.owner_list_publication_history(integer, timestamptz, uuid)') is not null;
  any_missing := not complete;
  if any_present and any_missing then
    raise exception 'partial owner admin surface is present';
  end if;

  create extension if not exists pgcrypto;

  create table public.listing_edit_events (
    id uuid primary key default pg_catalog.gen_random_uuid(),
    edit_id uuid not null references public.listing_edits (id),
    facility_id uuid not null references public.facilities (id),
    actor_user_id uuid not null,
    event_type text not null,
    from_status text,
    to_status text not null,
    created_at timestamptz not null default pg_catalog.clock_timestamp(),
    constraint listing_edit_events_no_sensitive_text check (event_type <> 'proposed_value')
  );
  alter table public.listing_edit_events enable row level security;
  revoke all on table public.listing_edit_events from public, anon, authenticated;

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
      check (pg_catalog.char_length(published_value) between 1 and 2000),
    constraint published_owner_listings_one_current_field
      unique (facility_id, field_name)
  );
  alter table public.published_owner_listings enable row level security;
  revoke all on table public.published_owner_listings from public, anon, authenticated;

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
      check (event_type in ('published', 'withdrawn')),
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
  alter table public.published_owner_listing_events enable row level security;
  revoke all on table public.published_owner_listing_events from public, anon, authenticated;

  create function public.nchf_owner_admin_publication_guard()
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
    execute function public.nchf_owner_admin_publication_guard();

  create trigger published_owner_listing_events_no_truncate
    before truncate
    on public.published_owner_listing_events
    for each statement
    execute function public.nchf_owner_admin_publication_guard();

  create function public.nchf_owner_admin_facility_is_listed(p_facility_id uuid)
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
        and facility.presence is distinct from 'absent'
    );
  $fn$;

  create view public.wa_afh_published_owner_content
  with (security_barrier = true) as
  select content.facility_id,
         content.field_name,
         content.published_value,
         content.published_at
  from public.published_owner_listings as content
  where public.nchf_owner_admin_facility_is_listed(content.facility_id);
  revoke all on table public.wa_afh_published_owner_content from public, anon, authenticated;
  grant select on table public.wa_afh_published_owner_content to anon, authenticated;

  create function public.submit_listing_edit(
    p_facility_id uuid,
    p_field_name text,
    p_proposed_value text
  )
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
  as $fn$
  declare
    v_actor uuid;
    v_text text;
    v_edit uuid;
  begin
    v_actor := auth.uid();
    if v_actor is null then
      raise exception 'authentication required';
    end if;
    if not exists (
      select 1
      from auth.users as account
      where account.id = v_actor
        and account.email_confirmed_at is not null
    ) then
      raise exception 'confirmed email required';
    end if;
    if p_field_name not in ('description', 'services', 'amenities') then
      raise exception 'field is not allowed';
    end if;
    v_text := pg_catalog.btrim(p_proposed_value);
    if v_text is null
       or pg_catalog.char_length(v_text) < 1
       or pg_catalog.char_length(v_text) > 2000 then
      raise exception 'proposed text must be 1 to 2000 characters';
    end if;
    if not public.nchf_owner_admin_facility_is_listed(p_facility_id) then
      raise exception 'facility is not eligible';
    end if;
    if not exists (
      select 1
      from public.owner_claims as claim
      where claim.facility_id = p_facility_id
        and claim.claimant_user_id = v_actor
        and claim.verification_status = 'approved'
    ) then
      raise exception 'approved claim required';
    end if;
    insert into public.listing_edits (
      facility_id, submitted_by_user_id, field_name, proposed_value, review_status, reviewed_at
    ) values (
      p_facility_id, v_actor, p_field_name, pg_catalog.to_jsonb(v_text), 'pending', null
    )
    returning id into v_edit;
    insert into public.listing_edit_events (
      edit_id, facility_id, actor_user_id, event_type, from_status, to_status
    ) values (
      v_edit, p_facility_id, v_actor, 'submitted', null, 'pending'
    );
    return v_edit;
  end;
  $fn$;

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
      select 1 from public.app_admins as admin_row where admin_row.user_id = auth.uid()
    ) then
      return;
    end if;
    return query
    select claim.id, claim.facility_id, claim.claimant_user_id,
           claim.verification_status, claim.evidence_notes, claim.reviewed_at
    from public.owner_claims as claim
    where p_before_id is null or claim.id < p_before_id
    order by claim.id desc
    limit v_limit;
  end;
  $fn$;

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
    v_status := lower(pg_catalog.btrim(p_status));
    if v_status is null or v_status = '' or v_status = 'all' then
      v_status := null;
    elsif v_status not in ('pending', 'approved', 'rejected') then
      raise exception 'status is not allowed';
    end if;
    if auth.uid() is null or not exists (
      select 1 from public.app_admins as admin_row where admin_row.user_id = auth.uid()
    ) then
      return;
    end if;
    return query
    select edit.id, edit.facility_id, edit.submitted_by_user_id, edit.field_name,
           pg_catalog.btrim(edit.proposed_value #>> '{}'),
           edit.review_status, edit.created_at, edit.reviewed_at,
           exists (
             select 1 from public.published_owner_listings as content
             where content.facility_id = edit.facility_id and content.field_name = edit.field_name
           ),
           exists (
             select 1 from public.published_owner_listings as content
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
      and (p_before is null or (edit.created_at, edit.id) < (p_before, p_before_id))
    order by edit.created_at desc, edit.id desc
    limit v_limit;
  end;
  $fn$;

  create function public.admin_count_listing_edits()
  returns table (review_status text, proposal_count bigint)
  language plpgsql
  stable
  security definer
  set search_path = ''
  as $fn$
  begin
    if auth.uid() is null or not exists (
      select 1 from public.app_admins as admin_row where admin_row.user_id = auth.uid()
    ) then
      return;
    end if;
    return query
    select status.name,
           (select count(*) from public.listing_edits as edit where edit.review_status = status.name)
    from (values ('pending'::text), ('approved'::text), ('rejected'::text)) as status(name)
    order by case status.name when 'pending' then 1 when 'approved' then 2 else 3 end;
  end;
  $fn$;

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
    v_text text;
    v_current_id uuid;
    v_current_value text;
    v_current_source uuid;
  begin
    v_actor := auth.uid();
    if v_actor is null or not exists (
      select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
    ) then
      raise exception 'administrator required';
    end if;
    select edit.facility_id, edit.submitted_by_user_id, edit.field_name, edit.review_status,
           pg_catalog.btrim(edit.proposed_value #>> '{}')
      into v_facility, v_submitter, v_field, v_status, v_text
    from public.listing_edits as edit
    where edit.id = p_edit_id
    for update;
    if not found then
      raise exception 'listing edit was not found';
    end if;
    if v_submitter = v_actor then
      raise exception 'self-review is not allowed';
    end if;
    if v_status is distinct from 'approved' then
      raise exception 'proposal is not approved';
    end if;
    if v_field not in ('description', 'services', 'amenities')
       or v_text is null
       or pg_catalog.char_length(v_text) < 1
       or pg_catalog.char_length(v_text) > 2000 then
      raise exception 'field is not allowed';
    end if;
    if not public.nchf_owner_admin_facility_is_listed(v_facility) then
      raise exception 'facility is not eligible';
    end if;
    if not exists (
      select 1 from public.owner_claims as claim
      where claim.facility_id = v_facility
        and claim.claimant_user_id = v_submitter
        and claim.verification_status = 'approved'
    ) then
      raise exception 'approved claim required';
    end if;
    select content.id, content.published_value, content.source_edit_id
      into v_current_id, v_current_value, v_current_source
    from public.published_owner_listings as content
    where content.facility_id = v_facility and content.field_name = v_field
    for update;
    if found and v_current_source = p_edit_id and v_current_value = v_text then
      return true;
    end if;
    insert into public.published_owner_listing_events (
      facility_id, field_name, source_edit_id, actor_user_id, event_type, previous_value, published_value
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

  create function public.admin_withdraw_published_owner_listing(
    p_facility_id uuid,
    p_field_name text
  )
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
      select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
    ) then
      raise exception 'administrator required';
    end if;
    if p_field_name not in ('description', 'services', 'amenities') then
      raise exception 'field is not allowed';
    end if;
    select content.id, content.source_edit_id, content.published_value
      into v_current_id, v_source, v_value
    from public.published_owner_listings as content
    where content.facility_id = p_facility_id and content.field_name = p_field_name
    for update;
    if not found then
      raise exception 'published owner text was not found';
    end if;
    select edit.submitted_by_user_id into v_submitter
    from public.listing_edits as edit
    where edit.id = v_source;
    if v_submitter = v_actor then
      raise exception 'self-review is not allowed';
    end if;
    insert into public.published_owner_listing_events (
      facility_id, field_name, source_edit_id, actor_user_id, event_type, previous_value, published_value
    ) values (
      p_facility_id, p_field_name, v_source, v_actor, 'withdrawn', v_value, v_value
    );
    delete from public.published_owner_listings where id = v_current_id;
    return true;
  end;
  $fn$;

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
      select 1 from public.app_admins as admin_row where admin_row.user_id = auth.uid()
    ) then
      return;
    end if;
    return query
    select event_row.id, event_row.facility_id, event_row.field_name, event_row.source_edit_id,
           event_row.actor_user_id, event_row.event_type, event_row.previous_value,
           event_row.published_value, event_row.created_at
    from public.published_owner_listing_events as event_row
    where p_before is null or (event_row.created_at, event_row.id) < (p_before, p_before_id)
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
    select edit.id, edit.facility_id, edit.field_name, edit.review_status, edit.created_at
    from public.listing_edits as edit
    where edit.submitted_by_user_id = v_actor
      and (p_before is null or (edit.created_at, edit.id) < (p_before, p_before_id))
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
    select event_row.id, event_row.edit_id, event_row.event_type,
           event_row.from_status, event_row.to_status, event_row.created_at
    from public.listing_edit_events as event_row
    where exists (
      select 1 from public.listing_edits as edit
      where edit.id = event_row.edit_id and edit.submitted_by_user_id = v_actor
    )
      and (p_before is null or (event_row.created_at, event_row.id) < (p_before, p_before_id))
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
    select event_row.id, event_row.facility_id, event_row.field_name, event_row.event_type,
           event_row.previous_value, event_row.published_value, event_row.created_at
    from public.published_owner_listing_events as event_row
    where exists (
      select 1 from public.owner_claims as claim
      where claim.facility_id = event_row.facility_id
        and claim.claimant_user_id = v_actor
        and claim.verification_status = 'approved'
    )
      and (p_before is null or (event_row.created_at, event_row.id) < (p_before, p_before_id))
    order by event_row.created_at desc, event_row.id desc
    limit v_limit;
  end;
  $fn$;

  revoke all on function public.nchf_owner_admin_publication_guard() from public, anon, authenticated;
  revoke all on function public.nchf_owner_admin_facility_is_listed(uuid) from public;
  grant execute on function public.nchf_owner_admin_facility_is_listed(uuid) to anon, authenticated;
  revoke all on function public.submit_listing_edit(uuid, text, text) from public, anon, authenticated;
  revoke all on function public.admin_list_owner_claims(integer, uuid) from public, anon, authenticated;
  revoke all on function public.admin_list_listing_edits(integer, timestamptz, uuid, text) from public, anon, authenticated;
  revoke all on function public.admin_count_listing_edits() from public, anon, authenticated;
  revoke all on function public.admin_publish_listing_edit(uuid) from public, anon, authenticated;
  revoke all on function public.admin_withdraw_published_owner_listing(uuid, text) from public, anon, authenticated;
  revoke all on function public.admin_list_owner_publication_events(integer, timestamptz, uuid) from public, anon, authenticated;
  revoke all on function public.owner_list_listing_edits(integer, timestamptz, uuid) from public, anon, authenticated;
  revoke all on function public.owner_list_listing_edit_events(integer, timestamptz, uuid) from public, anon, authenticated;
  revoke all on function public.owner_list_publication_history(integer, timestamptz, uuid) from public, anon, authenticated;

  grant execute on function public.submit_listing_edit(uuid, text, text) to authenticated;
  grant execute on function public.admin_list_owner_claims(integer, uuid) to authenticated;
  grant execute on function public.admin_list_listing_edits(integer, timestamptz, uuid, text) to authenticated;
  grant execute on function public.admin_count_listing_edits() to authenticated;
  grant execute on function public.admin_publish_listing_edit(uuid) to authenticated;
  grant execute on function public.admin_withdraw_published_owner_listing(uuid, text) to authenticated;
  grant execute on function public.admin_list_owner_publication_events(integer, timestamptz, uuid) to authenticated;
  grant execute on function public.owner_list_listing_edits(integer, timestamptz, uuid) to authenticated;
  grant execute on function public.owner_list_listing_edit_events(integer, timestamptz, uuid) to authenticated;
  grant execute on function public.owner_list_publication_history(integer, timestamptz, uuid) to authenticated;

  if has_function_privilege('anon', 'public.submit_listing_edit(uuid, text, text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.admin_publish_listing_edit(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.admin_list_owner_claims(integer, uuid)', 'EXECUTE')
     or has_table_privilege('anon', 'public.listing_edit_events', 'INSERT')
     or has_table_privilege('authenticated', 'public.listing_edit_events', 'INSERT')
     or has_table_privilege('anon', 'public.published_owner_listings', 'INSERT')
     or has_table_privilege('authenticated', 'public.published_owner_listings', 'UPDATE')
     or has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT') is not true
     or has_function_privilege('authenticated', 'public.submit_listing_edit(uuid, text, text)', 'EXECUTE') is not true then
    raise exception 'owner admin surface privileges were not limited';
  end if;

  create table public.nchf_owner_admin_surface_audit (
    surface_name text primary key,
    applied_at timestamptz not null default pg_catalog.clock_timestamp()
  );
  alter table public.nchf_owner_admin_surface_audit enable row level security;
  revoke all on table public.nchf_owner_admin_surface_audit from public, anon, authenticated;
  insert into public.nchf_owner_admin_surface_audit (surface_name)
  values ('20261108040000');

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) filter (where record_status = 'source_matched') from public.facilities) <> 0 then
    raise exception 'owner admin surface changed facility or claim rows';
  end if;
end;
$proposal$;

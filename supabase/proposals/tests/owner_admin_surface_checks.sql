do $checks$
declare
  owner_id uuid := '00000000-0000-4000-8000-0000000000bb';
  admin_id uuid := '00000000-0000-4000-8000-0000000000aa';
  other_admin uuid := '00000000-0000-4000-8000-0000000000cc';
  v_facility_id uuid;
  edit_id uuid;
  listed_count integer;
  statement text;
begin
  if to_regclass('public.listing_edit_events') is null
     or to_regclass('public.wa_afh_published_owner_content') is null
     or to_regprocedure('public.submit_listing_edit(uuid, text, text)') is null
     or to_regprocedure('public.admin_list_owner_claims(integer, uuid)') is null
     or to_regprocedure('public.admin_list_listing_edits(integer, timestamptz, uuid, text)') is null
     or to_regprocedure('public.admin_count_listing_edits()') is null
     or to_regprocedure('public.admin_publish_listing_edit(uuid)') is null
     or to_regprocedure('public.admin_withdraw_published_owner_listing(uuid, text)') is null
     or to_regprocedure('public.admin_list_owner_publication_events(integer, timestamptz, uuid)') is null
     or to_regprocedure('public.owner_list_listing_edits(integer, timestamptz, uuid)') is null
     or to_regprocedure('public.owner_list_listing_edit_events(integer, timestamptz, uuid)') is null
     or to_regprocedure('public.owner_list_publication_history(integer, timestamptz, uuid)') is null then
    raise exception 'missing owner admin surface object';
  end if;
  if pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure) not like '%select null::uuid%'
     or pg_get_functiondef('public.admin_approve_owner_claim(uuid)'::regprocedure) not like '%select true%' then
    raise exception 'existing claim function was replaced';
  end if;

  set local role anon;
  begin
    perform public.submit_listing_edit(
      '00000000-0000-4000-8000-000000000099'::uuid, 'description', 'text'
    );
    raise exception 'anonymous listing edit was accepted';
  exception
    when insufficient_privilege then
      null;
  end;
  reset role;

  insert into auth.users (id, email_confirmed_at) values (owner_id, clock_timestamp());
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  begin
    perform public.submit_listing_edit(
      (select id from public.facilities limit 1), 'description', 'A proposed description'
    );
    raise exception 'ineligible facility accepted a listing edit';
  exception
    when others then
      if sqlerrm <> 'facility is not eligible' then
        raise;
      end if;
  end;

  insert into public.facilities (
    canonical_name, facility_type, state_code, license_number, record_status,
    source_name, license_category, normalized_license_number
  ) values (
    'Eligible example', 'AFH', 'WA', '9000000001', 'source_matched',
    'wa_dshs_afh', 'afh', '9000000001'
  ) returning id into v_facility_id;
  insert into public.owner_claims (facility_id, claimant_user_id, verification_status)
  values (v_facility_id, owner_id, 'approved');
  edit_id := public.submit_listing_edit(v_facility_id, 'description', 'A proposed description');
  if edit_id is null then
    raise exception 'eligible listing edit was not stored';
  end if;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  foreach statement in array array[
    'select public.owner_list_listing_edits(20, null, null)',
    'select public.owner_list_listing_edit_events(20, null, null)',
    'select public.owner_list_publication_history(20, null, null)'
  ]
  loop
    execute statement;
  end loop;

  perform set_config('request.jwt.claim.sub', '', true);
  foreach statement in array array[
    'select public.owner_list_listing_edits(20, null, null)',
    'select public.owner_list_listing_edit_events(20, null, null)',
    'select public.owner_list_publication_history(20, null, null)'
  ]
  loop
    begin
      execute statement;
      raise exception 'anonymous owner list was accepted';
    exception
      when others then
        if sqlerrm <> 'authentication required' then
          raise;
        end if;
    end;
  end loop;

  perform set_config('request.jwt.claim.sub', other_admin::text, true);
  foreach statement in array array[
    'select public.admin_list_owner_claims(20, null)',
    'select public.admin_list_listing_edits(20, null, null, null)',
    'select public.admin_count_listing_edits()',
    'select public.admin_list_owner_publication_events(20, null, null)',
    format('select public.admin_publish_listing_edit(%L)', edit_id),
    format('select public.admin_withdraw_published_owner_listing(%L, %L)', v_facility_id, 'description')
  ]
  loop
    begin
      execute statement;
      raise exception 'non-administrator listing function was accepted';
    exception
      when others then
        if sqlerrm <> 'administrator required' then
          raise;
        end if;
    end;
  end loop;

  insert into public.app_admins (user_id) values (other_admin);
  update public.listing_edits set review_status = 'approved' where id = edit_id;
  if public.admin_publish_listing_edit(edit_id) is not true then
    raise exception 'administrator publish failed';
  end if;
  set local role anon;
  select count(*) into listed_count
  from public.wa_afh_published_owner_content
  where facility_id = v_facility_id;
  reset role;
  if listed_count <> 1 then
    raise exception 'published owner text was not visible';
  end if;

  perform set_config('request.jwt.claim.sub', other_admin::text, true);
  if public.admin_withdraw_published_owner_listing(v_facility_id, 'description') is not true then
    raise exception 'administrator withdrawal failed';
  end if;
  select count(*) into listed_count from public.wa_afh_published_owner_content;
  if listed_count <> 0 then
    raise exception 'withdrawn owner text remained visible';
  end if;

  foreach statement in array array['anon', 'authenticated']
  loop
    execute format('set local role %I', statement);
    begin
      perform public.nchf_owner_admin_facility_is_listed(v_facility_id);
      raise exception 'eligibility helper was executable';
    exception
      when insufficient_privilege then
        null;
    end;
    begin
      perform public.nchf_owner_admin_publication_guard();
      raise exception 'publication guard was executable';
    exception
      when insufficient_privilege then
        null;
    end;
    reset role;
  end loop;
  grant select, insert on public.listing_edit_events to anon;
  set local role anon;
  if (select count(*) from public.listing_edit_events) <> 0 then
    raise exception 'restored anonymous select saw event rows';
  end if;
  begin
    insert into public.listing_edit_events (edit_id, facility_id, actor_user_id, event_type, to_status)
    values (edit_id, v_facility_id, owner_id, 'submitted', 'pending');
    raise exception 'restored anonymous insert was accepted';
  exception
    when others then
      if sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;
  reset role;

  if (select count(*) from public.facilities where record_status = 'verified') <> 0
     or (select count(*) from public.facilities where facility_type = 'AF') <> 8121 then
    raise exception 'baseline facility rows changed';
  end if;
end;
$checks$;

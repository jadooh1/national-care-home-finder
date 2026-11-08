do $checks$
declare
  owner_id uuid := '00000000-0000-4000-8000-0000000000bb';
  admin_id uuid := '00000000-0000-4000-8000-0000000000aa';
  other_admin uuid := '00000000-0000-4000-8000-0000000000cc';
  v_facility_id uuid;
  edit_id uuid;
  listed_count integer;
  claim_rows integer;
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

  perform set_config('request.jwt.claim.sub', other_admin::text, true);
  select count(*) into claim_rows from public.admin_list_owner_claims(20, null);
  if claim_rows <> 0 then
    raise exception 'non-administrator listed claims';
  end if;

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

  set local role anon;
  begin
    insert into public.listing_edit_events (edit_id, facility_id, actor_user_id, event_type, to_status)
    values (edit_id, v_facility_id, owner_id, 'submitted', 'pending');
    raise exception 'anonymous event insert was accepted';
  exception
    when insufficient_privilege then
      null;
  end;
  reset role;

  if (select count(*) from public.facilities where record_status = 'verified') <> 0
     or (select count(*) from public.facilities where facility_type = 'AF') <> 8121 then
    raise exception 'baseline facility rows changed';
  end if;
end;
$checks$;

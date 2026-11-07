-- Phase 5H withdrawal checks. Disposable database only.
-- Loads after the Phase 5C fixture, the Phase 5C migration, the Phase 5G
-- migration, and the Phase 5H migration. Not a migration.

create function pg_temp.phase5h_home(p_id uuid)
returns text
language sql
stable
as $$
  select facility.canonical_name || '|' || facility.license_number || '|'
    || facility.source_hash || '|' || coalesce(facility.public_phone, '') || '|'
    || facility.record_status || '|' || coalesce(facility.address_line1, '') || '|'
    || coalesce(facility.licensed_capacity::text, '')
  from public.facilities as facility
  where facility.id = p_id;
$$;

do $checks$
declare
  claim_104 uuid;
  claim_106 uuid;
  edit_description uuid;
  edit_admin uuid;
  seen integer;
  event_count integer;
  published text;
  first_id uuid;
  second_id uuid;
  next_id uuid;
  first_at timestamptz;
  home_101 text := 'Published Home 00001|100001|' || repeat('ab', 32) || '|555-0101|source_matched|1 Published Street|6';
  home_104 text := 'Published Home 00004|100004|' || repeat('ab', 32) || '|555-0104|source_matched|4 Published Street|6';
  home_106 text := 'Published Home 00006|100006|' || repeat('ab', 32) || '|555-0106|source_matched|6 Published Street|6';
  listed_view text;
  removed_text text := 'Amenities proposed by an administrator';
  description_text text := 'A description that is approved but not yet published';
begin
  listed_view := md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true));
  if pg_temp.phase5h_home('00000000-0000-4000-8000-000000000101') is distinct from home_101
     or pg_temp.phase5h_home('00000000-0000-4000-8000-000000000104') is distinct from home_104
     or pg_temp.phase5h_home('00000000-0000-4000-8000-000000000106') is distinct from home_106
     or (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
        is distinct from (select count(*)::text from public.facilities)
     or (select value from public.phase5c_fixture_sentinel where name = 'listed-view')
        is distinct from listed_view then
    raise exception 'FAIL fixture changed before withdrawal checks';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  claim_104 := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000104',
    'I am the licensed provider for this home'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_approve_owner_claim(claim_104) is not true then
    raise exception 'FAIL claim approval returned false';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  edit_description := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'description',
    description_text
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_description, 'approved') is not true then
    raise exception 'FAIL proposal approval returned false';
  end if;
  reset role;
  if (select count(*) from public.published_owner_listings) <> 0
     or pg_temp.phase5h_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL approval created published content or changed the facility';
  end if;

  set local role authenticated;
  if public.admin_publish_listing_edit(edit_description) is not true then
    raise exception 'FAIL a different administrator could not publish';
  end if;
  reset role;
  set local role anon;
  select published_value
    into published
  from public.wa_afh_published_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000104'
    and field_name = 'description';
  if published is distinct from description_text then
    raise exception 'FAIL the public profile cannot read the published text';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  claim_106 := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000106',
    'An administrator asks to claim a different home'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_approve_owner_claim(claim_106) is not true then
    raise exception 'FAIL the administrator claim was not approved';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  edit_admin := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000106',
    'amenities',
    removed_text
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_admin, 'approved') is not true
     or public.admin_publish_listing_edit(edit_admin) is not true then
    raise exception 'FAIL the other administrator could not publish the proposal';
  end if;
  reset role;
  if (select published_by_user_id
      from public.published_owner_listings
      where facility_id = '00000000-0000-4000-8000-000000000106'
        and field_name = 'amenities')
     is distinct from '00000000-0000-4000-8000-0000000000d5'::uuid
     or (select submitted_by_user_id from public.listing_edits where id = edit_admin)
        is distinct from '00000000-0000-4000-8000-0000000000d4'::uuid then
    raise exception 'FAIL the publication actors were not the expected administrators';
  end if;

  select count(*) into event_count from public.published_owner_listing_events;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  begin
    set local role authenticated;
    perform public.admin_withdraw_published_owner_listing(
      '00000000-0000-4000-8000-000000000106',
      'amenities'
    );
    raise exception 'FAIL the submitter withdrew published text';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL submitter withdrawal error was %', sqlerrm;
      end if;
      reset role;
  end;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.admin_withdraw_published_owner_listing(
      '00000000-0000-4000-8000-000000000106',
      'amenities'
    );
    raise exception 'FAIL a non-admin withdrew published text';
  exception
    when others then
      if sqlerrm <> 'administrator required' then
        raise exception 'FAIL non-admin withdrawal error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role anon;
    perform public.admin_withdraw_published_owner_listing(
      '00000000-0000-4000-8000-000000000106',
      'amenities'
    );
    raise exception 'FAIL an anonymous caller withdrew published text';
  exception
    when insufficient_privilege then
      reset role;
  end;
  if (select count(*) from public.published_owner_listing_events) <> event_count
     or (select count(*) from public.published_owner_listings
         where facility_id = '00000000-0000-4000-8000-000000000106'
           and field_name = 'amenities') <> 1 then
    raise exception 'FAIL a blocked withdrawal changed publication state';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_withdraw_published_owner_listing(
    '00000000-0000-4000-8000-000000000106',
    'amenities'
  ) is not true then
    raise exception 'FAIL the publishing administrator withdrawal returned false';
  end if;
  reset role;

  set local role anon;
  select count(*)
    into seen
  from public.wa_afh_published_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000106'
    and field_name = 'amenities';
  if seen <> 0 then
    raise exception 'FAIL the public profile still returns the withdrawn field';
  end if;
  select published_value
    into published
  from public.wa_afh_published_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000104'
    and field_name = 'description';
  if published is distinct from description_text then
    raise exception 'FAIL withdrawal removed a different published field';
  end if;
  reset role;
  if exists (
    select 1
    from public.published_owner_listings
    where facility_id = '00000000-0000-4000-8000-000000000106'
      and field_name = 'amenities'
  ) then
    raise exception 'FAIL the current published row remains after withdrawal';
  end if;
  if (select count(*)
      from public.published_owner_listing_events
      where event_type = 'withdrawn'
        and facility_id = '00000000-0000-4000-8000-000000000106'
        and field_name = 'amenities'
        and previous_value = removed_text
        and published_value = removed_text
        and source_edit_id = edit_admin
        and actor_user_id = '00000000-0000-4000-8000-0000000000d5') <> 1
     or (select count(*) from public.published_owner_listing_events where event_type = 'withdrawn') <> 1 then
    raise exception 'FAIL withdrawal did not append one audit event for the removed text';
  end if;
  if (select count(*)
      from public.published_owner_listing_events
      where event_type = 'published'
        and facility_id = '00000000-0000-4000-8000-000000000104'
        and field_name = 'description'
        and previous_value is null
        and published_value = description_text) <> 1
     or (select count(*)
         from public.published_owner_listing_events
         where event_type = 'published'
           and facility_id = '00000000-0000-4000-8000-000000000106'
           and field_name = 'amenities'
           and published_value = removed_text) <> 1 then
    raise exception 'FAIL an earlier published event was removed';
  end if;
  if (select review_status from public.listing_edits where id = edit_admin) is distinct from 'approved'
     or (select review_status from public.listing_edits where id = edit_description) is distinct from 'approved' then
    raise exception 'FAIL withdrawal changed a review status';
  end if;

  begin
    update public.published_owner_listing_events
    set published_value = 'changed audit text'
    where event_type = 'withdrawn';
    raise exception 'FAIL the withdrawn audit row was updated';
  exception
    when others then
      if sqlerrm <> 'publication audit rows cannot be changed' then
        raise exception 'FAIL audit update error was %', sqlerrm;
      end if;
  end;
  begin
    delete from public.published_owner_listing_events
    where event_type = 'withdrawn';
    raise exception 'FAIL the withdrawn audit row was deleted';
  exception
    when others then
      if sqlerrm <> 'publication audit rows cannot be changed' then
        raise exception 'FAIL audit delete error was %', sqlerrm;
      end if;
  end;

  select count(*) into event_count from public.published_owner_listing_events;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  begin
    set local role authenticated;
    perform public.admin_withdraw_published_owner_listing(
      '00000000-0000-4000-8000-000000000106',
      'amenities'
    );
    raise exception 'FAIL a second withdrawal removed missing text';
  exception
    when others then
      if sqlerrm <> 'published owner text was not found' then
        raise exception 'FAIL second withdrawal error was %', sqlerrm;
      end if;
      reset role;
  end;
  if (select count(*) from public.published_owner_listing_events) <> event_count then
    raise exception 'FAIL a missing publication added an audit event';
  end if;
  if pg_temp.phase5h_home('00000000-0000-4000-8000-000000000104') is distinct from home_104
     or pg_temp.phase5h_home('00000000-0000-4000-8000-000000000106') is distinct from home_106 then
    raise exception 'FAIL withdrawal changed canonical name, license, source hash, status, address, or capacity';
  end if;

  begin
    set local role authenticated;
    delete from public.published_owner_listings
    where facility_id = '00000000-0000-4000-8000-000000000104'
      and field_name = 'description';
    raise exception 'FAIL direct deletion of current publication was accepted';
  exception
    when insufficient_privilege then
      reset role;
  end;
  if (select count(*)
      from public.published_owner_listings
      where facility_id = '00000000-0000-4000-8000-000000000104'
        and field_name = 'description') <> 1 then
    raise exception 'FAIL direct deletion changed the current publication';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  begin
    select count(*) into seen from public.admin_list_listing_edits(0);
    raise exception 'FAIL page size 0 was accepted';
  exception
    when others then
      if sqlerrm <> 'page size must be 1 to 50' then
        raise exception 'FAIL page size 0 error was %', sqlerrm;
      end if;
  end;
  begin
    select count(*) into seen from public.admin_list_owner_claims(51);
    raise exception 'FAIL page size 51 was accepted';
  exception
    when others then
      if sqlerrm <> 'page size must be 1 to 50' then
        raise exception 'FAIL page size 51 error was %', sqlerrm;
      end if;
  end;
  begin
    select count(*) into seen from public.owner_list_publication_history(0);
    raise exception 'FAIL owner page size 0 was accepted';
  exception
    when others then
      if sqlerrm <> 'page size must be 1 to 50' then
        raise exception 'FAIL owner page size error was %', sqlerrm;
      end if;
  end;
  begin
    select count(*) into seen
    from public.admin_list_listing_edits(20, pg_catalog.clock_timestamp(), null);
    raise exception 'FAIL a one-sided cursor was accepted';
  exception
    when others then
      if sqlerrm <> 'page cursor is incomplete' then
        raise exception 'FAIL cursor error was %', sqlerrm;
      end if;
  end;
  begin
    select count(*) into seen
    from public.admin_list_owner_publication_events(
      20,
      null,
      '00000000-0000-4000-8000-0000000000e1'
    );
    raise exception 'FAIL a one-sided event cursor was accepted';
  exception
    when others then
      if sqlerrm <> 'page cursor is incomplete' then
        raise exception 'FAIL event cursor error was %', sqlerrm;
      end if;
  end;

  select count(*) into seen from public.admin_list_owner_publication_events();
  if seen <> 3 then
    raise exception 'FAIL expected three visible publication events, saw %', seen;
  end if;
  select event_row.id, event_row.created_at
    into first_id, first_at
  from public.admin_list_owner_publication_events(1) as event_row;
  select event_row.id
    into second_id
  from public.admin_list_owner_publication_events(3) as event_row
  offset 1
  limit 1;
  select event_row.id
    into next_id
  from public.admin_list_owner_publication_events(1, first_at, first_id) as event_row;
  if next_id is distinct from second_id or next_id = first_id or next_id is null then
    raise exception 'FAIL the next publication page returned % instead of %', next_id, second_id;
  end if;
  select count(*) into seen from public.admin_list_owner_claims();
  if seen <> 3 then
    raise exception 'FAIL expected three visible claims, saw %', seen;
  end if;
  select claim.id
    into first_id
  from public.admin_list_owner_claims(1) as claim;
  select claim.id
    into second_id
  from public.admin_list_owner_claims(3) as claim
  offset 1
  limit 1;
  select claim.id
    into next_id
  from public.admin_list_owner_claims(1, first_id) as claim;
  if next_id is distinct from second_id or next_id = first_id or next_id is null then
    raise exception 'FAIL the next claim page returned % instead of %', next_id, second_id;
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  select count(*) into seen from public.admin_list_listing_edits();
  if seen <> 0 then
    raise exception 'FAIL a non-admin listing call returned rows';
  end if;
  select count(*) into seen
  from public.owner_list_publication_history()
  where facility_id = '00000000-0000-4000-8000-000000000106';
  if seen <> 0 then
    raise exception 'FAIL owner history returned another facility event';
  end if;
  select count(*) into seen
  from public.owner_list_publication_history()
  where facility_id = '00000000-0000-4000-8000-000000000104'
    and event_type = 'published'
    and published_value = description_text;
  if seen <> 1 then
    raise exception 'FAIL owner history missed the caller facility event';
  end if;
  select count(*) into seen
  from public.owner_list_listing_edits()
  where facility_id = '00000000-0000-4000-8000-000000000106';
  if seen <> 0 then
    raise exception 'FAIL owner proposals returned another owner row';
  end if;
  reset role;
  begin
    execute 'select actor_user_id from public.owner_list_publication_history()';
    raise exception 'FAIL owner history returned an administrator id';
  exception
    when undefined_column then
      null;
  end;

  if (select proposed_value from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
       is distinct from 'preserved proposal text'
     or (select review_status from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
       is distinct from 'pending'
     or (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
       is distinct from 'preserved claim evidence'
     or pg_temp.phase5h_home('00000000-0000-4000-8000-000000000101') is distinct from home_101
     or (select count(*)::text from public.facilities)
       is distinct from (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
     or md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))
       is distinct from listed_view then
    raise exception 'FAIL withdrawal changed preserved directory records';
  end if;
end;
$checks$;

select 'PHASE5H_READY' as status;

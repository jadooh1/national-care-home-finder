-- Phase 5G publication checks. Disposable database only.
-- Loads after the Phase 5C fixture, the Phase 5C migration, and the Phase 5G
-- migration. Not a migration.

create function pg_temp.phase5g_home(p_id uuid)
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
  edit_replacement uuid;
  edit_services uuid;
  edit_pending uuid;
  edit_admin uuid;
  seen integer;
  published text;
  previous text;
  home_101 text := 'Published Home 00001|100001|' || repeat('ab', 32) || '|555-0101|source_matched|1 Published Street|6';
  home_104 text := 'Published Home 00004|100004|' || repeat('ab', 32) || '|555-0104|source_matched|4 Published Street|6';
  home_106 text := 'Published Home 00006|100006|' || repeat('ab', 32) || '|555-0106|source_matched|6 Published Street|6';
  listed_view text;
begin
  listed_view := md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true));
  if pg_temp.phase5g_home('00000000-0000-4000-8000-000000000101') is distinct from home_101
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000104') is distinct from home_104
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000106') is distinct from home_106
     or (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
        is distinct from (select count(*)::text from public.facilities)
     or (select value from public.phase5c_fixture_sentinel where name = 'listed-view')
        is distinct from listed_view then
    raise exception 'FAIL fixture changed before publication checks';
  end if;
  if pg_get_functiondef('public.admin_publish_listing_edit(uuid)'::regprocedure) ~* 'update[[:space:]]+public\.facilities'
     or pg_get_functiondef('public.admin_publish_listing_edit(uuid)'::regprocedure) ~* 'update[[:space:]]+public\.wa_dshs_listed_facilities'
     or pg_get_functiondef('public.admin_review_listing_edit(uuid, text)'::regprocedure) ~* 'update[[:space:]]+public\.facilities' then
    raise exception 'FAIL a review or publication function writes facility rows';
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
    'A description that is approved but not yet published'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_description, 'approved') is not true then
    raise exception 'FAIL proposal approval returned false';
  end if;
  reset role;
  if (select count(*) from public.published_owner_listings) <> 0
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL approval created published content or changed the facility';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.admin_publish_listing_edit(edit_description);
    raise exception 'FAIL the owner published a proposal';
  exception
    when others then
      if sqlerrm <> 'administrator required' then
        raise exception 'FAIL owner publication error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role anon;
    perform public.admin_publish_listing_edit(edit_description);
    raise exception 'FAIL an anonymous caller published a proposal';
  exception
    when insufficient_privilege then
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_publish_listing_edit(edit_description) is not true then
    raise exception 'FAIL administrator publication returned false';
  end if;
  if public.admin_publish_listing_edit(edit_description) is not true then
    raise exception 'FAIL repeating the same publication returned false';
  end if;
  reset role;
  if (select count(*) from public.published_owner_listings where facility_id = '00000000-0000-4000-8000-000000000104' and field_name = 'description') <> 1
     or (select published_value from public.published_owner_listings where source_edit_id = edit_description)
        is distinct from 'A description that is approved but not yet published'
     or (select count(*) from public.published_owner_listing_events where source_edit_id = edit_description) <> 1
     or (select previous_value from public.published_owner_listing_events where source_edit_id = edit_description) is not null
     or (select review_status from public.listing_edits where id = edit_description) is distinct from 'approved'
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL publication did not keep one audited value apart from the facility';
  end if;

  set local role anon;
  select published_value
    into published
  from public.wa_afh_published_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000104'
    and field_name = 'description';
  if published is distinct from 'A description that is approved but not yet published' then
    raise exception 'FAIL the public profile cannot read the published text';
  end if;
  reset role;
  begin
    set local role anon;
    select published_by_user_id into published from public.published_owner_listings;
    raise exception 'FAIL the public read the publisher';
  exception
    when insufficient_privilege then
      reset role;
  end;
  begin
    set local role authenticated;
    perform 1 from public.published_owner_listing_events;
    raise exception 'FAIL a signed-in user read the audit table';
  exception
    when insufficient_privilege then
      reset role;
  end;
  begin
    set local role authenticated;
    insert into public.published_owner_listings (
      facility_id, field_name, published_value, source_edit_id, published_by_user_id
    ) values (
      '00000000-0000-4000-8000-000000000104',
      'services',
      'Direct publication must fail',
      edit_description,
      '00000000-0000-4000-8000-0000000000a1'
    );
    raise exception 'FAIL direct publication was accepted';
  exception
    when insufficient_privilege then
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  edit_replacement := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'description',
    'A later description that replaces the published text'
  );
  edit_services := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'services',
    'Services that an administrator rejects'
  );
  edit_pending := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'amenities',
    'Amenities that are still pending'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_replacement, 'approved') is not true
     or public.admin_review_listing_edit(edit_services, 'rejected') is not true then
    raise exception 'FAIL the second review did not record its decisions';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  begin
    set local role authenticated;
    perform public.admin_publish_listing_edit(edit_services);
    raise exception 'FAIL a rejected proposal was published';
  exception
    when others then
      if sqlerrm <> 'proposal is not approved' then
        raise exception 'FAIL rejected publication error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    perform public.admin_publish_listing_edit(edit_pending);
    raise exception 'FAIL a pending proposal was published';
  exception
    when others then
      if sqlerrm <> 'proposal is not approved' then
        raise exception 'FAIL pending publication error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    perform public.admin_publish_listing_edit('00000000-0000-4000-8000-0000000000e1');
    raise exception 'FAIL a preserved pending proposal was published';
  exception
    when others then
      if sqlerrm <> 'proposal is not approved' then
        raise exception 'FAIL preserved proposal error was %', sqlerrm;
      end if;
      reset role;
  end;
  set local role authenticated;
  if public.admin_publish_listing_edit(edit_replacement) is not true then
    raise exception 'FAIL replacement publication returned false';
  end if;
  reset role;
  select published_value, previous_value
    into published, previous
  from public.published_owner_listing_events
  where source_edit_id = edit_replacement;
  if published is distinct from 'A later description that replaces the published text'
     or previous is distinct from 'A description that is approved but not yet published'
     or (select count(*) from public.published_owner_listings where facility_id = '00000000-0000-4000-8000-000000000104' and field_name = 'description') <> 1
     or (select published_value from public.published_owner_listings where facility_id = '00000000-0000-4000-8000-000000000104' and field_name = 'description')
        is distinct from 'A later description that replaces the published text'
     or (select review_status from public.listing_edits where id = edit_description) is distinct from 'approved'
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL replacement did not preserve the audit and the facility';
  end if;

  begin
    update public.published_owner_listing_events
    set published_value = 'changed audit text'
    where source_edit_id = edit_replacement;
    raise exception 'FAIL the audit row was updated';
  exception
    when others then
      if sqlerrm <> 'publication audit rows cannot be changed' then
        raise exception 'FAIL audit update error was %', sqlerrm;
      end if;
  end;

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
    'Amenities proposed by an administrator'
  );
  begin
    perform public.admin_publish_listing_edit(edit_admin);
    raise exception 'FAIL an administrator published their own proposal before review';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL personal proposal error was %', sqlerrm;
      end if;
  end;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_admin, 'approved') is not true then
    raise exception 'FAIL another administrator could not approve the proposal';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  begin
    set local role authenticated;
    perform public.admin_publish_listing_edit(edit_admin);
    raise exception 'FAIL an administrator published their own proposal';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL self-publication error was %', sqlerrm;
      end if;
      reset role;
  end;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_publish_listing_edit(edit_admin) is not true then
    raise exception 'FAIL the other administrator could not publish';
  end if;
  select count(*) into seen from public.admin_list_published_owner_listings()
  where source_edit_id in (edit_replacement, edit_admin);
  if seen <> 2 then
    raise exception 'FAIL the administrator list did not return the published rows';
  end if;
  select count(*) into seen from public.admin_list_owner_publication_events()
  where source_edit_id = edit_admin
    and previous_value is null
    and published_value = 'Amenities proposed by an administrator';
  if seen <> 1 then
    raise exception 'FAIL the administrator audit list missed the publication';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  select count(*) into seen from public.admin_list_published_owner_listings();
  if seen <> 0 then
    raise exception 'FAIL an owner read the administrator publication list';
  end if;
  select count(*) into seen from public.admin_list_owner_publication_events();
  if seen <> 0 then
    raise exception 'FAIL an owner read the administrator audit list';
  end if;
  reset role;

  if (select proposed_value from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
       is distinct from 'preserved proposal text'
     or (select review_status from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
       is distinct from 'pending'
     or (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
       is distinct from 'preserved claim evidence'
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000101') is distinct from home_101
     or pg_temp.phase5g_home('00000000-0000-4000-8000-000000000106') is distinct from home_106
     or (select count(*)::text from public.facilities)
       is distinct from (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
     or md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))
       is distinct from listed_view
     or md5(pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true))
       is distinct from (select value from public.phase5c_fixture_sentinel where name = 'map-view') then
    raise exception 'FAIL publication changed preserved directory records';
  end if;
end;
$checks$;

select 'PHASE5G_READY' as status;

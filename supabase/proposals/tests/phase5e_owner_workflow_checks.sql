-- Phase 5E behavioral checks. Disposable database only.
-- Loads after the existing Phase 5C fixture and migration. Not a migration.

create function pg_temp.phase5e_home(p_id uuid)
returns text
language sql
stable
as $$
  select facility.canonical_name || '|' || facility.license_number || '|'
    || facility.source_hash || '|' || coalesce(facility.public_phone, '') || '|'
    || facility.record_status
  from public.facilities as facility
  where facility.id = p_id;
$$;

do $checks$
declare
  claim_104 uuid;
  claim_105 uuid;
  claim_105_again uuid;
  claim_106 uuid;
  other_claim uuid;
  edit_description uuid;
  edit_services uuid;
  edit_admin uuid;
  seen integer;
  proposed text;
  home_101 text := 'Published Home 00001|100001|' || repeat('ab', 32) || '|555-0101|source_matched';
  home_104 text := 'Published Home 00004|100004|' || repeat('ab', 32) || '|555-0104|source_matched';
  home_105 text := 'Published Home 00005|100005|' || repeat('ab', 32) || '|555-0105|source_matched';
  home_106 text := 'Published Home 00006|100006|' || repeat('ab', 32) || '|555-0106|source_matched';
begin
  if pg_temp.phase5e_home('00000000-0000-4000-8000-000000000101') is distinct from home_101
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000104') is distinct from home_104
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000105') is distinct from home_105
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000106') is distinct from home_106 then
    raise exception 'FAIL fixture homes changed before the workflow';
  end if;
  if (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
     is distinct from (select count(*)::text from public.facilities)
     or (select value from public.phase5c_fixture_sentinel where name = 'listed-view')
        is distinct from md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true)) then
    raise exception 'FAIL directory fixture changed before the workflow';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  claim_104 := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000104',
    'I am the licensed provider for this home'
  );
  reset role;
  if (select verification_status from public.owner_claims where id = claim_104) is distinct from 'pending'
     or (select claimant_user_id from public.owner_claims where id = claim_104)
        is distinct from '00000000-0000-4000-8000-0000000000a1'::uuid
     or (select count(*) from public.owner_claim_events where claim_id = claim_104 and event_type = 'submitted' and to_status = 'pending') <> 1 then
    raise exception 'FAIL claim submission did not record a pending claim';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000104',
      'The same owner submits a second open claim'
    );
    raise exception 'FAIL duplicate open claim was accepted';
  exception
    when others then
      if sqlerrm <> 'an open claim already exists' then
        raise exception 'FAIL duplicate claim error was %', sqlerrm;
      end if;
      reset role;
  end;
  if (select count(*) from public.owner_claims
      where facility_id = '00000000-0000-4000-8000-000000000104'
        and claimant_user_id = '00000000-0000-4000-8000-0000000000a1') <> 1 then
    raise exception 'FAIL duplicate claim wrote another row';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c3', false);
  begin
    set local role authenticated;
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000105',
      'An unconfirmed account tries to claim a home'
    );
    raise exception 'FAIL unconfirmed owner submitted a claim';
  exception
    when others then
      if sqlerrm <> 'confirmed email required' then
        raise exception 'FAIL unconfirmed claim error was %', sqlerrm;
      end if;
      reset role;
  end;

  begin
    set local role anon;
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000105',
      'An anonymous caller tries to claim a home'
    );
    raise exception 'FAIL anonymous caller submitted a claim';
  exception
    when insufficient_privilege then
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.admin_approve_owner_claim(claim_104);
    raise exception 'FAIL owner approved a claim';
  exception
    when others then
      if sqlerrm <> 'administrator required' then
        raise exception 'FAIL owner approval error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    perform public.admin_reject_owner_claim(claim_104);
    raise exception 'FAIL owner rejected a claim';
  exception
    when others then
      if sqlerrm <> 'administrator required' then
        raise exception 'FAIL owner rejection error was %', sqlerrm;
      end if;
      reset role;
  end;
  if (select verification_status from public.owner_claims where id = claim_104) is distinct from 'pending' then
    raise exception 'FAIL owner review changed the claim';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  set local role authenticated;
  select count(*) into seen from public.owner_claims where id = claim_104;
  if seen <> 0 then
    raise exception 'FAIL another owner read the claim';
  end if;
  select count(*) into seen from public.owner_claim_events where claim_id = claim_104;
  if seen <> 0 then
    raise exception 'FAIL another owner read the claim activity';
  end if;
  begin
    update public.owner_claims
    set verification_status = 'approved'
    where id = claim_104;
    raise exception 'FAIL another owner updated the claim';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    delete from public.owner_claims where id = claim_104;
    raise exception 'FAIL another owner deleted the claim';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    update public.listing_edits
    set review_status = 'approved',
        proposed_value = 'changed by another owner'
    where id = '00000000-0000-4000-8000-0000000000e1';
    raise exception 'FAIL another owner updated the proposal';
  exception
    when insufficient_privilege then
      null;
  end;
  reset role;
  if (select verification_status from public.owner_claims where id = claim_104) is distinct from 'pending'
     or (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
        is distinct from 'preserved claim evidence'
     or (select proposed_value from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
        is distinct from 'preserved proposal text' then
    raise exception 'FAIL another owner changed a preserved or new record';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    update public.facilities
    set canonical_name = 'Published by the owner'
    where id = '00000000-0000-4000-8000-000000000104';
    raise exception 'FAIL owner updated the facility';
  exception
    when insufficient_privilege then
      reset role;
  end;
  begin
    set local role authenticated;
    update public.wa_dshs_listed_facilities
    set canonical_name = 'Published by the owner'
    where id = '00000000-0000-4000-8000-000000000104';
    raise exception 'FAIL owner updated the directory';
  exception
    when insufficient_privilege then
      reset role;
  end;
  begin
    set local role authenticated;
    insert into public.owner_claims (facility_id, claimant_user_id, verification_status, evidence_notes)
    values (
      '00000000-0000-4000-8000-000000000105',
      '00000000-0000-4000-8000-0000000000a1',
      'approved',
      'A direct insert approves the owner'
    );
    raise exception 'FAIL owner inserted an approved claim';
  exception
    when insufficient_privilege then
      reset role;
  end;
  if pg_temp.phase5e_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL a direct write published the facility';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.submit_listing_edit(
      '00000000-0000-4000-8000-000000000104',
      'description',
      'A description submitted before approval'
    );
    raise exception 'FAIL proposal before approval was accepted';
  exception
    when others then
      if sqlerrm <> 'approved claim required' then
        raise exception 'FAIL unverified proposal error was %', sqlerrm;
      end if;
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  claim_106 := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000106',
    'An administrator submits a personal claim'
  );
  begin
    perform public.admin_approve_owner_claim(claim_106);
    raise exception 'FAIL self-approval was accepted';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL self-approval error was %', sqlerrm;
      end if;
  end;
  begin
    perform public.admin_reject_owner_claim(claim_106);
    raise exception 'FAIL self-rejection was accepted';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL self-rejection error was %', sqlerrm;
      end if;
  end;
  reset role;
  if (select verification_status from public.owner_claims where id = claim_106) is distinct from 'pending' then
    raise exception 'FAIL self-review changed the administrator claim';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_approve_owner_claim(claim_104) is not true then
    raise exception 'FAIL administrator approval returned false';
  end if;
  reset role;
  if (select verification_status from public.owner_claims where id = claim_104) is distinct from 'approved'
     or (select count(*) from public.owner_claim_events
         where claim_id = claim_104 and event_type = 'approved' and from_status = 'pending' and to_status = 'approved') <> 1
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL approval did not verify the claim without publishing the facility';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000104',
      'The approved owner submits another open claim'
    );
    raise exception 'FAIL duplicate approved claim was accepted';
  exception
    when others then
      if sqlerrm <> 'an open claim already exists' then
        raise exception 'FAIL duplicate approved claim error was %', sqlerrm;
      end if;
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  set local role authenticated;
  other_claim := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000104',
    'A second owner asks for the same home'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  begin
    set local role authenticated;
    perform public.admin_approve_owner_claim(other_claim);
    raise exception 'FAIL second approval was accepted';
  exception
    when others then
      if sqlerrm <> 'another approved claim exists for this facility' then
        raise exception 'FAIL second approval error was %', sqlerrm;
      end if;
      reset role;
  end;
  set local role authenticated;
  if public.admin_reject_owner_claim(other_claim) is not true then
    raise exception 'FAIL administrator rejection returned false';
  end if;
  reset role;
  if (select verification_status from public.owner_claims where id = other_claim) is distinct from 'rejected'
     or (select count(*) from public.owner_claim_events
         where claim_id = other_claim and event_type = 'rejected' and from_status = 'pending' and to_status = 'rejected') <> 1
     or (select count(*) from public.owner_claims
         where facility_id = '00000000-0000-4000-8000-000000000104' and verification_status = 'approved') <> 1 then
    raise exception 'FAIL rejection did not leave one approved claim';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  set local role authenticated;
  claim_105 := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000105',
    'This owner asks for a different home'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_reject_owner_claim(claim_105) is not true then
    raise exception 'FAIL rejection of a first claim returned false';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  set local role authenticated;
  claim_105_again := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000105',
    'A rejected owner submits a new claim'
  );
  reset role;
  if claim_105_again = claim_105
     or (select verification_status from public.owner_claims where id = claim_105) is distinct from 'rejected'
     or (select verification_status from public.owner_claims where id = claim_105_again) is distinct from 'pending' then
    raise exception 'FAIL a rejected owner could not submit a new claim';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  select count(*) into seen from public.owner_claims where id in (claim_105, claim_105_again);
  if seen <> 0 then
    raise exception 'FAIL the first owner read another owner claim';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  edit_description := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'description',
    'A proposed description for review'
  );
  reset role;
  if (select review_status from public.listing_edits where id = edit_description) is distinct from 'pending'
     or (select submitted_by_user_id from public.listing_edits where id = edit_description)
        is distinct from '00000000-0000-4000-8000-0000000000a1'::uuid
     or (select count(*) from public.listing_edit_events where edit_id = edit_description and event_type = 'submitted') <> 1
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL proposal creation changed the facility or skipped the event';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.admin_review_listing_edit(edit_description, 'approved');
    raise exception 'FAIL owner published a proposal';
  exception
    when others then
      if sqlerrm <> 'administrator required' then
        raise exception 'FAIL owner publication error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    select proposed_value into proposed from public.listing_edits where id = edit_description;
    raise exception 'FAIL owner read the proposed text';
  exception
    when insufficient_privilege then
      reset role;
  end;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  set local role authenticated;
  select count(*) into seen from public.listing_edits where id = edit_description;
  if seen <> 0 then
    raise exception 'FAIL another owner read the proposal';
  end if;
  select count(*) into seen from public.listing_edit_events where edit_id = edit_description;
  if seen <> 0 then
    raise exception 'FAIL another owner read the proposal activity';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_description, 'approved') is not true then
    raise exception 'FAIL proposal approval returned false';
  end if;
  reset role;
  if (select review_status from public.listing_edits where id = edit_description) is distinct from 'approved'
     or (select proposed_value from public.listing_edits where id = edit_description)
        is distinct from 'A proposed description for review'
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL proposal approval published the facility';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  edit_services := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'services',
    'A proposed services list for review'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_review_listing_edit(edit_services, 'rejected') is not true then
    raise exception 'FAIL proposal rejection returned false';
  end if;
  reset role;
  if (select review_status from public.listing_edits where id = edit_services) is distinct from 'rejected'
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000104') is distinct from home_104 then
    raise exception 'FAIL proposal rejection published the facility';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_approve_owner_claim(claim_106) is not true then
    raise exception 'FAIL a different administrator could not approve the claim';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  edit_admin := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000106',
    'amenities',
    'An administrator proposes amenities'
  );
  begin
    perform public.admin_review_listing_edit(edit_admin, 'approved');
    raise exception 'FAIL an administrator published their own proposal';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL self-publication error was %', sqlerrm;
      end if;
  end;
  reset role;
  if (select review_status from public.listing_edits where id = edit_admin) is distinct from 'pending'
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000106') is distinct from home_106 then
    raise exception 'FAIL self-publication changed the proposal or facility';
  end if;

  if (select verification_status from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
       is distinct from 'pending'
     or (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
       is distinct from 'preserved claim evidence'
     or (select review_status from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
       is distinct from 'pending'
     or (select proposed_value from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
       is distinct from 'preserved proposal text'
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000101') is distinct from home_101
     or pg_temp.phase5e_home('00000000-0000-4000-8000-000000000105') is distinct from home_105
     or (select count(*)::text from public.facilities)
       is distinct from (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
     or md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))
       is distinct from (select value from public.phase5c_fixture_sentinel where name = 'listed-view') then
    raise exception 'FAIL preserved directory rows changed';
  end if;
end;
$checks$;

select 'PHASE5E_READY' as status;

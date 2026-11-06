-- Behavioral checks for the Phase 5C migration. Runs only on a disposable database.

do $checks$
declare
  seen integer;
  new_claim uuid;
  new_edit uuid;
  other_claim uuid;
  note text;
  proposed text;
begin
  if (select value from public.phase5c_fixture_sentinel where name = 'facility-count')
     is distinct from (select count(*)::text from public.facilities) then
    raise exception 'FAIL facility count changed';
  end if;
  if (select value from public.phase5c_fixture_sentinel where name = 'listed-view')
     is distinct from md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))
     or (select value from public.phase5c_fixture_sentinel where name = 'map-view')
     is distinct from md5(pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true)) then
    raise exception 'FAIL directory view changed';
  end if;
  if (select privilege_text from public.nchf_phase5a_facilities_acl_snapshot where id = 1)
     is distinct from 'preserved phase 5a grant text' then
    raise exception 'FAIL phase 5a recovery text changed';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.nchf_phase5a_facilities_acl_snapshot'::regclass) then
    raise exception 'FAIL phase 5a row level security is off';
  end if;
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.listing_edits'::regclass
      and polname = 'listing_edits_ingest_definer_select'
  ) then
    raise exception 'FAIL ingest policy was removed';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  select count(*) into seen
  from public.owner_claims
  where id = '00000000-0000-4000-8000-0000000000c1'
    and verification_status = 'pending';
  if seen <> 1 then
    raise exception 'FAIL owner cannot read the preserved claim status';
  end if;
  reset role;

  foreach note in array ARRAY['anon', 'authenticated', 'phase5c_public_probe']
  loop
    begin
      execute format('set local role %I', note);
      execute 'select evidence_notes from public.owner_claims';
      raise exception 'FAIL % can read evidence_notes', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
    begin
      execute format('set local role %I', note);
      execute 'select proposed_value from public.listing_edits';
      raise exception 'FAIL % can read proposed_value', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
    begin
      execute format('set local role %I', note);
      execute 'insert into public.owner_claims (id, facility_id, claimant_user_id, verification_status, evidence_notes) values (gen_random_uuid(), ''00000000-0000-4000-8000-000000000104'', ''00000000-0000-4000-8000-0000000000a1'', ''approved'', ''no'')';
      raise exception 'FAIL % inserted a claim', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
    begin
      execute format('set local role %I', note);
      execute 'update public.owner_claims set verification_status = ''approved'' where id = ''00000000-0000-4000-8000-0000000000c1''';
      raise exception 'FAIL % updated a claim', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
    begin
      execute format('set local role %I', note);
      execute 'truncate public.owner_claims';
      raise exception 'FAIL % truncated owner_claims', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
    begin
      execute format('set local role %I', note);
      execute 'truncate public.owner_claim_events';
      raise exception 'FAIL % truncated owner_claim_events', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
    begin
      execute format('set local role %I', note);
      execute 'insert into public.owner_claims (evidence_notes) values (''column insert'')';
      raise exception 'FAIL % used a column insert', note;
    exception
      when insufficient_privilege then
        reset role;
    end;
  end loop;

  if (select count(*) from public.owner_claims) <> 1
     or (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
        is distinct from 'preserved claim evidence' then
    raise exception 'FAIL preserved claim changed during denied writes';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c3', false);
  begin
    set local role authenticated;
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000104',
      'unconfirmed account should not claim'
    );
    raise exception 'FAIL unconfirmed email submitted a claim';
  exception
    when others then
      if sqlerrm <> 'confirmed email required' then
        raise exception 'FAIL unconfirmed email error was %', sqlerrm;
      end if;
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.submit_owner_claim('00000000-0000-4000-8000-000000000002', 'this test home must be rejected');
    raise exception 'FAIL test-home id was accepted';
  exception
    when others then
      if sqlerrm <> 'facility is not eligible' then
        raise exception 'FAIL test-home id error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    perform public.submit_owner_claim('00000000-0000-4000-8000-000000000102', 'this named test home must be rejected');
    raise exception 'FAIL test-home name was accepted';
  exception
    when others then
      if sqlerrm <> 'facility is not eligible' then
        raise exception 'FAIL test-home name error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    perform public.submit_owner_claim('00000000-0000-4000-8000-000000000103', 'missing category must be rejected now');
    raise exception 'FAIL ineligible facility was accepted';
  exception
    when others then
      if sqlerrm <> 'facility is not eligible' then
        raise exception 'FAIL ineligible facility error was %', sqlerrm;
      end if;
      reset role;
  end;
  begin
    set local role authenticated;
    perform public.submit_owner_claim('00000000-0000-4000-8000-000000000109', 'letter license must be rejected now');
    raise exception 'FAIL non-digit license was accepted';
  exception
    when others then
      if sqlerrm <> 'facility is not eligible' then
        raise exception 'FAIL non-digit license error was %', sqlerrm;
      end if;
      reset role;
  end;

  set local role authenticated;
  new_claim := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000104',
    'I am the licensed provider for this home'
  );
  reset role;
  if (select verification_status from public.owner_claims where id = new_claim) is distinct from 'pending'
     or (select count(*) from public.owner_claim_events as event_row where event_row.claim_id = new_claim and event_row.event_type = 'submitted') <> 1 then
    raise exception 'FAIL confirmed claim did not create a pending row and event';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  begin
    set local role authenticated;
    perform public.submit_listing_edit(
      '00000000-0000-4000-8000-000000000104',
      'canonical_name',
      'renamed'
    );
    raise exception 'FAIL allowlist accepted canonical_name';
  exception
    when others then
      if sqlerrm <> 'approved claim required' and sqlerrm <> 'field is not allowed' then
        raise exception 'FAIL allowlist error was %', sqlerrm;
      end if;
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  if public.admin_approve_owner_claim(new_claim) is not true then
    raise exception 'FAIL administrator approval returned false';
  end if;
  reset role;

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
    raise exception 'FAIL second approved claim was accepted';
  exception
    when others then
      if sqlerrm <> 'another approved claim exists for this facility' then
        raise exception 'FAIL duplicate approval error was %', sqlerrm;
      end if;
      reset role;
  end;
  if (select count(*) from public.owner_claims where facility_id = '00000000-0000-4000-8000-000000000104' and verification_status = 'approved') <> 1 then
    raise exception 'FAIL duplicate approval left more than one approved claim';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  other_claim := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000105',
    'An administrator submits a personal claim'
  );
  begin
    perform public.admin_approve_owner_claim(other_claim);
    raise exception 'FAIL self-review was accepted';
  exception
    when others then
      if sqlerrm <> 'self-review is not allowed' then
        raise exception 'FAIL self-review error was %', sqlerrm;
      end if;
  end;
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;
  perform public.admin_approve_owner_claim(other_claim);
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  new_edit := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000104',
    'description',
    'A proposed description for review'
  );
  begin
    perform public.submit_listing_edit(
      '00000000-0000-4000-8000-000000000104',
      'license_number',
      '999999'
    );
    raise exception 'FAIL allowlist accepted license_number';
  exception
    when others then
      if sqlerrm <> 'field is not allowed' then
        raise exception 'FAIL field allowlist error was %', sqlerrm;
      end if;
  end;
  reset role;
  if (select count(*) from public.listing_edit_events as event_row where event_row.edit_id = new_edit and event_row.event_type = 'submitted') <> 1 then
    raise exception 'FAIL listing submission did not write an event';
  end if;
  if (select canonical_name from public.facilities where id = '00000000-0000-4000-8000-000000000104')
     is distinct from 'Published Home 00004' then
    raise exception 'FAIL a listing edit changed a facility';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  select count(*) into seen from public.admin_list_owner_claims();
  if seen <> 0 then
    raise exception 'FAIL non-admin list returned claim evidence';
  end if;
  select count(*) into seen
  from public.owner_claim_events as event_row
  where event_row.claim_id = new_claim;
  if seen <> 2 then
    raise exception 'FAIL claimant cannot read the claim events';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', false);
  set local role authenticated;
  select evidence_notes into note
  from public.admin_list_owner_claims()
  where id = '00000000-0000-4000-8000-0000000000c1';
  if note is distinct from 'preserved claim evidence' then
    raise exception 'FAIL admin list did not return preserved evidence';
  end if;
  if public.admin_review_listing_edit(new_edit, 'approved') is not true then
    raise exception 'FAIL listing review returned false';
  end if;
  select proposed_value into proposed
  from public.admin_list_listing_edits()
  where id = '00000000-0000-4000-8000-0000000000e1';
  if proposed is distinct from 'preserved proposal text' then
    raise exception 'FAIL admin list did not return preserved proposal text';
  end if;
  reset role;

  begin
    set local role anon;
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000104',
      'anonymous callers must not submit'
    );
    raise exception 'FAIL anon executed submit_owner_claim';
  exception
    when insufficient_privilege then
      reset role;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
  set local role authenticated;
  perform public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000106',
    'First concurrent owner for this home'
  );
  reset role;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e5', false);
  set local role authenticated;
  perform public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000106',
    'Second concurrent owner for this home'
  );
  reset role;

  create table public.phase5c_default_probe (id integer);
  if not has_table_privilege('anon', 'public.phase5c_default_probe', 'INSERT')
     or has_table_privilege('anon', 'public.owner_claim_events', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.listing_edit_events', 'INSERT')
     or exists (
       select 1
       from pg_attribute as attribute
       cross join lateral aclexplode(attribute.attacl) as column_acl
       where attribute.attrelid = 'public.owner_claim_events'::regclass
         and attribute.attname = 'event_type'
         and column_acl.grantee = 0
         and column_acl.privilege_type = 'UPDATE'
     )
     or exists (
       select 1
       from pg_class as relation
       cross join lateral aclexplode(relation.relacl) as table_acl
       where relation.oid = 'public.owner_claim_events'::regclass
         and table_acl.grantee = 0
         and table_acl.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'SELECT')
     ) then
    raise exception 'FAIL default privileges reappeared on the event tables';
  end if;
  if exists (
    select 1
    from pg_class as relation
    cross join lateral aclexplode(relation.relacl) as table_acl
    where relation.oid = any (array[
      'public.owner_claims'::regclass,
      'public.listing_edits'::regclass,
      'public.owner_claim_events'::regclass,
      'public.listing_edit_events'::regclass,
      'public.nchf_phase5c_privilege_snapshot'::regclass
    ])
      and table_acl.grantee = 0
      and table_acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  ) or exists (
    select 1
    from pg_attribute as attribute
    cross join lateral aclexplode(attribute.attacl) as column_acl
    where attribute.attrelid = any (array[
      'public.owner_claims'::regclass,
      'public.listing_edits'::regclass,
      'public.owner_claim_events'::regclass,
      'public.listing_edit_events'::regclass,
      'public.nchf_phase5c_privilege_snapshot'::regclass
    ])
      and attribute.attnum > 0
      and not attribute.attisdropped
      and column_acl.grantee = 0
  ) then
    raise exception 'FAIL public privileges remain on the protected tables';
  end if;
  drop table public.phase5c_default_probe;

  if (select evidence_notes from public.owner_claims where id = '00000000-0000-4000-8000-0000000000c1')
     is distinct from 'preserved claim evidence'
     or (select proposed_value from public.listing_edits where id = '00000000-0000-4000-8000-0000000000e1')
     is distinct from 'preserved proposal text'
     or (select count(*) from public.owner_claim_events where claim_id = '00000000-0000-4000-8000-0000000000c1') <> 0 then
    raise exception 'FAIL preserved rows were backfilled or edited';
  end if;
end
$checks$;

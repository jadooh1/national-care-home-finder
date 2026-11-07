-- Phase 5I listing-edit status filter checks. Disposable database only.
-- Loads after the Phase 5C fixture, the Phase 5C migration, the Phase 5G
-- migration, the Phase 5H migration, and the Phase 5I migration. Not a migration.

do $checks$
declare
  seen integer;
  newest_approved uuid := '00000000-0000-4000-8000-0000000005a3';
  older_approved uuid := '00000000-0000-4000-8000-0000000005a2';
  newest_pending uuid := '00000000-0000-4000-8000-0000000005b2';
  older_pending uuid := '00000000-0000-4000-8000-0000000005b1';
  rejected_edit uuid := '00000000-0000-4000-8000-0000000005c1';
  first_id uuid;
  next_id uuid;
  unfiltered_id uuid;
  first_status text;
  next_status text;
  first_at timestamptz;
  unfiltered_at timestamptz;
  facilities_before text;
  facilities_after text;
  pending_total bigint;
  approved_total bigint;
  rejected_total bigint;
  direct_count bigint;
begin
  select md5(string_agg(facility::text, E'\n' order by facility.id))
    into facilities_before
  from public.facilities as facility;

  update public.listing_edits
  set created_at = '2026-01-01T00:00:00Z'
  where id = '00000000-0000-4000-8000-0000000000e1';

  insert into public.listing_edits (
    id, facility_id, submitted_by_user_id, field_name, proposed_value, review_status, created_at
  ) values
    (newest_approved, '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'services', 'newer approved proposal', 'approved', '2026-06-03T00:00:00Z'),
    (older_approved, '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'amenities', 'older approved proposal', 'approved', '2026-06-02T00:00:00Z'),
    (newest_pending, '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'description', 'newer pending proposal', 'pending', '2026-06-01T00:00:00Z'),
    (older_pending, '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'services', 'older pending proposal', 'pending', '2026-05-01T00:00:00Z'),
    (rejected_edit, '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'amenities', 'rejected proposal', 'rejected', '2026-04-01T00:00:00Z');

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', false);
  set local role authenticated;

  select edit.id, edit.created_at
    into unfiltered_id, unfiltered_at
  from public.admin_list_listing_edits(1) as edit;
  if unfiltered_id is distinct from newest_approved then
    raise exception 'FAIL an unfiltered page of one row was %', unfiltered_id;
  end if;

  select edit.id, edit.review_status, edit.created_at
    into first_id, first_status, first_at
  from public.admin_list_listing_edits(1, null, null, 'pending') as edit;
  if first_id is distinct from newest_pending
     or first_status is distinct from 'pending'
     or first_at >= unfiltered_at then
    raise exception 'FAIL pending limit 1 returned % at %', first_id, first_at;
  end if;

  select edit.id, edit.review_status
    into next_id, next_status
  from public.admin_list_listing_edits(1, first_at, first_id, 'pending') as edit;
  if next_id is distinct from older_pending
     or next_status is distinct from 'pending'
     or next_id in (newest_approved, older_approved, rejected_edit) then
    raise exception 'FAIL the next pending page returned % (%)', next_id, next_status;
  end if;

  select count(*) into seen
  from public.admin_list_listing_edits(20, null, null, 'approved') as edit
  where edit.review_status is distinct from 'approved';
  if seen <> 0 then
    raise exception 'FAIL the approved filter included another status';
  end if;
  select edit.id into first_id
  from public.admin_list_listing_edits(1, null, null, 'approved') as edit;
  select edit.id, edit.review_status
    into next_id, next_status
  from public.admin_list_listing_edits(1, unfiltered_at, first_id, 'approved') as edit;
  if first_id is distinct from newest_approved
     or next_id is distinct from older_approved
     or next_status is distinct from 'approved' then
    raise exception 'FAIL approved pages returned % then %', first_id, next_id;
  end if;

  select count(*) into seen
  from public.admin_list_listing_edits(20, null, null, 'rejected') as edit
  where edit.review_status is distinct from 'rejected';
  if seen <> 0 then
    raise exception 'FAIL the rejected filter included another status';
  end if;
  select count(*) into seen
  from public.admin_list_listing_edits(20, null, null, 'rejected') as edit;
  if seen <> 1 then
    raise exception 'FAIL the rejected filter returned % rows', seen;
  end if;

  select count(distinct edit.review_status) into seen
  from public.admin_list_listing_edits(20, null, null, null) as edit;
  if seen < 2 then
    raise exception 'FAIL a null status returned one status';
  end if;
  select count(distinct edit.review_status) into seen
  from public.admin_list_listing_edits(20, null, null, 'all') as edit;
  if seen < 2 then
    raise exception 'FAIL all returned one status';
  end if;
  select count(distinct edit.review_status) into seen
  from public.admin_list_listing_edits(20, null, null, '  ALL  ') as edit;
  if seen < 2 then
    raise exception 'FAIL a blank-padded all returned one status';
  end if;
  select count(distinct edit.review_status) into seen
  from public.admin_list_listing_edits(20, null, null, '') as edit;
  if seen < 2 then
    raise exception 'FAIL an empty status returned one status';
  end if;

  begin
    select count(*) into seen
    from public.admin_list_listing_edits(20, null, null, 'nope');
    raise exception 'FAIL status nope was accepted';
  exception
    when others then
      if sqlerrm <> 'status is not allowed' then
        raise exception 'FAIL status error was %', sqlerrm;
      end if;
  end;
  begin
    select count(*) into seen from public.admin_list_listing_edits(51);
    raise exception 'FAIL page size 51 was accepted';
  exception
    when others then
      if sqlerrm <> 'page size must be 1 to 50' then
        raise exception 'FAIL page size 51 error was %', sqlerrm;
      end if;
  end;

  select count(*) into seen from public.admin_count_listing_edits();
  if seen <> 3 then
    raise exception 'FAIL an administrator count returned % rows', seen;
  end if;
  select counted.proposal_count into pending_total
  from public.admin_count_listing_edits() as counted
  where counted.review_status = 'pending';
  select counted.proposal_count into approved_total
  from public.admin_count_listing_edits() as counted
  where counted.review_status = 'approved';
  select counted.proposal_count into rejected_total
  from public.admin_count_listing_edits() as counted
  where counted.review_status = 'rejected';
  if pending_total is null or approved_total is null or rejected_total is null then
    raise exception 'FAIL the count did not return pending, approved, and rejected';
  end if;
  reset role;
  select count(*) into direct_count from public.listing_edits where review_status = 'pending';
  if pending_total is distinct from direct_count then
    raise exception 'FAIL pending count % did not match %', pending_total, direct_count;
  end if;
  select count(*) into direct_count from public.listing_edits where review_status = 'approved';
  if approved_total is distinct from direct_count then
    raise exception 'FAIL approved count % did not match %', approved_total, direct_count;
  end if;
  select count(*) into direct_count from public.listing_edits where review_status = 'rejected';
  if rejected_total is distinct from direct_count then
    raise exception 'FAIL rejected count % did not match %', rejected_total, direct_count;
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
  set local role authenticated;
  select count(*) into seen
  from public.admin_list_listing_edits(20, null, null, 'pending');
  if seen <> 0 then
    raise exception 'FAIL a non-admin listing call returned rows';
  end if;
  select count(*) into seen from public.admin_count_listing_edits();
  if seen <> 0 then
    raise exception 'FAIL a non-admin count returned rows';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', '', false);
  set local role authenticated;
  select count(*) into seen from public.admin_list_listing_edits(1, null, null, 'pending');
  if seen <> 0 then
    raise exception 'FAIL an anonymous listing call returned rows';
  end if;
  select count(*) into seen from public.admin_count_listing_edits();
  if seen <> 0 then
    raise exception 'FAIL an anonymous count returned rows';
  end if;
  reset role;

  select md5(string_agg(facility::text, E'\n' order by facility.id))
    into facilities_after
  from public.facilities as facility;
  if facilities_after is distinct from facilities_before
     or (select count(*)::text from public.facilities)
        is distinct from (select value from public.phase5c_fixture_sentinel where name = 'facility-count') then
    raise exception 'FAIL the status filter changed a facility';
  end if;
end;
$checks$;

select 'PHASE5I_READY' as status;

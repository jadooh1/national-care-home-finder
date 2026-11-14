-- Disposable checks for the premium owner-text gate. Not a migration.

do $checks$
declare
  seen integer;
  target_facility uuid := '00000000-0000-4000-8000-0000000000e2';
  blocked_facility uuid := '00000000-0000-4000-8000-000000000002';
begin
  insert into public.facilities (
    id, canonical_name, state_code, license_number, source_name, license_category,
    facility_type, record_status, normalized_license_number, presence
  ) values (
    target_facility, 'Local eligible home', 'WA', '123456', 'wa_dshs_afh', 'afh',
    'AF', 'source_matched', '123456', 'active'
  );
  insert into public.wa_dshs_license_comparison (license_number) values ('123456');
  insert into public.published_owner_listings (facility_id, field_name, published_value)
  values (target_facility, 'description', 'synthetic owner text');

  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  if seen <> 0 then
    raise exception 'FAIL owner text was visible without an entitlement';
  end if;

  begin
    set local role anon;
    perform 1 from public.wa_afh_published_owner_content;
    raise exception 'FAIL anonymous read of the ungated view was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  insert into public.premium_subscriptions (facility_id, status, current_period_end)
  values (target_facility, 'active', pg_catalog.now() + interval '30 days');

  set local role anon;
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  reset role;
  if seen <> 1 then
    raise exception 'FAIL an open entitlement did not reveal owner text';
  end if;

  update public.premium_subscriptions as subscription
  set status = 'canceled'
  where subscription.facility_id = target_facility;
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  if seen <> 0 then
    raise exception 'FAIL a closed entitlement still revealed owner text';
  end if;

  update public.premium_subscriptions as subscription
  set status = 'trialing',
      current_period_end = pg_catalog.now() + interval '1 day'
  where subscription.facility_id = target_facility;
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  if seen <> 1 then
    raise exception 'FAIL an open trial did not reveal owner text';
  end if;

  update public.premium_subscriptions as subscription
  set current_period_end = pg_catalog.now() - interval '1 minute'
  where subscription.facility_id = target_facility;
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  if seen <> 0 then
    raise exception 'FAIL an expired entitlement still revealed owner text';
  end if;

  begin
    set local role anon;
    insert into public.premium_subscriptions (facility_id, status, current_period_end)
    values (target_facility, 'active', pg_catalog.now() + interval '1 day');
    raise exception 'FAIL anonymous subscription insert was allowed';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    set local role authenticated;
    insert into public.wa_afh_premium_owner_content (facility_id, field_name, published_value, published_at)
    values (target_facility, 'description', 'synthetic owner text', pg_catalog.now());
    raise exception 'FAIL authenticated write through the premium view was allowed';
  exception
    when insufficient_privilege or feature_not_supported or object_not_in_prerequisite_state then
      null;
  end;

  update public.premium_subscriptions as subscription
  set status = 'active',
      current_period_end = pg_catalog.now() + interval '30 days'
  where subscription.facility_id = target_facility;
  update public.facilities as facility
  set presence = 'absent'
  where facility.id = target_facility;
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  if seen <> 0 then
    raise exception 'FAIL an absent facility remained visible';
  end if;

  update public.facilities as facility
  set presence = 'active',
      facility_type = 'AFH'
  where facility.id = target_facility;
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = target_facility;
  if seen <> 0 then
    raise exception 'FAIL a facility outside the production type remained visible';
  end if;

  insert into public.facilities (
    id, canonical_name, state_code, license_number, source_name, license_category,
    facility_type, record_status, normalized_license_number, presence
  ) values (
    blocked_facility, 'Local excluded home', 'WA', '123456', 'wa_dshs_afh', 'afh',
    'AF', 'source_matched', '123456', 'active'
  );
  insert into public.published_owner_listings (facility_id, field_name, published_value)
  values (blocked_facility, 'description', 'synthetic owner text');
  insert into public.premium_subscriptions (facility_id, status, current_period_end)
  values (blocked_facility, 'active', pg_catalog.now() + interval '30 days');
  select count(*) into seen
  from public.wa_afh_premium_owner_content as content
  where content.facility_id = blocked_facility;
  if seen <> 0 then
    raise exception 'FAIL the production sentinel exclusion was not applied';
  end if;

  delete from public.premium_subscriptions as subscription
  where subscription.facility_id in (target_facility, blocked_facility);
  delete from public.published_owner_listings as content
  where content.facility_id in (target_facility, blocked_facility);
  delete from public.facilities as facility
  where facility.id in (target_facility, blocked_facility);
  delete from public.wa_dshs_license_comparison
  where btrim(license_number) = '123456';
end;
$checks$;

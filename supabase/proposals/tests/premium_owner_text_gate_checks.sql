-- Disposable checks for the premium owner-text gate. Not a migration.

do $checks$
declare
  seen integer;
  target_facility uuid := '00000000-0000-4000-8000-0000000000e2';
begin
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

  delete from public.premium_subscriptions as subscription
  where subscription.facility_id = target_facility;
  delete from public.published_owner_listings as content
  where content.facility_id = target_facility;
end;
$checks$;

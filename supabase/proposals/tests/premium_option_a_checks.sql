-- Disposable checks for the Option A premium ledger. Not a migration.

do $checks$
declare
  seen integer;
  facility_one uuid := '00000000-0000-4000-8000-0000000000f1';
  facility_two uuid := '00000000-0000-4000-8000-0000000000f2';
  owner_id uuid := '00000000-0000-4000-8000-0000000000a1';
begin
  set role billing_recorder;
  perform public.development_record_premium_subscription(
    facility_one, owner_id, 'active', pg_catalog.now() + interval '30 days', false, 'dev_option_a_open'
  );
  reset role;

  select count(*) into seen from public.wa_afh_premium_owner_content where facility_id = facility_one;
  if seen <> 1 then
    raise exception 'FAIL active subscription did not reveal owner text';
  end if;
  select count(*) into seen from public.wa_afh_premium_owner_content where facility_id = facility_two;
  if seen <> 0 then
    raise exception 'FAIL owner text was visible without a subscription';
  end if;

  set role authenticated;
  select count(*) into seen from public.wa_afh_premium_owner_content;
  if seen <> 1 then
    raise exception 'FAIL a signed-in visitor could not read entitled owner text';
  end if;
  begin
    insert into public.premium_subscriptions (
      facility_id, owner_user_id, status, price_cents, currency, billing_interval,
      current_period_end, provider, provider_reference
    ) values (
      facility_two, owner_id, 'active', 9900, 'usd', 'month',
      pg_catalog.now() + interval '30 days', 'development-ledger', 'dev_option_a_fake'
    );
    raise exception 'FAIL authenticated insert was allowed';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    perform public.development_record_premium_subscription(
      facility_two, owner_id, 'active', pg_catalog.now() + interval '30 days', false, 'dev_option_a_fake'
    );
    raise exception 'FAIL authenticated billing call was allowed';
  exception
    when insufficient_privilege then
      null;
  end;
  select count(*) into seen from public.wa_afh_premium_owner_content;
  if seen <> 1 then
    raise exception 'FAIL authenticated role changed the premium view';
  end if;
  reset role;

  set role billing_recorder;
  perform public.development_record_premium_subscription(
    facility_one, owner_id, 'active', pg_catalog.now() + interval '30 days', true, 'dev_option_a_grace'
  );
  reset role;
  select count(*) into seen from public.wa_afh_premium_owner_content where facility_id = facility_one;
  if seen <> 1 then
    raise exception 'FAIL cancellation at period end removed access early';
  end if;

  set role billing_recorder;
  perform public.development_record_premium_subscription(
    facility_one, owner_id, 'canceled', pg_catalog.now() + interval '30 days', false, 'dev_option_a_stop'
  );
  reset role;
  select count(*) into seen from public.wa_afh_premium_owner_content where facility_id = facility_one;
  if seen <> 0 then
    raise exception 'FAIL canceled subscription stayed visible';
  end if;

  set role billing_recorder;
  begin
    perform public.development_record_premium_subscription(
      facility_one, owner_id, 'active', pg_catalog.now() - interval '1 minute', false, 'dev_option_a_late'
    );
    raise exception 'FAIL expired active subscription was recorded';
  exception
    when others then
      if sqlerrm not like '%future period end%' then
        raise;
      end if;
  end;
  begin
    perform public.development_record_premium_subscription(
      facility_one, owner_id, 'past_due', pg_catalog.now() + interval '30 days', false, '4111111111111111'
    );
    raise exception 'FAIL a card-like reference was stored';
  exception
    when others then
      if sqlerrm not like '%development reference required%' then
        raise;
      end if;
  end;
  reset role;

  insert into public.premium_subscriptions (
    facility_id, owner_user_id, status, price_cents, currency, billing_interval,
    current_period_end, provider, provider_reference
  ) values (
    facility_two, owner_id, 'active', 9900, 'usd', 'month',
    pg_catalog.now() - interval '1 minute', 'development-ledger', 'dev_option_a_old'
  );
  select count(*) into seen from public.wa_afh_premium_owner_content where facility_id = facility_two;
  if seen <> 0 then
    raise exception 'FAIL an expired period stayed visible';
  end if;
  delete from public.premium_subscriptions where facility_id = facility_two;

  insert into public.premium_subscriptions (
    facility_id, owner_user_id, status, price_cents, currency, billing_interval,
    current_period_end, provider, provider_reference
  ) values (
    facility_two, owner_id, 'past_due', 9900, 'usd', 'month',
    pg_catalog.now() + interval '30 days', 'development-ledger', 'dev_option_a_due'
  );
  select count(*) into seen from public.wa_afh_premium_owner_content where facility_id = facility_two;
  if seen <> 0 then
    raise exception 'FAIL a past-due subscription stayed visible';
  end if;
  delete from public.premium_subscriptions where facility_id = facility_two;

  begin
    insert into public.premium_subscriptions (
      facility_id, owner_user_id, status, price_cents, currency, billing_interval,
      current_period_end, provider, provider_reference
    ) values (
      facility_two, owner_id, 'active', 100, 'usd', 'month',
      pg_catalog.now() + interval '30 days', 'development-ledger', 'dev_option_a_price'
    );
    raise exception 'FAIL a non-premium price was stored';
  exception
    when check_violation then
      null;
  end;

  begin
    perform set_config('nchf.billing_environment', 'production', true);
    perform public.development_record_premium_subscription(
      facility_one, owner_id, 'active', pg_catalog.now() + interval '30 days', false, 'dev_option_a_prod'
    );
    raise exception 'FAIL production billing call was allowed';
  exception
    when others then
      if sqlerrm not like '%development billing ledger is closed%' then
        raise;
      end if;
  end;

  select count(*) into seen
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('premium_subscriptions', 'premium_subscription_events')
    and column_name ~* 'card|pan|secret|password|cvv';
  if seen <> 0 then
    raise exception 'FAIL the ledger has a payment-secret column';
  end if;

  select count(*) into seen from public.published_owner_listings;
  if seen <> 2 then
    raise exception 'FAIL the ledger changed published owner rows';
  end if;
end;
$checks$;

select 'PREMIUM_OPTION_A_READY' as status;

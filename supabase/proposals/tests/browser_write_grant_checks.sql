-- Disposable PostgreSQL proof for the browser write-grant proposal.
begin;

\ir browser_write_grant_fixture.sql

savepoint before_effect;

do $before$
declare
  sample uuid;
begin
  select id into sample from public.facilities limit 1;
  execute 'set local role anon';
  begin
    insert into public.facilities (id, canonical_name, record_status, license_number)
    values ('00000000-0000-4000-8000-000000000201', 'Blocked insert', 'unclassified', '9000000201');
    raise exception 'FAIL anon facility insert was accepted';
  exception
    when insufficient_privilege then
      if position('row-level security' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  execute 'reset role';
  execute 'set local role authenticated';
  insert into public.owner_claims (
    facility_id, claimant_user_id, verification_status, evidence_notes
  ) values (
    sample, '00000000-0000-4000-8000-0000000000aa', 'pending', 'direct browser insert'
  );
  insert into public.listing_edits (
    facility_id, submitted_by_user_id, field_name, proposed_value, review_status
  ) values (
    sample, '00000000-0000-4000-8000-0000000000aa', 'city', 'Example', 'pending'
  );
  execute 'reset role';
  if (select count(*) from public.owner_claims) <> 1
     or (select count(*) from public.listing_edits) <> 1 then
    raise exception 'FAIL direct claim or listing insert was already denied';
  end if;
end;
$before$;

rollback to savepoint before_effect;

select set_config('nchf.browser_write_remediation_authorization', 'authorize-browser-write-remediation', true);
select set_config('nchf.browser_write_remediation_target', 'yiehgstweswxjakbcdzc', true);

\ir ../20261108024500_browser_write_grant_remediation.sql
\ir ../20261108024500_browser_write_grant_remediation.sql

savepoint after_effect;

do $after$
declare
  sample uuid;
  verified_id uuid := '00000000-0000-4000-8000-000000000202';
  new_claim uuid;
begin
  select id into sample from public.facilities limit 1;
  insert into public.facilities (id, canonical_name, record_status, license_number)
  values (verified_id, 'Synthetic verified home', 'verified', '9000000202');

  execute 'set local role anon';
  if (select count(*) from public.facilities where id = verified_id) <> 1
     or (select count(*) from public.facilities where record_status = 'unclassified') <> 0 then
    raise exception 'FAIL anonymous select changed';
  end if;
  begin
    insert into public.facilities (id, canonical_name, record_status, license_number)
    values ('00000000-0000-4000-8000-000000000203', 'Blocked insert', 'unclassified', '9000000203');
    raise exception 'FAIL anon facility insert was accepted';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  begin
    update public.facilities set canonical_name = 'changed' where id = verified_id;
    raise exception 'FAIL anon facility update was accepted';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  begin
    delete from public.facilities where id = verified_id;
    raise exception 'FAIL anon facility delete was accepted';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  begin
    insert into public.owner_claims (
      facility_id, claimant_user_id, verification_status, evidence_notes
    ) values (
      sample, '00000000-0000-4000-8000-0000000000aa', 'pending', 'direct browser insert'
    );
    raise exception 'FAIL anon claim insert was accepted';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  execute 'reset role';

  execute 'set local role authenticated';
  begin
    insert into public.listing_edits (
      facility_id, submitted_by_user_id, field_name, proposed_value, review_status
    ) values (
      sample, '00000000-0000-4000-8000-0000000000aa', 'city', 'Example', 'pending'
    );
    raise exception 'FAIL authenticated listing insert was accepted';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  begin
    insert into public.owner_claims (
      facility_id, claimant_user_id, verification_status, evidence_notes
    ) values (
      sample, '00000000-0000-4000-8000-0000000000aa', 'pending', 'direct browser insert'
    );
    raise exception 'FAIL authenticated claim insert was accepted';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  new_claim := public.probe_owner_claim(sample);
  if new_claim is null or public.probe_admin_visible() is distinct from true then
    raise exception 'FAIL owner claim or administrator function was blocked';
  end if;
  begin
    perform public.probe_admin_visible();
    select 1 from public.app_admins;
    raise exception 'FAIL authenticated read app_admins directly';
  exception
    when insufficient_privilege then
      if position('permission denied' in sqlerrm) = 0 then
        raise;
      end if;
  end;
  execute 'reset role';

  if (select count(*) from public.owner_claims) <> 1
     or (select claimant_user_id from public.owner_claims where id = new_claim)
        is distinct from '00000000-0000-4000-8000-0000000000aa'::uuid then
    raise exception 'FAIL security definer claim was not recorded';
  end if;
end;
$after$;

rollback to savepoint after_effect;

\ir ../20261108024500_browser_write_grant_remediation.sql

do $still_clean$
begin
  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.app_admins) <> 1 then
    raise exception 'FAIL probe changed the baseline rows';
  end if;
end;
$still_clean$;

\ir ../20261108024500_browser_write_grant_remediation_ROLLBACK.sql

do $restored$
declare
  sample uuid;
begin
  if pg_catalog.has_table_privilege('anon', 'public.facilities', 'INSERT') is not true
     or pg_catalog.has_table_privilege('authenticated', 'public.listing_edits', 'INSERT') is not true
     or pg_catalog.has_table_privilege('anon', 'public.listing_edits', 'INSERT')
     or to_regclass('public.nchf_browser_write_remediation_audit') is not null
     or (select count(*) from public.facilities) <> 8121 then
    raise exception 'FAIL rollback did not restore the confirmed grants';
  end if;
  select id into sample from public.facilities limit 1;
  execute 'set local role authenticated';
  insert into public.owner_claims (
    facility_id, claimant_user_id, verification_status, evidence_notes
  ) values (
    sample, '00000000-0000-4000-8000-0000000000aa', 'pending', 'restored direct insert'
  );
  execute 'reset role';
  if (select count(*) from public.owner_claims) <> 1 then
    raise exception 'FAIL restored claim insert did not work';
  end if;
end;
$restored$;

rollback;

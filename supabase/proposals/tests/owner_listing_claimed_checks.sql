do $privileges$
begin
  if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT') then
    raise exception 'ungated view remained readable';
  end if;
  if has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'anonymous visitors can read claimed text';
  end if;
  if not has_table_privilege('anon', 'public.wa_dshs_listed_facilities', 'SELECT') then
    raise exception 'official directory is no longer public';
  end if;
end;
$privileges$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
set role authenticated;

do $approved$
declare
  seen integer;
begin
  select count(*) into seen
  from public.wa_afh_claimed_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000101';
  if seen <> 1 then
    raise exception 'approved owner could not read claimed text';
  end if;
  select count(*) into seen
  from public.wa_afh_claimed_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000102';
  if seen <> 0 then
    raise exception 'approved owner saw an unrelated facility';
  end if;
  select count(*) into seen
  from public.wa_afh_claimed_owner_content
  where facility_id = '00000000-0000-4000-8000-000000000104';
  if seen <> 0 then
    raise exception 'empty publication was reported as a row';
  end if;
end;
$approved$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', false);
set role authenticated;

do $unapproved$
declare
  seen integer;
begin
  select count(*) into seen from public.wa_afh_claimed_owner_content;
  if seen <> 0 then
    raise exception 'unapproved owner saw published text';
  end if;
end;
$unapproved$;

reset role;

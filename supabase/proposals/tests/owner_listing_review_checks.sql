do $privileges$
declare
  privilege text;
begin
  if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('service_role', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT')
     or has_table_privilege('service_role', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'owner listing proposal left a closed owner-text read open';
  end if;
  if not has_table_privilege('service_role', 'public.published_owner_listings', 'SELECT') then
    raise exception 'owner listing proposal removed the service role publication read';
  end if;
  if not has_function_privilege('authenticated', 'public.admin_list_published_owner_listings()', 'EXECUTE') then
    raise exception 'owner listing proposal removed the administrator list function';
  end if;
  foreach privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
    if has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', privilege)
       or has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', privilege)
       or has_table_privilege('service_role', 'public.wa_afh_claimed_owner_content', privilege) then
      raise exception 'owner listing proposal left a write privilege on the claimed view';
    end if;
  end loop;
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
  where facility_id <> '00000000-0000-4000-8000-000000000101';
  if seen <> 0 then
    raise exception 'approved owner saw another owner or an ineligible facility';
  end if;
end;
$approved$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b1', false);
set role authenticated;

do $other_owner$
declare
  seen integer;
  own_text text;
begin
  select count(*), min(published_value) into seen, own_text
  from public.wa_afh_claimed_owner_content;
  if seen <> 1 or own_text <> 'Approved owner text B' then
    raise exception 'the other approved owner saw the wrong text';
  end if;
end;
$other_owner$;

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
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d1', false);
set role authenticated;

do $administrator$
declare
  view_rows integer;
  function_rows integer;
begin
  select count(*) into view_rows from public.wa_afh_claimed_owner_content;
  if view_rows <> 0 then
    raise exception 'an administrator saw another owner through the claimed view';
  end if;
  select count(*) into function_rows from public.admin_list_published_owner_listings();
  if function_rows <> 7 then
    raise exception 'the administrator list function no longer reads publication rows';
  end if;
end;
$administrator$;

reset role;

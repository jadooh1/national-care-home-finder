do $privileges$
begin
  if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'owner listing proposal left a public owner-text read';
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
  where facility_id in (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000103',
    '00000000-0000-4000-8000-000000000104',
    '00000000-0000-4000-8000-000000000002'
  );
  if seen <> 0 then
    raise exception 'approved owner saw hidden or unrelated text';
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

-- Prove the seam matches the recorded development eligibility set.

do $checks$
declare
  claim_id uuid;
  edit_id uuid;
  seen integer;
  published_before integer;
begin
  if exists (
    select 1
    from public.facilities as facility
    join public.eligibility_baseline as baseline on baseline.facility_id = facility.id
    where public.nchf_owner_facility_eligible(facility.id) is distinct from baseline.eligible
       or public.nchf_phase5g_facility_is_listed(facility.id) is distinct from baseline.eligible
  ) then
    raise exception 'eligibility results changed';
  end if;
  if (select count(*) from public.eligibility_baseline where eligible) <> 5
     or not public.nchf_owner_facility_eligible('00000000-0000-4000-8000-000000000110')
     or public.nchf_owner_facility_eligible('00000000-0000-4000-8000-000000000201')
     or public.nchf_owner_facility_eligible('00000000-0000-4000-8000-000000000202')
     or public.nchf_owner_facility_eligible('00000000-0000-4000-8000-000000000002')
     or public.nchf_owner_facility_eligible('00000000-0000-4000-8000-000000000102')
     or public.nchf_owner_facility_eligible('00000000-0000-4000-8000-000000000109') then
    raise exception 'rejected facilities did not stay ineligible';
  end if;
  if exists (
    select 1
    from public.privilege_baseline as baseline
    where baseline.allowed is distinct from case baseline.subject
      when 'anon-listed' then has_table_privilege('anon', 'public.wa_dshs_listed_facilities', 'SELECT')
      when 'anon-published-view' then has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
      when 'authenticated-published-view' then has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT')
      when 'anon-claimed-view' then has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT')
      when 'authenticated-claimed-view' then has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', 'SELECT')
      when 'anon-publication-insert' then has_table_privilege('anon', 'public.published_owner_listings', 'INSERT')
      when 'authenticated-publication-insert' then has_table_privilege('authenticated', 'public.published_owner_listings', 'INSERT')
      when 'anon-phase5g' then has_function_privilege('anon', 'public.nchf_phase5g_facility_is_listed(uuid)', 'EXECUTE')
      when 'authenticated-submit-claim' then has_function_privilege('authenticated', 'public.submit_owner_claim(uuid, text)', 'EXECUTE')
    end
  ) then
    raise exception 'view or function privileges changed';
  end if;
  if md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'listed-view')
     or md5(pg_get_viewdef('public.wa_afh_published_owner_content'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'published-view')
     or md5(pg_get_viewdef('public.wa_afh_claimed_owner_content'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'claimed-view') then
    raise exception 'an existing view definition changed';
  end if;
  if not exists (
    select 1
    from pg_depend as dependency
    join pg_rewrite as rewrite on rewrite.oid = dependency.objid
    where dependency.refobjid = 'public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure
      and rewrite.ev_class = 'public.wa_afh_published_owner_content'::regclass
  ) then
    raise exception 'published view no longer depends on the listing function';
  end if;
  if pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
       not like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure)
       not like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_listing_edit(uuid, text, text)'::regprocedure)
       not like '%nchf_owner_facility_eligible%' then
    raise exception 'an eligibility check does not use the seam';
  end if;

  select count(*) into published_before from public.published_owner_listings;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  begin
    perform public.submit_owner_claim('00000000-0000-4000-8000-000000000201', 'evidence notes long enough here');
    raise exception 'oregon facility was accepted';
  exception when others then
    if sqlerrm <> 'facility is not eligible' then
      raise;
    end if;
  end;
  claim_id := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000104',
    'evidence notes long enough here'
  );
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', true);
  if public.admin_approve_owner_claim(claim_id) is not true then
    raise exception 'approved claim was not recorded';
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', true);
  begin
    perform public.submit_listing_edit(
      '00000000-0000-4000-8000-000000000104',
      'description',
      'another owner proposal'
    );
    raise exception 'another owner submitted a proposal';
  exception when others then
    if sqlerrm <> 'approved claim required' then
      raise;
    end if;
  end;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', true);
  claim_id := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000105',
    'administrator evidence notes'
  );
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', true);
  perform public.admin_approve_owner_claim(claim_id);
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', true);
  edit_id := public.submit_listing_edit(
    '00000000-0000-4000-8000-000000000105',
    'description',
    'administrator proposal'
  );
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', true);
  perform public.admin_review_listing_edit(edit_id, 'approved');
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', true);
  begin
    perform public.admin_publish_listing_edit(edit_id);
    raise exception 'self-review publication succeeded';
  exception when others then
    if sqlerrm <> 'self-review is not allowed' then
      raise;
    end if;
  end;
  if (select count(*) from public.published_owner_listings) <> published_before
     or (select count(*) from public.published_owner_listing_events) <> 0 then
    raise exception 'publication security test wrote a publication';
  end if;
  select count(*) into seen from public.listing_edits
  where facility_id = '00000000-0000-4000-8000-000000000104'
    and submitted_by_user_id = '00000000-0000-4000-8000-0000000000b2';
  if seen <> 0 then
    raise exception 'cross-owner proposal was stored';
  end if;
end;
$checks$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', false);
set role authenticated;
create temporary table other_owner_count as
select count(*) as seen
from public.owner_claims
where facility_id = '00000000-0000-4000-8000-000000000104';
reset role;

do $other_owner$
begin
  if (select seen from other_owner_count) <> 0 then
    raise exception 'another owner can see the claim';
  end if;
end;
$other_owner$;

do $rollback_checks$
begin
  if to_regprocedure('public.nchf_owner_facility_eligible(uuid)') is not null then
    raise exception 'eligibility seam remained after rollback';
  end if;
  if exists (
    select 1
    from public.facilities as facility
    join public.eligibility_baseline as baseline on baseline.facility_id = facility.id
    where public.nchf_phase5g_facility_is_listed(facility.id) is distinct from baseline.eligible
  ) then
    raise exception 'rollback changed eligibility';
  end if;
  if pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
       like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure)
       like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_listing_edit(uuid, text, text)'::regprocedure)
       like '%nchf_owner_facility_eligible%' then
    raise exception 'rollback left a function on the seam';
  end if;
  if (select count(*) from public.published_owner_listings) <> 0
     or (select count(*) from public.published_owner_listing_events) <> 0 then
    raise exception 'rollback changed publication records';
  end if;
  if md5(pg_get_viewdef('public.wa_afh_claimed_owner_content'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'claimed-view') then
    raise exception 'rollback changed the claimed view';
  end if;
end;
$rollback_checks$;

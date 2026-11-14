do $refusal$
begin
  if to_regprocedure('public.nchf_owner_facility_eligible(uuid)') is not null then
    raise exception 'refused seam was created';
  end if;
  if pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
       like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure)
       like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_listing_edit(uuid, text, text)'::regprocedure)
       like '%nchf_owner_facility_eligible%' then
    raise exception 'refused seam changed an eligibility function';
  end if;
  if (select count(*) from public.owner_claims) <> 1
     or (select count(*) from public.published_owner_listings) <> 0
     or (select count(*) from public.published_owner_listing_events) <> 0 then
    raise exception 'refused seam changed owner records';
  end if;
  if md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'listed-view')
     or md5(pg_get_viewdef('public.wa_afh_published_owner_content'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'published-view')
     or md5(pg_get_viewdef('public.wa_afh_claimed_owner_content'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'claimed-view') then
    raise exception 'refused seam changed a view';
  end if;
end;
$refusal$;

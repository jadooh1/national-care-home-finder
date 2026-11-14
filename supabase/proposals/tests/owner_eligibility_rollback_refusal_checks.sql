do $rollback_refusal$
begin
  if to_regprocedure('public.nchf_owner_facility_eligible(uuid)') is null then
    raise exception 'refused rollback removed the seam';
  end if;
  if pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
       not like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_owner_claim(uuid, text)'::regprocedure)
       not like '%nchf_owner_facility_eligible%'
     or pg_get_functiondef('public.submit_listing_edit(uuid, text, text)'::regprocedure)
       not like '%nchf_owner_facility_eligible%' then
    raise exception 'refused rollback changed an eligibility function';
  end if;
  if (select count(*) from public.published_owner_listings) <> 0
     or (select count(*) from public.published_owner_listing_events) <> 0 then
    raise exception 'refused rollback changed publication records';
  end if;
  if md5(pg_get_viewdef('public.wa_afh_claimed_owner_content'::regclass, true))
       is distinct from (select definition_hash from public.definition_baseline where object_name = 'claimed-view') then
    raise exception 'refused rollback changed the claimed view';
  end if;
end;
$rollback_refusal$;

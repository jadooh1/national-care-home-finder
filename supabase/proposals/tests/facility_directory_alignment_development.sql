-- Development-only behavior check. The runner rolls this transaction back.
-- It refuses a catalog that already has the production AF baseline.

do $development$
declare
  directory_before integer;
  map_before integer;
  facilities_before integer;
  claims_before integer;
  sample_id uuid;
  directory_during integer;
  updated_rows integer;
begin
  if (select count(*) from public.facilities where facility_type = 'AF') >= 8000 then
    raise exception 'facility alignment development test refuses a production-shaped catalog';
  end if;

  select count(*) into directory_before from public.wa_dshs_listed_facilities;
  select count(*) into map_before from public.wa_afh_map_facilities;
  select count(*) into facilities_before from public.facilities;
  select count(*) into claims_before from public.owner_claims;
  select listed.id into sample_id from public.wa_dshs_listed_facilities as listed limit 1;
  if sample_id is null then
    raise exception 'development directory is empty';
  end if;

  update public.facilities set facility_type = 'AF' where id = sample_id;
  select count(*) into directory_during from public.wa_dshs_listed_facilities;
  if directory_during <> directory_before - 1 then
    raise exception 'changing AFH to AF did not leave the development directory';
  end if;
  if (select count(*) from public.wa_afh_map_facilities) <> map_before - 1 then
    raise exception 'changing AFH to AF did not leave the development map';
  end if;
  update public.facilities set facility_type = 'AFH' where id = sample_id;

  update public.facilities as facility
  set source_name = 'wa_dshs_afh',
      license_category = 'afh',
      normalized_license_number = btrim(facility.license_number),
      record_status = 'source_matched'
  where facility.facility_type = 'AF'
    and facility.record_status = 'unverified'
    and exists (
      select 1 from public.wa_dshs_listed_facilities as listed where listed.id = facility.id
    );
  get diagnostics updated_rows = row_count;
  if updated_rows <> 0 then
    raise exception 'development alignment update matched a directory row';
  end if;

  set local role anon;
  begin
    update public.facilities set canonical_name = canonical_name where id = sample_id;
    raise exception 'anonymous facility update was accepted';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm not like '%row-level security%' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
  begin
    perform public.submit_owner_claim(sample_id, 'evidence notes that are long enough');
    raise exception 'anonymous owner claim was accepted';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm <> 'authentication required' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
  reset role;

  if (select count(*) from public.wa_dshs_listed_facilities) <> directory_before
     or (select count(*) from public.wa_afh_map_facilities) <> map_before
     or (select count(*) from public.facilities) <> facilities_before
     or (select count(*) from public.owner_claims) <> claims_before
     or (select facility_type from public.facilities where id = sample_id) <> 'AFH' then
    raise exception 'development catalog changed during the alignment test';
  end if;
end;
$development$;

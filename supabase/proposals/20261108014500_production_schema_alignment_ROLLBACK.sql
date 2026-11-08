-- Rollback for the production schema-alignment proposal. Do not apply it.
-- Drops only the schema objects that proposal added. It does not delete facility rows.
-- Required session settings, which this file does not set:
--   nchf.production_schema_alignment_authorization = authorize-production-schema-alignment
--   nchf.production_schema_alignment_target = yiehgstweswxjakbcdzc

do $rollback$
declare
  saved_expr text;
  facility_count integer;
  claim_count integer;
  edit_count integer;
  admin_count integer;
  created_events boolean;
  created_directory boolean;
  created_map boolean;
  added_source_name boolean;
  added_license_category boolean;
  added_facility_type boolean;
  added_normalized_license boolean;
  added_claim_reviewed_at boolean;
  added_edit_created_at boolean;
  added_edit_reviewed_at boolean;
  directory_viewdef text;
  map_viewdef text;
  directory_options text;
  map_options text;
begin
  if pg_catalog.current_setting('nchf.production_schema_alignment_authorization', true)
     is distinct from 'authorize-production-schema-alignment' then
    raise exception 'production schema alignment authorization is missing';
  end if;
  if pg_catalog.current_setting('nchf.production_schema_alignment_target', true)
     is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'production schema alignment target is not the reviewed production project';
  end if;
  if to_regclass('public.nchf_production_schema_alignment_audit') is null then
    raise exception 'production alignment audit is missing';
  end if;

  lock table public.facilities, public.owner_claims, public.listing_edits, public.app_admins
    in share row exclusive mode;

  select audit.verified_policy_expression, audit.facility_count, audit.claim_count,
         audit.edit_count, audit.admin_count, audit.created_owner_claim_events,
         audit.created_directory, audit.created_map,
         audit.added_source_name, audit.added_license_category, audit.added_facility_type,
         audit.added_normalized_license, audit.added_claim_reviewed_at,
         audit.added_edit_created_at, audit.added_edit_reviewed_at,
         audit.directory_viewdef, audit.map_viewdef, audit.directory_options, audit.map_options
    into saved_expr, facility_count, claim_count, edit_count, admin_count, created_events,
         created_directory, created_map,
         added_source_name, added_license_category, added_facility_type,
         added_normalized_license, added_claim_reviewed_at,
         added_edit_created_at, added_edit_reviewed_at,
         directory_viewdef, map_viewdef, directory_options, map_options
  from public.nchf_production_schema_alignment_audit as audit
  where audit.alignment_name = '20261108014500';
  if saved_expr is null
     or position('verified' in saved_expr) = 0
     or position('absent' in saved_expr) > 0
     or position('source_matched' in saved_expr) > 0
     or facility_count <> 8121
     or claim_count <> 0
     or edit_count <> 0
     or admin_count <> 1 then
    raise exception 'production alignment audit does not match the reviewed baseline';
  end if;

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.app_admins) <> 1
     or (select count(*) filter (where record_status = 'verified') from public.facilities) <> 0
     or (select count(*) filter (where record_status = 'source_matched') from public.facilities) <> 0
     or exists (select 1 from public.facilities where presence is not null) then
    raise exception 'refusing rollback because production rows changed after alignment';
  end if;
  if to_regclass('public.owner_claim_events') is not null
     and exists (select 1 from public.owner_claim_events) then
    raise exception 'refusing rollback because owner claim history exists';
  end if;

  execute 'alter policy ' || pg_catalog.quote_ident('Public read verified facilities')
    || ' on public.facilities using (' || saved_expr || ')';
  drop policy facilities_public_read_wa_afh_source_matched on public.facilities;
  drop function public.submit_owner_claim(uuid, text);
  if created_directory then
    drop view public.wa_dshs_listed_facilities;
  else
    execute 'create or replace view public.wa_dshs_listed_facilities '
      || case when directory_options = '' then '' else 'with (' || directory_options || ') ' end
      || 'as ' || directory_viewdef;
  end if;
  if created_map then
    drop view public.wa_afh_map_facilities;
  else
    execute 'create or replace view public.wa_afh_map_facilities '
      || case when map_options = '' then '' else 'with (' || map_options || ') ' end
      || 'as ' || map_viewdef;
  end if;
  if created_events then
    drop table public.owner_claim_events;
  end if;
  if added_claim_reviewed_at then
    alter table public.owner_claims drop column reviewed_at;
  end if;
  if added_edit_created_at then
    alter table public.listing_edits drop column created_at;
  end if;
  if added_edit_reviewed_at then
    alter table public.listing_edits drop column reviewed_at;
  end if;
  alter table public.facilities drop column presence;
  if added_source_name then
    alter table public.facilities drop column source_name;
  end if;
  if added_license_category then
    alter table public.facilities drop column license_category;
  end if;
  if added_facility_type then
    alter table public.facilities drop column facility_type;
  end if;
  if added_normalized_license then
    alter table public.facilities drop column normalized_license_number;
  end if;
  drop table public.nchf_production_schema_alignment_audit;

  if (select count(*) from public.facilities) <> 8121
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'facilities' and column_name = 'presence'
     )
     or to_regprocedure('public.submit_owner_claim(uuid, text)') is not null
     or (created_directory and to_regclass('public.wa_dshs_listed_facilities') is not null)
     or (created_map and to_regclass('public.wa_afh_map_facilities') is not null)
     or (not created_directory and to_regclass('public.wa_dshs_listed_facilities') is null)
     or (not created_map and to_regclass('public.wa_afh_map_facilities') is null) then
    raise exception 'rollback did not restore the reviewed schema baseline';
  end if;
end;
$rollback$;

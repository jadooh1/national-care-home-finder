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
         audit.edit_count, audit.admin_count, audit.created_owner_claim_events
    into saved_expr, facility_count, claim_count, edit_count, admin_count, created_events
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
  drop view public.wa_dshs_listed_facilities;
  drop view public.wa_afh_map_facilities;
  if created_events then
    drop table public.owner_claim_events;
  end if;
  alter table public.facilities drop column presence;
  drop table public.nchf_production_schema_alignment_audit;

  if (select count(*) from public.facilities) <> 8121
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'facilities' and column_name = 'presence'
     )
     or to_regprocedure('public.submit_owner_claim(uuid, text)') is not null then
    raise exception 'rollback did not restore the reviewed schema baseline';
  end if;
end;
$rollback$;

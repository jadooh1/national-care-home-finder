-- Read-only comparison queries. Do not run this file from an agent session.
-- It cannot change rows: the transaction is read only.

begin read only;

select count(*) as facility_count,
       count(*) filter (where record_status = 'verified') as verified_count,
       count(*) filter (where record_status = 'source_matched') as source_matched_count
from public.facilities;

select count(*) as claim_count from public.owner_claims;
select count(*) as edit_count from public.listing_edits;
select count(*) as admin_count from public.app_admins;

select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'facilities' and column_name = 'presence'
) as presence_column;

select to_regprocedure('public.submit_owner_claim(uuid, text)') as submit_owner_claim;

select policy.polname, policy.polcmd, pg_catalog.pg_get_expr(policy.polqual, policy.polrelid) as predicate
from pg_policy as policy
where policy.polrelid = 'public.facilities'::regclass
order by policy.polname;

select to_regclass('public.wa_dshs_listed_facilities') as directory_view,
       to_regclass('public.wa_afh_map_facilities') as map_view;

rollback;

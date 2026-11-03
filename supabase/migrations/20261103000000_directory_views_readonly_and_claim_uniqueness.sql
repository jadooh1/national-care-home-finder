-- Records security changes already applied to national-care-home-finder-dev.
-- This file documents that existing state. It does not introduce a new
-- development change and must not be treated as a production deployment.
--
-- Applied state:
-- 1. wa_dshs_listed_facilities and wa_afh_map_facilities are read-only
--    for anon and authenticated. SELECT remains granted.
-- 2. owner_claims has one pending or approved claim per facility and user.
--
-- Other directory views and column-level restrictions on public.facilities
-- are intentionally absent. security_invoker views depend on the underlying
-- table privileges and will be designed separately.

revoke insert, update, delete, truncate, references, trigger
  on table public.wa_dshs_listed_facilities,
           public.wa_afh_map_facilities
  from anon, authenticated;

grant select
  on table public.wa_dshs_listed_facilities,
           public.wa_afh_map_facilities
  to anon, authenticated;

create unique index if not exists owner_claims_one_active_claim_per_user_facility
  on public.owner_claims (facility_id, claimant_user_id)
  where verification_status in ('pending', 'approved');

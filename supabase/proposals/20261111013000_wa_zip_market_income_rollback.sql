-- Read-only rollback for the Washington ZIP market proposal.
-- Run it only on development project ajjsyloyihcqdomywhik, and only to undo
-- 20261111013000_wa_zip_market_income.sql. It does not change facility rows.

drop view if exists public.wa_zip_market_income;
drop table if exists public.wa_zip_market_census_staging;

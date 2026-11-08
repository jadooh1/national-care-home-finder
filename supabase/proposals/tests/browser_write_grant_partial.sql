begin;
\ir browser_write_grant_fixture.sql
select set_config('nchf.browser_write_remediation_authorization', 'authorize-browser-write-remediation', true);
select set_config('nchf.browser_write_remediation_target', 'yiehgstweswxjakbcdzc', true);
revoke maintain on table public.facilities from anon;
\ir ../20261108024500_browser_write_grant_remediation.sql

begin;
\ir browser_write_grant_fixture.sql
select set_config('nchf.browser_write_remediation_authorization', 'authorize-browser-write-remediation', true);
select set_config('nchf.browser_write_remediation_target', 'yiehgstweswxjakbcdzc', true);
delete from public.facilities where id in (select id from public.facilities limit 1);
\ir ../20261108024500_browser_write_grant_remediation.sql

-- Not authorized for execution.
-- A human sets both session settings before entering this transaction.
-- This file checks them and does not set them.
-- Supabase SQL editor does not support \ir. Paste the remediation body
-- inside one transaction after the settings are present.

begin;

do $guard$
begin
  if pg_catalog.current_setting('nchf.browser_write_remediation_authorization', true)
     is distinct from 'authorize-browser-write-remediation' then
    raise exception 'browser write remediation authorization is missing';
  end if;
  if pg_catalog.current_setting('nchf.browser_write_remediation_target', true)
     is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'browser write remediation target is not the reviewed production project';
  end if;
end;
$guard$;

\ir 20261108024500_browser_write_grant_remediation.sql

commit;

-- Development and production execution are not authorized.
-- This wrapper does not set the authorization settings and does not connect anywhere.
-- A later human session must supply both settings before pasting the migration
-- into the same transaction. The Supabase SQL editor does not support \ir.
-- The authorization value is authorize-production-schema-alignment.
-- The target value is yiehgstweswxjakbcdzc.

begin;

do $guard$
begin
  if pg_catalog.current_setting('nchf.production_schema_alignment_authorization', true)
     is distinct from 'authorize-production-schema-alignment' then
    raise exception 'production schema alignment authorization is missing';
  end if;
  if pg_catalog.current_setting('nchf.production_schema_alignment_target', true)
     is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'production schema alignment target is not the reviewed production project';
  end if;
end;
$guard$;

\ir ../migrations/20261108014500_production_schema_alignment.sql

commit;

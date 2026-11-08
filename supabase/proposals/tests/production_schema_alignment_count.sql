begin;
\ir production_schema_alignment_fixture.sql
select set_config('nchf.production_schema_alignment_authorization', 'authorize-production-schema-alignment', true);
select set_config('nchf.production_schema_alignment_target', 'yiehgstweswxjakbcdzc', true);
delete from public.facilities where id in (select id from public.facilities limit 1);
\ir ../../migrations/20261108014500_production_schema_alignment.sql

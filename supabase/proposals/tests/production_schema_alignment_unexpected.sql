begin;
\ir production_schema_alignment_fixture.sql
select set_config('nchf.production_schema_alignment_authorization', 'authorize-production-schema-alignment', true);
select set_config('nchf.production_schema_alignment_target', 'yiehgstweswxjakbcdzc', true);
create policy "Unexpected public facility read"
  on public.facilities
  for select
  to anon
  using (true);
\ir ../../migrations/20261108014500_production_schema_alignment.sql

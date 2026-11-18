-- Record the pre-seam development eligibility set. Not a migration.

insert into public.facilities (
  id, canonical_name, facility_type, address_line1, city, county, state_code,
  postal_code, latitude, longitude, license_number, licensed_capacity, record_status,
  normalized_license_number, license_category, source_name, source_hash, public_phone
) values
  ('00000000-0000-4000-8000-000000000110', 'Another Listed Home', 'AFH', '10 Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100110', 6, 'source_matched', '100110', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0110'),
  ('00000000-0000-4000-8000-000000000201', 'Oregon Home', 'AFH', '11 Street', 'Portland', 'Multnomah', 'OR', '97201', 45.5, -122.6, '200001', 5, 'source_matched', '200001', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0201'),
  ('00000000-0000-4000-8000-000000000202', 'Production Type Home', 'AF', '12 Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100202', 6, 'source_matched', '100202', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0202');

create table public.eligibility_baseline (
  facility_id uuid primary key,
  eligible boolean not null
);

insert into public.eligibility_baseline (facility_id, eligible)
select facility.id, public.nchf_phase5g_facility_is_listed(facility.id)
from public.facilities as facility;

create table public.privilege_baseline (
  subject text primary key,
  allowed boolean not null
);

insert into public.privilege_baseline (subject, allowed) values
  ('anon-listed', has_table_privilege('anon', 'public.wa_dshs_listed_facilities', 'SELECT')),
  ('anon-published-view', has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')),
  ('authenticated-published-view', has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT')),
  ('anon-claimed-view', has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT')),
  ('authenticated-claimed-view', has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', 'SELECT')),
  ('anon-publication-insert', has_table_privilege('anon', 'public.published_owner_listings', 'INSERT')),
  ('authenticated-publication-insert', has_table_privilege('authenticated', 'public.published_owner_listings', 'INSERT')),
  ('anon-phase5g', has_function_privilege('anon', 'public.nchf_phase5g_facility_is_listed(uuid)', 'EXECUTE')),
  ('authenticated-submit-claim', has_function_privilege('authenticated', 'public.submit_owner_claim(uuid, text)', 'EXECUTE'));

create table public.definition_baseline (
  object_name text primary key,
  definition_hash text not null
);

insert into public.definition_baseline (object_name, definition_hash) values
  ('listed-view', md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))),
  ('published-view', md5(pg_get_viewdef('public.wa_afh_published_owner_content'::regclass, true))),
  ('claimed-view', md5(pg_get_viewdef('public.wa_afh_claimed_owner_content'::regclass, true)));

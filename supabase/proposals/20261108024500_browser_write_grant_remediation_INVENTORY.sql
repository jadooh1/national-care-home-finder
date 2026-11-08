-- Read-only inventory. It does not change privileges or rows.
begin read only;

select relation.relname,
       roles.rolname,
       acl.privilege_type
from pg_catalog.pg_class as relation
cross join lateral pg_catalog.aclexplode(relation.relacl) as acl
join pg_catalog.pg_roles as roles on roles.oid = acl.grantee
where relation.oid = any (array[
  'public.facilities'::regclass,
  'public.owner_claims'::regclass,
  'public.listing_edits'::regclass
])
and roles.rolname in ('anon', 'authenticated')
order by relation.relname, roles.rolname, acl.privilege_type;

select relation.relname,
       relation.relrowsecurity,
       relation.relforcerowsecurity
from pg_catalog.pg_class as relation
where relation.oid = any (array[
  'public.facilities'::regclass,
  'public.owner_claims'::regclass,
  'public.listing_edits'::regclass
]);

select policy.polrelid::regclass as relation_name,
       policy.polname,
       policy.polcmd
from pg_catalog.pg_policy as policy
where policy.polrelid = any (array[
  'public.facilities'::regclass,
  'public.owner_claims'::regclass,
  'public.listing_edits'::regclass
])
order by relation_name, policy.polname;

rollback;

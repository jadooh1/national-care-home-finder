-- Private visitor feedback for development review. This file is not a migration.
-- It stores whether a visitor found a public Washington page and an optional
-- comment. It does not store a name, contact address, health detail, or official record.
-- Apply only after setting nchf.billing_environment to development.

do $preflight$
begin
  if current_setting('nchf.billing_environment', true) is distinct from 'development' then
    raise exception 'visitor feedback requires nchf.billing_environment=development';
  end if;
  if current_setting('nchf.supabase_project_ref', true) = 'yiehgstweswxjakbcdzc' then
    raise exception 'refusing the production project';
  end if;
  if to_regclass('public.app_admins') is null then
    raise exception 'visitor feedback requires administrator membership';
  end if;
end;
$preflight$;

create table public.development_visitor_feedback (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  found boolean not null,
  comment text,
  language text not null,
  page_path text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint development_visitor_feedback_language_check check (language in ('en', 'es')),
  constraint development_visitor_feedback_comment_check check (comment is null or pg_catalog.char_length(comment) between 1 and 500),
  constraint development_visitor_feedback_path_check check (page_path ~ '^/washington(/[0-9]{1,20})?$')
);

alter table public.development_visitor_feedback enable row level security;

revoke all on table public.development_visitor_feedback from public, anon, authenticated;

create function public.submit_visitor_feedback(
  p_found boolean,
  p_comment text,
  p_language text,
  p_page_path text,
  p_company text,
  p_elapsed_ms integer
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_comment text;
  v_path text;
  v_id uuid;
begin
  if p_company is not null and pg_catalog.btrim(p_company) <> '' then
    raise exception 'feedback was rejected';
  end if;
  if p_elapsed_ms is null or p_elapsed_ms < 3000 or p_elapsed_ms > 1800000 then
    raise exception 'feedback was rejected';
  end if;
  if p_language not in ('en', 'es') or p_found is null then
    raise exception 'feedback was rejected';
  end if;
  v_path := split_part(split_part(coalesce(p_page_path, ''), '?', 1), '#', 1);
  if v_path !~ '^/washington(/[0-9]{1,20})?$' then
    raise exception 'feedback was rejected';
  end if;
  v_comment := nullif(pg_catalog.regexp_replace(coalesce(p_comment, ''), '\s+', ' ', 'g'), '');
  if v_comment is not null then
    v_comment := pg_catalog.btrim(v_comment);
  end if;
  if v_comment = '' then
    v_comment := null;
  end if;
  if v_comment is not null and pg_catalog.char_length(v_comment) > 500 then
    raise exception 'feedback comment is too long';
  end if;
  if v_comment is not null and v_comment ~* '\m(diagnos(is|ed)|dementia|alzheimer|medication|medications|hipaa|medical record|diagnostico|diagnóstico|demencia|medicamento|historial medico|historial médico)\M' then
    raise exception 'feedback cannot include resident health information';
  end if;
  if exists (
    select 1
    from public.development_visitor_feedback as prior
    where prior.page_path = v_path
      and prior.language = p_language
      and prior.found = p_found
      and prior.comment is not distinct from v_comment
      and prior.created_at > pg_catalog.clock_timestamp() - interval '2 minutes'
  ) then
    raise exception 'feedback was rejected';
  end if;
  insert into public.development_visitor_feedback (found, comment, language, page_path)
  values (p_found, v_comment, p_language, v_path)
  returning id into v_id;
  return v_id;
end;
$fn$;

create function public.admin_list_visitor_feedback(p_limit integer)
returns table (
  id uuid,
  found boolean,
  comment text,
  language text,
  page_path text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid;
  v_limit integer;
begin
  v_actor := auth.uid();
  if v_actor is null or not exists (
    select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
  ) then
    raise exception 'administrator required';
  end if;
  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  return query
  select feedback.id, feedback.found, feedback.comment, feedback.language, feedback.page_path, feedback.created_at
  from public.development_visitor_feedback as feedback
  order by feedback.created_at desc, feedback.id desc
  limit v_limit;
end;
$fn$;

revoke all on function public.submit_visitor_feedback(boolean, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.admin_list_visitor_feedback(integer) from public, anon, authenticated;
grant execute on function public.submit_visitor_feedback(boolean, text, text, text, text, integer) to anon, authenticated;
grant execute on function public.admin_list_visitor_feedback(integer) to authenticated;

do $guard$
begin
  if has_table_privilege('anon', 'public.development_visitor_feedback', 'SELECT')
     or has_table_privilege('authenticated', 'public.development_visitor_feedback', 'SELECT')
     or has_table_privilege('anon', 'public.development_visitor_feedback', 'INSERT') then
    raise exception 'visitor feedback is readable by a browser role';
  end if;
  if has_function_privilege('anon', 'public.admin_list_visitor_feedback(integer)', 'EXECUTE') then
    raise exception 'anonymous review of visitor feedback is allowed';
  end if;
end;
$guard$;

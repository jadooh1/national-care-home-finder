-- Replace the production owner-claim review functions with the guarded versions.
-- This does not change facilities, directory membership, or eligibility predicates.
-- A human sets both settings in the same transaction before running it:
--   nchf.claim_review_guard_authorization = authorize-claim-review-guard
--   nchf.claim_review_guard_target = yiehgstweswxjakbcdzc

do $proposal$
declare
  approve_body text;
  reject_body text;
begin
  if current_setting('nchf.claim_review_guard_authorization', true) is distinct from 'authorize-claim-review-guard'
     or current_setting('nchf.claim_review_guard_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'claim review guard target is not the reviewed production project';
  end if;

  if to_regprocedure('public.admin_approve_owner_claim(uuid)') is null
     or to_regprocedure('public.admin_reject_owner_claim(uuid)') is null
     or to_regclass('public.owner_claim_events') is null then
    raise exception 'claim review guard requires the reviewed owner functions';
  end if;

  approve_body := pg_get_functiondef('public.admin_approve_owner_claim(uuid)'::regprocedure);
  reject_body := pg_get_functiondef('public.admin_reject_owner_claim(uuid)'::regprocedure);

  if position('another approved claim exists for this facility' in approve_body) > 0
     and position('owner_claim_events' in approve_body) > 0
     and position('self-review is not allowed' in reject_body) > 0
     and position('owner_claim_events' in reject_body) > 0
     and to_regclass('public.owner_claims_one_approved_claim_per_facility') is not null then
    return;
  end if;

  if exists (
    select 1
    from public.owner_claims as claim
    where claim.verification_status = 'approved'
    group by claim.facility_id
    having count(*) > 1
  ) then
    raise exception 'more than one approved claim exists for a facility';
  end if;

  if position('Self-approval is not permitted' in approve_body) = 0
     or position('Pending claim not found or self-review prohibited' in reject_body) = 0
     or position('owner_claim_events' in approve_body) > 0
     or position('another approved claim exists for this facility' in approve_body) > 0 then
    raise exception 'owner claim review functions are not the reviewed production baseline';
  end if;

  create or replace function public.admin_approve_owner_claim(p_claim_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = ''
  as $fn$
  declare
    v_actor uuid;
    v_facility uuid;
    v_claimant uuid;
    v_status text;
  begin
    v_actor := auth.uid();
    if v_actor is null or not exists (
      select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
    ) then
      raise exception 'administrator required';
    end if;
    select claim.facility_id, claim.claimant_user_id, claim.verification_status
      into v_facility, v_claimant, v_status
    from public.owner_claims as claim
    where claim.id = p_claim_id;
    if not found then
      raise exception 'claim was not found';
    end if;
    if v_claimant = v_actor then
      raise exception 'self-review is not allowed';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_facility::text, 0));
    perform 1
    from public.owner_claims as claim
    where claim.facility_id = v_facility
    for update;
    select claim.verification_status
      into v_status
    from public.owner_claims as claim
    where claim.id = p_claim_id;
    if v_status is distinct from 'pending' then
      raise exception 'claim is not pending';
    end if;
    if exists (
      select 1
      from public.owner_claims as claim
      where claim.facility_id = v_facility
        and claim.verification_status = 'approved'
        and claim.id is distinct from p_claim_id
    ) then
      raise exception 'another approved claim exists for this facility';
    end if;
    update public.owner_claims
    set verification_status = 'approved',
        reviewed_at = pg_catalog.clock_timestamp()
    where id = p_claim_id;
    insert into public.owner_claim_events (
      claim_id, facility_id, actor_user_id, event_type, from_status, to_status
    ) values (
      p_claim_id, v_facility, v_actor, 'approved', 'pending', 'approved'
    );
    return true;
  end;
  $fn$;

  create or replace function public.admin_reject_owner_claim(p_claim_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = ''
  as $fn$
  declare
    v_actor uuid;
    v_facility uuid;
    v_claimant uuid;
    v_status text;
  begin
    v_actor := auth.uid();
    if v_actor is null or not exists (
      select 1 from public.app_admins as admin_row where admin_row.user_id = v_actor
    ) then
      raise exception 'administrator required';
    end if;
    select claim.facility_id, claim.claimant_user_id, claim.verification_status
      into v_facility, v_claimant, v_status
    from public.owner_claims as claim
    where claim.id = p_claim_id
    for update;
    if not found then
      raise exception 'claim was not found';
    end if;
    if v_claimant = v_actor then
      raise exception 'self-review is not allowed';
    end if;
    if v_status is distinct from 'pending' then
      raise exception 'claim is not pending';
    end if;
    update public.owner_claims
    set verification_status = 'rejected',
        reviewed_at = pg_catalog.clock_timestamp()
    where id = p_claim_id;
    insert into public.owner_claim_events (
      claim_id, facility_id, actor_user_id, event_type, from_status, to_status
    ) values (
      p_claim_id, v_facility, v_actor, 'rejected', 'pending', 'rejected'
    );
    return true;
  end;
  $fn$;

  approve_body := pg_get_functiondef('public.admin_approve_owner_claim(uuid)'::regprocedure);
  reject_body := pg_get_functiondef('public.admin_reject_owner_claim(uuid)'::regprocedure);
  if to_regclass('public.owner_claims_one_approved_claim_per_facility') is null then
    create unique index owner_claims_one_approved_claim_per_facility
      on public.owner_claims (facility_id)
      where verification_status = 'approved';
  end if;

  if position('another approved claim exists for this facility' in approve_body) = 0
     or position('owner_claim_events' in approve_body) = 0
     or position('self-review is not allowed' in reject_body) = 0
     or position('owner_claim_events' in reject_body) = 0
     or to_regclass('public.owner_claims_one_approved_claim_per_facility') is null then
    raise exception 'claim review guard did not install the reviewed functions';
  end if;
end;
$proposal$;

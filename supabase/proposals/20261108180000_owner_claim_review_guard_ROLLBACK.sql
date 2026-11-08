-- Restore the owner-claim review functions observed on production before this proposal.
-- Requires the same two settings as the forward proposal. Does not delete claims or events.

do $rollback$
declare
  approve_body text;
  reject_body text;
begin
  if current_setting('nchf.claim_review_guard_authorization', true) is distinct from 'authorize-claim-review-guard'
     or current_setting('nchf.claim_review_guard_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'claim review guard target is not the reviewed production project';
  end if;

  approve_body := pg_get_functiondef('public.admin_approve_owner_claim(uuid)'::regprocedure);
  reject_body := pg_get_functiondef('public.admin_reject_owner_claim(uuid)'::regprocedure);
  if position('another approved claim exists for this facility' in approve_body) = 0
     or position('owner_claim_events' in reject_body) = 0 then
    raise exception 'claim review guard is absent';
  end if;

  create or replace function public.admin_approve_owner_claim(p_claim_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = ''
  as $fn$
  declare
    v_admin_id uuid;
    v_claimant_id uuid;
  begin
    v_admin_id := auth.uid();
    if v_admin_id is null
       or not exists (
         select 1
         from public.app_admins
         where user_id = v_admin_id
       )
    then
      raise exception 'Administrator access required';
    end if;
    select claimant_user_id
    into v_claimant_id
    from public.owner_claims
    where id = p_claim_id
      and verification_status = 'pending'
    for update;
    if not found then
      raise exception 'Pending claim not found';
    end if;
    if v_claimant_id = v_admin_id then
      raise exception 'Self-approval is not permitted';
    end if;
    update public.owner_claims
    set verification_status = 'approved',
        reviewed_at = now()
    where id = p_claim_id
      and verification_status = 'pending';
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
    v_admin_id uuid;
  begin
    v_admin_id := auth.uid();
    if v_admin_id is null
       or not exists (
         select 1
         from public.app_admins
         where user_id = v_admin_id
       )
    then
      raise exception 'Administrator access required';
    end if;
    update public.owner_claims
    set verification_status = 'rejected',
        reviewed_at = now()
    where id = p_claim_id
      and verification_status = 'pending'
      and claimant_user_id <> v_admin_id;
    if not found then
      raise exception 'Pending claim not found or self-review prohibited';
    end if;
    return true;
  end;
  $fn$;

  drop index if exists public.owner_claims_one_approved_claim_per_facility;
end;
$rollback$;

-- Daily Spark allowance, called by app/api/spark/route.ts. Safe to re-run.
-- Free members: 30 outbound Sparks per rolling 24 hours (lib/plusPlans.ts FREE_DAILY_SPARKS shows
-- the same number in the UI). Plus members and women are exempt.
-- "Plus" matches isPlusProfile in lib/plus.ts, so comped Day 1 members are exempt too.
create or replace function public.get_spark_allowance(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_daily_cap constant integer := 30;
  v_gender text;
  v_is_plus boolean;
  v_used integer;
begin
  -- Members may only read their own allowance; service-role calls have no auth.uid().
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select
    lower(trim(coalesce(p.gender, ''))),
    coalesce(p.plus_expires_at > now(), false)
      or coalesce(p.is_plus, false)
      or coalesce(p.is_premium, false)
      or (
        lower(coalesce(p.subscription_status, '')) in ('active', 'trialing')
        and (p.current_period_end is null or p.current_period_end >= now())
      )
  into v_gender, v_is_plus
  from public.profiles p
  where p.id = p_user_id;

  if coalesce(v_is_plus, false) or v_gender = 'female' then
    return jsonb_build_object('allowed', true, 'unlimited', true, 'remaining', 999);
  end if;

  select count(*)::integer
  into v_used
  from public.sparks s
  where s.sender_id = p_user_id
    and s.created_at > now() - interval '24 hours';

  return jsonb_build_object(
    'allowed', v_used < v_daily_cap,
    'unlimited', false,
    'used', v_used,
    'remaining', greatest(v_daily_cap - v_used, 0)
  );
end;
$$;

revoke all on function public.get_spark_allowance(uuid) from public, anon;
grant execute on function public.get_spark_allowance(uuid) to authenticated, service_role;

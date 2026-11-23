-- =====================================================================
-- 20261205_google_play_billing.sql        (meetin.asia)
--
-- Google Play Billing for the Android app (app/api/billing/google-play/verify, lib/billing/googlePlay.ts).
--
--   play_purchases      one row per Google Play purchase token: the member who bought it, the product, the order id,
--                       the state and the paid-until time. The token is the primary key, so a token can belong to one
--                       member only. Server-only: RLS is on and there is no policy, so members cannot read or write it.
--   profiles.boost_credits
--                       Boosts bought and not yet used. Written only by the service role (guard trigger below).
--   grant_boost_credit  adds one Boost credit for a verified purchase, exactly once per token (service role only).
--   expire_google_play_plus
--                       turns Plus off for members whose Google Play subscription ended: a cancelled one at the end of the
--                       paid period, a lapsed one two days after it (the grace for a late renewal check). Members who
--                       still have complimentary Plus (plus_expires_at in the future) or a CCBill subscription keep it.
--                       Scheduled hourly when pg_cron is available. The app re-checks purchases each time it opens, which
--                       renews the paid-until time of a subscription that keeps renewing.
--
-- Safe to re-run.
-- =====================================================================

begin;

alter table public.profiles add column if not exists boost_credits integer not null default 0;

create table if not exists public.play_purchases (
  purchase_token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  kind text not null,
  order_id text,
  state text not null default 'active',
  expires_at timestamptz,
  settled boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint play_purchases_kind_check check (kind in ('subscription', 'consumable'))
);

create index if not exists idx_play_purchases_user on public.play_purchases (user_id);

alter table public.play_purchases enable row level security;
revoke all on table public.play_purchases from anon, authenticated;

-- Members can never change their own Boost balance.
create or replace function public.guard_profile_boost_credits()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;
  if TG_OP = 'INSERT' then
    NEW.boost_credits := 0;
  else
    NEW.boost_credits := OLD.boost_credits;
  end if;
  return NEW;
end;
$$;

revoke all on function public.guard_profile_boost_credits() from public, anon, authenticated;
grant execute on function public.guard_profile_boost_credits() to service_role;

drop trigger if exists trg_guard_profile_boost_credits on public.profiles;
create trigger trg_guard_profile_boost_credits
  before insert or update of boost_credits on public.profiles
  for each row execute function public.guard_profile_boost_credits();

-- One Boost credit per verified token, however many times the app retries.
create or replace function public.grant_boost_credit(p_user uuid, p_token text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  credits integer;
begin
  update public.play_purchases
     set settled = true, updated_at = timezone('utc'::text, now())
   where purchase_token = p_token and user_id = p_user and kind = 'consumable' and not settled;
  if found then
    update public.profiles set boost_credits = boost_credits + 1 where id = p_user;
  end if;
  select boost_credits into credits from public.profiles where id = p_user;
  return coalesce(credits, 0);
end;
$$;

revoke all on function public.grant_boost_credit(uuid, text) from public, anon, authenticated;
grant execute on function public.grant_boost_credit(uuid, text) to service_role;

create or replace function public.expire_google_play_plus()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.profiles p
     set is_plus = false,
         subscription_status = 'expired'
   where p.is_plus
     and p.ccbill_subscription_id is null
     and (p.plus_expires_at is null or p.plus_expires_at < now())
     and p.current_period_end is not null
     and (
       (lower(coalesce(p.subscription_status, '')) = 'active' and p.current_period_end < now() - interval '2 days')
       or (lower(coalesce(p.subscription_status, '')) = 'canceled' and p.current_period_end < now())
     )
     and exists (select 1 from public.play_purchases pp where pp.user_id = p.id and pp.kind = 'subscription');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.expire_google_play_plus() from public, anon, authenticated;
grant execute on function public.expire_google_play_plus() to service_role;

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('ail-expire-google-play-plus')
      where exists (select 1 from cron.job where jobname = 'ail-expire-google-play-plus');
    perform cron.schedule('ail-expire-google-play-plus', '23 * * * *', 'select public.expire_google_play_plus()');
  end if;
exception when others then
  raise notice 'pg_cron schedule skipped: %', sqlerrm;
end
$cron$;

commit;

-- Rollback (manual):
--   select cron.unschedule('ail-expire-google-play-plus');
--   drop function if exists public.expire_google_play_plus();
--   drop function if exists public.grant_boost_credit(uuid, text);
--   drop trigger if exists trg_guard_profile_boost_credits on public.profiles;
--   drop function if exists public.guard_profile_boost_credits();
--   drop table if exists public.play_purchases;
--   alter table public.profiles drop column if exists boost_credits;

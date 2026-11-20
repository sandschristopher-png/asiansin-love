-- =====================================================================
-- 20261130_ccbill_billing.sql        (meetin.asia)
--
-- CCBill subscription lifecycle for Meet in Asia Plus (app/api/webhooks/ccbill, lib/billing/ccbill.ts).
--
--   profiles.ccbill_subscription_id   the member's current CCBill subscription id (nullable). The
--                                     Plus columns themselves (is_plus, subscription_status,
--                                     current_period_end, plus_expires_at) already exist and are
--                                     written only by the service role.
--   ccbill_subscriptions              one row per CCBill subscription: owner, status, period end and
--                                     the time of the last event applied. Event times decide order, so
--                                     a late, older event cannot undo a newer one.
--   ccbill_webhook_events             one row per processed webhook event (dedupe key). A replayed
--                                     event is recognised and skipped. Holds no payment or personal data.
--
-- Both tables are server-only: RLS is on and no policy is created, so members can neither read nor
-- write them. Safe to re-run.
-- =====================================================================

begin;

alter table public.profiles add column if not exists ccbill_subscription_id text;

create table if not exists public.ccbill_subscriptions (
  subscription_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  current_period_end timestamptz,
  last_event_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint ccbill_subscriptions_status_check check (
    status in ('active', 'canceled', 'expired', 'refunded', 'chargeback', 'voided')
  )
);

create index if not exists idx_ccbill_subscriptions_user on public.ccbill_subscriptions (user_id);

create table if not exists public.ccbill_webhook_events (
  event_key text primary key,
  event_type text not null,
  subscription_id text,
  outcome text not null,
  received_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.ccbill_subscriptions enable row level security;
alter table public.ccbill_webhook_events enable row level security;
revoke all on table public.ccbill_subscriptions from anon, authenticated;
revoke all on table public.ccbill_webhook_events from anon, authenticated;

commit;

-- Rollback (manual):
--   drop table if exists public.ccbill_webhook_events;
--   drop table if exists public.ccbill_subscriptions;
--   alter table public.profiles drop column if exists ccbill_subscription_id;

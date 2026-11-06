-- =====================================================================
-- 20261116_push_subscriptions_unique.sql        (asiansin.love)
--
-- Web push subscriptions: one row per browser endpoint. /api/push/subscribe upserts with
-- onConflict 'endpoint', which needs a unique index; re-subscribing the same device (reinstall,
-- key rotation, another member signing in on it) then updates the row instead of duplicating it.
--   1. Drop duplicate endpoints, keeping the most recently updated row.
--   2. Unique index on endpoint.
--   3. Index on user_id for sendPushToUser lookups.
-- Safe to re-run. (push_subscriptions itself predates the migrations folder.)
-- =====================================================================

begin;

do $$
begin
  if to_regclass('public.push_subscriptions') is null then
    raise notice 'public.push_subscriptions not found; nothing to do';
    return;
  end if;

  delete from public.push_subscriptions p
  using public.push_subscriptions q
  where p.endpoint = q.endpoint
    and p.ctid <> q.ctid
    and (coalesce(p.updated_at, 'epoch'::timestamptz), p.ctid) < (coalesce(q.updated_at, 'epoch'::timestamptz), q.ctid);

  execute 'create unique index if not exists push_subscriptions_endpoint_key on public.push_subscriptions (endpoint)';
  execute 'create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id)';
end;
$$;

commit;
-- =====================================================================
-- 20261107_launch_patch.sql        (asiansin.love)
--
-- The live public.moderation_log table has these columns:
--   id, user_id, actor_id, category, action, flagged_text, points_deducted, created_at
-- Older migrations (20261009 / 20261012) wrote trigger_rule / penalty_points, which do not exist
-- live, so admin_confirm_quarantine and admin_release_quarantine failed on insert.
--
-- 1. admin_confirm_quarantine: logs category / action / flagged_text (message snippet + notes) /
--    points_deducted, actor_id = reviewing admin (p_admin_id, else auth.uid()).
-- 2. admin_release_quarantine: same column alignment (also fixed in 20261103 for anyone running
--    the files in order).
-- 3. user_reports.status: makes sure the admin queue's 'resolved' / 'dismissed' values are allowed
--    if a CHECK constraint exists (existing values are kept).
--
-- 4. onboarding_completed is server-only (POST /api/onboarding, behind the VPN / proxy gate);
--    hide_profile (Private Mode) needs AIL+ for men, free for women.
-- 5. Performance indexes for messages, favorites, sparks, profiles and user_highlights.
--
-- Function signatures are unchanged, so grants stay service_role only (re-asserted below).
-- Safe to re-run.
-- =====================================================================

begin;

-- 1. Confirm a quarantined message ----------------------------------------
create or replace function public.admin_confirm_quarantine(
  p_message_id uuid,
  p_admin_id uuid,
  p_additional_penalty int default 0,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg record;
  v_penalty int := greatest(coalesce(p_additional_penalty, 0), 0);
begin
  select id, sender_id, content, is_quarantined
    into v_msg
    from public.messages
   where id = p_message_id;

  if not found then
    raise exception 'Message not found: %', p_message_id;
  end if;

  if v_penalty > 0 then
    update public.profiles
       set reputation_score = greatest(0, coalesce(reputation_score, 100) - v_penalty)
     where id = v_msg.sender_id;
  end if;

  insert into public.moderation_log (user_id, actor_id, category, action, flagged_text, points_deducted)
  values (
    v_msg.sender_id,
    coalesce(p_admin_id, auth.uid()),
    'admin_confirmed_violation',
    'confirm_quarantine',
    left(coalesce(v_msg.content, ''), 250)
      || case when nullif(trim(coalesce(p_notes, '')), '') is not null then ' | note: ' || left(p_notes, 200) else '' end,
    v_penalty
  );

  return jsonb_build_object(
    'success', true,
    'message_id', p_message_id,
    'sender_id', v_msg.sender_id,
    'points_deducted', v_penalty,
    'action', 'confirmed'
  );
end;
$$;

revoke all on function public.admin_confirm_quarantine(uuid, uuid, int, text) from public, anon, authenticated;
grant execute on function public.admin_confirm_quarantine(uuid, uuid, int, text) to service_role;

-- 2. Release a quarantined message ----------------------------------------
create or replace function public.admin_release_quarantine(
  p_message_id uuid,
  p_admin_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg record;
begin
  select id, sender_id, receiver_id, content, is_quarantined
    into v_msg
    from public.messages
   where id = p_message_id;

  if not found then
    raise exception 'Message not found: %', p_message_id;
  end if;

  if not v_msg.is_quarantined then
    return jsonb_build_object('success', false, 'message', 'Message is not quarantined');
  end if;

  -- Transaction-scoped override checked by guard_message_quarantine()
  perform set_config('moderation.allow_quarantine_lift', 'on', true);

  update public.messages set is_quarantined = false where id = p_message_id;

  insert into public.moderation_log (user_id, actor_id, category, action, flagged_text, points_deducted)
  values (
    v_msg.sender_id,
    coalesce(p_admin_id, auth.uid()),
    'admin_release',
    'release_quarantine',
    left(coalesce(v_msg.content, ''), 250)
      || case when nullif(trim(coalesce(p_notes, '')), '') is not null then ' | note: ' || left(p_notes, 200) else '' end,
    0
  );

  return jsonb_build_object(
    'success', true,
    'message_id', p_message_id,
    'sender_id', v_msg.sender_id,
    'receiver_id', v_msg.receiver_id,
    'action', 'released'
  );
end;
$$;

revoke all on function public.admin_release_quarantine(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_release_quarantine(uuid, uuid, text) to service_role;

-- 3. user_reports.status values used by /admin/verifications --------------
do $$
declare
  v_con record;
  v_values text[];
begin
  for v_con in
    select c.conname
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
     where c.conrelid = 'public.user_reports'::regclass
       and c.contype = 'c'
       and a.attname = 'status'
  loop
    execute format('alter table public.user_reports drop constraint %I', v_con.conname);
  end loop;

  -- Keep every value already in the table, plus the ones the app writes.
  select array_agg(distinct v) into v_values
    from (
      select status as v from public.user_reports where status is not null
      union select unnest(array['pending', 'resolved', 'dismissed', 'reviewed'])
    ) s;

  execute format(
    'alter table public.user_reports add constraint user_reports_status_check check (status is null or status = any (%L::text[]))',
    v_values
  );
end;
$$;

-- 4. Member-flag guards ------------------------------------------------
--   onboarding_completed: only POST /api/onboarding (service role, after the VPN / proxy gate)
--     can mark onboarding done.
--   hide_profile (Private Mode): free for women; men need AIL+. Turning it OFF is always allowed.
create or replace function public.guard_profile_member_flags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Trusted contexts: no end-user JWT, or the service role.
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    NEW.onboarding_completed := false;
  elsif NEW.onboarding_completed is distinct from OLD.onboarding_completed then
    NEW.onboarding_completed := OLD.onboarding_completed;
  end if;

  if coalesce(NEW.hide_profile, false)
     and (TG_OP = 'INSERT' or not coalesce(OLD.hide_profile, false))
     and lower(coalesce(NEW.gender, '')) = 'male'
     and not coalesce(NEW.is_plus, false) then
    NEW.hide_profile := case when TG_OP = 'INSERT' then false else OLD.hide_profile end;
  end if;

  return NEW;
end;
$$;

revoke all on function public.guard_profile_member_flags() from public, anon, authenticated;
grant execute on function public.guard_profile_member_flags() to service_role;

drop trigger if exists trg_guard_profile_member_flags on public.profiles;
create trigger trg_guard_profile_member_flags
  before insert or update of onboarding_completed, hide_profile on public.profiles
  for each row execute function public.guard_profile_member_flags();

-- 5. Performance indexes (real table / column names; skipped if a table is missing) ----------
create index if not exists idx_messages_conversation_created on public.messages (conversation_id, created_at desc);
create index if not exists idx_messages_pair_created on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists idx_messages_receiver_created on public.messages (receiver_id, created_at desc);
create index if not exists idx_favorites_user_target on public.favorites (user_id, favorite_profile_id);
create index if not exists idx_sparks_sender on public.sparks (sender_id, created_at desc);
create index if not exists idx_sparks_receiver on public.sparks (receiver_id, created_at desc);
create index if not exists idx_profiles_last_active on public.profiles (last_active_at desc);
create index if not exists idx_profiles_created on public.profiles (created_at desc);

do $$
begin
  -- Profile Highlights live in user_highlights (not profile_highlights).
  if to_regclass('public.user_highlights') is not null then
    execute 'create index if not exists idx_user_highlights_user on public.user_highlights (user_id)';
  end if;
end;
$$;

commit;

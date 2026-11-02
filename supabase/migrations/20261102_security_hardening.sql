-- =====================================================================
-- 20261102_security_hardening.sql        (asiansin.love)
--
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: every statement is idempotent.
--
-- What this fixes
--   1. Members could edit their own is_admin / is_plus / is_verified /
--      reputation / avatar_status etc. straight from the browser.
--   2. Ages could be set below 18 (or disagree with birthdate) by calling
--      the API directly.
--   3. Moderation + admin RPCs were executable by anyone holding the
--      public anon key (Postgres grants EXECUTE to PUBLIC by default).
--   4. Members could INSERT messages directly, bypassing the moderation
--      engine, contact-sharing gate and daily quota in /api/messages.
--   5. Quarantined (shadow-banned) messages were still delivered to the
--      recipient over Realtime, because the SELECT policy allowed them.
--   6. profiles were readable by logged-out visitors holding the anon key.
--   7. The `verifications` storage bucket is forced private.
--
-- Rollback notes are at the bottom of this file.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Protected profile columns (server-only writes)
-- ---------------------------------------------------------------------
-- Browser sessions (auth.uid() is set, role = authenticated) can never
-- change these columns. The service role (API routes / webhooks), the SQL
-- editor and SECURITY DEFINER jobs without a user JWT are unaffected.
--
-- The function is written with jsonb so it keeps working if an optional
-- column (plus_enabled, membership_tier, ...) does not exist yet.

create or replace function public.guard_profile_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  protected_cols text[] := array[
    'is_admin','is_plus','plus_enabled','membership_tier',
    'is_verified','verification_status','verified_at',
    'avatar_status','avatar_approved_at',
    'reputation_score','reputation_tier',
    'travel_city','travel_country',
    'location_verified_at'
  ];
  fallback_defaults jsonb := jsonb_build_object(
    'is_admin', false, 'is_plus', false, 'plus_enabled', false,
    'is_verified', false, 'reputation_score', 100, 'reputation_tier', 'Standard'
  );
  new_j jsonb := to_jsonb(NEW);
  old_j jsonb;
  col text;
  expr text;
  val jsonb;
begin
  -- Trusted contexts: no end-user JWT, or the service role.
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    old_j := to_jsonb(OLD);
    foreach col in array protected_cols loop
      if new_j ? col then
        new_j := jsonb_set(new_j, array[col], coalesce(old_j -> col, 'null'::jsonb));
      end if;
    end loop;

    -- 'gps_verified' can only be granted by the server.
    if new_j ? 'location_source'
       and new_j ->> 'location_source' = 'gps_verified'
       and (old_j ->> 'location_source') is distinct from 'gps_verified' then
      new_j := jsonb_set(new_j, '{location_source}',
                         coalesce(old_j -> 'location_source', '"self_reported"'::jsonb));
    end if;
  else
    -- INSERT by a member: protected columns start from their safe defaults.
    foreach col in array protected_cols loop
      if new_j ? col then
        select pg_get_expr(d.adbin, d.adrelid) into expr
          from pg_attrdef d
          join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
         where d.adrelid = 'public.profiles'::regclass and a.attname = col;
        if expr is not null then
          execute format('select to_jsonb(%s)', expr) into val;
        else
          val := coalesce(fallback_defaults -> col, 'null'::jsonb);
        end if;
        new_j := jsonb_set(new_j, array[col], coalesce(val, 'null'::jsonb));
      end if;
    end loop;

    if new_j ? 'location_source' and new_j ->> 'location_source' = 'gps_verified' then
      new_j := jsonb_set(new_j, '{location_source}', '"self_reported"'::jsonb);
    end if;
  end if;

  NEW := jsonb_populate_record(NEW, new_j);
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_protected on public.profiles;
create trigger trg_guard_profile_protected
  before insert or update on public.profiles
  for each row execute function public.guard_profile_protected_columns();

-- ---------------------------------------------------------------------
-- 2. Age enforcement (18+), computed from birthdate when present
-- ---------------------------------------------------------------------
create or replace function public.guard_profile_age()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  computed int;
begin
  if NEW.birthdate is not null then
    computed := date_part('year', age(current_date, NEW.birthdate::date))::int;
    if computed < 18 then
      raise exception 'You must be at least 18 years old to use this service.'
        using errcode = 'check_violation';
    end if;
    NEW.age := computed;               -- age always follows birthdate
  elsif NEW.age is not null and NEW.age < 18 then
    raise exception 'You must be at least 18 years old to use this service.'
      using errcode = 'check_violation';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_age on public.profiles;
create trigger trg_guard_profile_age
  before insert or update on public.profiles
  for each row execute function public.guard_profile_age();

-- ---------------------------------------------------------------------
-- 3. Moderation RPC compatibility (only created if missing)
-- ---------------------------------------------------------------------
-- /api/messages calls apply_moderation_penalty with the named arguments
-- p_user_id, p_deduction, p_action, p_category, p_flagged, but the earlier
-- migration defines a different signature. If your database already has the
-- 5-argument version this block does nothing.
do $$
begin
  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'apply_moderation_penalty'
       and p.proargnames @> array['p_deduction','p_action','p_category','p_flagged']
  ) then
    create function public.apply_moderation_penalty(
      p_user_id   uuid,
      p_deduction int,
      p_action    text default null,
      p_category  text default null,
      p_flagged   text default null
    )
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      insert into public.moderation_log (user_id, trigger_rule, flagged_text, penalty_points, actor_id)
      values (
        p_user_id,
        coalesce(nullif(p_category, ''), p_action, 'moderation'),
        p_flagged,
        greatest(coalesce(p_deduction, 0), 0),
        null
      );

      update public.profiles
         set reputation_score = greatest(0, coalesce(reputation_score, 100) - greatest(coalesce(p_deduction, 0), 0))
       where id = p_user_id;
    end;
    $fn$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Lock server-only functions down to the service role
-- ---------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'apply_moderation_penalty',
         'admin_release_quarantine',
         'admin_confirm_quarantine',
         'apply_date_review',
         'guard_message_quarantine',
         'guard_profile_protected_columns',
         'guard_profile_age'
       )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Messages: send only through /api/messages, hide quarantined rows
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'messages' and column_name = 'receiver_id'
  ) then
    raise notice 'public.messages has no receiver_id column - message policies skipped. Review section 5 by hand.';
    return;
  end if;

  alter table public.messages enable row level security;

  -- Members no longer insert directly; the API route uses the service role.
  drop policy if exists "Users can insert their own messages." on public.messages;

  -- Recipients never see quarantined (shadow-banned) messages, not even via Realtime.
  drop policy if exists "Users can view messages they sent or received." on public.messages;
  drop policy if exists "Participants can view deliverable messages" on public.messages;
  create policy "Participants can view deliverable messages"
    on public.messages for select to authenticated
    using (
      auth.uid() = sender_id
      or (auth.uid() = receiver_id and coalesce(is_quarantined, false) = false)
    );

  -- Recipients may mark messages as read (read receipts).
  drop policy if exists "Recipients can mark messages read" on public.messages;
  create policy "Recipients can mark messages read"
    on public.messages for update to authenticated
    using (auth.uid() = receiver_id)
    with check (auth.uid() = receiver_id);

  -- ...and that is the ONLY thing a member can change on a message.
  execute $f$
    create or replace function public.guard_message_user_update()
    returns trigger
    language plpgsql
    set search_path = public
    as $g$
    begin
      if auth.uid() is not null and coalesce(auth.role(), '') <> 'service_role' then
        NEW.sender_id      := OLD.sender_id;
        NEW.receiver_id    := OLD.receiver_id;
        NEW.content        := OLD.content;
        NEW.is_quarantined := OLD.is_quarantined;
        NEW.created_at     := OLD.created_at;
      end if;
      return NEW;
    end;
    $g$;
  $f$;

  execute 'revoke all on function public.guard_message_user_update() from public, anon, authenticated';
  execute 'grant execute on function public.guard_message_user_update() to service_role';

  drop trigger if exists trg_guard_message_user_update on public.messages;
  create trigger trg_guard_message_user_update
    before update on public.messages
    for each row execute function public.guard_message_user_update();
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Profiles are visible to signed-in members only
-- ---------------------------------------------------------------------
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Members can view profiles" on public.profiles;
create policy "Members can view profiles"
  on public.profiles for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- 7. Verification selfies must live in a private bucket
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets set public = false where id = 'verifications';
  end if;
end;
$$;

commit;

-- ---------------------------------------------------------------------
-- Diagnostics worth running afterwards (read-only)
-- ---------------------------------------------------------------------
--   select policyname, cmd, roles, qual, with_check
--     from pg_policies where schemaname = 'public' and tablename in ('profiles','messages');
--
--   select id, public from storage.buckets;
--
--   -- Anything still executable by logged-out visitors?
--   select p.oid::regprocedure, has_function_privilege('anon', p.oid, 'execute') as anon_can_run
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.prokind = 'f' order by 2 desc, 1;
--
-- Rollback (only if something breaks and you need the old behaviour back):
--   drop trigger if exists trg_guard_profile_protected on public.profiles;
--   drop trigger if exists trg_guard_profile_age       on public.profiles;
--   drop trigger if exists trg_guard_message_user_update on public.messages;
--   create policy "Users can insert their own messages." on public.messages
--     for insert with check (auth.uid() = sender_id);

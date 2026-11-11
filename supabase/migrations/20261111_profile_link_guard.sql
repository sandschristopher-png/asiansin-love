-- =====================================================================
-- Profile contact-detail guard (defense in depth).
--
-- The app checks public profile text first with lib/moderation.ts validateProfileContent (live
-- in the edit form, and in PATCH /api/profile), which handles leetspeak, spacing tricks and
-- phone heuristics, and shows a friendly message. This trigger is the backstop for writes that
-- skip the app (usernames and names are written from the browser). Its patterns are deliberately
-- narrower than the app's, so it never blocks text the app allowed.
--
--   - Only fields that actually change are checked, so existing profiles never fail an
--     unrelated save.
--   - PostgreSQL ARE syntax: \y is the word boundary (\b would mean backspace), ~* is
--     case-insensitive matching.
--   - Long digit runs (7+) are refused in usernames and names only. Bios are server-written
--     (guard_profile_bio), where the app's phone check (which skips years and round numbers)
--     already runs.
--   - Usernames are matched with underscores read as spaces ("whatsapp_jane" -> "whatsapp jane");
--     generated placeholders ("user_" + hex) are skipped so sign-ups never fail.
--
-- Safe to re-run.
-- =====================================================================

begin;

create or replace function public.profile_text_has_contact(p_text text, p_check_digits boolean)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  t text := coalesce(p_text, '');
begin
  if t = '' then
    return false;
  end if;
  return
    -- Links and domains: explicit schemes, www., and real domains (no spaces around the dot).
    t ~* '(https?://|www\.)'
    or t ~* '\y[a-z0-9-]+\.(com|net|org|asia|io|app|xyz|site|online|info|biz|link|live|ly|gg|ru|cn)\y'
    or t ~* '(\[dot\]|\(dot\))'
    or t ~* '\y(wa\.me|t\.me)\y'
    -- Messaging apps and social platforms (unambiguous names only).
    or t ~* '\y(whatsapp|telegram|viber|wechat|snapchat|instagram|kakaotalk)\y'
    or t ~* '\yline\s*id\y'
    -- Emails.
    or t ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}'
    -- Phone-like digit runs (usernames and names only).
    or (p_check_digits and t ~ '[0-9]{7,}');
end;
$$;

create or replace function public.guard_profile_external_links()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT' or NEW.bio is distinct from OLD.bio)
     and public.profile_text_has_contact(NEW.bio, false) then
    raise exception 'External links, emails and messaging handles are not allowed in profiles.'
      using errcode = '23514';
  end if;

  -- Generated placeholders ("user_" + hex from the account id) can contain digit runs: skip them.
  if (TG_OP = 'INSERT' or NEW.username is distinct from OLD.username)
     and coalesce(NEW.username, '') !~* '^user_[0-9a-f-]+$'
     and public.profile_text_has_contact(translate(NEW.username, '_', ' '), true) then
    raise exception 'Usernames cannot contain links, messaging handles or phone numbers.'
      using errcode = '23514';
  end if;

  if (TG_OP = 'INSERT' or NEW.display_name is distinct from OLD.display_name)
     and public.profile_text_has_contact(NEW.display_name, true) then
    raise exception 'Names cannot contain links, messaging handles or phone numbers.'
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

-- full_name is checked too where the column exists (older databases may not have it).
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    execute $f$
      create or replace function public.guard_profile_full_name_links()
      returns trigger
      language plpgsql
      set search_path = public
      as $body$
      begin
        if (TG_OP = 'INSERT' or NEW.full_name is distinct from OLD.full_name)
           and public.profile_text_has_contact(NEW.full_name, true) then
          raise exception 'Names cannot contain links, messaging handles or phone numbers.'
            using errcode = '23514';
        end if;
        return NEW;
      end;
      $body$;
    $f$;
    execute 'drop trigger if exists trg_guard_profile_full_name_links on public.profiles';
    execute 'create trigger trg_guard_profile_full_name_links
               before insert or update of full_name on public.profiles
               for each row execute function public.guard_profile_full_name_links()';
  end if;
end;
$$;

drop trigger if exists trg_guard_profile_external_links on public.profiles;
create trigger trg_guard_profile_external_links
  before insert or update of bio, username, display_name on public.profiles
  for each row execute function public.guard_profile_external_links();

commit;

-- Rollback (manual):
--   drop trigger if exists trg_guard_profile_external_links on public.profiles;
--   drop trigger if exists trg_guard_profile_full_name_links on public.profiles;
--   drop function if exists public.guard_profile_external_links();
--   drop function if exists public.guard_profile_full_name_links();
--   drop function if exists public.profile_text_has_contact(text, boolean);

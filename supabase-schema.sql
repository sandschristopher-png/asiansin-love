-- =========================================================
-- asiansin.love Complete Production Schema & RLS Policies
-- =========================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  age integer not null,
  city text not null,
  country text not null,
  job_title text,
  relationship_intent text default 'Marriage & Long-Term Partner',
  bio text,
  avatar_url text,
  photos text[] default '{}',
  languages text[] default '{"English"}',
  is_verified boolean default false,
  is_online boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);

create policy "Users can insert their own profile." 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile." 
  on public.profiles for update using (auth.uid() = id);

-- 2. Favorites / Bookmarks Table
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  favorite_profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, favorite_profile_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites." 
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can add favorites." 
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can remove their own favorites." 
  on public.favorites for delete using (auth.uid() = user_id);

-- 3. Direct Messages Table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users on delete cascade not null,
  recipient_id uuid references auth.users on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Users can view messages they sent or received." 
  on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can insert their own messages." 
  on public.messages for insert with check (auth.uid() = sender_id);

-- 4. Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('message', 'verification', 'favorite', 'system')),
  title text not null,
  description text not null,
  link_url text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications."
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update read status on their own notifications."
  on public.notifications for update using (auth.uid() = user_id);

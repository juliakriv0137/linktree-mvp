-- Run this in Supabase SQL editor (one-time).
-- It creates tables + RLS policies required by the app.

create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  theme jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- LINKS
create table if not exists public.links (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  position int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_profile_id_position_idx on public.links (profile_id, position);

-- CLICK EVENTS (analytics)
create table if not exists public.click_events (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid not null references public.links(id) on delete cascade,
  destination text not null,
  referrer text,
  user_agent text,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists click_events_link_id_created_at_idx on public.click_events (link_id, created_at desc);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_links_updated_at on public.links;
create trigger trg_links_updated_at
before update on public.links
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.click_events enable row level security;

-- PROFILES policies:
-- Public can read profiles (for /[username])
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles for select
to anon, authenticated
using (true);

-- Authenticated user can insert own profile row
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Authenticated user can update own profile row
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- LINKS policies:
-- Public can read ONLY active links (public page)
drop policy if exists "links_public_read_active" on public.links;
create policy "links_public_read_active"
on public.links for select
to anon, authenticated
using (is_active = true);

-- Owner can manage own links
drop policy if exists "links_owner_all" on public.links;
create policy "links_owner_all"
on public.links for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- CLICK EVENTS policies:
-- Anyone can insert click events (analytics)
drop policy if exists "click_events_public_insert" on public.click_events;
create policy "click_events_public_insert"
on public.click_events for insert
to anon, authenticated
with check (true);

-- Owner can read click events for their links (optional)
-- This enables reading analytics if you later build a UI for it.
drop policy if exists "click_events_owner_select" on public.click_events;
create policy "click_events_owner_select"
on public.click_events for select
to authenticated
using (
  exists (
    select 1
    from public.links l
    where l.id = click_events.link_id
      and l.profile_id = auth.uid()
  )
);

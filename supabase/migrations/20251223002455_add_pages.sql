begin;

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text null, -- null = home
  title text not null default 'Home',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_site_pages_updated_at') then
    create trigger trg_site_pages_updated_at
    before update on public.site_pages
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.site_pages
  drop constraint if exists site_pages_slug_not_blank;

alter table public.site_pages
  add constraint site_pages_slug_not_blank
  check (slug is null or btrim(slug) <> '');

create unique index if not exists ux_site_pages_site_home
  on public.site_pages(site_id)
  where slug is null;

create unique index if not exists ux_site_pages_site_slug
  on public.site_pages(site_id, slug)
  where slug is not null;

create index if not exists ix_site_pages_site_sort
  on public.site_pages(site_id, sort_order, created_at);

alter table public.site_blocks
  add column if not exists page_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_blocks_page_id_fkey'
  ) then
    alter table public.site_blocks
      add constraint site_blocks_page_id_fkey
      foreign key (page_id) references public.site_pages(id)
      on delete cascade;
  end if;
end $$;

create index if not exists ix_site_blocks_page
  on public.site_blocks(page_id, position, created_at);

with home_pages as (
  insert into public.site_pages(site_id, slug, title, sort_order, is_published)
  select s.id, null, 'Home', 0, true
  from public.sites s
  where not exists (
    select 1 from public.site_pages p
    where p.site_id = s.id and p.slug is null
  )
  returning site_id, id
),
existing_home as (
  select p.site_id, p.id
  from public.site_pages p
  where p.slug is null
),
home_map as (
  select * from home_pages
  union all
  select * from existing_home
)
update public.site_blocks b
set page_id = hm.id
from home_map hm
where b.site_id = hm.site_id
  and b.page_id is null;

alter table public.site_blocks
  alter column page_id set not null;

alter table public.site_pages enable row level security;

drop policy if exists "site_pages_select_own" on public.site_pages;
create policy "site_pages_select_own"
on public.site_pages
for select
using (
  exists (
    select 1 from public.sites s
    where s.id = site_pages.site_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "site_pages_insert_own" on public.site_pages;
create policy "site_pages_insert_own"
on public.site_pages
for insert
with check (
  exists (
    select 1 from public.sites s
    where s.id = site_pages.site_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "site_pages_update_own" on public.site_pages;
create policy "site_pages_update_own"
on public.site_pages
for update
using (
  exists (
    select 1 from public.sites s
    where s.id = site_pages.site_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sites s
    where s.id = site_pages.site_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "site_pages_delete_own" on public.site_pages;
create policy "site_pages_delete_own"
on public.site_pages
for delete
using (
  exists (
    select 1 from public.sites s
    where s.id = site_pages.site_id
      and s.owner_id = auth.uid()
  )
);

commit;

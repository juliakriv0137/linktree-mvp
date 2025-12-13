alter table public.sites
  add column if not exists theme_key text not null default 'midnight',
  add column if not exists button_style text not null default 'solid',
  add column if not exists background_style text not null default 'solid';

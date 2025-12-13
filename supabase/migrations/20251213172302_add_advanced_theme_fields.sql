alter table public.sites
  add column if not exists font_scale text not null default 'md',
  add column if not exists button_radius text not null default '2xl',
  add column if not exists card_style text not null default 'card';

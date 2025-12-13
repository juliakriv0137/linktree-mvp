alter table public.sites
  add column if not exists bg_color text,
  add column if not exists text_color text,
  add column if not exists muted_color text,
  add column if not exists button_color text,
  add column if not exists button_text_color text,
  add column if not exists border_color text;

comment on column public.sites.bg_color is 'Custom background color (hex like #0B0F0E). Null = theme default.';
comment on column public.sites.text_color is 'Custom primary text color (hex). Null = theme default.';
comment on column public.sites.muted_color is 'Custom muted text color (hex). Null = theme default.';
comment on column public.sites.button_color is 'Custom button background color (hex). Null = theme default.';
comment on column public.sites.button_text_color is 'Custom button text color (hex). Null = theme default.';
comment on column public.sites.border_color is 'Custom border color (hex). Null = theme default.';

-- Add variant and style to site_blocks
alter table public.site_blocks
  add column if not exists variant text not null default 'default',
  add column if not exists style jsonb not null default '{}'::jsonb;

-- Backfill safety (for any edge cases)
update public.site_blocks
set
  variant = coalesce(variant, 'default'),
  style = coalesce(style, '{}'::jsonb);

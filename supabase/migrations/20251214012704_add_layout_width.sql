alter table public.sites
add column if not exists layout_width text not null default 'compact';

alter table public.sites
drop constraint if exists sites_layout_width_check;

alter table public.sites
add constraint sites_layout_width_check
check (layout_width in ('compact', 'wide', 'full'));

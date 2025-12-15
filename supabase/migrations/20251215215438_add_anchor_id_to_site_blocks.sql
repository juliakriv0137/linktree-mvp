alter table public.site_blocks
add column if not exists anchor_id text;

create index if not exists site_blocks_site_id_anchor_id_idx
on public.site_blocks (site_id, anchor_id);

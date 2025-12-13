-- Image block: content = { url: string, alt?: string, shape?: 'circle'|'rounded'|'square' }
-- content column is jsonb already, so we only add a light CHECK constraint.

alter table public.site_blocks
  drop constraint if exists site_blocks_image_content_check;

alter table public.site_blocks
  add constraint site_blocks_image_content_check
  check (
    type <> 'image'
    or (
      content ? 'url'
      and length(trim(both from (content->>'url'))) > 0
    )
  );

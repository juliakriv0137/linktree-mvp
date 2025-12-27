begin;

-- Allow public read of published pages (needed for /[username] & /[username]/[slug])
drop policy if exists "Public read published pages" on public.site_pages;

create policy "Public read published pages"
on public.site_pages
for select
using (is_published = true);

commit;

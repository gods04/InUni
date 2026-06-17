-- Allow logged-out visitors to browse approved Shared Files metadata.
-- Downloads, previews, uploads, and file reports still require login.

drop policy if exists "Anyone can read approved shared file metadata"
on public.files;

create policy "Anyone can read approved shared file metadata"
on public.files for select
to anon, authenticated
using (
  status = 'available'
  and exists (
    select 1
    from public.file_links
    where file_links.file_id = files.id
      and file_links.link_type = 'shared_file'
      and file_links.shared_status = 'approved'
  )
);

drop policy if exists "Anyone can read approved shared file links"
on public.file_links;

create policy "Anyone can read approved shared file links"
on public.file_links for select
to anon, authenticated
using (
  link_type = 'shared_file'
  and shared_status = 'approved'
);

grant select on table public.files to anon;
grant select on table public.file_links to anon;

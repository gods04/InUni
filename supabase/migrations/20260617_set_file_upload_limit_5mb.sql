-- InUni file upload limit adjustment
-- Run this if the files schema was already installed with the older 100MB limit.

alter table public.files
drop constraint if exists files_size_bytes_check;

alter table public.files
add constraint files_size_bytes_check
check (size_bytes > 0 and size_bytes <= 5242880);

drop policy if exists "Active users can insert own files within quota"
on public.files;

create policy "Active users can insert own files within quota"
on public.files for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.current_profile_can_participate()
  and size_bytes <= 5242880
  and public.current_profile_daily_upload_bytes() + size_bytes <= 1073741824
);

-- InUni existing-project files upgrade
-- Run this on a Supabase project that already has the original InUni schema.
-- Do not run supabase/schema.sql again on an existing project.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'file_status'
  ) then
    create type public.file_status as enum (
      'uploading',
      'available',
      'pending_review',
      'hidden_by_reports'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'shared_file_status'
  ) then
    create type public.shared_file_status as enum ('pending', 'approved');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'file_scan_status'
  ) then
    create type public.file_scan_status as enum (
      'not_scanned',
      'pending',
      'clean',
      'flagged',
      'failed'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'file_link_type'
  ) then
    create type public.file_link_type as enum (
      'post',
      'comment',
      'shared_file'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'file_report_type'
  ) then
    create type public.file_report_type as enum (
      'copyright',
      'malicious_file',
      'privacy',
      'harassment',
      'other'
    );
  end if;
end;
$$;

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_provider text not null default 'supabase',
  storage_bucket text not null,
  storage_path text not null unique,
  original_filename text not null,
  display_filename text not null,
  mime_type text not null,
  extension text not null,
  size_bytes bigint not null check (
    size_bytes > 0 and size_bytes <= 5242880
  ),
  description text not null default '' check (char_length(description) <= 200),
  status public.file_status not null default 'available',
  scan_status public.file_scan_status not null default 'not_scanned',
  download_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.file_links (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  link_type public.file_link_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  shared_status public.shared_file_status,
  course_code text,
  campus_or_faculty text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint file_links_context check (
    (
      link_type = 'post'
      and post_id is not null
      and comment_id is null
      and shared_status is null
    )
    or (
      link_type = 'comment'
      and comment_id is not null
      and post_id is null
      and shared_status is null
    )
    or (
      link_type = 'shared_file'
      and post_id is null
      and comment_id is null
      and shared_status is not null
    )
  )
);

create table if not exists public.file_reports (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  report_type public.file_report_type not null,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (file_id, reporter_id)
);

create index if not exists files_owner_created_idx
on public.files (owner_id, created_at desc);

create index if not exists files_status_created_idx
on public.files (status, created_at desc);

create index if not exists file_links_file_id_idx
on public.file_links (file_id);

create index if not exists file_links_post_id_idx
on public.file_links (post_id);

create index if not exists file_links_comment_id_idx
on public.file_links (comment_id);

create index if not exists file_links_shared_idx
on public.file_links (shared_status, created_at desc);

create index if not exists file_reports_file_id_idx
on public.file_reports (file_id);

create or replace function public.current_profile_daily_upload_bytes()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(size_bytes), 0)::bigint
  from public.files
  where owner_id = auth.uid()
    and created_at >= now() - interval '1 day';
$$;

create or replace function public.refresh_file_report_count(target_file uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  unique_reports integer;
begin
  select count(distinct reporter_id)
  into unique_reports
  from public.file_reports
  where file_id = target_file;

  update public.files
  set
    report_count = unique_reports,
    status = case
      when unique_reports >= 3 then 'hidden_by_reports'::public.file_status
      else status
    end
  where id = target_file;
end;
$$;

create or replace function public.after_file_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_file_report_count(new.file_id);
  return new;
end;
$$;

drop trigger if exists files_set_updated_at on public.files;
create trigger files_set_updated_at
before update on public.files
for each row execute function public.set_updated_at();

drop trigger if exists file_reports_refresh_count on public.file_reports;
create trigger file_reports_refresh_count
after insert on public.file_reports
for each row execute function public.after_file_report_insert();

alter table public.files enable row level security;
alter table public.file_links enable row level security;
alter table public.file_reports enable row level security;

drop policy if exists "Users can read available own and public files"
on public.files;
create policy "Users can read available own and public files"
on public.files for select
to authenticated
using (
  public.current_profile_is_admin()
  or (
    public.current_profile_can_participate()
    and (
      owner_id = auth.uid()
      or status = 'available'
    )
  )
);

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

drop policy if exists "Owners and admins can update files"
on public.files;
create policy "Owners and admins can update files"
on public.files for update
to authenticated
using (
  public.current_profile_is_admin()
  or (
    owner_id = auth.uid()
    and public.current_profile_can_participate()
  )
)
with check (
  public.current_profile_is_admin()
  or (
    owner_id = auth.uid()
    and public.current_profile_can_participate()
  )
);

drop policy if exists "Owners and admins can delete files"
on public.files;
create policy "Owners and admins can delete files"
on public.files for delete
to authenticated
using (
  public.current_profile_is_admin()
  or (
    owner_id = auth.uid()
    and public.current_profile_can_participate()
  )
);

drop policy if exists "Authenticated active users can read file links"
on public.file_links;
create policy "Authenticated active users can read file links"
on public.file_links for select
to authenticated
using (
  public.current_profile_can_participate()
  or public.current_profile_is_admin()
);

drop policy if exists "Active users can create file links"
on public.file_links;
create policy "Active users can create file links"
on public.file_links for insert
to authenticated
with check (
  public.current_profile_can_participate()
  and exists (
    select 1
    from public.files
    where files.id = file_id
      and files.owner_id = auth.uid()
  )
);

drop policy if exists "Admins can update file links"
on public.file_links;
create policy "Admins can update file links"
on public.file_links for update
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

drop policy if exists "Owners and admins can delete file links"
on public.file_links;
create policy "Owners and admins can delete file links"
on public.file_links for delete
to authenticated
using (
  public.current_profile_is_admin()
  or exists (
    select 1
    from public.files
    where files.id = file_id
      and files.owner_id = auth.uid()
      and public.current_profile_can_participate()
  )
);

drop policy if exists "Users can read own file reports"
on public.file_reports;
create policy "Users can read own file reports"
on public.file_reports for select
to authenticated
using (
  reporter_id = auth.uid()
  or public.current_profile_is_admin()
);

drop policy if exists "Active users can report files"
on public.file_reports;
create policy "Active users can report files"
on public.file_reports for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.current_profile_can_participate()
);

drop policy if exists "Admins can delete file reports"
on public.file_reports;
create policy "Admins can delete file reports"
on public.file_reports for delete
to authenticated
using (public.current_profile_is_admin());

drop policy if exists "Active users can upload own file objects"
on storage.objects;
create policy "Active users can upload own file objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'inuni-files'
  and public.current_profile_can_participate()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Active users can create signed file URLs"
on storage.objects;
create policy "Active users can create signed file URLs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'inuni-files'
  and (
    public.current_profile_is_admin()
    or (
      public.current_profile_can_participate()
      and exists (
        select 1
        from public.files
        where files.storage_bucket = 'inuni-files'
          and files.storage_path = storage.objects.name
          and files.status = 'available'
      )
    )
  )
);

drop policy if exists "Owners and admins can delete file objects"
on storage.objects;
create policy "Owners and admins can delete file objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'inuni-files'
  and (
    public.current_profile_is_admin()
    or (
      public.current_profile_can_participate()
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

revoke all on table public.files from anon, authenticated;
revoke all on table public.file_links from anon, authenticated;
revoke all on table public.file_reports from anon, authenticated;

grant select, insert, update, delete on table public.files to authenticated;
grant select, insert, update, delete on table public.file_links to authenticated;
grant select, insert, delete on table public.file_reports to authenticated;

revoke all on function public.current_profile_daily_upload_bytes() from public;
revoke all on function public.refresh_file_report_count(uuid) from public;

grant execute on function public.current_profile_daily_upload_bytes()
to authenticated;
grant execute on function public.refresh_file_report_count(uuid)
to authenticated;

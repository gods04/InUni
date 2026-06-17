-- InUni Supabase MVP setup
-- Run once in a new Supabase project from the SQL editor.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'admin');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
create type public.file_status as enum (
  'uploading',
  'available',
  'pending_review',
  'hidden_by_reports'
);
create type public.shared_file_status as enum ('pending', 'approved');
create type public.file_scan_status as enum (
  'not_scanned',
  'pending',
  'clean',
  'flagged',
  'failed'
);
create type public.file_link_type as enum ('post', 'comment', 'shared_file');
create type public.file_report_type as enum (
  'copyright',
  'malicious_file',
  'privacy',
  'harassment',
  'other'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (char_length(trim(username)) between 2 and 40),
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 80),
  is_uct_verified boolean not null default false,
  role public.user_role not null default 'student',
  is_banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null
    check (char_length(trim(title)) between 1 and 120),
  content text not null
    check (char_length(trim(content)) between 1 and 20000),
  category text not null check (
    category in (
      'Study',
      'Campus Life',
      'Questions',
      'Lost & Found',
      'Confessions',
      'General'
    )
  ),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null
    check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 10),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint reports_one_target check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create unique index reports_unique_post_reporter
on public.reports (reporter_id, post_id)
where post_id is not null;

create unique index reports_unique_comment_reporter
on public.reports (reporter_id, comment_id)
where comment_id is not null;

create table public.files (
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

create table public.file_links (
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

create table public.file_reports (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  report_type public.file_report_type not null,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (file_id, reporter_id)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_category_idx on public.posts (category);
create index posts_author_id_idx on public.posts (author_id);
create index comments_post_id_idx on public.comments (post_id, created_at);
create index reports_status_created_at_idx
on public.reports (status, created_at desc);
create index files_owner_created_idx on public.files (owner_id, created_at desc);
create index files_status_created_idx on public.files (status, created_at desc);
create index file_links_file_id_idx on public.file_links (file_id);
create index file_links_post_id_idx on public.file_links (post_id);
create index file_links_comment_id_idx on public.file_links (comment_id);
create index file_links_shared_idx
on public.file_links (shared_status, created_at desc);
create index file_reports_file_id_idx on public.file_reports (file_id);

create or replace function public.current_profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_profile_can_participate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_banned = false
  );
$$;

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

create or replace function public.update_own_profile(
  new_username text,
  new_display_name text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(new_username)) not between 2 and 40 then
    raise exception 'Username must be between 2 and 40 characters';
  end if;

  if char_length(trim(new_display_name)) not between 1 and 80 then
    raise exception 'Display name must be between 1 and 80 characters';
  end if;

  update public.profiles
  set
    username = trim(new_username),
    display_name = trim(new_display_name)
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.set_user_ban(
  target_user uuid,
  banned boolean,
  reason text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if not public.current_profile_is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_user = auth.uid() then
    raise exception 'Administrators cannot change their own ban status';
  end if;

  update public.profiles
  set
    is_banned = banned,
    ban_reason = case
      when banned then nullif(trim(reason), '')
      else null
    end
  where id = target_user
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

create trigger files_set_updated_at
before update on public.files
for each row execute function public.set_updated_at();

create trigger file_reports_refresh_count
after insert on public.file_reports
for each row execute function public.after_file_report_insert();

create or replace function public.is_uct_email(
  email text,
  email_confirmed_at timestamptz
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    email_confirmed_at is not null
    and (
      lower(coalesce(email, '')) like '%@uct.ac.za'
      or lower(coalesce(email, '')) like '%@myuct.ac.za'
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  safe_username text;
  display_value text;
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(coalesce(new.email, 'student'), '@', 1)
  );
  safe_username := lower(regexp_replace(base_name, '[^a-zA-Z0-9_]+', '_', 'g'))
    || '_' || left(new.id::text, 8);
  display_value := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    base_name,
    'Student'
  );

  insert into public.profiles (
    id,
    username,
    display_name,
    is_uct_verified,
    role,
    is_banned
  )
  values (
    new.id,
    left(safe_username, 40),
    left(display_value, 80),
    public.is_uct_email(new.email, new.email_confirmed_at),
    'student',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_uct_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set is_uct_verified = public.is_uct_email(
    new.email,
    new.email_confirmed_at
  )
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_verification_changed
after update of email, email_confirmed_at on auth.users
for each row execute function public.sync_uct_verification();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.files enable row level security;
alter table public.file_links enable row level security;
alter table public.file_reports enable row level security;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using (public.current_profile_is_admin());

create policy "Anyone can read posts"
on public.posts for select
to anon, authenticated
using (true);

create policy "Active users can create own posts"
on public.posts for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Active users can update own posts"
on public.posts for update
to authenticated
using (
  author_id = auth.uid()
  and public.current_profile_can_participate()
)
with check (
  author_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Owners and admins can delete posts"
on public.posts for delete
to authenticated
using (
  author_id = auth.uid()
  or public.current_profile_is_admin()
);

create policy "Anyone can read comments"
on public.comments for select
to anon, authenticated
using (true);

create policy "Active users can create own comments"
on public.comments for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Active users can update own comments"
on public.comments for update
to authenticated
using (
  author_id = auth.uid()
  and public.current_profile_can_participate()
)
with check (
  author_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Owners and admins can delete comments"
on public.comments for delete
to authenticated
using (
  author_id = auth.uid()
  or public.current_profile_is_admin()
);

create policy "Users can read own reports"
on public.reports for select
to authenticated
using (reporter_id = auth.uid());

create policy "Admins can read all reports"
on public.reports for select
to authenticated
using (public.current_profile_is_admin());

create policy "Active users can create own reports"
on public.reports for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Admins can update reports"
on public.reports for update
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

create policy "Admins can delete reports"
on public.reports for delete
to authenticated
using (public.current_profile_is_admin());

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

create policy "Active users can insert own files within quota"
on public.files for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.current_profile_can_participate()
  and size_bytes <= 5242880
  and public.current_profile_daily_upload_bytes() + size_bytes <= 1073741824
);

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

create policy "Authenticated active users can read file links"
on public.file_links for select
to authenticated
using (
  public.current_profile_can_participate()
  or public.current_profile_is_admin()
);

create policy "Anyone can read approved shared file links"
on public.file_links for select
to anon, authenticated
using (
  link_type = 'shared_file'
  and shared_status = 'approved'
);

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

create policy "Admins can update file links"
on public.file_links for update
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

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

create policy "Users can read own file reports"
on public.file_reports for select
to authenticated
using (
  reporter_id = auth.uid()
  or public.current_profile_is_admin()
);

create policy "Active users can report files"
on public.file_reports for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Admins can delete file reports"
on public.file_reports for delete
to authenticated
using (public.current_profile_is_admin());

create policy "Active users can upload own file objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'inuni-files'
  and public.current_profile_can_participate()
  and (storage.foldername(name))[1] = auth.uid()::text
);

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

-- This view intentionally exposes only public profile fields. The base profiles
-- table remains restricted to the profile owner and administrators.
create view public.public_profiles
with (security_barrier = true)
as
select id, username, display_name, is_uct_verified, created_at
from public.profiles;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.posts from anon, authenticated;
revoke all on table public.comments from anon, authenticated;
revoke all on table public.reports from anon, authenticated;
revoke all on table public.files from anon, authenticated;
revoke all on table public.file_links from anon, authenticated;
revoke all on table public.file_reports from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.public_profiles to anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;
grant select on table public.comments to anon, authenticated;
grant insert, update, delete on table public.comments to authenticated;
grant select, insert, update, delete on table public.reports to authenticated;
grant select on table public.files to anon;
grant select on table public.file_links to anon;
grant select, insert, update, delete on table public.files to authenticated;
grant select, insert, update, delete on table public.file_links to authenticated;
grant select, insert, delete on table public.file_reports to authenticated;

revoke all on function public.current_profile_is_admin() from public;
revoke all on function public.current_profile_can_participate() from public;
revoke all on function public.current_profile_daily_upload_bytes() from public;
revoke all on function public.refresh_file_report_count(uuid) from public;
revoke all on function public.is_uct_email(text, timestamptz) from public;
revoke all on function public.update_own_profile(text, text) from public;
revoke all on function public.set_user_ban(uuid, boolean, text) from public;

grant execute on function public.current_profile_is_admin() to authenticated;
grant execute on function public.current_profile_can_participate() to authenticated;
grant execute on function public.current_profile_daily_upload_bytes() to authenticated;
grant execute on function public.refresh_file_report_count(uuid) to authenticated;
grant execute on function public.update_own_profile(text, text) to authenticated;
grant execute on function public.set_user_ban(uuid, boolean, text) to authenticated;

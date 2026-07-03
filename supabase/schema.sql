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
  avatar_path text
    check (avatar_path is null or char_length(trim(avatar_path)) between 1 and 300),
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
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content text not null
    check (char_length(trim(content)) between 1 and 20000),
  category text not null check (
    category in (
      'Academics',
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

create table public.food_recipes (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  required_ingredients text[] not null default '{}',
  optional_ingredients text[] not null default '{}',
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  total_minutes integer not null check (total_minutes between 1 and 360),
  prep_minutes integer not null check (prep_minutes between 0 and 360),
  estimated_cost_zar numeric(8, 2) not null check (estimated_cost_zar >= 0),
  cooking_access text not null check (
    cooking_access in ('no-cook', 'microwave', 'stove', 'full-kitchen')
  ),
  dietary text not null check (dietary in ('meat', 'vegetarian', 'vegan')),
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campus_menu_items (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 1 and 120),
  vendor text not null default '' check (char_length(vendor) <= 120),
  category text not null default '' check (char_length(category) <= 80),
  price_zar numeric(8, 2) not null check (price_zar >= 0),
  notes text not null default '' check (char_length(notes) <= 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
create index food_recipes_active_title_idx
on public.food_recipes (is_active, title);
create index campus_menu_items_active_price_idx
on public.campus_menu_items (is_active, price_zar);

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

  if not public.current_profile_can_participate() then
    raise exception 'Restricted accounts cannot edit profile details';
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

create or replace function public.update_own_display_name(
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

  if not public.current_profile_can_participate() then
    raise exception 'Restricted accounts cannot edit profile details';
  end if;

  if char_length(trim(new_display_name)) not between 1 and 80 then
    raise exception 'Display name must be between 1 and 80 characters';
  end if;

  update public.profiles
  set display_name = trim(new_display_name)
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.update_own_avatar(
  new_avatar_path text
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

  if not public.current_profile_can_participate() then
    raise exception 'Restricted accounts cannot edit profile details';
  end if;

  if new_avatar_path is not null then
    if char_length(trim(new_avatar_path)) not between 1 and 300 then
      raise exception 'Profile photo path is invalid';
    end if;

    if (storage.foldername(new_avatar_path))[1] <> auth.uid()::text then
      raise exception 'Profile photo path must belong to the current user';
    end if;
  end if;

  update public.profiles
  set avatar_path = nullif(trim(coalesce(new_avatar_path, '')), '')
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
alter table public.food_recipes enable row level security;
alter table public.campus_menu_items enable row level security;

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

create policy "Anyone can read active food recipes"
on public.food_recipes for select
to anon, authenticated
using (is_active);

create policy "Admins can manage food recipes"
on public.food_recipes for all
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

create policy "Anyone can read active campus menu items"
on public.campus_menu_items for select
to anon, authenticated
using (is_active);

create policy "Admins can manage campus menu items"
on public.campus_menu_items for all
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

insert into public.food_recipes (
  id,
  title,
  description,
  required_ingredients,
  optional_ingredients,
  steps,
  total_minutes,
  prep_minutes,
  estimated_cost_zar,
  cooking_access,
  dietary,
  tags
)
values
  (
    'pap-and-chakalaka-bowl',
    'Pap and chakalaka bowl',
    'A warm South African-inspired bowl using pap and chakalaka for a filling budget meal.',
    array['pap', 'chakalaka'],
    array['spinach', 'fried egg'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook the pap',
        'heat', 'Medium heat',
        'minutes', 10,
        'instruction', 'Whisk maize meal into simmering water, then stir often so it does not catch at the bottom.',
        'cue', 'Pap is thick, smooth, and pulls away slightly from the pot.'
      ),
      jsonb_build_object(
        'title', 'Warm the chakalaka',
        'heat', 'Low heat',
        'minutes', 5,
        'instruction', 'Warm chakalaka in a small pot, stirring every minute.',
        'cue', 'Chakalaka is bubbling gently and smells cooked through.'
      ),
      jsonb_build_object(
        'title', 'Finish the bowl',
        'heat', 'Residual heat',
        'minutes', 3,
        'instruction', 'Fold in spinach if using it, then spoon chakalaka over the pap.',
        'cue', 'Spinach is wilted but still green.'
      )
    ),
    18,
    5,
    22,
    'stove',
    'vegan',
    array['budget', 'chakalaka', 'south-african', 'vegan']
  ),
  (
    'bean-curry-and-rice',
    'Bean curry and rice',
    'A batch-friendly curry that turns pantry basics into a proper dinner.',
    array['rice', 'beans', 'tomato', 'curry powder'],
    array['onion', 'spinach', 'chilli'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Start the rice',
        'heat', 'Medium-high heat',
        'minutes', 12,
        'instruction', 'Rinse rice, add water, bring to a boil, then cover and cook until tender.',
        'cue', 'Rice is tender and most water is absorbed.'
      ),
      jsonb_build_object(
        'title', 'Build the curry base',
        'heat', 'Medium heat',
        'minutes', 6,
        'instruction', 'Cook tomato with curry powder and a pinch of salt, stirring so the spice does not burn.',
        'cue', 'Tomato darkens slightly and the curry smells fragrant.'
      ),
      jsonb_build_object(
        'title', 'Simmer the beans',
        'heat', 'Low heat',
        'minutes', 10,
        'instruction', 'Add beans and simmer gently until the curry thickens.',
        'cue', 'Beans are hot and the sauce coats a spoon.'
      ),
      jsonb_build_object(
        'title', 'Serve',
        'heat', 'Off heat',
        'minutes', 2,
        'instruction', 'Fluff rice, spoon curry over it, and add spinach or chilli if available.',
        'cue', 'Rice is fluffed and curry sits on top without running everywhere.'
      )
    ),
    30,
    8,
    35,
    'stove',
    'vegan',
    array['batch', 'budget', 'curry', 'vegan']
  ),
  (
    'tomato-cheese-pasta',
    'Tomato cheese pasta',
    'A simple pasta bowl for nights when tomato and cheese are the only exciting things left.',
    array['pasta', 'tomato', 'cheese'],
    array['garlic', 'chilli flakes', 'spinach'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Boil pasta',
        'heat', 'High heat',
        'minutes', 10,
        'instruction', 'Boil pasta in salted water and save a little cooking water before draining.',
        'cue', 'Pasta bends easily but still has a little bite.'
      ),
      jsonb_build_object(
        'title', 'Make sauce',
        'heat', 'Medium heat',
        'minutes', 7,
        'instruction', 'Cook chopped tomato with oil, salt, and garlic if you have it.',
        'cue', 'Tomato sauce looks glossy and slightly thicker.'
      ),
      jsonb_build_object(
        'title', 'Toss together',
        'heat', 'Low heat',
        'minutes', 3,
        'instruction', 'Add pasta, a splash of cooking water, and cheese, then toss gently.',
        'cue', 'Cheese melts into the sauce and coats the pasta.'
      )
    ),
    20,
    5,
    34,
    'stove',
    'vegetarian',
    array['pasta', 'quick', 'stove', 'vegetarian']
  ),
  (
    'spicy-peanut-noodles',
    'Spicy peanut noodles',
    'A peanut sauce noodle bowl that is cheap, filling, and easy to adjust with chilli.',
    array['noodles', 'peanut butter', 'soy sauce'],
    array['chilli', 'spring onion', 'cabbage'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook noodles',
        'heat', 'High heat',
        'minutes', 5,
        'instruction', 'Boil noodles, then drain and keep a few spoons of the cooking water.',
        'cue', 'Noodles are soft enough to separate with a fork.'
      ),
      jsonb_build_object(
        'title', 'Mix sauce',
        'heat', 'No heat',
        'minutes', 3,
        'instruction', 'Stir peanut butter with soy sauce and warm noodle water until it loosens.',
        'cue', 'Sauce is smooth and pourable.'
      ),
      jsonb_build_object(
        'title', 'Coat noodles',
        'heat', 'Low heat',
        'minutes', 3,
        'instruction', 'Return noodles to the pot, add sauce, and toss gently with chilli if using.',
        'cue', 'Noodles are evenly coated and shiny.'
      )
    ),
    11,
    5,
    28,
    'stove',
    'vegan',
    array['budget', 'noodles', 'quick', 'vegan']
  ),
  (
    'chickpea-couscous-bowl',
    'Chickpea couscous bowl',
    'A quick couscous bowl using tinned chickpeas and tomato for a no-stress lunch.',
    array['couscous', 'chickpeas', 'tomato'],
    array['cucumber', 'lemon juice', 'parsley'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Steam couscous',
        'heat', 'Kettle or microwave high',
        'minutes', 6,
        'instruction', 'Cover couscous with hot water, cover the bowl, and let it steam.',
        'cue', 'Couscous grains are fluffy and no dry patches remain.'
      ),
      jsonb_build_object(
        'title', 'Warm chickpeas',
        'heat', 'Microwave high',
        'minutes', 3,
        'instruction', 'Warm chickpeas with tomato, salt, and a small splash of oil.',
        'cue', 'Chickpeas are warm and seasoned.'
      ),
      jsonb_build_object(
        'title', 'Assemble bowl',
        'heat', 'No heat',
        'minutes', 2,
        'instruction', 'Fluff couscous with a fork, then spoon chickpeas and tomato over it.',
        'cue', 'Bowl is fluffy, warm, and not watery.'
      )
    ),
    11,
    6,
    36,
    'microwave',
    'vegan',
    array['campus', 'microwave', 'vegan']
  ),
  (
    'egg-fried-rice',
    'Egg fried rice',
    'A useful way to turn leftover rice, egg, and frozen vegetables into a proper meal.',
    array['rice', 'egg', 'frozen veg', 'soy sauce'],
    array['spring onion', 'chilli oil', 'peas'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Fry rice',
        'heat', 'Medium-high heat',
        'minutes', 5,
        'instruction', 'Fry leftover rice with a little oil, breaking up clumps as it heats.',
        'cue', 'Rice grains separate instead of clumping together.'
      ),
      jsonb_build_object(
        'title', 'Add veg',
        'heat', 'Medium-high heat',
        'minutes', 4,
        'instruction', 'Add frozen vegetables and keep stirring so the rice does not stick.',
        'cue', 'Vegetables are hot and bright.'
      ),
      jsonb_build_object(
        'title', 'Finish with egg',
        'heat', 'Low heat',
        'minutes', 4,
        'instruction', 'Push rice aside, scramble in the egg, then toss everything with soy sauce.',
        'cue', 'Egg is set in small soft pieces and rice tastes seasoned.'
      )
    ),
    13,
    6,
    32,
    'stove',
    'vegetarian',
    array['leftovers', 'rice', 'stove', 'vegetarian']
  ),
  (
    'mince-cabbage-rice',
    'Mince cabbage rice',
    'A filling pan meal with mince, cabbage, and rice when you want dinner plus leftovers.',
    array['mince', 'cabbage', 'rice', 'tomato'],
    array['onion', 'chilli', 'carrot'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook rice',
        'heat', 'Medium-high heat',
        'minutes', 12,
        'instruction', 'Cook rice first so it is ready when the mince is done.',
        'cue', 'Rice is tender and resting with the lid on.'
      ),
      jsonb_build_object(
        'title', 'Brown mince',
        'heat', 'Medium-high heat',
        'minutes', 7,
        'instruction', 'Brown mince in a pan, breaking it up with a spoon.',
        'cue', 'Mince is browned with no pink patches.'
      ),
      jsonb_build_object(
        'title', 'Simmer filling',
        'heat', 'Medium heat',
        'minutes', 8,
        'instruction', 'Add sliced cabbage and tomato, then cook until saucy.',
        'cue', 'Cabbage is soft at the edges and tomato coats the mince.'
      )
    ),
    27,
    8,
    55,
    'stove',
    'meat',
    array['batch', 'meat', 'rice', 'stove']
  ),
  (
    'microwave-mac-and-cheese',
    'Microwave mac and cheese',
    'A mug-style mac and cheese for res kitchens when you only have a microwave.',
    array['macaroni', 'milk', 'cheese'],
    array['pepper', 'mustard', 'chilli flakes'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook macaroni',
        'heat', 'Microwave high',
        'minutes', 8,
        'instruction', 'Microwave macaroni with water in a large bowl, stopping to stir every few minutes.',
        'cue', 'Macaroni is just tender and most liquid is absorbed.'
      ),
      jsonb_build_object(
        'title', 'Warm milk',
        'heat', 'Microwave medium',
        'minutes', 2,
        'instruction', 'Stir in milk and microwave briefly to warm it through.',
        'cue', 'Milk is hot but not boiling over.'
      ),
      jsonb_build_object(
        'title', 'Melt cheese',
        'heat', 'Residual heat',
        'minutes', 2,
        'instruction', 'Stir in cheese until smooth, then season with pepper or chilli.',
        'cue', 'Cheese melts into a creamy sauce.'
      )
    ),
    12,
    3,
    30,
    'microwave',
    'vegetarian',
    array['comfort', 'microwave', 'quick', 'vegetarian']
  ),
  (
    'banana-oat-pancakes',
    'Banana oat pancakes',
    'A small-batch pancake option using oats, banana, and egg for breakfast or a study snack.',
    array['oats', 'banana', 'egg'],
    array['cinnamon', 'peanut butter', 'honey'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Mix batter',
        'heat', 'No heat',
        'minutes', 4,
        'instruction', 'Mash banana, then mix with egg and oats.',
        'cue', 'Batter is thick but spoonable.'
      ),
      jsonb_build_object(
        'title', 'Cook first side',
        'heat', 'Low-medium heat',
        'minutes', 4,
        'instruction', 'Spoon small pancakes into a lightly oiled pan.',
        'cue', 'Edges look set and small bubbles appear on top.'
      ),
      jsonb_build_object(
        'title', 'Flip and finish',
        'heat', 'Low heat',
        'minutes', 3,
        'instruction', 'Flip gently and cook the second side, then serve warm.',
        'cue', 'Both sides are golden and the middle feels set.'
      )
    ),
    11,
    5,
    26,
    'stove',
    'vegetarian',
    array['breakfast', 'stove', 'vegetarian']
  )
on conflict (id) do nothing;

insert into public.campus_menu_items (
  id,
  name,
  vendor,
  category,
  price_zar,
  notes
)
values
  (
    'campus-chicken-mayo-sandwich',
    'Chicken mayo sandwich',
    'Campus Cafe',
    'Sandwiches',
    38,
    'Filling lunch option from the starter menu data.'
  ),
  (
    'campus-veg-curry-rice',
    'Veg curry and rice',
    'Upper Campus Canteen',
    'Hot meals',
    45,
    'Warm vegetarian plate with rice.'
  ),
  (
    'campus-chicken-schnitzel',
    'Chicken schnitzel plate',
    'Main Food Court',
    'Hot meals',
    68,
    'Bigger plate for days when the budget can stretch.'
  )
on conflict (id) do nothing;

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

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'inuni-avatars',
  'inuni-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can read profile photo objects"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'inuni-avatars');

create policy "Active users can upload own profile photo objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'inuni-avatars'
  and public.current_profile_can_participate()
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Active users can delete own profile photo objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'inuni-avatars'
  and public.current_profile_can_participate()
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- This view intentionally exposes only public profile fields. The base profiles
-- table remains restricted to the profile owner and administrators.
create view public.public_profiles
with (security_barrier = true)
as
select id, username, display_name, is_uct_verified, created_at, avatar_path
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
revoke all on function public.update_own_display_name(text) from public;
revoke all on function public.update_own_avatar(text) from public;
revoke all on function public.set_user_ban(uuid, boolean, text) from public;

grant execute on function public.current_profile_is_admin() to authenticated;
grant execute on function public.current_profile_can_participate() to authenticated;
grant execute on function public.current_profile_daily_upload_bytes() to authenticated;
grant execute on function public.refresh_file_report_count(uuid) to authenticated;
grant execute on function public.update_own_profile(text, text) to authenticated;
grant execute on function public.update_own_display_name(text) to authenticated;
grant execute on function public.update_own_avatar(text) to authenticated;
grant execute on function public.set_user_ban(uuid, boolean, text) to authenticated;

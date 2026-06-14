-- InUni Supabase setup
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 120),
  content text not null check (char_length(trim(content)) > 0),
  category text not null check (
    category in ('Study', 'Campus Life', 'Questions', 'Lost & Found', 'Confessions', 'General')
  ),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'Community report',
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at);
create index if not exists reports_post_id_idx on public.reports (post_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles"
on public.profiles for select
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
on public.posts for select
using (true);

drop policy if exists "Logged-in users can create posts" on public.posts;
create policy "Logged-in users can create posts"
on public.posts for insert
with check (auth.uid() = author_id);

drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
on public.posts for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
on public.posts for delete
using (auth.uid() = author_id);

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
on public.comments for select
using (true);

drop policy if exists "Logged-in users can create comments" on public.comments;
create policy "Logged-in users can create comments"
on public.comments for insert
with check (auth.uid() = author_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
on public.comments for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
on public.comments for delete
using (auth.uid() = author_id);

drop policy if exists "Anyone can read post likes" on public.post_likes;
create policy "Anyone can read post likes"
on public.post_likes for select
using (true);

drop policy if exists "Logged-in users can like posts" on public.post_likes;
create policy "Logged-in users can like posts"
on public.post_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own likes" on public.post_likes;
create policy "Users can remove their own likes"
on public.post_likes for delete
using (auth.uid() = user_id);

drop policy if exists "Users can report posts" on public.reports;
create policy "Users can report posts"
on public.reports for insert
with check (auth.uid() = reporter_id);

drop policy if exists "Users can read their own reports" on public.reports;
create policy "Users can read their own reports"
on public.reports for select
using (auth.uid() = reporter_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

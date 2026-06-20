-- Add editable profile identity fields and public profile photos.
-- Run this on existing Supabase projects after the files/public metadata migrations.

alter table public.profiles
add column if not exists avatar_path text
check (
  avatar_path is null
  or char_length(trim(avatar_path)) between 1 and 300
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

drop policy if exists "Anyone can read profile photo objects"
on storage.objects;
create policy "Anyone can read profile photo objects"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'inuni-avatars');

drop policy if exists "Active users can upload own profile photo objects"
on storage.objects;
create policy "Active users can upload own profile photo objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'inuni-avatars'
  and public.current_profile_can_participate()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Active users can delete own profile photo objects"
on storage.objects;
create policy "Active users can delete own profile photo objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'inuni-avatars'
  and public.current_profile_can_participate()
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace view public.public_profiles
with (security_barrier = true)
as
select id, username, display_name, is_uct_verified, created_at, avatar_path
from public.profiles;

grant select on table public.public_profiles to anon, authenticated;

revoke all on function public.update_own_profile(text, text) from public;
revoke all on function public.update_own_display_name(text) from public;
revoke all on function public.update_own_avatar(text) from public;

grant execute on function public.update_own_profile(text, text) to authenticated;
grant execute on function public.update_own_display_name(text) to authenticated;
grant execute on function public.update_own_avatar(text) to authenticated;

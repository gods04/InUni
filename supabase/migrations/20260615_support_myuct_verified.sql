-- Add verified status support for UCT student email addresses.
-- Safe to run on an existing InUni Supabase project.

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

update public.profiles as profile
set is_uct_verified = public.is_uct_email(
  auth_user.email,
  auth_user.email_confirmed_at
)
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.is_uct_verified is distinct from public.is_uct_email(
    auth_user.email,
    auth_user.email_confirmed_at
  );

revoke all on function public.is_uct_email(text, timestamptz) from public;

select
  public.is_uct_email('student@uct.ac.za', now()) as accepts_uct,
  public.is_uct_email('student@myuct.ac.za', now()) as accepts_myuct,
  not public.is_uct_email('student@gmail.com', now()) as rejects_other_domain,
  not public.is_uct_email('student@myuct.ac.za', null) as requires_confirmation;

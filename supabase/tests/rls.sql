-- Run after supabase/schema.sql in a disposable Supabase project.
-- Replace UUID values with users created in auth.users before running.

-- Required actors:
-- student_id: normal student
-- banned_id: banned student
-- admin_id: admin

-- Verify manually with SET LOCAL request.jwt.claim.sub and authenticated role:
-- 1. anon can SELECT posts/comments but cannot INSERT.
-- 2. student can INSERT a post/comment/report for their own ID.
-- 3. banned user cannot INSERT posts/comments/reports.
-- 4. student cannot SELECT all reports or update another profile's role/ban.
-- 5. admin can SELECT reports, update report status, delete posts/comments,
--    and update is_banned/ban_reason but cannot change a user's id.

select
  'profiles' as table_name,
  count(*) as policy_count
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
union all
select 'posts', count(*) from pg_policies
where schemaname = 'public' and tablename = 'posts'
union all
select 'comments', count(*) from pg_policies
where schemaname = 'public' and tablename = 'comments'
union all
select 'reports', count(*) from pg_policies
where schemaname = 'public' and tablename = 'reports';

select
  to_regprocedure('public.current_profile_is_admin()') is not null
    as has_admin_helper,
  to_regprocedure('public.current_profile_can_participate()') is not null
    as has_participation_helper,
  to_regprocedure('public.set_user_ban(uuid,boolean,text)') is not null
    as has_ban_rpc,
  to_regprocedure('public.update_own_profile(text,text)') is not null
    as has_profile_rpc;

select
  public.is_uct_email('student@uct.ac.za', now()) as accepts_uct,
  public.is_uct_email('student@myuct.ac.za', now()) as accepts_myuct,
  not public.is_uct_email('student@gmail.com', now()) as rejects_other_domain,
  not public.is_uct_email('student@myuct.ac.za', null) as requires_confirmation;

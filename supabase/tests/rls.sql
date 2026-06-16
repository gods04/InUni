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
-- 6. anon cannot select, insert, or report files.
-- 7. active authenticated user can insert own file metadata within 100MB
--    and the 1GB daily quota.
-- 8. banned user cannot insert file metadata, download file metadata, or file reports.
-- 9. user cannot report the same file twice.
-- 10. three distinct reporters move the file to hidden_by_reports.
-- 11. admin can approve shared file links and delete files.
-- 12. normal users cannot update shared_status.
-- 13. active users can upload to their own storage prefix, while signed URL
--     access remains tied to available file metadata.

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
where schemaname = 'public' and tablename = 'reports'
union all
select 'files', count(*)
from pg_policies
where schemaname = 'public' and tablename = 'files'
union all
select 'file_links', count(*)
from pg_policies
where schemaname = 'public' and tablename = 'file_links'
union all
select 'file_reports', count(*)
from pg_policies
where schemaname = 'public' and tablename = 'file_reports';

select 'storage.objects' as table_name, count(*) as policy_count
from pg_policies
where schemaname = 'storage' and tablename = 'objects';

select
  to_regprocedure('public.current_profile_is_admin()') is not null
    as has_admin_helper,
  to_regprocedure('public.current_profile_can_participate()') is not null
    as has_participation_helper,
  to_regprocedure('public.current_profile_daily_upload_bytes()') is not null
    as has_file_quota_helper,
  to_regprocedure('public.refresh_file_report_count(uuid)') is not null
    as has_file_report_count_helper,
  to_regprocedure('public.set_user_ban(uuid,boolean,text)') is not null
    as has_ban_rpc,
  to_regprocedure('public.update_own_profile(text,text)') is not null
    as has_profile_rpc;

select
  public.is_uct_email('student@uct.ac.za', now()) as accepts_uct,
  public.is_uct_email('student@myuct.ac.za', now()) as accepts_myuct,
  not public.is_uct_email('student@gmail.com', now()) as rejects_other_domain,
  not public.is_uct_email('student@myuct.ac.za', null) as requires_confirmation;

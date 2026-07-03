-- Seed useful forum discussions as normal posts.
-- Safe to run on an existing InUni Supabase project, even if the post-slug
-- migration has not been applied yet. These posts use fixed seed-owner accounts
-- so they do not appear to be posted by the site admin. No fake comments are
-- inserted.

create extension if not exists "pgcrypto";

alter table public.posts
add column if not exists slug text;

alter table public.posts
drop constraint if exists posts_slug_key;

drop index if exists public.posts_slug_key;

with normalized as (
  select
    id,
    coalesce(
      nullif(
        trim(
          both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')
        ),
        ''
      ),
      'post'
    ) as base_slug,
    row_number() over (
      partition by coalesce(
        nullif(
          trim(
            both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')
          ),
          ''
        ),
        'post'
      )
      order by created_at, id
    ) as slug_rank
  from public.posts
)
update public.posts
set slug = case
  when normalized.slug_rank = 1 then normalized.base_slug
  else normalized.base_slug || '-' || normalized.slug_rank::text
end
from normalized
where public.posts.id = normalized.id;

alter table public.posts
alter column slug set not null;

alter table public.posts
drop constraint if exists posts_slug_check;

alter table public.posts
add constraint posts_slug_check
check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.posts
add constraint posts_slug_key unique (slug);

with seed_owners (
  id,
  email,
  username,
  display_name
) as (
  values
    (
      '70000000-0000-4000-8000-000000000001'::uuid,
      'seed-maya@inuni.local',
      'seed_maya',
      'Maya'
    ),
    (
      '70000000-0000-4000-8000-000000000002'::uuid,
      'seed-jeff@inuni.local',
      'seed_jeff',
      'Jeff'
    ),
    (
      '70000000-0000-4000-8000-000000000003'::uuid,
      'seed-bob@inuni.local',
      'seed_bob',
      'Bob'
    ),
    (
      '70000000-0000-4000-8000-000000000004'::uuid,
      'seed-priya@inuni.local',
      'seed_priya',
      'Priya'
    ),
    (
      '70000000-0000-4000-8000-000000000005'::uuid,
      'seed-lena@inuni.local',
      'seed_lena',
      'Lena'
    ),
    (
      '70000000-0000-4000-8000-000000000006'::uuid,
      'seed-sam@inuni.local',
      'seed_sam',
      'Sam'
    ),
    (
      '70000000-0000-4000-8000-000000000007'::uuid,
      'seed-noah@inuni.local',
      'seed_noah',
      'Noah'
    )
)
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  seed_owners.id,
  'authenticated',
  'authenticated',
  seed_owners.email,
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username',
    seed_owners.username,
    'display_name',
    seed_owners.display_name
  ),
  now(),
  now()
from seed_owners
on conflict (id) do update
set
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

with seed_owners (
  id,
  username,
  display_name
) as (
  values
    ('70000000-0000-4000-8000-000000000001'::uuid, 'seed_maya', 'Maya'),
    ('70000000-0000-4000-8000-000000000002'::uuid, 'seed_jeff', 'Jeff'),
    ('70000000-0000-4000-8000-000000000003'::uuid, 'seed_bob', 'Bob'),
    ('70000000-0000-4000-8000-000000000004'::uuid, 'seed_priya', 'Priya'),
    ('70000000-0000-4000-8000-000000000005'::uuid, 'seed_lena', 'Lena'),
    ('70000000-0000-4000-8000-000000000006'::uuid, 'seed_sam', 'Sam'),
    ('70000000-0000-4000-8000-000000000007'::uuid, 'seed_noah', 'Noah')
)
insert into public.profiles (
  id,
  username,
  display_name,
  is_uct_verified,
  role,
  is_banned
)
select
  seed_owners.id,
  seed_owners.username,
  seed_owners.display_name,
  false,
  'student',
  false
from seed_owners
on conflict (id) do update
set
  username = excluded.username,
  display_name = excluded.display_name,
  is_uct_verified = false,
  role = 'student',
  is_banned = false,
  ban_reason = null;

with seed_posts (
  id,
  author_id,
  title,
  slug,
  category,
  content,
  is_anonymous
) as (
  values
    (
      '99999999-9999-4999-8999-999999999991'::uuid,
      '70000000-0000-4000-8000-000000000001'::uuid,
      'Engineering handbook: where do I check course rules?',
      'engineering-handbook-where-do-i-check-course-rules',
      'General',
      concat_ws(E'\n\n',
        'Use this thread for UCT Engineering and the Built Environment handbook questions.',
        'The undergraduate handbook is the place to check curriculum rules, course codes, progression rules and programme structure:',
        'https://uct.ac.za/sites/default/files/media/documents/2026-ebe-handbook-7a-final-web.pdf',
        'For entry requirements and programme summaries, the undergraduate prospectus is usually easier to start with:',
        'https://uct.ac.za/students/prospective-students/undergraduate-prospectus'
      ),
      false
    ),
    (
      '99999999-9999-4999-8999-999999999992'::uuid,
      '70000000-0000-4000-8000-000000000002'::uuid,
      'Commerce handbook link for BCom and BBusSc',
      'commerce-handbook-link-for-bcom-and-bbussc',
      'General',
      concat_ws(E'\n\n',
        'Use this thread for UCT Commerce handbook questions, especially BCom and BBusSc rules.',
        'Commerce undergraduate handbook:',
        'https://uct.ac.za/sites/default/files/media/documents/2026-commerce-handbook-6a-final-web.pdf',
        'Undergraduate prospectus:',
        'https://uct.ac.za/students/prospective-students/undergraduate-prospectus'
      ),
      false
    ),
    (
      '99999999-9999-4999-8999-999999999993'::uuid,
      '70000000-0000-4000-8000-000000000003'::uuid,
      'Open Day planning: which faculty talks are worth prioritising?',
      'open-day-planning-which-faculty-talks-are-worth-prioritising',
      'Questions',
      concat_ws(E'\n\n',
        'Use this thread to share practical UCT Open Day or campus-visit planning advice.',
        'If someone is deciding between faculties, what should they prioritise: faculty talks, residence information, campus tours, student-life stops, or walking around the actual buildings?'
      ),
      false
    ),
    (
      '99999999-9999-4999-8999-999999999994'::uuid,
      '70000000-0000-4000-8000-000000000004'::uuid,
      'Club and society events: what is actually beginner-friendly?',
      'club-and-society-events-what-is-actually-beginner-friendly',
      'Campus Life',
      concat_ws(E'\n\n',
        'Use this thread to recommend UCT clubs, societies, practices, talks, and socials that feel welcoming for beginners.',
        'Mention what made it easy to arrive alone, whether the event had a clear activity, and what new students should know before going.'
      ),
      false
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      '70000000-0000-4000-8000-000000000001'::uuid,
      'Exam study spaces: what is actually calm late at night?',
      'exam-study-spaces-what-is-actually-calm-late-at-night',
      'Study',
      concat_ws(E'\n\n',
        'Use this thread for late-night UCT study space advice.',
        'Which spaces are calm, have plugs, feel safe when leaving late, and are realistic during exam season? Mention times, campus area, transport, and anything students should plan before going.'
      ),
      false
    ),
    (
      '22222222-2222-4222-8222-222222222222'::uuid,
      '70000000-0000-4000-8000-000000000002'::uuid,
      'Late-night safety checklist before leaving campus',
      'late-night-safety-checklist-before-leaving-campus',
      'Campus Life',
      concat_ws(E'\n\n',
        'Use this thread to share practical late-night campus safety habits.',
        'Useful reminders can include saving the CPS toll-free number, using shuttles where possible, avoiding walking alone, keeping a student card nearby, and planning the route before leaving a study space.'
      ),
      false
    ),
    (
      '33333333-3333-4333-8333-333333333333'::uuid,
      '70000000-0000-4000-8000-000000000003'::uuid,
      'Has the UCT Shuttle app been reliable for ETAs?',
      'has-the-uct-shuttle-app-been-reliable-for-etas',
      'Questions',
      concat_ws(E'\n\n',
        'Use this thread to compare recent UCT Shuttle app ETA experiences.',
        'Is the ETA close enough to trust, or should students still add a buffer before lectures, exams, and late trips between campus areas?'
      ),
      false
    ),
    (
      '44444444-4444-4444-8444-444444444444'::uuid,
      '70000000-0000-4000-8000-000000000005'::uuid,
      'Writing Centre before essay deadlines: worth it?',
      'writing-centre-before-essay-deadlines-worth-it',
      'Study',
      concat_ws(E'\n\n',
        'Use this thread for UCT Writing Centre experiences and advice.',
        'When is it worth booking, what kind of feedback should students expect, and is it more useful with a rough outline or a full draft?'
      ),
      false
    ),
    (
      '55555555-5555-4555-8555-555555555555'::uuid,
      '70000000-0000-4000-8000-000000000004'::uuid,
      'Student Wellness: what is the fastest way to book help?',
      'student-wellness-what-is-the-fastest-way-to-book-help',
      'Questions',
      concat_ws(E'\n\n',
        'Use this thread to share practical Student Wellness booking advice.',
        'Students can mention whether the UCT App, calling, visiting a clinic, or using the Student Careline felt like the best first step for different situations.'
      ),
      false
    ),
    (
      '66666666-6666-4666-8666-666666666666'::uuid,
      '70000000-0000-4000-8000-000000000006'::uuid,
      'Mini exam-day checklist for campus',
      'mini-exam-day-checklist-for-campus',
      'General',
      concat_ws(E'\n\n',
        'Use this thread to build a practical UCT exam-day checklist.',
        'Helpful reminders can include student card, venue checks, stationery, water, phone battery, shuttle planning, food, and where to wait or revise before writing.'
      ),
      false
    ),
    (
      '77777777-7777-4777-8777-777777777777'::uuid,
      '70000000-0000-4000-8000-000000000007'::uuid,
      'Lost and found: what details help people return items?',
      'lost-and-found-what-details-help-people-return-items',
      'Lost & Found',
      concat_ws(E'\n\n',
        'Use this thread to share tips for lost-and-found posts at UCT.',
        'What details help without exposing too much private information? Mention useful locations, security desks, item descriptions, proof of ownership, and how people usually return things.'
      ),
      false
    ),
    (
      '88888888-8888-4888-8888-888888888888'::uuid,
      '70000000-0000-4000-8000-000000000001'::uuid,
      'Exam reset advice: how do you recover before the next paper?',
      'exam-reset-advice-how-do-you-recover-before-the-next-paper',
      'Confessions',
      concat_ws(E'\n\n',
        'Use this thread for practical advice after a difficult exam.',
        'What helps students reset before the next paper: sleep, planning, support, breathing routines, arriving early, starting with easier questions, or avoiding stressful post-exam comparisons?'
      ),
      false
    )
)
insert into public.posts (
  id,
  author_id,
  title,
  slug,
  content,
  category,
  is_anonymous
)
select
  seed_posts.id,
  seed_posts.author_id,
  seed_posts.title,
  seed_posts.slug,
  seed_posts.content,
  seed_posts.category,
  seed_posts.is_anonymous
from seed_posts
on conflict (id) do update
set
  author_id = excluded.author_id,
  title = excluded.title,
  slug = excluded.slug,
  content = excluded.content,
  category = excluded.category,
  is_anonymous = excluded.is_anonymous;

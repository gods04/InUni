alter table public.posts
drop constraint if exists posts_category_check;

update public.posts
set category = 'Academics'
where category = 'Study';

alter table public.posts
add constraint posts_category_check
check (
  category in (
    'Academics',
    'Campus Life',
    'Questions',
    'Lost & Found',
    'Confessions',
    'General'
  )
);

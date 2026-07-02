alter table public.posts
add column if not exists slug text;

alter table public.posts
drop constraint if exists posts_slug_key;

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

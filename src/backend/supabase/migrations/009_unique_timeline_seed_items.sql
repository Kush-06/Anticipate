-- Make timeline writes idempotent per user.
-- Existing duplicate rows are collapsed before the uniqueness rules are added.

alter table public.user_timeline_items
  drop constraint if exists user_timeline_items_user_key_source_unique;

drop index if exists public.user_timeline_items_user_title_active_unique;

with duplicate_keys as (
  select
    id,
    row_number() over (
      partition by user_id, item_key, source
      order by created_at asc, id asc
    ) as rn
  from public.user_timeline_items
)
delete from public.user_timeline_items uti
using duplicate_keys
where uti.id = duplicate_keys.id
  and duplicate_keys.rn > 1;

with duplicate_titles as (
  select
    id,
    row_number() over (
      partition by user_id, lower(regexp_replace(btrim(title), '\s+', ' ', 'g'))
      order by created_at asc, id asc
    ) as rn
  from public.user_timeline_items
  where is_dismissed = false
)
delete from public.user_timeline_items uti
using duplicate_titles
where uti.id = duplicate_titles.id
  and duplicate_titles.rn > 1;

alter table public.user_timeline_items
  add constraint user_timeline_items_user_key_source_unique
  unique (user_id, item_key, source);

create unique index if not exists user_timeline_items_user_title_active_unique
  on public.user_timeline_items (
    user_id,
    lower(regexp_replace(btrim(title), '\s+', ' ', 'g'))
  )
  where is_dismissed = false;

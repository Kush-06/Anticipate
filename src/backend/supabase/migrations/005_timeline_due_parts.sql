-- Timeline events now require month/year, with day optional.
-- Backfill existing rows from due_date when present; otherwise use created_at so
-- NOT NULL constraints can be applied without dropping existing user events.

alter table public.user_timeline_items
  add column if not exists due_year integer,
  add column if not exists due_month smallint,
  add column if not exists due_day smallint;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_timeline_items'
      and column_name = 'due_date'
  ) then
    update public.user_timeline_items
    set
      due_year = extract(year from coalesce(due_date, created_at))::integer,
      due_month = extract(month from coalesce(due_date, created_at))::smallint,
      due_day = case
        when due_date is null then null
        else extract(day from due_date)::smallint
      end
    where due_year is null
       or due_month is null;
  else
    update public.user_timeline_items
    set
      due_year = extract(year from created_at)::integer,
      due_month = extract(month from created_at)::smallint
    where due_year is null
       or due_month is null;
  end if;
end $$;

alter table public.user_timeline_items
  alter column due_year set not null,
  alter column due_month set not null,
  add constraint user_timeline_items_due_year_check check (due_year between 2000 and 2100),
  add constraint user_timeline_items_due_month_check check (due_month between 1 and 12),
  add constraint user_timeline_items_due_day_check check (due_day is null or due_day between 1 and 31);

alter table public.user_timeline_items
  drop column if exists due_date;

drop index if exists public.idx_timeline_user_group;
create index idx_timeline_user_group
  on public.user_timeline_items(user_id, spine_group, due_year, due_month, due_day);

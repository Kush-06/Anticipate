create table user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_subtopic_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table user_progress enable row level security;

create policy "users_own_progress_select" on user_progress
  for select using (auth.uid() = user_id);

create policy "users_own_progress_insert" on user_progress
  for insert with check (auth.uid() = user_id);

create policy "users_own_progress_update" on user_progress
  for update using (auth.uid() = user_id);

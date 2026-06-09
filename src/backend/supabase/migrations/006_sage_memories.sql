create table public.sage_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.sage_memories enable row level security;

create policy "Users can manage their own memories"
  on public.sage_memories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_sage_memories_user_id
  on public.sage_memories(user_id, created_at desc);

create table if not exists public.sage_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context text not null check (context in ('home', 'lesson')),
  context_id text,
  title text not null default 'New Sage chat',
  messages jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sage_conversations_user_context
  on public.sage_conversations(user_id, context, context_id, updated_at desc);

alter table public.sage_conversations enable row level security;

create policy "sage_conversations_select" on public.sage_conversations
  for select using (auth.uid() = user_id);

create policy "sage_conversations_insert" on public.sage_conversations
  for insert with check (auth.uid() = user_id);

create policy "sage_conversations_update" on public.sage_conversations
  for update using (auth.uid() = user_id);

create policy "sage_conversations_delete" on public.sage_conversations
  for delete using (auth.uid() = user_id);

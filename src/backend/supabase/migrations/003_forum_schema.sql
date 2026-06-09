-- Create forum_threads table
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null,
  title text not null,
  created_at timestamptz not null default now(),
  author_nickname text not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.forum_threads enable row level security;

-- Policies for forum_threads
create policy "forum_threads_read" on public.forum_threads
  for select using (true);

create policy "forum_threads_write" on public.forum_threads
  for insert with check (auth.uid() is not distinct from user_id);

create policy "forum_threads_delete" on public.forum_threads
  for delete using (auth.uid() = user_id);

-- Create forum_messages table
create table if not exists public.forum_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  author_nickname text not null,
  user_id uuid references auth.users(id) on delete cascade,
  is_sage_reply boolean not null default false,
  parent_id uuid references public.forum_messages(id) on delete set null,
  parent_content text,
  parent_nickname text
);

-- Enable RLS
alter table public.forum_messages enable row level security;

-- Policies for forum_messages
create policy "forum_messages_read" on public.forum_messages
  for select using (true);

create policy "forum_messages_write" on public.forum_messages
  for insert with check (auth.uid() is not distinct from user_id or is_sage_reply = true);

create policy "forum_messages_delete" on public.forum_messages
  for delete using (auth.uid() = user_id);

-- Enable Realtime for these tables by adding them to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forum_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_threads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forum_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_messages;
  END IF;
END $$;


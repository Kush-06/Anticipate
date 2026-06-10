-- Create forum_message_reactions table
create table if not exists public.forum_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.forum_messages(id) on delete cascade,
  reactor_id text not null,
  created_at timestamptz not null default now(),
  constraint forum_message_reactions_unique unique (message_id, reactor_id)
);

create index if not exists idx_forum_message_reactions_message_id
  on public.forum_message_reactions(message_id);

-- Required so realtime DELETE payloads include message_id/reactor_id (not just id),
-- which the client uses to update reaction counts for other viewers.
alter table public.forum_message_reactions replica identity full;

-- Enable RLS
alter table public.forum_message_reactions enable row level security;

-- Policies for forum_message_reactions
-- Anonymous-first trust model (matches forum_threads/forum_messages read policies and
-- the is_sage_reply branch of forum_messages_write): reactor_id may be an auth user id
-- or a generated anonymous device id, so it cannot be checked against auth.uid().
create policy "forum_message_reactions_read" on public.forum_message_reactions
  for select using (true);

create policy "forum_message_reactions_insert" on public.forum_message_reactions
  for insert with check (true);

create policy "forum_message_reactions_delete" on public.forum_message_reactions
  for delete using (true);

-- Enable Realtime for this table by adding it to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forum_message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_message_reactions;
  END IF;
END $$;

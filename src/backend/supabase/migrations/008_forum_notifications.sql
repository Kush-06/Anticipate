-- Create forum_notifications table
create table if not exists public.forum_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('thread_reply', 'message_reply', 'message_like')),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  message_id uuid references public.forum_messages(id) on delete cascade,
  actor_nickname text not null,
  preview text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_forum_notifications_recipient
  on public.forum_notifications(recipient_id, created_at desc);

-- Enable RLS
alter table public.forum_notifications enable row level security;

-- Policies for forum_notifications
-- Recipients are always authenticated users (anonymous posters have no stable
-- cross-session identity to deliver notifications to), so read/update can be
-- scoped to auth.uid(). Insert stays open like forum_message_reactions: the
-- actor triggering a notification is often a different (possibly anonymous)
-- user than the recipient, matching the forum's anonymous-first trust model.
create policy "forum_notifications_read" on public.forum_notifications
  for select using (auth.uid() = recipient_id);

create policy "forum_notifications_insert" on public.forum_notifications
  for insert with check (true);

create policy "forum_notifications_update" on public.forum_notifications
  for update using (auth.uid() = recipient_id);

-- Enable Realtime for this table by adding it to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forum_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_notifications;
  END IF;
END $$;

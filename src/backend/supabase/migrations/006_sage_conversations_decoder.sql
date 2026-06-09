-- Migration: Allow 'decoder' context in sage_conversations
ALTER TABLE public.sage_conversations
  DROP CONSTRAINT IF EXISTS sage_conversations_context_check;

ALTER TABLE public.sage_conversations
  ADD CONSTRAINT sage_conversations_context_check
  CHECK (context IN ('home', 'lesson', 'decoder'));

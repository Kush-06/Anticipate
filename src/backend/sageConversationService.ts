import { supabase } from './supabaseClient'
import type { SageHistoryMessage } from '../frontend/services/sageToolService'

export type SageConversationContext = 'home' | 'lesson' | 'decoder'

export interface SageDisplayMessage {
  role: 'user' | 'assistant'
  content: string
  lessonCards?: Array<{
    topicId: string
    subTopicId: string
    title: string
    reason: string
  }>
  toolActivity?: string[]
}

export interface SageConversation {
  id: string
  userId: string | null
  context: SageConversationContext
  contextId: string | null
  title: string
  messages: SageDisplayMessage[]
  history: SageHistoryMessage[]
  createdAt: string
  updatedAt: string
}

interface SageConversationRow {
  id: string
  user_id: string | null
  context: SageConversationContext
  context_id: string | null
  title: string
  messages: SageDisplayMessage[]
  history: SageHistoryMessage[]
  created_at: string
  updated_at: string
}

function rowToConversation(row: SageConversationRow): SageConversation {
  return {
    id: row.id,
    userId: row.user_id,
    context: row.context,
    contextId: row.context_id,
    title: row.title,
    messages: row.messages ?? [],
    history: row.history ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function nowIso() {
  return new Date().toISOString()
}

function createLocalId() {
  if ('crypto' in window && 'randomUUID' in window.crypto) return window.crypto.randomUUID()
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function titleFromMessages(messages: SageDisplayMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content.trim()
  if (!firstUserMessage) return 'New Sage chat'
  return firstUserMessage.length > 54 ? `${firstUserMessage.slice(0, 51)}...` : firstUserMessage
}

function localStorageKey(context: SageConversationContext, contextId?: string | null) {
  return `anticipate_sage_conversations_${context}_${contextId ?? 'global'}`
}

function readLocalConversations(context: SageConversationContext, contextId?: string | null): SageConversation[] {
  try {
    const raw = localStorage.getItem(localStorageKey(context, contextId))
    if (!raw) return []
    return JSON.parse(raw) as SageConversation[]
  } catch {
    return []
  }
}

function writeLocalConversations(context: SageConversationContext, contextId: string | null | undefined, conversations: SageConversation[]) {
  localStorage.setItem(localStorageKey(context, contextId), JSON.stringify(conversations))
}

export async function fetchSageConversations(
  userId: string | null,
  context: SageConversationContext,
  contextId?: string | null,
): Promise<SageConversation[]> {
  if (!userId) return readLocalConversations(context, contextId)

  let query = supabase
    .from('sage_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('context', context)
    .order('updated_at', { ascending: false })

  query = contextId ? query.eq('context_id', contextId) : query.is('context_id', null)

  const { data, error } = await query
  if (error) throw new Error(`fetchSageConversations failed: ${error.message}`)
  return ((data ?? []) as SageConversationRow[]).map(rowToConversation)
}

export async function upsertSageConversation(
  userId: string | null,
  conversation: {
    id?: string | null
    context: SageConversationContext
    contextId?: string | null
    title?: string
    messages: SageDisplayMessage[]
    history: SageHistoryMessage[]
  },
): Promise<SageConversation> {
  const updatedAt = nowIso()
  const title = conversation.title?.trim() || titleFromMessages(conversation.messages)

  if (!userId) {
    const existing = readLocalConversations(conversation.context, conversation.contextId)
    const id = conversation.id ?? createLocalId()
    const previous = existing.find((item) => item.id === id)
    const next: SageConversation = {
      id,
      userId: null,
      context: conversation.context,
      contextId: conversation.contextId ?? null,
      title,
      messages: conversation.messages,
      history: conversation.history,
      createdAt: previous?.createdAt ?? updatedAt,
      updatedAt,
    }
    writeLocalConversations(
      conversation.context,
      conversation.contextId,
      [next, ...existing.filter((item) => item.id !== id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    )
    return next
  }

  const row = {
    id: conversation.id ?? undefined,
    user_id: userId,
    context: conversation.context,
    context_id: conversation.contextId ?? null,
    title,
    messages: conversation.messages,
    history: conversation.history,
    updated_at: updatedAt,
  }

  const { data, error } = await supabase
    .from('sage_conversations')
    .upsert(row)
    .select()
    .single()

  if (error) throw new Error(`upsertSageConversation failed: ${error.message}`)
  return rowToConversation(data as SageConversationRow)
}

export function getSageConversationTitle(messages: SageDisplayMessage[]) {
  return titleFromMessages(messages)
}

import { supabase } from './supabaseClient'

export interface SageMemory {
  id: string
  userId: string
  content: string
  createdAt: string
}

interface SageMemoryRow {
  id: string
  user_id: string
  content: string
  created_at: string
}

function rowToMemory(row: SageMemoryRow): SageMemory {
  return { id: row.id, userId: row.user_id, content: row.content, createdAt: row.created_at }
}

export async function fetchSageMemories(userId: string): Promise<SageMemory[]> {
  const { data, error } = await supabase
    .from('sage_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`fetchSageMemories failed: ${error.message}`)
  return ((data ?? []) as SageMemoryRow[]).map(rowToMemory)
}

export async function addSageMemory(userId: string, content: string): Promise<SageMemory> {
  const { data, error } = await supabase
    .from('sage_memories')
    .insert({ user_id: userId, content })
    .select()
    .single()
  if (error) throw new Error(`addSageMemory failed: ${error.message}`)
  return rowToMemory(data as SageMemoryRow)
}

export async function deleteSageMemory(id: string): Promise<void> {
  const { error } = await supabase.from('sage_memories').delete().eq('id', id)
  if (error) throw new Error(`deleteSageMemory failed: ${error.message}`)
}

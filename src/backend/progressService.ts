import { supabase } from './supabaseClient'

export async function fetchProgress(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_progress')
    .select('completed_subtopic_ids')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as { completed_subtopic_ids: string[] } | null)?.completed_subtopic_ids ?? []
}

export async function saveProgress(userId: string, ids: string[]): Promise<void> {
  await supabase.from('user_progress').upsert({
    user_id: userId,
    completed_subtopic_ids: ids,
    updated_at: new Date().toISOString(),
  })
}

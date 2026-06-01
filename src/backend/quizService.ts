import { supabase } from './supabaseClient'
import type { QuizQuestion } from '../frontend/data/topics'

export async function fetchQuizQuestions(
  topicId: string,
  subtopicId: string | null
): Promise<QuizQuestion[]> {
  let query = supabase
    .from('quiz_questions')
    .select('id, question, options, correct_answer, explanation')
    .eq('topic_id', topicId)
    .order('sort_order')

  query = subtopicId !== null
    ? query.eq('subtopic_id', subtopicId)
    : query.is('subtopic_id', null)

  const { data, error } = await query
  if (error || !data) return []

  return data.map(row => ({
    id: row.id as string,
    question: row.question as string,
    options: row.options as string[],
    correctAnswer: row.correct_answer as number,
    explanation: row.explanation as string,
  }))
}

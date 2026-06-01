import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizData {
  [topicId: string]: {
    subtopics: Record<string, QuizQuestion[]>
    topicQuiz: QuizQuestion[]
  }
}

const data: QuizData = JSON.parse(
  readFileSync(resolve('./scripts/quiz-data.json'), 'utf-8')
)

type Row = {
  id: string
  topic_id: string
  subtopic_id: string | null
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  sort_order: number
}

const rows: Row[] = []

for (const [topicId, topicData] of Object.entries(data)) {
  for (const [subtopicId, questions] of Object.entries(topicData.subtopics)) {
    questions.forEach((q, i) => {
      rows.push({
        id: q.id,
        topic_id: topicId,
        subtopic_id: subtopicId,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        sort_order: i,
      })
    })
  }
  topicData.topicQuiz.forEach((q, i) => {
    rows.push({
      id: q.id,
      topic_id: topicId,
      subtopic_id: null,
      question: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      sort_order: i,
    })
  })
}

const { error } = await supabase.from('quiz_questions').upsert(rows)
if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}
console.log(`Seeded ${rows.length} questions.`)

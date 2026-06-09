import { supabase } from './supabaseClient'
import { sendChatMessage } from '../frontend/services/aiChatService'
import { topics } from '../frontend/data/topics'

export interface ForumThread {
  id: string
  topic_id: string
  title: string
  created_at: string
  author_nickname: string
  user_id?: string | null
}

export interface ForumMessage {
  id: string
  thread_id: string
  content: string
  created_at: string
  author_nickname: string
  user_id?: string | null
  is_sage_reply: boolean
  parent_id?: string | null
  parent_content?: string | null
  parent_nickname?: string | null
}

export interface SageValidationResult {
  relevance: 'relevant' | 'off_topic'
  bestTopicId: string | null
  answeredInLesson: {
    topicId: string
    subTopicId: string
    lessonTitle: string
  } | null
  explanation: string
}

const NICKNAME_KEY = 'anticipate_anon_nickname'
const ANIMALS = [
  'Owl', 'Badger', 'Fox', 'Squirrel', 'Panda', 'Koala', 'Otter', 'Hedgehog',
  'Deer', 'Rabbit', 'Robin', 'Beaver', 'Seal', 'Dolphin', 'Penguin', 'Falcon',
  'Puffin', 'Turtle', 'Swan', 'Bear'
]

export function getUserNickname(): string {
  let name = localStorage.getItem(NICKNAME_KEY)
  if (!name) {
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    const num = Math.floor(100 + Math.random() * 900)
    name = `Anonymous ${animal} ${num}`
    localStorage.setItem(NICKNAME_KEY, name)
  }
  return name
}

// PUBLIC SERVICE METHODS

export async function fetchThreads(topicId?: string): Promise<ForumThread[]> {
  let query = supabase.from('forum_threads').select('*').order('created_at', { ascending: false })
  if (topicId) {
    query = query.eq('topic_id', topicId)
  }
  const { data, error } = await query

  if (error) throw new Error(`fetchThreads failed: ${error.message}`)

  return (data ?? []) as ForumThread[]
}

export async function createThread(
  topicId: string,
  title: string,
  content: string,
  userId?: string | null
): Promise<ForumThread> {
  const authorNickname = getUserNickname()
  const now = new Date().toISOString()
  const threadId = crypto.randomUUID()
  
  const newThread: ForumThread = {
    id: threadId,
    topic_id: topicId,
    title,
    created_at: now,
    author_nickname: authorNickname,
    user_id: userId || null
  }

  const firstMessage: ForumMessage = {
    id: crypto.randomUUID(),
    thread_id: threadId,
    content,
    created_at: now,
    author_nickname: authorNickname,
    user_id: userId || null,
    is_sage_reply: false
  }

  const { data, error } = await supabase
    .from('forum_threads')
    .insert({
      id: newThread.id,
      topic_id: newThread.topic_id,
      title: newThread.title,
      created_at: newThread.created_at,
      author_nickname: newThread.author_nickname,
      user_id: newThread.user_id
    })
    .select()
    .single()

  if (error) throw new Error(`createThread failed: ${error.message}`)

  const { error: msgError } = await supabase
    .from('forum_messages')
    .insert({
      id: firstMessage.id,
      thread_id: firstMessage.thread_id,
      content: firstMessage.content,
      created_at: firstMessage.created_at,
      author_nickname: firstMessage.author_nickname,
      user_id: firstMessage.user_id,
      is_sage_reply: firstMessage.is_sage_reply
    })

  if (msgError) {
    await supabase.from('forum_threads').delete().eq('id', newThread.id)
    throw new Error(`createThread first message failed: ${msgError.message}`)
  }

  return data as ForumThread
}

export async function fetchMessages(threadId: string): Promise<ForumMessage[]> {
  const { data, error } = await supabase
    .from('forum_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchMessages failed: ${error.message}`)

  return (data ?? []) as ForumMessage[]
}

export async function fetchReplyCount(threadId: string): Promise<number> {
  const { count, error } = await supabase
    .from('forum_messages')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId)

  if (error) throw new Error(`fetchReplyCount failed: ${error.message}`)
  if (count === null || count === undefined) {
    throw new Error('fetchReplyCount failed: count is null')
  }
  return count
}


export async function createMessage(
  threadId: string,
  content: string,
  userId?: string | null,
  isSageReply: boolean = false,
  parentId?: string | null,
  parentContent?: string | null,
  parentNickname?: string | null
): Promise<ForumMessage> {
  const authorNickname = isSageReply ? 'Sage (AI Tutor)' : getUserNickname()
  const now = new Date().toISOString()
  const newMessage: ForumMessage = {
    id: crypto.randomUUID(),
    thread_id: threadId,
    content,
    created_at: now,
    author_nickname: authorNickname,
    user_id: isSageReply ? null : (userId || null),
    is_sage_reply: isSageReply,
    parent_id: parentId || null,
    parent_content: parentContent || null,
    parent_nickname: parentNickname || null
  }

  const { data, error } = await supabase
    .from('forum_messages')
    .insert({
      id: newMessage.id,
      thread_id: newMessage.thread_id,
      content: newMessage.content,
      created_at: newMessage.created_at,
      author_nickname: newMessage.author_nickname,
      user_id: newMessage.user_id,
      is_sage_reply: newMessage.is_sage_reply,
      parent_id: newMessage.parent_id,
      parent_content: newMessage.parent_content,
      parent_nickname: newMessage.parent_nickname
    })
    .select()
    .single()

  if (error) throw new Error(`createMessage failed: ${error.message}`)
  return data as ForumMessage
}

// SAGE AI MODERATION AND REDIRECT CHECKER
export async function validatePostWithSage(
  currentTopicId: string,
  content: string
): Promise<SageValidationResult> {
  const currentTopic = topics.find(t => t.id === currentTopicId)
  const currentTopicTitle = currentTopic?.title ?? currentTopicId

  // Build the context string of all available topics and lessons
  const topicsContext = topics
    .map(t => {
      const lessons = t.subTopics.map(s => `${s.title} (ID: ${s.id})`).join(', ')
      return `- ${t.title} (ID: "${t.id}"): ${lessons}`
    })
    .join('\n')

  const systemPrompt = `You are Sage, the sharp, friendly personal finance tutor and community moderator for Anticipate.
The user wants to post a question to the "${currentTopicTitle}" (ID: "${currentTopicId}") community forum.
Your job is to look at whatever the user typed in and evaluate it for:
1) RELEVANCE: Is it relevant to personal finance, budgeting, tax, investing, career, renting, buying a home, or general adulting? If it is completely off-topic (e.g. asking about computer hardware, recipes, gaming, trivia, or just typing gibberish), flag it as off_topic.
2) REDIRECT TO ANOTHER FORUM: Is the post relevant, but clearly belongs in another topic's forum? For example, if they are writing in the "Starting Work" forum but are asking about buying a house, you should redirect them to the "buying-a-home" forum.
3) REDIRECT TO LESSON: Is this a basic question that is directly answered in an existing lesson in our course library? For example, if they ask "What is the 50 30 20 rule?", we have an exact lesson for that: "The 50/30/20 Rule" (lesson-03) in the "Starting Work" (starting-work) topic. If so, identify the lesson ID and topic ID.

AVAILABLE TOPICS AND LESSONS:
${topicsContext}

You MUST return a JSON object exactly matching this format, with no extra text or markdown wrapping:
{
  "relevance": "relevant" | "off_topic",
  "bestTopicId": "topic-id-if-different" | null,
  "answeredInLesson": {
    "topicId": "topic-id",
    "subTopicId": "subtopic-id",
    "lessonTitle": "exact-lesson-title"
  } | null,
  "explanation": "Your brief response as Sage. Max 2-3 sentences. Be friendly, encouraging, and clear. If off-topic, say 'I\\'m not quite sure this is relevant to our community...' and explain why. If redirecting to another forum, explain why they should go there. If redirecting to a lesson, say 'I already have a lesson for this!...' and point it out."
}`

  const messages = [
    { role: 'user' as const, content: content }
  ]

  try {
    const reply = await sendChatMessage(systemPrompt, messages)
    
    // Clean reply if model wraps it in markdown code block
    let cleaned = reply.trim()
    if (cleaned.startsWith('```')) {
      // remove first line
      cleaned = cleaned.replace(/^```(json)?\n/, '')
      // remove last line
      cleaned = cleaned.replace(/\n```$/, '')
    }

    const parsed = JSON.parse(cleaned) as SageValidationResult
    return {
      relevance: parsed.relevance ?? 'relevant',
      bestTopicId: parsed.bestTopicId ?? null,
      answeredInLesson: parsed.answeredInLesson ?? null,
      explanation: parsed.explanation ?? "This looks great! Let's post it to the community."
    }
  } catch (err) {
    console.error('validatePostWithSage failed, using local fallback:', err)
    
    // Basic local keyword fallback in case of AI failure
    const lowercase = content.toLowerCase()
    
    // Check if totally off-topic (very basic check: check if it contains any numbers, money terms, or letters)
    const financialKeywords = [
      'tax', 'pension', 'money', 'saving', 'save', 'earn', 'earning', 'income', 'budget', 'salary', 'pay', 'payslip', 'rent', 'deposit', 
      'guarantor', 'mortgage', 'house', 'home', 'isa', 'lisa', 'relationship', 'marriage',
      'baby', 'child', 'car', 'finance', 'debt', 'borrow', 'credit', 'invest', 'stock', 'share',
      'fund', 'allowance', 'student', 'interest', 'work', 'job', 'employer', 'bill'
    ]
    const hasFinancialKeyword = financialKeywords.some(kw => lowercase.includes(kw))
    
    if (content.length < 5 || !hasFinancialKeyword) {
      return {
        relevance: 'off_topic',
        bestTopicId: null,
        answeredInLesson: null,
        explanation: "I'm not quite sure this is relevant to personal finance or adulting. Could you clarify your question?"
      }
    }

    // Check if fits another topic
    // If in starting-work but mentions house/mortgage/rent/deposit
    if (currentTopicId !== 'buying-a-home' && (lowercase.includes('mortgage') || lowercase.includes('lisa') || lowercase.includes('buy a house') || lowercase.includes('buying a home'))) {
      return {
        relevance: 'relevant',
        bestTopicId: 'buying-a-home',
        answeredInLesson: null,
        explanation: "This question seems meant for the Buying a Home forum. Let's head over there!"
      }
    }
    if (currentTopicId !== 'renting' && (lowercase.includes('rent') || lowercase.includes('deposit') || lowercase.includes('landlord') || lowercase.includes('tenancy'))) {
      return {
        relevance: 'relevant',
        bestTopicId: 'renting',
        answeredInLesson: null,
        explanation: "This fits perfectly under the Renting forum. Let's redirect you."
      }
    }
    if (currentTopicId !== 'debt' && (lowercase.includes('debt') || lowercase.includes('payoff') || lowercase.includes('avalanche') || lowercase.includes('snowball') || lowercase.includes('credit card debt'))) {
      return {
        relevance: 'relevant',
        bestTopicId: 'debt',
        answeredInLesson: null,
        explanation: "This sounds like a conversation for our Managing Debt forum. Shall we go there?"
      }
    }

    // Check if matches specific popular lessons
    if (lowercase.includes('50/30/20') || lowercase.includes('50 30 20')) {
      return {
        relevance: 'relevant',
        bestTopicId: null,
        answeredInLesson: {
          topicId: 'starting-work',
          subTopicId: 'lesson-03',
          lessonTitle: 'The 50/30/20 Rule'
        },
        explanation: "I already have a lesson for this! It covers the 50/30/20 budgeting rule step-by-step."
      }
    }

    if (lowercase.includes('lifetime isa') || lowercase.includes('lisa')) {
      return {
        relevance: 'relevant',
        bestTopicId: null,
        answeredInLesson: {
          topicId: 'buying-a-home',
          subTopicId: 'lesson-09',
          lessonTitle: 'The Lifetime ISA (LISA)'
        },
        explanation: "I already have a lesson for this! Let's check out our Lifetime ISA guide."
      }
    }

    if (lowercase.includes('compound interest')) {
      return {
        relevance: 'relevant',
        bestTopicId: null,
        answeredInLesson: {
          topicId: 'foundations',
          subTopicId: 'lesson-36',
          lessonTitle: 'The Power of Compound Interest'
        },
        explanation: "I already have a lesson for this! Read about how compound interest works here."
      }
    }

    return {
      relevance: 'relevant',
      bestTopicId: null,
      answeredInLesson: null,
      explanation: "This looks great! Let's post it to the community."
    }
  }
}

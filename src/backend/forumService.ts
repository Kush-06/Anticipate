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

// PREMIUM MOCK DATA
const MOCK_THREADS: ForumThread[] = [
  {
    id: 'mock-thread-starting-work-1',
    topic_id: 'starting-work',
    title: 'How much tax am I paying on a £25k salary?',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    author_nickname: 'Anonymous Badger 482'
  },
  {
    id: 'mock-thread-starting-work-2',
    topic_id: 'starting-work',
    title: 'Is auto-enrolment pension really free money?',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    author_nickname: 'Anonymous Panda 123'
  },
  {
    id: 'mock-thread-renting-1',
    topic_id: 'renting',
    title: 'Landlord trying to deduct £200 for "cleaning"',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    author_nickname: 'Anonymous Fox 719'
  },
  {
    id: 'mock-thread-buying-home-1',
    topic_id: 'buying-a-home',
    title: 'Is a Lifetime ISA (LISA) worth it?',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    author_nickname: 'Anonymous Owl 554'
  },
  {
    id: 'mock-thread-debt-1',
    topic_id: 'debt',
    title: 'Snowball vs Avalanche method?',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    author_nickname: 'Anonymous Otter 881'
  }
]

const MOCK_MESSAGES: Record<string, ForumMessage[]> = {
  'mock-thread-starting-work-1': [
    {
      id: 'msg-sw1-1',
      thread_id: 'mock-thread-starting-work-1',
      content: 'I just got my first payslip and it says tax code 1257L. I don\'t understand how much of it is actually tax vs national insurance. Anyone can break it down?',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      author_nickname: 'Anonymous Badger 482',
      is_sage_reply: false
    },
    {
      id: 'msg-sw1-2',
      thread_id: 'mock-thread-starting-work-1',
      content: '1257L means you get £12,570 tax-free per year. Anything above that is taxed at 20% (up to £50k). National Insurance is separate, usually about 8% of your salary above £242/week. You can use online tools like Salary Calculator to check!',
      created_at: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      author_nickname: 'Anonymous Bear 910',
      is_sage_reply: false
    }
  ],
  'mock-thread-starting-work-2': [
    {
      id: 'msg-sw2-1',
      thread_id: 'mock-thread-starting-work-2',
      content: 'My employer says they match 3% if I contribute 5%. Why would I do that if it reduces my take-home pay? I need the cash now.',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      author_nickname: 'Anonymous Panda 123',
      is_sage_reply: false
    },
    {
      id: 'msg-sw2-2',
      thread_id: 'mock-thread-starting-work-2',
      content: 'Yes! It is literally a 100% return on your 3% portion. If you opt out, you\'re rejecting free money that your employer is contractually obliged to pay you. Over 40 years, that extra 3% compounding is huge!',
      created_at: new Date(Date.now() - 22 * 3600000).toISOString(),
      author_nickname: 'Anonymous Koala 632',
      is_sage_reply: false
    }
  ],
  'mock-thread-renting-1': [
    {
      id: 'msg-r1-1',
      thread_id: 'mock-thread-renting-1',
      content: 'My tenancy ended last week and the landlord wants £200 for cleaning the kitchen, but it was spotless. What are my rights?',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      author_nickname: 'Anonymous Fox 719',
      is_sage_reply: false
    },
    {
      id: 'msg-r1-2',
      thread_id: 'mock-thread-renting-1',
      content: 'Your deposit must be protected in a scheme (TDP). Do NOT agree to the deduction. Dispute it through the scheme. The landlord has to prove the place was dirtier than when you moved in (using the check-in inventory). They usually back down when you say you\'ll dispute it.',
      created_at: new Date(Date.now() - 1.8 * 3600000).toISOString(),
      author_nickname: 'Anonymous Robin 111',
      is_sage_reply: false
    }
  ],
  'mock-thread-buying-home-1': [
    {
      id: 'msg-bh1-1',
      thread_id: 'mock-thread-buying-home-1',
      content: 'I\'m 23 and want to buy a house in 5 years. Should I use a Cash LISA or Stocks & Shares LISA?',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      author_nickname: 'Anonymous Owl 554',
      is_sage_reply: false
    },
    {
      id: 'msg-bh1-2',
      thread_id: 'mock-thread-buying-home-1',
      content: 'Absolutely worth it for the 25% government bonus! If your timeline is 5 years, a Cash LISA is safer because stock markets can go down in the short term. Just make sure the house you buy is under £450k, otherwise there\'s a 25% penalty on withdrawal.',
      created_at: new Date(Date.now() - 11 * 3600000).toISOString(),
      author_nickname: 'Anonymous Falcon 302',
      is_sage_reply: false
    }
  ],
  'mock-thread-debt-1': [
    {
      id: 'msg-d1-1',
      thread_id: 'mock-thread-debt-1',
      content: 'I have £3k on a credit card (19% APR) and a £2k student overdraft (0% APR but interest starting soon). Which one do I pay off first?',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      author_nickname: 'Anonymous Otter 881',
      is_sage_reply: false
    },
    {
      id: 'msg-d1-2',
      thread_id: 'mock-thread-debt-1',
      content: 'Avalanche method: pay off the 19% credit card first because it has the highest interest. It mathematically saves you the most money. Snowball is good for psychological wins (paying smallest balance first), but here the credit card interest is too high to ignore!',
      created_at: new Date(Date.now() - 0.8 * 3600000).toISOString(),
      author_nickname: 'Anonymous Squirrel 225',
      is_sage_reply: false
    }
  ]
}

// LocalStorage helpers to simulate database tables locally if DB fails
const LOCAL_THREADS_KEY = 'anticipate_local_forum_threads'
const LOCAL_MESSAGES_KEY = 'anticipate_local_forum_messages'

function getLocalThreads(): ForumThread[] {
  try {
    const data = localStorage.getItem(LOCAL_THREADS_KEY)
    if (!data) {
      localStorage.setItem(LOCAL_THREADS_KEY, JSON.stringify(MOCK_THREADS))
      return MOCK_THREADS
    }
    return JSON.parse(data)
  } catch {
    return MOCK_THREADS
  }
}

function saveLocalThreads(threads: ForumThread[]) {
  localStorage.setItem(LOCAL_THREADS_KEY, JSON.stringify(threads))
}

function getLocalMessages(): Record<string, ForumMessage[]> {
  try {
    const data = localStorage.getItem(LOCAL_MESSAGES_KEY)
    if (!data) {
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(MOCK_MESSAGES))
      return MOCK_MESSAGES
    }
    return JSON.parse(data)
  } catch {
    return MOCK_MESSAGES
  }
}

function saveLocalMessages(messages: Record<string, ForumMessage[]>) {
  localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages))
}

// PUBLIC SERVICE METHODS

export async function fetchThreads(topicId?: string): Promise<ForumThread[]> {
  try {
    let query = supabase.from('forum_threads').select('*').order('created_at', { ascending: false })
    if (topicId) {
      query = query.eq('topic_id', topicId)
    }
    const { data, error } = await query
    
    if (error) {
      // If table doesn't exist, fall back to LocalStorage
      console.warn('Supabase fetchThreads error, falling back to LocalStorage:', error.message)
      return getLocalThreads().filter(t => !topicId || t.topic_id === topicId)
    }
    
    // Seed with mock threads if empty and no database entries yet
    if (!data || data.length === 0) {
      const filteredMocks = MOCK_THREADS.filter(t => !topicId || t.topic_id === topicId)
      return filteredMocks
    }
    
    return data as ForumThread[]
  } catch (err) {
    console.warn('fetchThreads exception, falling back to LocalStorage:', err)
    return getLocalThreads().filter(t => !topicId || t.topic_id === topicId)
  }
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

  try {
    // Attempt Supabase write
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

    if (error) throw error

    // Insert first message
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

    if (msgError) throw msgError

    return data as ForumThread
  } catch (err) {
    console.warn('Supabase createThread failed, saving to LocalStorage:', err)
    
    // Save locally
    const threads = getLocalThreads()
    threads.unshift(newThread)
    saveLocalThreads(threads)

    const messages = getLocalMessages()
    messages[threadId] = [firstMessage]
    saveLocalMessages(messages)

    return newThread
  }
}

export async function fetchMessages(threadId: string): Promise<ForumMessage[]> {
  try {
    const { data, error } = await supabase
      .from('forum_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Supabase fetchMessages error, falling back to LocalStorage:', error.message)
      return getLocalMessages()[threadId] || []
    }

    if (!data || data.length === 0) {
      return getLocalMessages()[threadId] || []
    }

    return data as ForumMessage[]
  } catch (err) {
    console.warn('fetchMessages exception, falling back to LocalStorage:', err)
    return getLocalMessages()[threadId] || []
  }
}

export async function fetchReplyCount(threadId: string): Promise<number> {
  try {
    const res = await supabase
      .from('forum_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId)
    const { count, error } = res
    if (error || count === null || count === undefined) {
      throw new Error(error?.message || 'Count is null')
    }
    return count
  } catch {
    const messages = getLocalMessages()
    return messages[threadId]?.length ?? 0
  }
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

  try {
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

    if (error) throw error
    return data as ForumMessage
  } catch (err) {
    console.warn('Supabase createMessage failed, saving to LocalStorage:', err)
    
    const messages = getLocalMessages()
    if (!messages[threadId]) {
      messages[threadId] = []
    }
    messages[threadId].push(newMessage)
    saveLocalMessages(messages)

    return newMessage
  }
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

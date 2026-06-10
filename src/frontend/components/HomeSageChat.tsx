import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Brain, Clock3, Plus, Send, Trash2, User, X } from 'lucide-react'
import { topics } from '../data/topics'
import { SageAvatar } from './SageAvatar'
import { getActiveProvider, sendChatMessage } from '../services/aiChatService'
import { sendWithTools, type SageHistoryMessage, type SageTool } from '../services/sageToolService'
import { useProfile, type UserProfile } from '../context/ProfileContext'
import { useTimeline } from '../context/TimelineContext'
import { useProgress } from '../context/ProgressContext'
import { addTimelineItem, markTimelineItemDone } from '@backend/timelineService'
import {
  fetchSageConversations,
  getSageConversationTitle,
  upsertSageConversation,
  type SageConversation,
} from '@backend/sageConversationService'
import {
  fetchSageMemories,
  addSageMemory,
  deleteSageMemory,
  type SageMemory,
} from '@backend/sageMemoryService'
import type { SpineGroup, SpineItem, SpineStatus } from '../../shared/types'

interface LessonCard {
  topicId: string
  subTopicId: string
  title: string
  reason: string
}

interface HomeChatMessage {
  role: 'user' | 'assistant'
  content: string
  lessonCards?: LessonCard[]
  toolActivity?: string[]
}

interface HomeSageChatProps {
  open: boolean
  onClose: () => void
}

const SUGGEST_LESSON_TOOL: SageTool = {
  name: 'suggest_lesson',
  description: 'Suggest a specific lesson from the Anticipate app that is relevant to what the user asked or mentioned. Only call this when the lesson is clearly applicable. Suggest at most 2 per turn.',
  parameters: {
    type: 'object',
    properties: {
      topicId:    { type: 'string', description: "The topic ID, e.g. 'starting-work'" },
      subTopicId: { type: 'string', description: "The lesson ID, e.g. 'lesson-01'" },
      title:      { type: 'string', description: 'Human-readable lesson title' },
      reason:     { type: 'string', description: 'One sentence explaining why this lesson is relevant right now' },
    },
    required: ['topicId', 'subTopicId', 'title', 'reason'],
  },
}

interface TimelineEventInput {
  itemKey: string
  title: string
  tag: string
  spineGroup: SpineGroup
  status: SpineStatus
  whenLabel: string
  dueYear: number
  dueMonth: number
  dueDay?: number
  lessonPath?: string
}

const ADD_TIMELINE_EVENT_TOOL: SageTool = {
  name: 'add_timeline_event',
  description: "Add a financial milestone to the user's personal timeline when they mention a concrete upcoming life event. Call this immediately when you have a title and a rough date or timeframe. Only ask a follow-up question if the date is completely absent and cannot be inferred.",
  parameters: {
    type: 'object',
    properties: {
      title:       { type: 'string', description: 'Short, actionable title for the timeline item' },
      tag:         { type: 'string', description: "Category label, e.g. 'career', 'housing', 'tax'" },
      spineGroup:  { type: 'string', enum: ['this-week', 'coming-up', 'later'], description: "Best estimate; the app will derive final grouping from the due month/year" },
      status:      { type: 'string', enum: ['active', 'pending'], description: "Use 'active' for this-week items, 'pending' for future ones" },
      whenLabel:   { type: 'string', description: "Human-readable timing including year, e.g. '15 Jul 2026' or 'Jul 2026'" },
      dueYear:     { type: 'number', description: "Four-digit year the event belongs to, e.g. 2026" },
      dueMonth:    { type: 'number', description: "Month number from 1 to 12" },
      dueDay:      { type: 'number', description: "Optional day of month from 1 to 31 if an exact date is known" },
      lessonPath:  { type: 'string', description: "Optional relevant lesson, e.g. '/topic/starting-work/subtopic/lesson-01'" },
      itemKey:     { type: 'string', description: "Short unique slug derived from title + month/year, e.g. 'new-job-jul-2026'" },
      relatedEvents: {
        type: 'array',
        description: 'Optional: 1–2 natural follow-up events to create at the same time (e.g. first payslip, pension enrolment)',
        items: {
          type: 'object',
          properties: {
            title:      { type: 'string' },
            tag:        { type: 'string' },
            spineGroup: { type: 'string', enum: ['this-week', 'coming-up', 'later'] },
            status:     { type: 'string', enum: ['active', 'pending'] },
            whenLabel:  { type: 'string' },
            dueYear:    { type: 'number' },
            dueMonth:   { type: 'number' },
            dueDay:     { type: 'number' },
            lessonPath: { type: 'string' },
            itemKey:    { type: 'string' },
          },
          required: ['title', 'tag', 'spineGroup', 'status', 'whenLabel', 'dueYear', 'dueMonth', 'itemKey'],
        },
      },
    },
    required: ['title', 'tag', 'spineGroup', 'status', 'whenLabel', 'dueYear', 'dueMonth', 'itemKey'],
  },
}

const SAVE_MEMORY_TOOL: SageTool = {
  name: 'save_memory',
  description: `Save a fact about the user worth remembering across future conversations.
Use when the user reveals something personal: a preference, a goal, a life detail, a habit, or anything not already obvious from their profile.
Do NOT save things already covered by their onboarding data (employment type, life stage, six-month goal, etc.).
Write the fact in second person and keep it under 120 characters: "User prefers…", "User mentioned…", "User is saving for…".`,
  parameters: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'The fact to remember, written in second person (max 120 characters)' },
    },
    required: ['content'],
  },
}

const COMPLETE_TIMELINE_EVENT_TOOL: SageTool = {
  name: 'complete_timeline_event',
  description: "Mark a timeline milestone as done when the user explicitly confirms they have completed it. Only call this when there is clear confirmation from the user, not just an intention.",
  parameters: {
    type: 'object',
    properties: {
      itemKey: { type: 'string', description: 'The id of the timeline event from the "Current timeline milestones" list' },
    },
    required: ['itemKey'],
  },
}

const UPDATE_CONFIDENCE_TOOL: SageTool = {
  name: 'update_confidence',
  description: `Update a confidence score when the user has clearly grown their understanding during this conversation.
Only call if there is strong evidence of a genuine shift — not just because they asked a question.
Use this sparingly: maximum once per conversation, and only when the improvement is unmistakable.`,
  parameters: {
    type: 'object',
    properties: {
      dimension: {
        type: 'string',
        enum: ['tax', 'pensions', 'budgeting', 'investing', 'contracts'],
        description: 'Which confidence area improved',
      },
      newScore: {
        type: 'number',
        minimum: 1,
        maximum: 5,
        description: 'New confidence score from 1 to 5',
      },
    },
    required: ['dimension', 'newScore'],
  },
}

function buildProfileDetails(profile: UserProfile): string {
  const lines: string[] = []
  if (profile.salary) lines.push(`Take-home salary: £${profile.salary}`)
  if (profile.livingSituation) lines.push(`Living situation: ${profile.livingSituation}`)
  if (profile.studentLoan) lines.push(`Student loan: ${profile.studentLoan}`)
  if (profile.hasDebt) lines.push(`Has debt: ${profile.hasDebt}`)
  if (profile.firstJobCompanyName) lines.push(`Employer: ${profile.firstJobCompanyName}`)
  if (profile.firstJobStartDate) lines.push(`Job start date: ${profile.firstJobStartDate}`)
  if (profile.firstJobPayDate) lines.push(`Pay date: ${profile.firstJobPayDate}`)
  if (profile.firstJobSalary) lines.push(`Gross salary: ${profile.firstJobSalary}`)
  if (profile.uniDegreeYears) lines.push(`Degree length: ${profile.uniDegreeYears}`)
  if (profile.uniStudyYear) lines.push(`Study year: ${profile.uniStudyYear}`)
  if (profile.freelanceIndustry) lines.push(`Freelance industry: ${profile.freelanceIndustry}`)
  if (profile.workingYearsRole) lines.push(`Current role: ${profile.workingYearsRole}`)
  if (profile.workingYearsPension) lines.push(`Has workplace pension: ${profile.workingYearsPension}`)
  if (profile.notWorkingFundsSource) lines.push(`Funds source: ${profile.notWorkingFundsSource}`)
  if (profile.rentAmount) lines.push(`Monthly rent: £${profile.rentAmount}`)
  if (profile.tenancyLength) lines.push(`Tenancy length: ${profile.tenancyLength}`)
  if (profile.familyRentBoard) lines.push(`Pays board to family: ${profile.familyRentBoard}`)
  if (profile.mortgagePayment) lines.push(`Mortgage payment: ${profile.mortgagePayment}`)
  if (profile.mortgageType) lines.push(`Mortgage type: ${profile.mortgageType}`)
  if (profile.studentRentAmount) lines.push(`Student rent: £${profile.studentRentAmount}`)
  if (profile.studentRentSource) lines.push(`Rent funded by: ${profile.studentRentSource}`)
  if (profile.movingCity) lines.push(`Moving to: ${profile.movingCity}`)
  if (profile.movingTimeframe) lines.push(`Moving timeframe: ${profile.movingTimeframe}`)
  if (profile.buyingLisa) lines.push(`Has LISA: ${profile.buyingLisa}`)
  if (profile.buyingBudget) lines.push(`Buying budget: ${profile.buyingBudget}`)
  if (profile.babySavingsFund) lines.push(`Baby savings fund: ${profile.babySavingsFund}`)
  if (profile.expectedNewSalary) lines.push(`Expected new salary: ${profile.expectedNewSalary}`)
  if (profile.carTargetBudget) lines.push(`Car budget: ${profile.carTargetBudget}`)
  if (profile.carPurchaseMethod) lines.push(`Car purchase method: ${profile.carPurchaseMethod}`)
  return lines.join('\n')
}

function buildTopicsListing(): string {
  return topics
    .map((t) => `${t.id}: ${t.subTopics.map((s) => `${s.id} "${s.title}"`).join(', ')}`)
    .join('\n')
}

function buildCompletedLessonsText(completedIds: string[]): string {
  if (completedIds.length === 0) return 'None yet'
  const lines: string[] = []
  for (const topic of topics) {
    for (const sub of topic.subTopics) {
      if (completedIds.includes(sub.id)) lines.push(`- ${topic.title}: ${sub.title}`)
    }
  }
  return lines.length > 0 ? lines.join('\n') : 'None yet'
}

function buildTimelineItemsText(items: SpineItem[]): string {
  const active = items.filter((i) => i.status !== 'done')
  if (active.length === 0) return 'None'
  return active.map((i) => `- ${i.id}: "${i.title}" (${i.when})`).join('\n')
}

function buildSystemPrompt(
  profile: UserProfile | null,
  memories: SageMemory[],
  completedIds: string[],
  timelineItems: SpineItem[],
): string {
  if (!profile) {
    return 'You are Sage, a friendly personal finance assistant on Anticipate. Help with personal finance questions. Be warm and concise. British English only. Never give regulated financial advice.'
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const memoriesSection = memories.length > 0
    ? `\n## What Sage remembers about you\n${memories.map((m) => `- ${m.content}`).join('\n')}`
    : ''

  const profileDetails = buildProfileDetails(profile)
  const detailsSection = profileDetails ? `\n## Additional profile details\n${profileDetails}` : ''

  return `Today's date is ${today}.

You are Sage, a warm and sharp personal finance companion on Anticipate — an app for young UK professionals navigating money for the first time.

## User context
Name: ${profile.firstName} | Life stage: ${profile.lifeStage} | Employment: ${profile.employmentType}
Six-month goal: ${profile.sixMonthGoal}
Upcoming events: ${profile.upcomingEvents.length > 0 ? profile.upcomingEvents.join(', ') : 'none specified'}
Confidence (1–5): tax ${profile.confidenceScores.tax}, pensions ${profile.confidenceScores.pensions}, budgeting ${profile.confidenceScores.budgeting}, investing ${profile.confidenceScores.investing}, contracts ${profile.confidenceScores.contracts}
${detailsSection}
${memoriesSection}

## Lessons completed
${buildCompletedLessonsText(completedIds)}

## Current timeline milestones
${buildTimelineItemsText(timelineItems)}

## Your role
Help with any personal finance question. Suggest relevant app lessons using the suggest_lesson tool — never just name a lesson in plain text. Keep responses warm and concise: 2–4 sentences, British English. Never give regulated financial advice; nudge users to verify important decisions with a professional.

## Lesson suggestion rules
- Suggest at most 2 lessons per turn
- Only suggest when clearly relevant to what the user asked
- Do NOT suggest lessons the user has already completed (listed above)
- Populate "reason" with one sentence explaining why it's relevant right now

## Available topics
${buildTopicsListing()}

## Memory rules
- Call save_memory when the user reveals something personal worth remembering: a preference, a side goal, a life detail, a habit, a fear, or anything not already captured in their profile
- Do NOT save things already obvious from their onboarding data (employment, life stage, six-month goal, etc.)
- Do NOT save the same type of fact twice; if a similar memory already exists, skip it
- Keep saved facts concise and written in second person: "User prefers…", "User mentioned…"

## Timeline creation
You can add events to the user's personal timeline when they mention a concrete upcoming life event (new job, moving, baby, pay rise, buying a car, etc.).

## Timeline rules
- When the user mentions a concrete upcoming life event, call add_timeline_event immediately — do not ask for confirmation first
- Every timeline event must have dueYear and dueMonth. Only include dueDay when an exact day is known.
- Use whatever date or timeframe the user provided; if they said "next month", estimate dueYear and dueMonth from today's date and omit dueDay
- Only ask a follow-up question if NO date or timeframe whatsoever can be inferred from what they said
- When creating an event, also add 1–2 natural follow-up events via relatedEvents (e.g. for a new job: first payslip check, pension auto-enrolment)
- Do NOT create events for vague future intentions ("I might invest someday")
- After creating events, confirm warmly what was added in 1–2 sentences
- Call complete_timeline_event only when the user explicitly confirms they have finished a milestone. Match against the itemKey list above.

## Confidence update rules
- Call update_confidence at most once per conversation, only when the user has clearly shifted their understanding through this conversation — not just by asking a question`
}

function renderMessage(text: string): ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part as ReactNode
  )
}

function LessonSuggestionCard({ card, onNavigate }: { card: LessonCard; onNavigate: (path: string) => void }) {
  return (
    <div
      className="scc-lesson-card"
      onClick={() => onNavigate(`/topic/${card.topicId}/subtopic/${card.subTopicId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(`/topic/${card.topicId}/subtopic/${card.subTopicId}`)}
    >
      <div className="scc-lesson-card__title">{card.title}</div>
      <div className="scc-lesson-card__reason">{card.reason}</div>
      <div className="scc-lesson-card__cta">Start lesson →</div>
    </div>
  )
}

export function HomeSageChat({ open, onClose }: HomeSageChatProps) {
  const navigate = useNavigate()
  const { profile, userId, updateProfile } = useProfile()
  const { groups, refreshTimeline } = useTimeline()
  const { completedSubTopicIds } = useProgress()
  const [isClosing, setIsClosing] = useState(false)
  const [renderedMessages, setRenderedMessages] = useState<HomeChatMessage[]>([])
  const [history, setHistory] = useState<SageHistoryMessage[]>([])
  const [conversations, setConversations] = useState<SageConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [memories, setMemories] = useState<SageMemory[]>([])
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jumpingAssistantIndex, setJumpingAssistantIndex] = useState<number | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pendingCardsRef = useRef<LessonCard[]>([])
  const pendingActivityRef = useRef<string[]>([])
  const activeConversationIdRef = useRef<string | null>(null)

  const timelineItems: SpineItem[] = groups.flatMap((g) => g.items)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = setTimeout(() => {
      setHistoryLoading(true)
      void fetchSageConversations(userId, 'home')
        .then((saved) => {
          if (cancelled) return
          setConversations(saved)
        })
        .catch((err) => {
          if (!cancelled) setError("I didn't quite get that, please try again.")
          console.error('[Sage] failed to load conversations:', err)
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, userId])

  useEffect(() => {
    if (!open || !userId) return
    void fetchSageMemories(userId).then(setMemories).catch(() => {})
  }, [open, userId])

  useEffect(() => {
    if (!(open || isClosing)) return
    const container = messagesContainerRef.current
    if (container) {
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }, 60)
    }
  }, [renderedMessages, loading, open, isClosing])

  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      document.documentElement.style.setProperty('--scc-vv-height', `${vv.height}px`)
      document.documentElement.style.setProperty('--scc-vv-offset-top', `${vv.offsetTop}px`)
      
      // Auto-scroll messages to bottom when visual viewport shrinks (e.g. keyboard opens)
      const container = messagesContainerRef.current
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight
        }, 50)
      }
    }
    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)
    handleResize()
    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [open])

  // Lock body scroll using position: fixed to prevent background layout scroll on iOS
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    
    // Save original styles
    const origPosition = document.body.style.position
    const origTop = document.body.style.top
    const origWidth = document.body.style.width
    const origLeft = document.body.style.left
    const origOverflow = document.body.style.overflow
    const origHtmlOverflow = document.documentElement.style.overflow

    // Apply fixed positioning to lock background scrolling
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.left = '0'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.position = origPosition
      document.body.style.top = origTop
      document.body.style.width = origWidth
      document.body.style.left = origLeft
      document.body.style.overflow = origOverflow
      document.documentElement.style.overflow = origHtmlOverflow
    }
  }, [open])

  // Prevent touchmove scrolling background on iOS when open
  useEffect(() => {
    if (!open) return

    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const scrollEl = target.closest('.scc-messages') || target.closest('.scc-history')

      if (scrollEl) {
        const el = scrollEl as HTMLElement
        const currentY = e.touches[0].clientY
        const deltaY = currentY - touchStartY

        // If at top and trying to scroll up
        if (el.scrollTop === 0 && deltaY > 0) {
          if (e.cancelable) e.preventDefault()
        }
        // If at bottom and trying to scroll down
        else if (el.scrollTop + el.clientHeight >= el.scrollHeight && deltaY < 0) {
          if (e.cancelable) e.preventDefault()
        }
      } else {
        const isInput = target.closest('textarea') || target.closest('input')
        if (!isInput) {
          if (e.cancelable) e.preventDefault()
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [open])

  function closePanel() {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 280)
  }

  function startNewConversation() {
    setRenderedMessages([])
    setHistory([])
    setJumpingAssistantIndex(null)
    setActiveConversationId(null)
    setInput('')
    setError(null)
    setHistoryOpen(false)
    setMemoryOpen(false)
  }

  function openConversation(conversation: SageConversation) {
    setActiveConversationId(conversation.id)
    setRenderedMessages(conversation.messages as HomeChatMessage[])
    setHistory(conversation.history)
    setJumpingAssistantIndex(null)
    setInput('')
    setError(null)
    setHistoryOpen(false)
    setMemoryOpen(false)
  }

  async function handleDeleteMemory(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id))
    await deleteSageMemory(id).catch(() => {})
  }

  async function saveConversation(nextMessages: HomeChatMessage[], nextHistory: SageHistoryMessage[]) {
    const saved = await upsertSageConversation(userId, {
      id: activeConversationIdRef.current,
      context: 'home',
      title: getSageConversationTitle(nextMessages),
      messages: nextMessages,
      history: nextHistory,
    })
    setActiveConversationId(saved.id)
    setConversations((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)])
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    pendingCardsRef.current = []
    pendingActivityRef.current = []

    const userRendered: HomeChatMessage = { role: 'user', content: trimmed }
    const nextHistory: SageHistoryMessage[] = [...history, { role: 'user', text: trimmed }]
    const nextRenderedMessages = [...renderedMessages, userRendered]

    setRenderedMessages(nextRenderedMessages)
    setInput('')
    setLoading(true)
    setError(null)
    const userTurnSaved = saveConversation(nextRenderedMessages, nextHistory).catch(() => null)

    const systemPrompt = buildSystemPrompt(profile, memories, completedSubTopicIds, timelineItems)
    const provider = getActiveProvider()

    try {
      if (provider === 'claude' || provider === 'gemini' || provider === 'openai') {
        const result = await sendWithTools(
          systemPrompt,
          nextHistory,
          [SUGGEST_LESSON_TOOL, ADD_TIMELINE_EVENT_TOOL, SAVE_MEMORY_TOOL, COMPLETE_TIMELINE_EVENT_TOOL, UPDATE_CONFIDENCE_TOOL],
          async (name, toolInput) => {
            if (name === 'suggest_lesson') {
              pendingCardsRef.current = [...pendingCardsRef.current, toolInput as unknown as LessonCard]
              return 'Lesson card shown to user.'
            }
            if (name === 'add_timeline_event' && userId) {
              const allItems: TimelineEventInput[] = [
                toolInput as unknown as TimelineEventInput,
                ...((toolInput.relatedEvents as TimelineEventInput[] | undefined) ?? []),
              ]
              const results = await Promise.allSettled(
                allItems.map((item) => addTimelineItem(userId, item)),
              )
              await refreshTimeline()
              const successCount = results.filter((r) => r.status === 'fulfilled').length
              const firstError = results
                .find((r): r is PromiseRejectedResult => r.status === 'rejected')
                ?.reason as Error | undefined
              const label = successCount > 0
                ? `Added ${successCount} event${successCount !== 1 ? 's' : ''} to your timeline`
                : `Timeline error: ${firstError?.message ?? 'unknown'}`
              pendingActivityRef.current = [...pendingActivityRef.current, label]
              return `${successCount} timeline event(s) added successfully.`
            }
            if (name === 'save_memory' && userId) {
              const content = (toolInput.content as string).slice(0, 120)
              const saved = await addSageMemory(userId, content).catch(() => null)
              if (saved) setMemories((prev) => [saved, ...prev])
              return 'Memory saved.'
            }
            if (name === 'complete_timeline_event' && userId) {
              const itemKey = toolInput.itemKey as string
              await markTimelineItemDone(userId, itemKey).catch(() => {})
              await refreshTimeline()
              const item = timelineItems.find((i) => i.id === itemKey)
              const label = item ? item.title : itemKey
              pendingActivityRef.current = [...pendingActivityRef.current, `Marked "${label}" as done`]
              return `Timeline event "${itemKey}" marked as done.`
            }
            if (name === 'update_confidence' && profile) {
              const dimension = toolInput.dimension as keyof typeof profile.confidenceScores
              const newScore = Math.min(5, Math.max(1, Math.round(toolInput.newScore as number)))
              await updateProfile({ confidenceScores: { ...profile.confidenceScores, [dimension]: newScore } })
              return `Confidence in ${dimension} updated to ${newScore}/5.`
            }
            return 'Unknown tool.'
          },
        )
        const cards = pendingCardsRef.current
        const activity = pendingActivityRef.current
        const assistantRendered: HomeChatMessage = {
          role: 'assistant',
          content: result.text,
          lessonCards: cards.length > 0 ? cards : undefined,
          toolActivity: activity.length > 0 ? activity : undefined,
        }
        const savedMessages = [...nextRenderedMessages, assistantRendered]
        const savedHistory = [...nextHistory, result.newTurn]
        setRenderedMessages(savedMessages)
        setJumpingAssistantIndex(nextRenderedMessages.length)
        setHistory(savedHistory)
        await userTurnSaved
        await saveConversation(savedMessages, savedHistory)
      } else {
        const reply = await sendChatMessage(
          systemPrompt,
          nextHistory.map((m) => ({ role: m.role, content: m.text })),
        )
        const savedMessages: HomeChatMessage[] = [...nextRenderedMessages, { role: 'assistant', content: reply }]
        const savedHistory: SageHistoryMessage[] = [...nextHistory, { role: 'assistant', text: reply }]
        setRenderedMessages(savedMessages)
        setJumpingAssistantIndex(nextRenderedMessages.length)
        setHistory(savedHistory)
        await userTurnSaved
        await saveConversation(savedMessages, savedHistory)
      }
    } catch (err) {
      console.error('[Sage] chat error:', err)
      setError("I didn't quite get that, please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  function handleNavigate(path: string) {
    closePanel()
    setTimeout(() => navigate(path), 290)
  }

  return (
    <>
      {(open || isClosing) && (
        <>
          <div
            className={`scc-backdrop ${isClosing ? 'scc-backdrop--closing' : ''}`}
            onClick={closePanel}
            aria-hidden="true"
          />
          <div className="scc-viewport">
            <div
              className={`scc-panel ${isClosing ? 'scc-panel--closing' : ''}`}
              role="dialog"
              aria-label="Chat with Sage"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="scc-header">
              <div className="scc-header__left">
                <SageAvatar size={28} />
                <span className="scc-header__title">Talk to Sage</span>
                {userId && memories.length > 0 && (
                  <button
                    className={`scc-memory-chip ${memoryOpen ? 'scc-memory-chip--active' : ''}`}
                    onClick={() => { setMemoryOpen((v) => !v); setHistoryOpen(false) }}
                    aria-label={`Sage remembers ${memories.length} thing${memories.length !== 1 ? 's' : ''}`}
                  >
                    <Brain size={11} />
                    {memories.length}
                  </button>
                )}
              </div>
              <div className="scc-header__actions">
                <button
                  className={`scc-header__icon ${historyOpen ? 'scc-header__icon--active' : ''}`}
                  onClick={() => { setHistoryOpen((v) => !v); setMemoryOpen(false) }}
                  aria-label="Saved Sage chats"
                >
                  <Clock3 size={16} />
                </button>
                <button className="scc-header__icon" onClick={startNewConversation} aria-label="Start new Sage chat">
                  <Plus size={17} />
                </button>
                <button className="scc-header__icon" onClick={closePanel} aria-label="Close chat">
                  <X size={17} />
                </button>
              </div>
            </div>

            {historyOpen && (
              <div className="scc-history">
                <div className="scc-history__top">
                  <span>Saved chats</span>
                  <button onClick={startNewConversation}>New chat</button>
                </div>
                {historyLoading && <p className="scc-history__empty">Loading chats...</p>}
                {!historyLoading && conversations.length === 0 && (
                  <p className="scc-history__empty">Your Sage conversations will appear here.</p>
                )}
                {!historyLoading && conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`scc-history__item ${conversation.id === activeConversationId ? 'scc-history__item--active' : ''}`}
                    onClick={() => openConversation(conversation)}
                  >
                    <span>{conversation.title}</span>
                    <time>{new Date(conversation.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</time>
                  </button>
                ))}
              </div>
            )}

            {memoryOpen && (
              <div className="scc-history">
                <div className="scc-history__top">
                  <span>Sage's memory</span>
                  <span style={{ fontSize: 11, color: '#7c715e', fontWeight: 400 }}>{memories.length} saved</span>
                </div>
                {memories.length === 0 && (
                  <p className="scc-history__empty">Sage will remember things you tell it here.</p>
                )}
                {memories.map((mem) => (
                  <div key={mem.id} className="scc-memory__item">
                    <span>{mem.content}</span>
                    <button
                      className="scc-memory__delete"
                      onClick={() => void handleDeleteMemory(mem.id)}
                      aria-label="Delete memory"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="scc-messages" ref={messagesContainerRef}>
              {renderedMessages.length === 0 && !loading && (
                <div className="scc-empty">
                  <div className="scc-empty__avatar-wrapper">
                    <SageAvatar size={48} />
                  </div>
                  <p className="scc-empty__title">Chat with Sage</p>
                  <p className="scc-empty__desc">Ask me anything about personal finance — I'll answer your questions and suggest lessons tailored to your situation.</p>
                </div>
              )}
              {renderedMessages.map((m, i) => {
                const isUser = m.role === 'user'
                return (
                  <div key={i} className={`scc-row scc-row--${m.role}`}>
                    {!isUser && (
                      <div className="scc-msg-avatar">
                        <SageAvatar size={28} leafJump={jumpingAssistantIndex === i} />
                      </div>
                    )}
                    <div className="scc-msg-content">
                      <div className={`scc-bubble scc-bubble--${m.role}`}>
                        {renderMessage(m.content)}
                      </div>
                      {!isUser && m.lessonCards && m.lessonCards.length > 0 && (
                        <div className="scc-cards">
                          {m.lessonCards.map((card, ci) => (
                            <LessonSuggestionCard key={ci} card={card} onNavigate={handleNavigate} />
                          ))}
                        </div>
                      )}
                      {!isUser && m.toolActivity && m.toolActivity.length > 0 && (
                        <div className="scc-tool-activity">
                          {m.toolActivity.map((label, ai) => (
                            <span key={ai} className="scc-tool-activity__item">✦ {label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isUser && (
                      <div className="scc-msg-avatar scc-msg-avatar--user">
                        <User size={15} style={{ color: '#ffffff' }} />
                      </div>
                    )}
                  </div>
                )
              })}
              {loading && (
                <div className="scc-row scc-row--assistant">
                  <div className="scc-msg-avatar">
                    <SageAvatar size={28} />
                  </div>
                  <div className="scc-bubble scc-bubble--assistant scc-bubble--loading">
                    <span className="scc-dots"><span /><span /><span /></span>
                  </div>
                </div>
              )}
              {error && (
                <div className="scc-row scc-row--assistant">
                  <div className="scc-msg-avatar">
                    <SageAvatar size={28} />
                  </div>
                  <div className="scc-msg-content">
                    <div className="scc-bubble scc-bubble--error">{error}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="scc-input-row">
              <textarea
                ref={inputRef}
                className="scc-textarea"
                rows={1}
                placeholder="Ask Sage anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="scc-send"
                onClick={() => void handleSend()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      <style>{`
        .scc-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 19;
          background: rgba(28, 26, 36, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: scc-fade-in 0.24s ease-out both;
        }
        .scc-backdrop--closing { animation: scc-fade-out 0.24s ease-out both; }
        @keyframes scc-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scc-fade-out { from { opacity: 1; } to { opacity: 0; } }

        .scc-viewport {
          position: fixed;
          top: var(--scc-vv-offset-top, 0px);
          left: 0; right: 0;
          height: var(--scc-vv-height, 100vh);
          z-index: 20;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
        }

        .scc-panel {
          position: relative;
          width: 100%;
          height: 85%;
          pointer-events: auto;
          border-radius: 28px 28px 0 0;
          background: #f4f0e6;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
          animation: scc-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .scc-panel--closing { animation: scc-slide-down 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes scc-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scc-slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }

        .scc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          flex-shrink: 0;
          background: #f4f0e6;
          border-bottom: 1.5px solid #e6dbc4;
          z-index: 5;
        }
        .scc-header__left { display: flex; align-items: center; gap: 10px; }
        .scc-header__title {
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: bold;
          color: #1c1a24;
        }
        .scc-header__actions { display: flex; align-items: center; gap: 8px; }
        .scc-header__icon {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: none;
          background: #ffffff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #5f5848;
          transition: background-color 0.15s ease, transform 0.15s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          flex-shrink: 0;
        }
        .scc-header__icon:hover, .scc-header__icon--active { background: #ebe7dd; color: #1c2a47; }
        .scc-header__icon:active { transform: scale(0.95); }

        .scc-history {
          flex-shrink: 0;
          background: #fffaf0;
          border-bottom: 1.5px solid #e6dbc4;
          padding: 10px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .scc-history__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #1c1a24;
        }
        .scc-history__top button {
          border: none;
          background: transparent;
          color: #e9694a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 0;
        }
        .scc-history__empty {
          margin: 2px 0 0;
          color: #7c715e;
          font-size: 12px;
          line-height: 1.4;
        }
        .scc-history__item {
          border: 1px solid #eadfca;
          background: #ffffff;
          border-radius: 8px;
          padding: 9px 10px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          cursor: pointer;
          text-align: left;
          color: #1c1a24;
        }
        .scc-history__item--active {
          border-color: #ff9b7d;
          background: #fff3ec;
        }
        .scc-history__item span {
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .scc-history__item time {
          color: #7c715e;
          font-size: 11px;
        }

        .scc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
          overscroll-behavior: contain;
        }
        .scc-messages::-webkit-scrollbar { display: none; }

        .scc-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 100%;
        }
        .scc-row--user { justify-content: flex-end; }
        .scc-row--assistant { justify-content: flex-start; }

        .scc-msg-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 78%;
        }
        .scc-row--user .scc-msg-content { align-items: flex-end; }

        .scc-msg-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          overflow: visible;
          margin-top: 2px;
        }
        .scc-msg-avatar--user { background: #95a4bb; overflow: hidden; }

        .scc-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px;
          margin: auto;
        }
        .scc-empty__avatar-wrapper {
          margin-bottom: 16px;
          position: relative;
        }
        .scc-empty__avatar-wrapper::after {
          content: '';
          position: absolute;
          top: -4px; left: -4px; right: -4px; bottom: -4px;
          border: 2px solid #ff9b7d;
          border-radius: 50%;
          opacity: 0.4;
          animation: scc-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes scc-ping { 75%, 100% { transform: scale(1.18); opacity: 0; } }
        .scc-empty__title {
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: bold;
          color: #1c1a24;
          margin: 0 0 8px;
        }
        .scc-empty__desc {
          font-size: 13px;
          color: #5f5848;
          line-height: 1.5;
          max-width: 260px;
          margin: 0;
        }

        .scc-bubble--error {
          background: #fde8e4;
          color: #c93b2b;
          border: 1px solid #f9c0b5;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 6px rgba(201,59,43,0.06);
        }

        .scc-bubble {
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          animation: scc-bubble-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes scc-bubble-in { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .scc-bubble--user {
          background: #1c2a47;
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
        }
        .scc-bubble--assistant {
          background: #ffffff;
          color: #1c1a24;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .scc-bubble--loading { padding: 12px 16px; }
        .scc-dots { display: flex; gap: 5px; align-items: center; }
        .scc-dots span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #95a4bb;
          animation: scc-dot-bounce 1.2s infinite ease-in-out;
        }
        .scc-dots span:nth-child(1) { animation-delay: 0s; }
        .scc-dots span:nth-child(2) { animation-delay: 0.2s; }
        .scc-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes scc-dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1);   opacity: 1; }
        }

        .scc-cards {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .scc-lesson-card {
          background: #ffffff;
          border-radius: 14px;
          border-left: 4px solid #e9694a;
          padding: 12px 14px;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          animation: scc-bubble-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .scc-lesson-card:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(233,105,74,0.12); }
        .scc-lesson-card:active { transform: scale(0.98); }
        .scc-lesson-card__title {
          font-family: Georgia, serif;
          font-size: 14px;
          font-weight: bold;
          color: #1c1a24;
          margin-bottom: 3px;
        }
        .scc-lesson-card__reason {
          font-size: 12px;
          color: #5f5848;
          line-height: 1.4;
          margin-bottom: 8px;
        }
        .scc-lesson-card__cta {
          font-size: 12px;
          font-weight: 600;
          color: #e9694a;
        }

        .scc-tool-activity {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-left: 2px;
        }
        .scc-tool-activity__item {
          font-size: 11px;
          color: #a0916e;
          font-style: italic;
          letter-spacing: 0.01em;
          animation: scc-bubble-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .scc-input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 14px 16px;
          padding-bottom: max(14px, env(safe-area-inset-bottom));
          flex-shrink: 0;
          background: #f4f0e6;
          border-top: 1.5px solid #e6dbc4;
          z-index: 5;
        }
        .scc-textarea {
          flex: 1;
          resize: none;
          border: none;
          border-radius: 20px;
          padding: 10px 16px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          color: #1c1a24;
          background: #ffffff;
          outline: none;
          max-height: 100px;
          overflow-y: auto;
          line-height: 1.45;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .scc-textarea:disabled { opacity: 0.5; }
        .scc-send {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: none;
          background: #ff7350;
          color: #ffffff;
          font-size: 15px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s ease, transform 0.1s ease, background-color 0.15s ease;
          box-shadow: 0 2px 8px rgba(255,115,80,0.2);
        }
        .scc-send:hover { background: #e9694a; }
        .scc-send:disabled { opacity: 0.35; cursor: not-allowed; background: #e6dbc4; box-shadow: none; color: #95a4bb; }
        .scc-send:not(:disabled):active { transform: scale(0.92); }

        .scc-memory-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1.5px solid #e6dbc4;
          background: #ffffff;
          color: #7c715e;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
          line-height: 1;
        }
        .scc-memory-chip:hover, .scc-memory-chip--active {
          background: #ebe7dd;
          border-color: #d4c9b0;
          color: #1c2a47;
        }

        .scc-memory__item {
          border: 1px solid #eadfca;
          background: #ffffff;
          border-radius: 8px;
          padding: 9px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 13px;
          color: #1c1a24;
          line-height: 1.4;
        }
        .scc-memory__item span {
          flex: 1;
          font-weight: 500;
        }
        .scc-memory__delete {
          border: none;
          background: transparent;
          color: #c0b49a;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          border-radius: 4px;
          transition: color 0.12s ease;
        }
        .scc-memory__delete:hover { color: #c93b2b; }
      `}</style>
    </>
  )
}

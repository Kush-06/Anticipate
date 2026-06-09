import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Clock3, Plus, Send, User, X } from 'lucide-react'
import { topics } from '../data/topics'
import { SageAvatar } from './SageAvatar'
import { getActiveProvider, sendChatMessage } from '../services/aiChatService'
import { sendWithTools, type SageHistoryMessage, type SageTool } from '../services/sageToolService'
import { useProfile, type UserProfile } from '../context/ProfileContext'
import { useTimeline } from '../context/TimelineContext'
import { addTimelineItem } from '@backend/timelineService'
import {
  fetchSageConversations,
  getSageConversationTitle,
  upsertSageConversation,
  type SageConversation,
} from '@backend/sageConversationService'
import type { SpineGroup, SpineStatus } from '../../shared/types'

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
  dueDate?: string
  lessonPath?: string
}

const ADD_TIMELINE_EVENT_TOOL: SageTool = {
  name: 'add_timeline_event',
  description: "Add a financial milestone to the user's personal timeline. Only call this when the user has clearly mentioned a concrete upcoming life event AND you have enough information. If the event date is unknown, ask the user for it BEFORE calling this tool.",
  parameters: {
    type: 'object',
    properties: {
      title:       { type: 'string', description: 'Short, actionable title for the timeline item' },
      tag:         { type: 'string', description: "Category label, e.g. 'career', 'housing', 'tax'" },
      spineGroup:  { type: 'string', enum: ['this-week', 'coming-up', 'later'], description: "Use 'this-week' for imminent items, 'coming-up' for weeks away, 'later' for months away" },
      status:      { type: 'string', enum: ['active', 'pending'], description: "Use 'active' for this-week items, 'pending' for future ones" },
      whenLabel:   { type: 'string', description: "Human-readable timing, e.g. '15 Jul', 'In 3 weeks', 'End of month'" },
      dueDate:     { type: 'string', description: "ISO 8601 date if known, e.g. '2025-07-15'" },
      lessonPath:  { type: 'string', description: "Optional relevant lesson, e.g. '/topic/starting-work/subtopic/lesson-01'" },
      itemKey:     { type: 'string', description: "Short unique slug derived from title + date, e.g. 'new-job-jul-2025'" },
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
            dueDate:    { type: 'string' },
            lessonPath: { type: 'string' },
            itemKey:    { type: 'string' },
          },
          required: ['title', 'tag', 'spineGroup', 'status', 'whenLabel', 'itemKey'],
        },
      },
    },
    required: ['title', 'tag', 'spineGroup', 'status', 'whenLabel', 'itemKey'],
  },
}

function buildTopicsListing(): string {
  return topics
    .map((t) => `${t.id}: ${t.subTopics.map((s) => `${s.id} "${s.title}"`).join(', ')}`)
    .join('\n')
}

function buildSystemPrompt(profile: UserProfile | null): string {
  if (!profile) {
    return 'You are Sage, a friendly personal finance assistant on Anticipate. Help with personal finance questions. Be warm and concise. British English only. Never give regulated financial advice.'
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return `Today's date is ${today}.

You are Sage, a warm and sharp personal finance companion on Anticipate — an app for young UK professionals navigating money for the first time.

USER CONTEXT
Name: ${profile.firstName} | Life stage: ${profile.lifeStage} | Employment: ${profile.employmentType}
Six-month goal: ${profile.sixMonthGoal}
Upcoming events: ${profile.upcomingEvents.length > 0 ? profile.upcomingEvents.join(', ') : 'none specified'}
Confidence (1–5): tax ${profile.confidenceScores.tax}, pensions ${profile.confidenceScores.pensions}, budgeting ${profile.confidenceScores.budgeting}, investing ${profile.confidenceScores.investing}

YOUR ROLE
Help with any personal finance question. Suggest relevant app lessons using the suggest_lesson tool — never just name a lesson in plain text. Keep responses warm and concise: 2–4 sentences, British English. Never give regulated financial advice; nudge users to verify important decisions with a professional.

LESSON SUGGESTION RULES
- Suggest at most 2 lessons per turn
- Only suggest when clearly relevant to what the user asked
- Populate "reason" with one sentence explaining why it's relevant right now

AVAILABLE TOPICS
${buildTopicsListing()}

TIMELINE CREATION
You can add events to the user's personal timeline when they mention a concrete upcoming life event (new job, moving, baby, pay rise, buying a car, etc.).

TIMELINE RULES
- ONLY create a timeline event when the user explicitly mentions a real upcoming event
- If the event date is unclear or missing, ask the user for it BEFORE calling add_timeline_event. Example: if they say "I got a new job" without a start date, ask "Congratulations! When do you start?" then create the event after they answer
- When creating an event, also add 1–2 natural follow-up events via relatedEvents (e.g. for a new job: first payslip check, pension auto-enrolment)
- Do NOT create events for vague future intentions ("I might invest someday")
- After creating events, confirm warmly what was added in 1–2 sentences`
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
  const { profile, userId } = useProfile()
  const { refreshTimeline } = useTimeline()
  const [isClosing, setIsClosing] = useState(false)
  const [renderedMessages, setRenderedMessages] = useState<HomeChatMessage[]>([])
  const [history, setHistory] = useState<SageHistoryMessage[]>([])
  const [conversations, setConversations] = useState<SageConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pendingCardsRef = useRef<LessonCard[]>([])
  const pendingActivityRef = useRef<string[]>([])
  const activeConversationIdRef = useRef<string | null>(null)
  const renderedMessagesLengthRef = useRef(0)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    renderedMessagesLengthRef.current = renderedMessages.length
  }, [renderedMessages.length])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = setTimeout(() => {
      setHistoryLoading(true)
      void fetchSageConversations(userId, 'home')
        .then((saved) => {
          if (cancelled) return
          setConversations(saved)
          if (activeConversationIdRef.current || renderedMessagesLengthRef.current > 0 || saved.length === 0) return
          const latest = saved[0]
          setActiveConversationId(latest.id)
          setRenderedMessages(latest.messages as HomeChatMessage[])
          setHistory(latest.history)
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load saved chats.')
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
    const handleResize = () => setViewportHeight(vv.height)
    vv.addEventListener('resize', handleResize)
    handleResize()
    return () => vv.removeEventListener('resize', handleResize)
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
    setActiveConversationId(null)
    setInput('')
    setError(null)
    setHistoryOpen(false)
  }

  function openConversation(conversation: SageConversation) {
    setActiveConversationId(conversation.id)
    setRenderedMessages(conversation.messages as HomeChatMessage[])
    setHistory(conversation.history)
    setInput('')
    setError(null)
    setHistoryOpen(false)
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

    const systemPrompt = buildSystemPrompt(profile)
    const provider = getActiveProvider()

    try {
      if (provider === 'claude' || provider === 'gemini' || provider === 'openai') {
        const result = await sendWithTools(
          systemPrompt,
          nextHistory,
          [SUGGEST_LESSON_TOOL, ADD_TIMELINE_EVENT_TOOL],
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
        setHistory(savedHistory)
        await userTurnSaved
        await saveConversation(savedMessages, savedHistory)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
          <div
            className={`scc-panel ${isClosing ? 'scc-panel--closing' : ''}`}
            role="dialog"
            aria-label="Chat with Sage"
            style={{ height: `${viewportHeight * 0.85}px` }}
          >
            <div className="scc-header">
              <div className="scc-header__left">
                <SageAvatar size={28} />
                <span className="scc-header__title">Ask Sage</span>
              </div>
              <div className="scc-header__actions">
                <button
                  className={`scc-header__icon ${historyOpen ? 'scc-header__icon--active' : ''}`}
                  onClick={() => setHistoryOpen((value) => !value)}
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
                        <SageAvatar size={28} />
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
              {error && <p className="scc-error">{error}</p>}
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

        .scc-panel {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          z-index: 20;
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
          overflow: hidden;
          margin-top: 2px;
        }
        .scc-msg-avatar--user { background: #95a4bb; }

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

        .scc-error {
          font-size: 12px;
          color: #c93b2b;
          background: #fde8e4;
          border-radius: 12px;
          padding: 10px 14px;
          text-align: center;
          border: 1px solid #f9c0b5;
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
      `}</style>
    </>
  )
}

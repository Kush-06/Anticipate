import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Clock3, Plus, Send, User, X } from 'lucide-react'
import { hasActiveProvider, sendChatMessage, type ChatMessage, type ChatRole } from '../services/aiChatService'
import { SageAvatar } from './SageAvatar'
import {
  fetchSageConversations,
  getSageConversationTitle,
  upsertSageConversation,
  type SageConversation,
  type SageDisplayMessage,
} from '@backend/sageConversationService'
import { fetchSageMemories, type SageMemory } from '@backend/sageMemoryService'
import { useProfile, type UserProfile } from '../context/ProfileContext'

export interface LessonChatBotProps {
  lessonTitle: string
  topicTitle: string
  lessonContent: string
}

function buildProfileContext(profile: UserProfile | null): string {
  if (!profile) return ''
  const lines: string[] = [
    `Name: ${profile.firstName} | Life stage: ${profile.lifeStage}`,
  ]
  if (profile.salary) lines.push(`Take-home salary: £${profile.salary}`)
  if (profile.livingSituation) lines.push(`Living situation: ${profile.livingSituation}`)
  if (profile.studentLoan) lines.push(`Student loan: ${profile.studentLoan}`)
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
  if (profile.upcomingEvents.length > 0) lines.push(`Upcoming events: ${profile.upcomingEvents.join(', ')}`)
  return lines.join('\n')
}

function buildSystemPrompt(
  lessonTitle: string,
  topicTitle: string,
  lessonContent: string,
  memories: SageMemory[],
  profile: UserProfile | null,
): string {
  const profileSection = profile ? `\n## User context\n${buildProfileContext(profile)}\n` : ''
  const memoriesSection = memories.length > 0
    ? `\n## What Sage remembers about you\n${memories.map((m) => `- ${m.content}`).join('\n')}\n`
    : ''

  return `You are a sharp, friendly personal finance tutor for young UK professionals on Anticipate.

LESSON CONTEXT
Topic: "${topicTitle}" | Lesson: "${lessonTitle}"
${lessonContent}
${profileSection}${memoriesSection}
RULES
- British English only
- Never give regulated financial advice; nudge users to verify with a professional when needed
- Only answer questions about personal finance and this lesson; gently redirect anything off-topic

HOW TO RESPOND
- Be extremely concise: 1-2 sentences maximum for simple questions.
- Use short, punchy bullet points for lists.
- Do not repeat the lesson text.
- Match their level: plain English, no jargon.
- If they seem confused, ask one clarifying question before launching into a long explanation`
}

function renderMessage(text: string): ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part as ReactNode
  )
}

export function LessonChatBot({ lessonTitle, topicTitle, lessonContent }: LessonChatBotProps) {
  const { userId, profile } = useProfile()
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<SageConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [memories, setMemories] = useState<SageMemory[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jumpingAssistantIndex, setJumpingAssistantIndex] = useState<number | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeConversationIdRef = useRef<string | null>(null)
  const messagesLengthRef = useRef(0)

  const active = hasActiveProvider()
  const contextId = `${topicTitle}:${lessonTitle}`

  useEffect(() => {
    if (userId) void fetchSageMemories(userId).then(setMemories).catch(() => {})
  }, [userId])

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    messagesLengthRef.current = messages.length
  }, [messages.length])

  useEffect(() => {
    if (!active || !open) return
    let cancelled = false
    const timer = setTimeout(() => {
      setHistoryLoading(true)
      void fetchSageConversations(userId, 'lesson', contextId)
        .then((saved) => {
          if (cancelled) return
          setConversations(saved)
          if (activeConversationIdRef.current || messagesLengthRef.current > 0 || saved.length === 0) return
          const latest = saved[0]
          setActiveConversationId(latest.id)
          setMessages(latest.messages.map((message) => ({ role: message.role, content: message.content })))
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
  }, [active, open, userId, contextId])

  useEffect(() => {
    if (!active || !open) return
    const container = messagesContainerRef.current
    if (container) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }, 60)
    }
  }, [messages, loading, active, open])

  // Listen to visual viewport changes to dynamically size the drawer when the keyboard shows up on iOS
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      document.documentElement.style.setProperty('--lcb-vv-height', `${vv.height}px`)
      document.documentElement.style.setProperty('--lcb-vv-offset-top', `${vv.offsetTop}px`)
      
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
      window.scrollTo(0, scrollY)
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
      const scrollEl = target.closest('.lcb-messages') || target.closest('.lcb-history')

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

  if (!active) return null

  function openPanel() {
    setOpen(true)
    setIsClosing(false)
  }

  function closePanel() {
    setIsClosing(true)
    setTimeout(() => {
      setOpen(false)
      setIsClosing(false)
      setError(null)
    }, 280)
  }

  function startNewConversation() {
    setMessages([])
    setJumpingAssistantIndex(null)
    setActiveConversationId(null)
    setInput('')
    setError(null)
    setHistoryOpen(false)
  }

  function openConversation(conversation: SageConversation) {
    setActiveConversationId(conversation.id)
    setMessages(conversation.messages.map((message) => ({ role: message.role, content: message.content })))
    setJumpingAssistantIndex(null)
    setInput('')
    setError(null)
    setHistoryOpen(false)
  }

  async function saveConversation(nextMessages: ChatMessage[]) {
    const displayMessages: SageDisplayMessage[] = nextMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }))
    const saved = await upsertSageConversation(userId, {
      id: activeConversationIdRef.current,
      context: 'lesson',
      contextId,
      title: getSageConversationTitle(displayMessages),
      messages: displayMessages,
      history: displayMessages.map((message) => ({ role: message.role, text: message.content })),
    })
    setActiveConversationId(saved.id)
    setConversations((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)])
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { role: 'user' as ChatRole, content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)
    const userTurnSaved = saveConversation(next).catch(() => null)
    try {
      const reply = await sendChatMessage(buildSystemPrompt(lessonTitle, topicTitle, lessonContent, memories, profile), next)
      const savedMessages = [...next, { role: 'assistant' as ChatRole, content: reply }]
      setMessages(savedMessages)
      setJumpingAssistantIndex(next.length)
      await userTurnSaved
      await saveConversation(savedMessages)
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

  return (
    <>
      {!open && !isClosing && (
        <button
          className="lcb-fab"
          onClick={openPanel}
          aria-label="Ask Sage AI tutor"
        >
          <SageAvatar size={34} />
        </button>
      )}

      {(open || isClosing) && (
        <>
          <div 
            className={`lcb-backdrop ${isClosing ? 'lcb-backdrop--closing' : ''}`} 
            onClick={closePanel} 
            aria-hidden="true" 
          />
          <div className="lcb-viewport">
            <div 
              className={`lcb-panel ${isClosing ? 'lcb-panel--closing' : ''}`} 
              role="dialog" 
              aria-label="Sage AI tutor"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="lcb-header">
              <div className="lcb-header__left">
                <SageAvatar size={28} />
                <span className="lcb-header__title">Ask Sage</span>
              </div>
              <div className="lcb-header__actions">
                <button
                  className={`lcb-header__icon ${historyOpen ? 'lcb-header__icon--active' : ''}`}
                  onClick={() => setHistoryOpen((value) => !value)}
                  aria-label="Saved Sage chats"
                >
                  <Clock3 size={16} />
                </button>
                <button className="lcb-header__icon" onClick={startNewConversation} aria-label="Start new Sage chat">
                  <Plus size={17} />
                </button>
                <button className="lcb-header__icon" onClick={closePanel} aria-label="Close chat">
                  <X size={17} />
                </button>
              </div>
            </div>

            {historyOpen && (
              <div className="lcb-history">
                <div className="lcb-history__top">
                  <span>Saved chats</span>
                  <button onClick={startNewConversation}>New chat</button>
                </div>
                {historyLoading && <p className="lcb-history__empty">Loading chats...</p>}
                {!historyLoading && conversations.length === 0 && (
                  <p className="lcb-history__empty">Your Sage conversations for this lesson will appear here.</p>
                )}
                {!historyLoading && conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`lcb-history__item ${conversation.id === activeConversationId ? 'lcb-history__item--active' : ''}`}
                    onClick={() => openConversation(conversation)}
                  >
                    <span>{conversation.title}</span>
                    <time>{new Date(conversation.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</time>
                  </button>
                ))}
              </div>
            )}

            <div className="lcb-messages" ref={messagesContainerRef}>
              {messages.length === 0 && !loading && (
                <div className="lcb-empty">
                  <div className="lcb-empty__avatar-wrapper">
                    <SageAvatar size={48} />
                  </div>
                  <p className="lcb-empty__title">Chat with Sage</p>
                  <p className="lcb-empty__desc">Ask me anything about this lesson! I can help explain concepts, give analogies, or answer questions.</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`lcb-row lcb-row--${m.role}`}>
                    {!isUser && (
                      <div className="lcb-msg-avatar">
                        <SageAvatar size={28} leafJump={jumpingAssistantIndex === i} />
                      </div>
                    )}
                    <div className={`lcb-bubble lcb-bubble--${m.role}`}>
                      {renderMessage(m.content)}
                    </div>
                    {isUser && (
                      <div className="lcb-msg-avatar lcb-msg-avatar--user">
                        <User size={15} style={{ color: '#ffffff' }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="lcb-row lcb-row--assistant">
                  <div className="lcb-msg-avatar">
                    <SageAvatar size={28} />
                  </div>
                  <div className="lcb-bubble lcb-bubble--assistant lcb-bubble--loading">
                    <span className="lcb-dots"><span /><span /><span /></span>
                  </div>
                </div>
              )}
              {error && (
                <div className="lcb-row lcb-row--assistant">
                  <div className="lcb-msg-avatar">
                    <SageAvatar size={28} />
                  </div>
                  <div className="lcb-bubble lcb-bubble--error">{error}</div>
                </div>
              )}
            </div>

            <div className="lcb-input-row">
              <textarea
                ref={inputRef}
                className="lcb-textarea"
                rows={1}
                placeholder="Ask a question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="lcb-send"
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
        @keyframes float-btn {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .lcb-fab {
          position: absolute;
          bottom: 20px;
          right: 16px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 1.5px solid #f2ab8d;
          background: #fbe1d6;
          box-shadow: 0 4px 12px rgba(233, 105, 74, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          padding: 0;
          animation: float-btn 3.5s ease-in-out infinite;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .lcb-fab:hover {
          box-shadow: 0 6px 18px rgba(233, 105, 74, 0.25);
          transform: translateY(-2px);
        }
        .lcb-fab:active {
          transform: scale(0.95);
        }
        .lcb-fab img { border-radius: 50%; object-fit: cover; }

        .lcb-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 19;
          background: rgba(28, 26, 36, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: lcb-fade-in 0.24s ease-out both;
        }
        .lcb-backdrop--closing {
          animation: lcb-fade-out 0.24s ease-out both;
        }
        @keyframes lcb-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lcb-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        .lcb-viewport {
          position: fixed;
          top: var(--lcb-vv-offset-top, 0px);
          left: 0; right: 0;
          height: var(--lcb-vv-height, 100vh);
          z-index: 20;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
        }

        .lcb-panel {
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
          animation: lcb-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .lcb-panel--closing {
          animation: lcb-slide-down 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes lcb-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes lcb-slide-down {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }

        .lcb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          flex-shrink: 0;
          background: #f4f0e6;
          border-bottom: 1.5px solid #e6dbc4;
          z-index: 5;
        }
        .lcb-header__left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lcb-header__title {
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: bold;
          color: #1c1a24;
        }
        .lcb-header__actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lcb-header__icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5f5848;
          transition: background-color 0.15s ease, transform 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }
        .lcb-header__icon:hover,
        .lcb-header__icon--active {
          background: #ebe7dd;
          color: #1c2a47;
        }
        .lcb-header__icon:active { transform: scale(0.95); }

        .lcb-history {
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
        .lcb-history__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #1c1a24;
        }
        .lcb-history__top button {
          border: none;
          background: transparent;
          color: #e9694a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 0;
        }
        .lcb-history__empty {
          margin: 2px 0 0;
          color: #7c715e;
          font-size: 12px;
          line-height: 1.4;
        }
        .lcb-history__item {
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
        .lcb-history__item--active {
          border-color: #ff9b7d;
          background: #fff3ec;
        }
        .lcb-history__item span {
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lcb-history__item time {
          color: #7c715e;
          font-size: 11px;
        }

        .lcb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
          overscroll-behavior: contain;
        }
        .lcb-messages::-webkit-scrollbar { display: none; }

        .lcb-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 100%;
        }
        .lcb-row--user {
          justify-content: flex-end;
        }
        .lcb-row--assistant {
          justify-content: flex-start;
        }

        .lcb-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: visible;
        }
        .lcb-msg-avatar--user {
          background: #95a4bb;
          overflow: hidden;
        }

        .lcb-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px;
          margin-top: auto;
          margin-bottom: auto;
        }
        .lcb-empty__avatar-wrapper {
          margin-bottom: 16px;
          position: relative;
        }
        .lcb-empty__avatar-wrapper::after {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid #ff9b7d;
          border-radius: 50%;
          opacity: 0.4;
          animation: lcb-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes lcb-ping {
          75%, 100% { transform: scale(1.18); opacity: 0; }
        }
        .lcb-empty__title {
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: bold;
          color: #1c1a24;
          margin: 0 0 8px;
        }
        .lcb-empty__desc {
          font-size: 13px;
          color: #5f5848;
          line-height: 1.5;
          max-width: 240px;
          margin: 0;
        }

        .lcb-bubble--error {
          background: #fde8e4;
          color: #c93b2b;
          border: 1px solid #f9c0b5;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 6px rgba(201,59,43,0.06);
        }

        .lcb-bubble {
          max-width: 75%;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          animation: lcb-bubble-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes lcb-bubble-in {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        .lcb-bubble--user {
          background: #1c2a47;
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
        }
        .lcb-bubble--assistant {
          background: #ffffff;
          color: #1c1a24;
          border: none;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        }
        .lcb-bubble--loading { padding: 12px 16px; }
        .lcb-dots {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .lcb-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #95a4bb;
          animation: lcb-dot-bounce 1.2s infinite ease-in-out;
        }
        .lcb-dots span:nth-child(1) { animation-delay: 0s; }
        .lcb-dots span:nth-child(2) { animation-delay: 0.2s; }
        .lcb-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes lcb-dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1);   opacity: 1; }
        }

        .lcb-input-row {
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
        .lcb-textarea {
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
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          transition: background-color 0.15s ease;
        }
        .lcb-textarea:focus   { background: #ffffff; }
        .lcb-textarea:disabled { opacity: 0.5; }
        .lcb-send {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #ff7350;
          color: #ffffff;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s ease, transform 0.1s ease, background-color 0.15s ease;
          box-shadow: 0 2px 8px rgba(255, 115, 80, 0.2);
        }
        .lcb-send:hover {
          background: #e9694a;
        }
        .lcb-send:disabled            { opacity: 0.35; cursor: not-allowed; background: #e6dbc4; box-shadow: none; color: #95a4bb; }
        .lcb-send:not(:disabled):active { transform: scale(0.92); }
      `}</style>
    </>
  )
}

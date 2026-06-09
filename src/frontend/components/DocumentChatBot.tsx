import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Brain, Clock3, Plus, Send, Trash2, User, X } from 'lucide-react'
import { sendChatMessage, type ChatMessage, type ChatRole } from '../services/aiChatService'
import { SageAvatar } from './SageAvatar'
import { fetchSageMemories, deleteSageMemory, type SageMemory } from '@backend/sageMemoryService'
import { useProfile, type UserProfile } from '../context/ProfileContext'
import {
  fetchSageConversations,
  getSageConversationTitle,
  upsertSageConversation,
  type SageConversation,
} from '@backend/sageConversationService'

export interface DocumentChatBotProps {
  documentTitle: string
  documentPath: string
}

function buildProfileContext(profile: UserProfile | null): string {
  if (!profile) return ''
  const lines: string[] = [
    `Name: ${profile.firstName} | Life stage: ${profile.lifeStage}`,
  ]
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
  if (profile.upcomingEvents.length > 0) lines.push(`Upcoming events: ${profile.upcomingEvents.join(', ')}`)
  return lines.join('\n')
}

function buildSystemPrompt(documentTitle: string, documentContent: string, memories: SageMemory[], profile: UserProfile | null): string {
  const profileSection = profile ? `\n## User context\n${buildProfileContext(profile)}\n` : ''
  const memoriesSection = memories.length > 0
    ? `\n## What Sage remembers about you\n${memories.map((m) => `- ${m.content}`).join('\n')}\n`
    : ''

  return `You are a sharp, friendly personal finance tutor for young UK professionals on Anticipate.

CONTEXT
Document: "${documentTitle}"
${documentContent}
${profileSection}${memoriesSection}
RULES
- British English only
- Never give regulated financial advice; nudge users to verify with a professional when needed
- Only answer questions about the document or personal finance concepts; gently redirect anything off-topic

HOW TO RESPOND
- Be extremely concise: 1-2 sentences maximum for simple questions.
- Use short, punchy bullet points for lists.
- Do not repeat the document text.
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

export function DocumentChatBot({ documentTitle, documentPath }: DocumentChatBotProps) {
  const { userId, profile } = useProfile()
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
  const [documentContent, setDocumentContent] = useState<string>('')
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeConversationIdRef = useRef<string | null>(null)
  const messagesLengthRef = useRef(0)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    messagesLengthRef.current = messages.length
  }, [messages.length])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = setTimeout(() => {
      setHistoryLoading(true)
      void fetchSageConversations(userId, 'decoder', documentPath)
        .then((saved) => {
          if (cancelled) return
          setConversations(saved)
          if (activeConversationIdRef.current || messagesLengthRef.current > 0 || saved.length === 0) return
          const latest = saved[0]
          setActiveConversationId(latest.id)
          setMessages(latest.messages.map((m) => ({ role: m.role as ChatRole, content: m.content })))
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
  }, [open, userId, documentPath])

  useEffect(() => {
    if (open && userId) {
      void fetchSageMemories(userId).then(setMemories).catch(() => {})
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
  }, [messages, loading, open, isClosing])

  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      document.documentElement.style.setProperty('--dcb-vv-height', `${vv.height}px`)
      document.documentElement.style.setProperty('--dcb-vv-offset-top', `${vv.offsetTop}px`)
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      document.body.scrollTop = 0
    }
    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)
    handleResize()
    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [open])

  // Prevent layout viewport scroll when open
  useEffect(() => {
    if (!open) return

    const preventScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      document.body.scrollTop = 0
    }

    window.scrollTo(0, 0)
    document.body.scrollTop = 0

    window.addEventListener('scroll', preventScroll)
    return () => {
      window.removeEventListener('scroll', preventScroll)
    }
  }, [open])

  // Prevent touchmove scrolling background on iOS when open
  useEffect(() => {
    if (!open) return

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const isScrollable =
        target.closest('.dcb-messages') ||
        target.closest('.dcb-history') ||
        target.closest('textarea') ||
        target.closest('input')

      if (!isScrollable) {
        if (e.cancelable) {
          e.preventDefault()
        }
      }
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    async function loadContent() {
      try {
        const modules = import.meta.glob('../content/documents/*.md', { query: '?raw', import: 'default' })
        const pathKey = `../content/documents/${documentPath}`
        const loader = modules[pathKey]
        
        if (!loader) {
          throw new Error(`Document not found: ${pathKey}`)
        }
        
        const content = await loader() as string
        setDocumentContent(content)
      } catch (err) {
        console.error('[Sage] failed to load document:', err)
        setError("I didn't quite get that, please try again.")
      }
    }
    loadContent()
  }, [documentPath])

  function openPanel() { setOpen(true) }
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
    setMemoryOpen(false)
  }

  function openConversation(conversation: SageConversation) {
    setActiveConversationId(conversation.id)
    setMessages(conversation.messages.map((m) => ({ role: m.role as ChatRole, content: m.content })))
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

  async function saveConversation(nextMessages: ChatMessage[]) {
    const displayMessages = nextMessages.map((m) => ({ role: m.role, content: m.content }))
    const saved = await upsertSageConversation(userId, {
      id: activeConversationIdRef.current,
      context: 'decoder',
      contextId: documentPath,
      title: getSageConversationTitle(displayMessages),
      messages: displayMessages,
      history: nextMessages.map((m) => ({ role: m.role as 'user' | 'assistant', text: m.content })),
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
      const reply = await sendChatMessage(buildSystemPrompt(documentTitle, documentContent, memories, profile), next)
      const assistantMsg: ChatMessage = { role: 'assistant' as ChatRole, content: reply }
      const finalMessages = [...next, assistantMsg]
      setMessages(finalMessages)
      setJumpingAssistantIndex(next.length)
      await userTurnSaved
      await saveConversation(finalMessages)
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
          className="dcb-fab"
          onClick={openPanel}
          aria-label="Ask Sage AI tutor"
        >
          <SageAvatar size={34} />
        </button>
      )}

      {(open || isClosing) && (
        <>
          <div 
            className={`dcb-backdrop ${isClosing ? 'dcb-backdrop--closing' : ''}`} 
            onClick={closePanel} 
            aria-hidden="true"
          />
          <div className="dcb-viewport">
            <div 
              className={`dcb-panel ${isClosing ? 'dcb-panel--closing' : ''}`} 
              role="dialog"
              aria-label="Chat with Sage"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="dcb-header">
              <div className="dcb-header__left">
                <SageAvatar size={28} />
                <span className="dcb-header__title">Ask Sage</span>
                {userId && memories.length > 0 && (
                  <button
                    className={`dcb-memory-chip ${memoryOpen ? 'dcb-memory-chip--active' : ''}`}
                    onClick={() => { setMemoryOpen((v) => !v); setHistoryOpen(false) }}
                    aria-label={`Sage remembers ${memories.length} thing${memories.length !== 1 ? 's' : ''}`}
                  >
                    <Brain size={11} />
                    {memories.length}
                  </button>
                )}
              </div>
              <div className="dcb-header__actions">
                <button
                  className={`dcb-header__icon ${historyOpen ? 'dcb-header__icon--active' : ''}`}
                  onClick={() => { setHistoryOpen((v) => !v); setMemoryOpen(false) }}
                  aria-label="Saved Sage chats"
                >
                  <Clock3 size={16} />
                </button>
                <button className="dcb-header__icon" onClick={startNewConversation} aria-label="Start new Sage chat">
                  <Plus size={17} />
                </button>
                <button className="dcb-header__icon" onClick={closePanel} aria-label="Close chat">
                  <X size={17} />
                </button>
              </div>
            </div>

            {historyOpen && (
              <div className="dcb-history">
                <div className="dcb-history__top">
                  <span>Saved chats</span>
                  <button onClick={startNewConversation}>New chat</button>
                </div>
                {historyLoading && <p className="dcb-history__empty">Loading chats...</p>}
                {!historyLoading && conversations.length === 0 && (
                  <p className="dcb-history__empty">Your Sage conversations will appear here.</p>
                )}
                {!historyLoading && conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`dcb-history__item ${conversation.id === activeConversationId ? 'dcb-history__item--active' : ''}`}
                    onClick={() => openConversation(conversation)}
                  >
                    <span>{conversation.title}</span>
                    <time>{new Date(conversation.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</time>
                  </button>
                ))}
              </div>
            )}

            {memoryOpen && (
              <div className="dcb-history">
                <div className="dcb-history__top">
                  <span>Sage's memory</span>
                  <span style={{ fontSize: 11, color: '#7c715e', fontWeight: 400 }}>{memories.length} saved</span>
                </div>
                {memories.length === 0 && (
                  <p className="dcb-history__empty">Sage will remember things you tell it here.</p>
                )}
                {memories.map((mem) => (
                  <div key={mem.id} className="dcb-memory__item">
                    <span>{mem.content}</span>
                    <button
                      className="dcb-memory__delete"
                      onClick={() => void handleDeleteMemory(mem.id)}
                      aria-label="Delete memory"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="dcb-messages" ref={messagesContainerRef}>
              {messages.length === 0 && !loading && (
                <div className="dcb-empty">
                  <div className="dcb-empty__avatar-wrapper">
                    <SageAvatar size={48} />
                  </div>
                  <p className="dcb-empty__title">Chat with Sage</p>
                  <p className="dcb-empty__desc">Ask me anything about this document!</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === 'user'
                return (
                  <div key={i} className={`dcb-row dcb-row--${m.role}`}>
                    {!isUser && (
                      <div className="dcb-msg-avatar">
                        <SageAvatar size={28} leafJump={jumpingAssistantIndex === i} />
                      </div>
                    )}
                    <div className="dcb-msg-content">
                      <div className={`dcb-bubble dcb-bubble--${m.role}`}>
                        {renderMessage(m.content)}
                      </div>
                    </div>
                    {isUser && (
                      <div className="dcb-msg-avatar dcb-msg-avatar--user">
                        <User size={15} style={{ color: '#ffffff' }} />
                      </div>
                    )}
                  </div>
                )
              })}
              {loading && (
                <div className="dcb-row dcb-row--assistant">
                  <div className="dcb-msg-avatar">
                    <SageAvatar size={28} />
                  </div>
                  <div className="dcb-bubble dcb-bubble--assistant dcb-bubble--loading">
                    <span className="dcb-dots"><span /><span /><span /></span>
                  </div>
                </div>
              )}
              {error && (
                <div className="dcb-row dcb-row--assistant">
                  <div className="dcb-msg-avatar">
                    <SageAvatar size={28} />
                  </div>
                  <div className="dcb-msg-content">
                    <div className="dcb-bubble dcb-bubble--error">{error}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="dcb-input-row">
              <textarea
                ref={inputRef}
                className="dcb-textarea"
                rows={1}
                placeholder="Ask Sage anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="dcb-send"
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
        .dcb-fab {
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
        .dcb-fab:hover {
          box-shadow: 0 6px 18px rgba(233, 105, 74, 0.25);
          transform: translateY(-2px);
        }

        .dcb-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 19;
          background: rgba(28, 26, 36, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: dcb-fade-in 0.24s ease-out both;
        }
        .dcb-backdrop--closing { animation: dcb-fade-out 0.24s ease-out both; }
        @keyframes dcb-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dcb-fade-out { from { opacity: 1; } to { opacity: 0; } }

        .dcb-viewport {
          position: fixed;
          top: var(--dcb-vv-offset-top, 0px);
          left: 0; right: 0;
          height: var(--dcb-vv-height, 100vh);
          z-index: 20;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
        }

        .dcb-panel {
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
          animation: dcb-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dcb-panel--closing { animation: dcb-slide-down 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes dcb-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes dcb-slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }

        .dcb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          flex-shrink: 0;
          background: #f4f0e6;
          border-bottom: 1.5px solid #e6dbc4;
          z-index: 5;
        }
        .dcb-header__left { display: flex; align-items: center; gap: 10px; }
        .dcb-header__title {
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: bold;
          color: #1c1a24;
        }
        .dcb-header__actions { display: flex; align-items: center; gap: 8px; }
        .dcb-header__icon {
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
        .dcb-header__icon:hover, .dcb-header__icon--active { background: #ebe7dd; color: #1c2a47; }
        .dcb-header__icon:active { transform: scale(0.95); }

        .dcb-history {
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
        .dcb-history__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #1c1a24;
        }
        .dcb-history__top button {
          border: none;
          background: transparent;
          color: #e9694a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 0;
        }
        .dcb-history__empty {
          margin: 2px 0 0;
          color: #7c715e;
          font-size: 12px;
          line-height: 1.4;
        }
        .dcb-history__item {
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
        .dcb-history__item--active {
          border-color: #ff9b7d;
          background: #fff3ec;
        }
        .dcb-history__item span {
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dcb-history__item time {
          color: #7c715e;
          font-size: 11px;
        }

        .dcb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
        }
        .dcb-messages::-webkit-scrollbar { display: none; }

        .dcb-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 100%;
        }
        .dcb-row--user { justify-content: flex-end; }
        .dcb-row--assistant { justify-content: flex-start; }

        .dcb-msg-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 78%;
        }
        .dcb-row--user .dcb-msg-content { align-items: flex-end; }

        .dcb-msg-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          overflow: visible;
          margin-top: 2px;
        }
        .dcb-msg-avatar--user { background: #95a4bb; overflow: hidden; }

        .dcb-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px;
          margin: auto;
        }
        .dcb-empty__avatar-wrapper {
          margin-bottom: 16px;
          position: relative;
        }
        .dcb-empty__avatar-wrapper::after {
          content: '';
          position: absolute;
          top: -4px; left: -4px; right: -4px; bottom: -4px;
          border: 2px solid #ff9b7d;
          border-radius: 50%;
          opacity: 0.4;
          animation: dcb-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes dcb-ping { 75%, 100% { transform: scale(1.18); opacity: 0; } }
        .dcb-empty__title {
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: bold;
          color: #1c1a24;
          margin: 0 0 8px;
        }
        .dcb-empty__desc {
          font-size: 13px;
          color: #5f5848;
          line-height: 1.5;
          max-width: 260px;
          margin: 0;
        }

        .dcb-bubble--error {
          background: #fde8e4;
          color: #c93b2b;
          border: 1px solid #f9c0b5;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 6px rgba(201,59,43,0.06);
        }

        .dcb-bubble {
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          animation: dcb-bubble-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes dcb-bubble-in { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .dcb-bubble--user {
          background: #1c2a47;
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
        }
        .dcb-bubble--assistant {
          background: #ffffff;
          color: #1c1a24;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .dcb-bubble--loading { padding: 12px 16px; }
        .dcb-dots { display: flex; gap: 5px; align-items: center; }
        .dcb-dots span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #95a4bb;
          animation: dcb-dot-bounce 1.2s infinite ease-in-out;
        }
        .dcb-dots span:nth-child(1) { animation-delay: 0s; }
        .dcb-dots span:nth-child(2) { animation-delay: 0.2s; }
        .dcb-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dcb-dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1);   opacity: 1; }
        }

        .dcb-input-row {
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
        .dcb-textarea {
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
        .dcb-textarea:disabled { opacity: 0.5; }
        .dcb-send {
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
        .dcb-send:hover { background: #e9694a; }
        .dcb-send:disabled { opacity: 0.35; cursor: not-allowed; background: #e6dbc4; box-shadow: none; color: #95a4bb; }
        .dcb-send:not(:disabled):active { transform: scale(0.92); }

        .dcb-memory-chip {
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
        .dcb-memory-chip:hover, .dcb-memory-chip--active {
          background: #ebe7dd;
          border-color: #d4c9b0;
          color: #1c2a47;
        }

        .dcb-memory__item {
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
        .dcb-memory__item span {
          flex: 1;
          font-weight: 500;
        }
        .dcb-memory__delete {
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
        .dcb-memory__delete:hover { color: #c93b2b; }
      `}</style>
    </>
  )
}

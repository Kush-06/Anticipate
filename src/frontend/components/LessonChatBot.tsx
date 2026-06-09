import { useState, useRef, useEffect, type ReactNode } from 'react'
import { User } from 'lucide-react'
import { hasActiveProvider, sendChatMessage, type ChatMessage, type ChatRole } from '../services/aiChatService'
import { SageAvatar } from './SageAvatar'

export interface LessonChatBotProps {
  lessonTitle: string
  topicTitle: string
  lessonContent: string
}

function buildSystemPrompt(lessonTitle: string, topicTitle: string, lessonContent: string): string {
  return `You are a sharp, friendly personal finance tutor for young UK professionals on Anticipate.

LESSON CONTEXT
Topic: "${topicTitle}" | Lesson: "${lessonTitle}"
${lessonContent}

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
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = hasActiveProvider()

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
      setViewportHeight(vv.height)
    }

    vv.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      vv.removeEventListener('resize', handleResize)
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

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { role: 'user' as ChatRole, content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const reply = await sendChatMessage(buildSystemPrompt(lessonTitle, topicTitle, lessonContent), next)
      setMessages([...next, { role: 'assistant' as ChatRole, content: reply }])
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
          <div 
            className={`lcb-panel ${isClosing ? 'lcb-panel--closing' : ''}`} 
            role="dialog" 
            aria-label="Sage AI tutor"
            style={{
              height: `${viewportHeight * 0.85}px`
            }}
          >
            <div className="lcb-header">
              <div className="lcb-header__left">
                <SageAvatar size={28} />
                <span className="lcb-header__title">Ask Sage</span>
              </div>
              <button className="lcb-header__close" onClick={closePanel} aria-label="Close chat">✕</button>
            </div>

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
                        <SageAvatar size={28} />
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
              {error && <p className="lcb-error">{error}</p>}
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
                ➤
              </button>
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

        .lcb-panel {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 20;
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
        .lcb-header__close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #5f5848;
          transition: background-color 0.15s ease, transform 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }
        .lcb-header__close:hover { background: #ebe7dd; }
        .lcb-header__close:active { transform: scale(0.95); }

        .lcb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
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
          overflow: hidden;
        }
        .lcb-msg-avatar--user {
          background: #95a4bb;
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

        .lcb-error {
          font-size: 12px;
          color: #c93b2b;
          background: #fde8e4;
          border-radius: 12px;
          padding: 10px 14px;
          text-align: center;
          border: 1px solid #f9c0b5;
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

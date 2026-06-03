import { useState, useRef, useEffect } from 'react'
import { hasActiveProvider, sendChatMessage, type ChatMessage, type ChatRole } from '../services/aiChatService'
import { SageAvatar } from './SageAvatar'

export interface LessonChatBotProps {
  lessonTitle: string
  topicTitle: string
  lessonContent: string
}

function buildSystemPrompt(lessonTitle: string, topicTitle: string, lessonContent: string): string {
  return `You are Anticipate's friendly personal finance tutor for young UK professionals. \
Keep answers concise, warm, and jargon-free. Use British English. \
Never give regulated financial advice — remind the user to verify with a professional when appropriate.

The student is currently studying the lesson titled "${lessonTitle}" from the topic "${topicTitle}". \
Here is the full lesson content for your reference:

---
${lessonContent}
---

Only answer questions related to personal finance and the content above. \
If asked something completely unrelated, gently redirect back to the lesson.`
}

export function LessonChatBot({ lessonTitle, topicTitle, lessonContent }: LessonChatBotProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = hasActiveProvider()

  useEffect(() => {
    if (!active) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, active])

  useEffect(() => {
    if (!active || !open) return
    inputRef.current?.focus()
  }, [open, active])

  if (!active) return null

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

  function closePanel() {
    setOpen(false)
    setError(null)
  }

  return (
    <>
      {!open && (
        <button
          className="lcb-fab"
          onClick={() => setOpen(true)}
          aria-label="Ask Anticipate AI tutor"
        >
          <SageAvatar size={34} />
        </button>
      )}

      {open && (
        <>
          <div className="lcb-backdrop" onClick={closePanel} aria-hidden="true" />
          <div className="lcb-panel" role="dialog" aria-label="Anticipate AI tutor">
            <div className="lcb-header">
              <div className="lcb-header__left">
                <SageAvatar size={28} />
                <span className="lcb-header__title">Ask Anticipate</span>
              </div>
              <button className="lcb-header__close" onClick={closePanel} aria-label="Close chat">✕</button>
            </div>

            <div className="lcb-messages">
              {messages.length === 0 && !loading && (
                <p className="lcb-empty">Ask me anything about this lesson!</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`lcb-bubble lcb-bubble--${m.role}`}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="lcb-bubble lcb-bubble--assistant lcb-bubble--loading">
                  <span className="lcb-dots"><span /><span /><span /></span>
                </div>
              )}
              {error && <p className="lcb-error">{error}</p>}
              <div ref={bottomRef} />
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
        .lcb-fab {
          position: absolute;
          bottom: 88px;
          right: 16px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: var(--p-coral);
          box-shadow: 0 4px 16px rgba(233, 105, 74, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          padding: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .lcb-fab:hover  { transform: scale(1.06); box-shadow: 0 6px 22px rgba(233,105,74,0.42); }
        .lcb-fab:active { transform: scale(0.95); }
        .lcb-fab img    { border-radius: 50%; object-fit: cover; }

        .lcb-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 85%;
          z-index: 19;
          background: rgba(28, 26, 36, 0.28);
        }

        .lcb-panel {
          position: absolute;
          top: 15%;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 20;
          border-radius: 24px 24px 0 0;
          border-top: 1.5px solid var(--p-line);
          background: var(--p-bg-2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: lcb-slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes lcb-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .lcb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 14px;
          border-bottom: 1px solid var(--p-line);
          flex-shrink: 0;
        }
        .lcb-header__left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lcb-header__title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          color: var(--p-ink);
        }
        .lcb-header__close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid var(--p-line);
          background: var(--p-card);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--p-ink-3);
          transition: background 0.15s ease;
          flex-shrink: 0;
        }
        .lcb-header__close:hover { background: var(--p-line); }

        .lcb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: none;
        }
        .lcb-messages::-webkit-scrollbar { display: none; }

        .lcb-empty {
          font-size: 13px;
          color: var(--p-ink-3);
          text-align: center;
          margin-top: 28px;
        }
        .lcb-error {
          font-size: 12px;
          color: var(--p-coral);
          background: var(--p-coral-tint);
          border-radius: 10px;
          padding: 8px 12px;
          text-align: center;
        }

        .lcb-bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .lcb-bubble--user {
          align-self: flex-end;
          background: var(--p-navy);
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }
        .lcb-bubble--assistant {
          align-self: flex-start;
          background: var(--p-card);
          color: var(--p-ink-2);
          border: 1px solid var(--p-line);
          border-bottom-left-radius: 4px;
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
          background: var(--p-ink-3);
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
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          border-top: 1px solid var(--p-line);
          flex-shrink: 0;
          background: var(--p-bg-2);
        }
        .lcb-textarea {
          flex: 1;
          resize: none;
          border: 1.5px solid var(--p-line);
          border-radius: 14px;
          padding: 10px 14px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--p-ink);
          background: var(--p-card);
          outline: none;
          max-height: 120px;
          overflow-y: auto;
          line-height: 1.45;
          transition: border-color 0.15s ease;
        }
        .lcb-textarea:focus   { border-color: var(--p-navy); }
        .lcb-textarea:disabled { opacity: 0.5; }
        .lcb-send {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: var(--p-navy);
          color: #ffffff;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .lcb-send:disabled            { opacity: 0.35; cursor: not-allowed; }
        .lcb-send:not(:disabled):active { transform: scale(0.92); }
      `}</style>
    </>
  )
}

import { useState, useRef, useEffect } from 'react'
import { User } from 'lucide-react'
import { hasActiveProvider, sendChatMessage, type ChatMessage, type ChatRole } from '../services/aiChatService'
import { SageAvatar } from './SageAvatar'

export interface DocumentChatBotProps {
  documentTitle: string
  documentPath: string
}

function buildSystemPrompt(documentTitle: string, documentContent: string): string {
  return `You are a sharp, friendly personal finance tutor for young UK professionals on Anticipate.

CONTEXT
Document: "${documentTitle}"
${documentContent}

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

export function DocumentChatBot({ documentTitle, documentPath }: DocumentChatBotProps) {
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const [documentContent, setDocumentContent] = useState<string>('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const active = hasActiveProvider()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
        console.error(`Failed to load document at ${documentPath}`, err)
        setError('Could not load document content.')
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

  function renderMessage(content: string) {
    return content.split('\n').map((line, i) => <p key={i} style={{ margin: '4px 0' }}>{line}</p>)
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
      const reply = await sendChatMessage(buildSystemPrompt(documentTitle, documentContent), next)
      setMessages([...next, { role: 'assistant' as ChatRole, content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
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
          <div 
            className={`dcb-panel ${isClosing ? 'dcb-panel--closing' : ''}`} 
            style={{
              height: `${viewportHeight * 0.85}px`
            }}
          >
            <div className="dcb-header">
              <div className="dcb-header__left">
                <SageAvatar size={28} />
                <span className="dcb-header__title">Ask Sage</span>
              </div>
              <button className="dcb-header__close" onClick={closePanel} aria-label="Close chat">✕</button>
            </div>

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
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`dcb-row dcb-row--${m.role}`}>
                    {!isUser && (
                      <div className="dcb-msg-avatar">
                        <SageAvatar size={28} />
                      </div>
                    )}
                    <div className={`dcb-bubble dcb-bubble--${m.role}`}>
                      {renderMessage(m.content)}
                    </div>
                    {isUser && (
                      <div className="dcb-msg-avatar dcb-msg-avatar--user">
                        <User size={15} style={{ color: '#ffffff' }} />
                      </div>
                    )}
                  </div>
                );
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
              {error && <p className="dcb-error">{error}</p>}
            </div>

            <div className="dcb-input-row">
              <textarea
                className="dcb-textarea"
                rows={1}
                placeholder="Ask a question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                className="dcb-send"
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
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 19;
          background: rgba(28, 26, 36, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: dcb-fade-in 0.24s ease-out both;
        }
        .dcb-backdrop--closing {
          animation: dcb-fade-out 0.24s ease-out both;
        }
        @keyframes dcb-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dcb-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .dcb-panel {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 70vh;
          z-index: 20;
          border-radius: 28px 28px 0 0;
          background: #f4f0e6;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
          animation: dcb-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dcb-panel--closing {
          animation: dcb-slide-down 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes dcb-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes dcb-slide-down {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
        .dcb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          flex-shrink: 0;
          background: #f4f0e6;
          border-bottom: 1.5px solid #e6dbc4;
        }
        .dcb-header__left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dcb-header__title {
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: bold;
          color: #1c1a24;
        }
        .dcb-header__close {
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
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
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
        .dcb-row { display: flex; align-items: flex-end; gap: 8px; max-width: 100%; }
        .dcb-row--user { justify-content: flex-end; }
        .dcb-bubble { 
          max-width: 75%;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .dcb-bubble--user { background: #1c2a47; color: #ffffff; border-radius: 18px 18px 4px 18px; }
        .dcb-bubble--assistant { background: #ffffff; color: #1c1a24; border-radius: 18px 18px 18px 4px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03); }
        .dcb-input-row { padding: 14px 16px; display: flex; gap: 8px; background: #f4f0e6; border-top: 1.5px solid #e6dbc4; }
        .dcb-textarea { flex: 1; padding: 10px 16px; border-radius: 20px; border: none; outline: none; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); }
        .dcb-send { width: 40px; height: 40px; border-radius: 50%; border: none; background: #ff7350; color: #ffffff; }
        .dcb-msg-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dcb-msg-avatar--user { background: #95a4bb; }
        .dcb-empty { padding: 40px 24px; text-align: center; }
        .dcb-empty__avatar-wrapper { margin-bottom: 16px; }
        .dcb-empty__title { font-family: Georgia, serif; font-size: 18px; font-weight: bold; color: #1c1a24; margin: 0 0 8px; }
        .dcb-empty__desc { font-size: 13px; color: #5f5848; }
        .dcb-error { font-size: 12px; color: #c93b2b; background: #fde8e4; border-radius: 12px; padding: 10px 14px; }
        .dcb-dots { display: flex; gap: 5px; }
        .dcb-dots span { width: 7px; height: 7px; border-radius: 50%; background: #95a4bb; }
      `}</style>
    </>
  )
}

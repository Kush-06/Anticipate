import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { TopicIcon } from './TopicIcon'
import { SageAvatar } from './SageAvatar'
import { MessageSquare, Send, ArrowLeft, AlertCircle, CheckCircle, HelpCircle, RotateCw, CornerUpLeft } from 'lucide-react'
import { topics } from '../data/topics'
import { sendChatMessage } from '../services/aiChatService'
import { Toaster, toast } from 'sonner'
import { supabase } from '@backend/supabaseClient'
import {
  fetchThreads,
  createThread,
  fetchMessages,
  createMessage,
  fetchReplyCount,
  getUserNickname,
  validatePostWithSage,
  type ForumThread,
  type ForumMessage,
  type SageValidationResult
} from '../../backend/forumService'

export function CommunityScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Topic filtering - driven directly by searchParams URL query state
  const selectedTopicId = searchParams.get('topic') || 'all'
  const setSelectedTopicId = (id: string) => {
    setSearchParams({ topic: id })
  }
  
  // Threads list state
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({})
  const [loadingThreads, setLoadingThreads] = useState(true)

  // Active Thread / Messaging view
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null)
  const [messages, setMessages] = useState<ForumMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyInput, setReplyInput] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  // Inline Sage reply warning state (avoids ugly top red toasts getting cut off)
  const [replyWarning, setReplyWarning] = useState<string | null>(null)
  const [replyToMessage, setReplyToMessage] = useState<ForumMessage | null>(null)
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true)

  // New thread creation flow
  const [isCreating, setIsCreating] = useState(false)
  const [newTopicId, setNewTopicId] = useState(topics[0]?.id || '')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  
  // Sage validation states
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<SageValidationResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Animation states for smooth closing transitions
  const [isClosingThread, setIsClosingThread] = useState(false)
  const [isClosingCreating, setIsClosingCreating] = useState(false)

  // Dynamic Viewport height for iOS keyboard layout shifts

  // Swipe-to-reply states
  const [swipeMsgId, setSwipeMsgId] = useState<string | null>(null)
  const [swipeX, setSwipeX] = useState<number>(0)
  const swipeStartX = useRef<number>(0)
  const swipeStartY = useRef<number>(0)
  const hasTriggeredSwipeReply = useRef<boolean>(false)

  // Pull-to-refresh states for threads list
  const [threadPullY, setThreadPullY] = useState(0)
  const [isThreadRefreshingState, setIsThreadRefreshingState] = useState(false)
  const [isDraggingThread, setIsDraggingThread] = useState(false)
  const threadTouchStart = useRef({ x: 0, y: 0 })
  const threadScrollTop = useRef(0)

  // Pull-to-refresh states for messages list
  const [messagePullY, setMessagePullY] = useState(0)
  const [isMessageRefreshingState, setIsMessageRefreshingState] = useState(false)
  const [isDraggingMessage, setIsDraggingMessage] = useState(false)
  const messageTouchStart = useRef({ x: 0, y: 0 })
  const messageScrollTop = useRef(0)

  // Swipe-to-reply gesture handlers
  const handleMsgTouchStart = (e: React.TouchEvent, msgId: string) => {
    const touch = e.touches[0]
    swipeStartX.current = touch.clientX
    swipeStartY.current = touch.clientY
    setSwipeMsgId(msgId)
    setSwipeX(0)
    hasTriggeredSwipeReply.current = false
  }

  const handleMsgTouchMove = (e: React.TouchEvent) => {
    if (!swipeMsgId) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeStartX.current
    const deltaY = touch.clientY - swipeStartY.current

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) { // Swipe to the left
        const pull = Math.max(-95, deltaX)
        setSwipeX(pull)
        if (e.cancelable) {
          e.preventDefault()
        }
      }
    }
  }

  const handleMsgTouchEnd = (msg: ForumMessage) => {
    if (!swipeMsgId) return
    if (swipeX < -45) {
      setReplyToMessage(msg)
      setReplyWarning(null)
      setTimeout(() => {
        replyInputRef.current?.focus()
      }, 50)
    }
    setSwipeMsgId(null)
    setSwipeX(0)
    hasTriggeredSwipeReply.current = false
  }

  // Pull-to-refresh handlers for Threads list
  const handleThreadTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    threadTouchStart.current = { x: touch.clientX, y: touch.clientY }
    threadScrollTop.current = e.currentTarget.scrollTop
    setIsDraggingThread(true)
  }

  const handleThreadTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (threadScrollTop.current > 0 || isThreadRefreshingState) return
    const touch = e.touches[0]
    const diffY = touch.clientY - threadTouchStart.current.y
    const diffX = touch.clientX - threadTouchStart.current.x

    if (diffY > 0 && Math.abs(diffY) > Math.abs(diffX)) {
      const pull = Math.min(80, Math.pow(diffY, 0.82))
      setThreadPullY(pull)
      if (pull > 0 && e.cancelable) {
        e.preventDefault()
      }
    }
  }

  const handleThreadTouchEnd = async () => {
    setIsDraggingThread(false)
    if (isThreadRefreshingState) return
    if (threadPullY > 50) {
      setIsThreadRefreshingState(true)
      setThreadPullY(50)
      
      setLoadingThreads(true)
      const fetched = await fetchThreads(selectedTopicId === 'all' ? undefined : selectedTopicId)
      setThreads(fetched)
      setLoadingThreads(false)

      setIsThreadRefreshingState(false)
      setThreadPullY(0)
    } else {
      setThreadPullY(0)
    }
  }

  // Pull-to-refresh handlers for Messages list
  const handleMessageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    messageTouchStart.current = { x: touch.clientX, y: touch.clientY }
    messageScrollTop.current = e.currentTarget.scrollTop
    setIsDraggingMessage(true)
  }

  const handleMessageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (messageScrollTop.current > 0 || isMessageRefreshingState) return
    const touch = e.touches[0]
    const diffY = touch.clientY - messageTouchStart.current.y
    const diffX = touch.clientX - messageTouchStart.current.x

    if (diffY > 0 && Math.abs(diffY) > Math.abs(diffX)) {
      const pull = Math.min(80, Math.pow(diffY, 0.82))
      setMessagePullY(pull)
      if (pull > 0 && e.cancelable) {
        e.preventDefault()
      }
    }
  }

  const handleMessageTouchEnd = async () => {
    setIsDraggingMessage(false)
    if (isMessageRefreshingState) return
    if (messagePullY > 50) {
      setIsMessageRefreshingState(true)
      setMessagePullY(50)

      if (activeThread) {
        setLoadingMessages(true)
        try {
          const fetched = await fetchMessages(activeThread.id)
          setMessages(fetched)
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingMessages(false)
        }
      }

      setIsMessageRefreshingState(false)
      setMessagePullY(0)
    } else {
      setMessagePullY(0)
    }
  }

  const userId = localStorage.getItem('anticipate_uid')
  const userNickname = getUserNickname()

  // Track visual viewport changes (e.g. keyboard showing up on iOS)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      document.documentElement.style.setProperty('--vv-height', `${vv.height}px`)
      // Scroll messages container to bottom directly
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
      // Reset scroll position on viewport change to prevent iOS keyboard layout shifts
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
  }, [])

  // Prevent layout viewport scroll when modal/drawer is open
  useEffect(() => {
    if (!activeThread && !isCreating) return

    const vv = window.visualViewport
    const preventScroll = () => {
      if (vv) {
        document.documentElement.style.setProperty('--vv-height', `${vv.height}px`)
      }
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      document.body.scrollTop = 0
    }

    // Force scroll reset immediately when drawer opens
    window.scrollTo(0, 0)
    document.body.scrollTop = 0

    window.addEventListener('scroll', preventScroll)
    if (vv) {
      vv.addEventListener('scroll', preventScroll)
    }

    return () => {
      window.removeEventListener('scroll', preventScroll)
      if (vv) {
        vv.removeEventListener('scroll', preventScroll)
      }
    }
  }, [activeThread, isCreating])

  // Prevent background body scrolling when modal/drawer is open
  useEffect(() => {
    if (activeThread || isCreating) {
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
  }, [activeThread, isCreating])

  // Lock body touch scroll on iOS to prevent browser rubber-banding/layout shifting
  useEffect(() => {
    if (!activeThread && !isCreating) return

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const isScrollable = target.closest('.anp-scrollable-messages') || target.closest('.anp-modal-scrollable')
      
      if (!isScrollable) {
        if (e.cancelable) {
          e.preventDefault()
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [activeThread, isCreating])

  // Helper to force scroll to top when inputs are focused on iOS
  const handleInputFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, 0)
      document.body.scrollTop = 0
    }, 100)
  }

  // Load threads and subscribe to real-time additions
  useEffect(() => {
    let active = true
    async function loadThreads() {
      setLoadingThreads(true)
      try {
        // Quick check if the database tables exist in the schema cache
        const { error: dbCheckErr } = await supabase.from('forum_threads').select('id').limit(1)
        if (dbCheckErr && (dbCheckErr.code === 'PGRST205' || dbCheckErr.message.includes('not found') || dbCheckErr.message.includes('schema cache'))) {
          setIsDbConnected(false)
        } else {
          setIsDbConnected(true)
        }

        const fetched = await fetchThreads(selectedTopicId === 'all' ? undefined : selectedTopicId)
        if (!active) return
        setThreads(fetched)
        
        // Fetch reply counts in parallel
        const counts: Record<string, number> = {}
        await Promise.all(
          fetched.map(async (t) => {
            const count = await fetchReplyCount(t.id)
            counts[t.id] = count
          })
        )
        if (!active) return
        setReplyCounts(counts)
      } catch (err) {
        console.error('Failed to load threads:', err)
      } finally {
        if (active) setLoadingThreads(false)
      }
    }
    void loadThreads()

    // Subscribe to thread insertions on Supabase Realtime
    const channel = supabase
      .channel('forum_threads_global_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_threads'
        },
        async (payload) => {
          console.log('Realtime thread insert event:', payload)
          const newThread = payload.new as ForumThread
          if (!active) return
          if (selectedTopicId === 'all' || newThread.topic_id === selectedTopicId) {
            setThreads((prev) => {
              if (prev.some((t) => t.id === newThread.id)) return prev
              return [newThread, ...prev]
            })
            const count = await fetchReplyCount(newThread.id)
            setReplyCounts((prev) => ({ ...prev, [newThread.id]: count }))
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`Supabase Realtime thread subscription status: ${status}`, err || '')
      })

    // Global listener to update reply counts on the list in real-time when messages are posted
    const msgCountChannel = supabase
      .channel('forum_messages_count_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_messages'
        },
        (payload) => {
          console.log('Realtime message insert event (global count):', payload)
          const newMsg = payload.new as ForumMessage
          if (!active) return
          setReplyCounts((prev) => ({
            ...prev,
            [newMsg.thread_id]: (prev[newMsg.thread_id] || 0) + 1
          }))
        }
      )
      .subscribe((status, err) => {
        console.log(`Supabase Realtime msg count subscription status: ${status}`, err || '')
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
      void supabase.removeChannel(msgCountChannel)
    }
  }, [selectedTopicId])

  // Load active thread messages and subscribe to real-time message updates
  useEffect(() => {
    if (!activeThread) return
    let active = true
    
    async function loadMessages() {
      setLoadingMessages(true)
      try {
        const fetched = await fetchMessages(activeThread!.id)
        // Add a small delay to allow the slide-in animation to finish smoothly without GPU stutter
        await new Promise(resolve => setTimeout(resolve, 200))
        if (active) setMessages(fetched)
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        if (active) setLoadingMessages(false)
      }
    }
    void loadMessages()

    // Subscribe to message insertions on Supabase Realtime (with safe client-side filtering for reliability)
    const channel = supabase
      .channel(`forum_messages_thread_${activeThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_messages'
        },
        (payload) => {
          console.log('Realtime message insert event (thread):', payload)
          const newMsg = payload.new as ForumMessage
          if (!active) return
          if (newMsg.thread_id === activeThread.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`Supabase Realtime thread messages subscription status: ${status}`, err || '')
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [activeThread])

  // Scroll to bottom of messages when messages change or reply banner toggles
  useEffect(() => {
    if (activeThread) {
      const timer = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages, activeThread, replyToMessage])

  // Get topic object
  const getTopic = (id: string) => topics.find(t => t.id === id)

  // Format date helper
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Handle starting a thread
  const handleOpenCreate = () => {
    setIsCreating(true)
    setNewTopicId(selectedTopicId === 'all' ? topics[0]?.id || '' : selectedTopicId)
    setNewTitle('')
    setNewContent('')
    setValidationResult(null)
    setValidationError(null)
    setIsValidating(false)
  }

  const handleCloseCreate = () => {
    setIsClosingCreating(true)
    setTimeout(() => {
      setIsCreating(false)
      setIsClosingCreating(false)
      setValidationResult(null)
    }, 240)
  }

  const handleCloseThread = () => {
    setIsClosingThread(true)
    setTimeout(() => {
      setActiveThread(null)
      setIsClosingThread(false)
      setMessages([])
      setReplyWarning(null)
      setReplyToMessage(null)
    }, 300)
  }

  // Sage AI Post Validation
  const handleValidatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    setIsValidating(true)
    setValidationError(null)
    setValidationResult(null)

    try {
      // Check validation
      const result = await validatePostWithSage(newTopicId, `${newTitle}\n\n${newContent}`)
      
      // If approved, post immediately without prompting the user
      if (result.relevance === 'relevant' && !result.bestTopicId && !result.answeredInLesson) {
        await handlePublishPostDirect(newTopicId, newTitle.trim(), newContent.trim())
      } else {
        // If there's a reason to redirect or reject, present Sage feedback
        setValidationResult(result)
      }
    } catch (err) {
      console.error(err)
      setValidationError('Could not check post validation. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  // Direct publisher (bypass approval dashboard screen if perfect)
  const handlePublishPostDirect = async (targetTopicId: string, title: string, content: string) => {
    setLoadingThreads(true)
    try {
      const thread = await createThread(targetTopicId, title, content, userId)
      setIsCreating(false)
      setNewTitle('')
      setNewContent('')
      setValidationResult(null)
      
      // Auto open the new thread
      setActiveThread(thread)
      
      // Refresh thread list
      const fetched = await fetchThreads(selectedTopicId === 'all' ? undefined : selectedTopicId)
      setThreads(fetched)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create conversation.')
    } finally {
      setLoadingThreads(false)
    }
  }

  // Create thread submission after Sage approves (for redirect choices)
  const handlePublishPost = async (targetTopicId = newTopicId) => {
    if (!newTitle.trim() || !newContent.trim()) return
    await handlePublishPostDirect(targetTopicId, newTitle.trim(), newContent.trim())
  }

  // Post a reply (with Sage background relevance checks)
  const handleSendReply = async () => {
    const trimmed = replyInput.trim()
    if (!trimmed || !activeThread || postingReply) return

    setPostingReply(true)
    setReplyWarning(null)
    try {
      // BACKGROUND CHECK: Sage relevance check before reply gets posted
      const check = await validatePostWithSage(activeThread.topic_id, trimmed)
      if (check.relevance === 'off_topic') {
        // Present a light peach-toned warning directly inside the drawer (never cut off at the top)
        setReplyWarning(check.explanation)
        setPostingReply(false)
        return
      }

      // If relevant, save it
      const newMsg = await createMessage(
        activeThread.id, 
        trimmed, 
        userId, 
        false,
        replyToMessage?.id,
        replyToMessage?.content,
        replyToMessage?.author_nickname
      )
      setMessages(prev => [...prev, newMsg])
      setReplyInput('')
      setReplyToMessage(null) // Reset reply-to after sending
      
      // Increment count locally
      setReplyCounts(prev => ({
        ...prev,
        [activeThread.id]: (prev[activeThread.id] || 0) + 1
      }))

      // Handle Sage direct mentions
      if (trimmed.toLowerCase().includes('@sage') || trimmed.toLowerCase().includes('sage')) {
        setTimeout(async () => {
          try {
            const systemPrompt = `You are Sage, the sharp, friendly personal finance tutor.
You are replying directly inside a community forum thread titled "${activeThread.title}" on the topic "${getTopic(activeThread.topic_id)?.title}".
Keep it short (2-3 sentences max) and helpful.`
            
            const conversationHistory = [
              ...messages.map(m => ({
                role: (m.is_sage_reply ? 'assistant' : 'user') as 'user' | 'assistant',
                content: m.content
              })),
              { role: 'user' as const, content: trimmed }
            ]

            const replyText = await sendChatMessage(systemPrompt, conversationHistory)
            const sageReply = await createMessage(activeThread.id, replyText, null, true)
            setMessages(prev => [...prev, sageReply])
            setReplyCounts(prev => ({
              ...prev,
              [activeThread.id]: (prev[activeThread.id] || 0) + 1
            }))
          } catch (err) {
            console.error('Sage response in thread failed', err)
          }
        }, 1500)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to send reply.')
    } finally {
      setPostingReply(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendReply()
    }
  }

  return (
    <div className="anp-app" style={{ background: 'var(--p-bg)' }}>
      {/* Toast notifications positioned at the bottom center to avoid top notch cutoff */}
      <Toaster richColors position="bottom-center" />

      <div style={{ height: 'max(calc(16px * var(--d)), env(safe-area-inset-top))', flexShrink: 0 }} />

      {/* Top Header */}
      <div className="anp-top" style={{ paddingBottom: 8, gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="av-logo">anticipate.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -2 }}>
            <span style={{ fontSize: 11, color: 'var(--p-ink-3)' }}>Ask the Community</span>
            {isDbConnected ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--p-mint)', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--p-mint)' }} /> Live
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--p-gold)', fontWeight: 600 }} title="Database tables missing. Run 003_forum_schema.sql in Supabase SQL editor.">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--p-gold)', animation: 'pulse 1.5s infinite ease-in-out' }} /> Local Only
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            className="av-sage__cta" 
            style={{ margin: 0, padding: '6px 12px', fontSize: 13, borderRadius: 'var(--r-pill)', background: 'var(--p-coral)', color: '#ffffff', border: 'none' }}
            onClick={handleOpenCreate}
          >
            Make a Post
          </button>
        </div>
      </div>

      <div 
        className="anp-scroll" 
        onTouchStart={handleThreadTouchStart}
        onTouchMove={handleThreadTouchMove}
        onTouchEnd={handleThreadTouchEnd}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div style={{
          height: threadPullY,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isDraggingThread ? 'none' : 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          background: 'transparent',
          color: 'var(--p-coral)',
          fontSize: 12,
          fontWeight: 500,
          gap: 8,
          flexShrink: 0
        }}>
          <RotateCw 
            size={14} 
            className={isThreadRefreshingState || threadPullY > 50 ? 'spin-animation' : ''} 
            style={{ 
              transform: `rotate(${threadPullY * 4}deg)`, 
              transition: isThreadRefreshingState ? 'none' : 'transform 0.1s linear' 
            }} 
          />
          <span>{isThreadRefreshingState ? 'Refreshing...' : threadPullY > 50 ? 'Release to refresh' : 'Pull to refresh'}</span>
        </div>
        {/* Horizontal filter bar */}
        <div className="anp-community-filters" style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '8px 16px',
          scrollbarWidth: 'none',
          flexShrink: 0
        }}>
          <button
            onClick={() => setSelectedTopicId('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              border: '1.5px solid var(--p-line)',
              background: selectedTopicId === 'all' ? 'var(--p-ink)' : 'var(--p-card)',
              color: selectedTopicId === 'all' ? 'var(--p-bg)' : 'var(--p-ink-2)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            All Topics
          </button>
          {topics.map((t) => {
            const active = selectedTopicId === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-pill)',
                  border: '1.5px solid var(--p-line)',
                  background: active ? t.color : 'var(--p-card)',
                  color: active ? '#ffffff' : 'var(--p-ink-2)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <TopicIcon topicId={t.id} size={14} color={active ? '#ffffff' : t.color} />
                {t.title}
              </button>
            )
          })}
        </div>

        {/* User Identity Info */}
        <div style={{
          padding: '0 16px 10px',
          fontSize: 12,
          color: 'var(--p-ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <span>Everything you post is anonymous</span>
          <span style={{ fontWeight: 600, color: 'var(--p-coral)' }}>Persona: {userNickname}</span>
        </div>

        {/* Threads List */}
        <div style={{ flex: 1, padding: '0 16px 32px' }}>
          {loadingThreads ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '24px 0' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="anp-l-track" style={{ minHeight: 80, animation: 'pulse 1.5s infinite ease-in-out', opacity: 0.6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: 'var(--p-line)', width: '70%', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 10, background: 'var(--p-line)', width: '40%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 24px',
              textAlign: 'center',
              background: 'var(--p-card)',
              borderRadius: 'var(--r-xl)',
              border: '1.5px solid var(--p-line)'
            }}>
              <MessageSquare size={32} style={{ color: 'var(--p-ink-4)', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--p-ink)' }}>No conversations yet</div>
              <div style={{ fontSize: 13, color: 'var(--p-ink-3)', marginTop: 4, maxWidth: 220 }}>
                Be the first to ask a question anonymously or start a discussion!
              </div>
              <button 
                onClick={handleOpenCreate}
                className="av-sage__cta" 
                style={{ marginTop: 16 }}
              >
                Ask the community
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {threads.map((t) => {
                const topic = getTopic(t.topic_id)
                const replies = replyCounts[t.id] ?? 0
                return (
                  <div
                    key={t.id}
                    className="anp-l-track"
                    style={{ 
                      flexDirection: 'column', 
                      alignItems: 'stretch', 
                      gap: 8, 
                      padding: 16,
                      background: 'var(--p-card)',
                      borderColor: 'var(--p-line)'
                    }}
                    onClick={() => setActiveThread(t)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ 
                        fontFamily: 'var(--font-display)', 
                        fontSize: 15, 
                        fontWeight: 600, 
                        color: 'var(--p-ink)', 
                        lineHeight: 1.35
                      }}>
                        {t.title}
                      </div>
                      {topic && (
                        <div style={{ 
                          padding: 4, 
                          borderRadius: 8, 
                          background: `${topic.color}15`, 
                          color: topic.color, 
                          display: 'flex', 
                          alignItems: 'center',
                          flexShrink: 0
                        }}>
                          <TopicIcon topicId={t.topic_id} size={15} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p-ink-3)' }}>
                        <span style={{ fontWeight: 500, color: 'var(--p-ink-2)' }}>
                          {t.user_id === userId ? 'You' : t.author_nickname}
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(t.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--p-coral)' }}>
                        <MessageSquare size={12} />
                        <span>{replies} {replies === 1 ? 'reply' : 'replies'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE THREAD MODAL / DRAWER */}
      {(isCreating || isClosingCreating) && (
        <div 
          className={`anp-modal-backdrop ${isClosingCreating ? 'anp-modal-backdrop--closing' : ''}`}
          style={{ 
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <div 
            className={`anp-modal-drawer ${isClosingCreating ? 'anp-modal-drawer--closing' : ''}`}
            style={{
              maxHeight: 'calc(var(--vv-height, 100%) * 0.9)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1.5px solid var(--p-line)',
              background: 'var(--p-bg)'
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Make a Post Anonymously</span>
              <button 
                onClick={handleCloseCreate} 
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: 'var(--p-ink-2)'
                }}
              >
                ✕
              </button>
            </div>

            <div className="anp-modal-scrollable" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {!validationResult && !isValidating && (
                <form onSubmit={handleValidatePost} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--p-ink-2)', marginBottom: 4 }}>Select Topic</label>
                    <select
                      value={newTopicId}
                      onChange={(e) => setNewTopicId(e.target.value)}
                      onFocus={handleInputFocus}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        border: '1.5px solid var(--p-line)',
                        background: '#ffffff',
                        fontSize: 16,
                        color: 'var(--p-ink)'
                      }}
                    >
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--p-ink-2)', marginBottom: 4 }}>Title / Question</label>
                    <input
                      type="text"
                      placeholder="e.g. How do I dispute a tenancy deposit charge?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onFocus={handleInputFocus}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        border: '1.5px solid var(--p-line)',
                        background: '#ffffff',
                        fontSize: 16,
                        color: 'var(--p-ink)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--p-ink-2)', marginBottom: 4 }}>Details / Context</label>
                    <textarea
                      placeholder="Type details or content here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      onFocus={handleInputFocus}
                      required
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        border: '1.5px solid var(--p-line)',
                        background: '#ffffff',
                        fontSize: 16,
                        color: 'var(--p-ink)',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {validationError && (
                    <div style={{ color: 'var(--p-coral)', background: 'var(--p-coral-tint)', padding: '10px 12px', borderRadius: 'var(--r-md)', fontSize: 13, border: '1.5px solid #f2ab8d', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <AlertCircle size={14} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="av-sage__cta"
                    style={{ margin: '10px 0 0', width: '100%', justifyContent: 'center', background: 'var(--p-coral)', color: '#ffffff', border: 'none' }}
                  >
                    Post Anonymously
                  </button>
                </form>
              )}

              {isValidating && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 0',
                  gap: 16
                }}>
                  <div style={{ position: 'relative' }}>
                    <SageAvatar size={60} />
                    <div style={{
                      position: 'absolute',
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      border: '2px solid var(--p-coral)',
                      borderRadius: '50%',
                      animation: 'lcb-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-ink-2)' }}>Sage is reviewing your question...</div>
                  <div style={{ fontSize: 12, color: 'var(--p-ink-3)', textAlign: 'center', maxWidth: 200 }}>
                    Checking for relevance and looking for duplicate lessons to assist you.
                  </div>
                </div>
              )}

              {validationResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Sage Response bubble */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <SageAvatar size={34} />
                    <div style={{
                      background: 'var(--p-card)',
                      padding: 14,
                      borderRadius: '4px 16px 16px 16px',
                      fontSize: 14,
                      color: 'var(--p-ink)',
                      lineHeight: 1.45,
                      boxShadow: 'var(--shadow-card)',
                      border: '1px solid var(--p-line)'
                    }}>
                      {validationResult.explanation}
                    </div>
                  </div>

                  {/* PREMIUM LIGHT PEACH TONE CARDS (NO AGGRESSIVE REDS) */}
                  {validationResult.relevance === 'off_topic' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: 'var(--p-gold-tint)',
                      padding: 14,
                      borderRadius: 'var(--r-lg)',
                      border: '1.5px solid var(--p-line)'
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--p-gold)', fontSize: 13, fontWeight: 600 }}>
                        <AlertCircle size={16} style={{ color: 'var(--p-gold)' }} />
                        <span style={{ color: 'var(--p-ink)' }}>Not Quite Relevant</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--p-ink-2)', lineHeight: 1.4 }}>
                        Sage believes this topic isn't relevant to adulting or personal finance. Please rewrite your post to fit community guidelines.
                      </p>
                      <button
                        onClick={() => setValidationResult(null)}
                        style={{
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1px solid var(--p-line)',
                          borderRadius: 'var(--r-md)',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--p-ink-2)',
                          cursor: 'pointer'
                        }}
                      >
                        Edit Post
                      </button>
                    </div>
                  )}

                  {validationResult.relevance === 'relevant' && validationResult.bestTopicId && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: 'var(--p-gold-tint)',
                      padding: 14,
                      borderRadius: 'var(--r-lg)',
                      border: '1.5px solid var(--p-line)'
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--p-gold)', fontSize: 13, fontWeight: 600 }}>
                        <HelpCircle size={16} />
                        <span>Wrong Forum Topic</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--p-ink-2)', lineHeight: 1.4 }}>
                        This seems to belong in the <b>{getTopic(validationResult.bestTopicId)?.title}</b> forum. Sage recommends redirecting to post it there.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handlePublishPost(validationResult.bestTopicId!)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: getTopic(validationResult.bestTopicId)?.color || 'var(--p-coral)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: 'var(--r-md)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Redirect & Post
                        </button>
                        <button
                          onClick={() => setValidationResult(null)}
                          style={{
                            padding: '8px 12px',
                            background: '#ffffff',
                            border: '1px solid var(--p-line)',
                            borderRadius: 'var(--r-md)',
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--p-ink-2)',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {validationResult.relevance === 'relevant' && validationResult.answeredInLesson && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: 'var(--p-mint-tint)',
                      padding: 14,
                      borderRadius: 'var(--r-lg)',
                      border: '1.5px solid var(--p-mint)'
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--p-mint)', fontSize: 13, fontWeight: 600 }}>
                        <CheckCircle size={16} />
                        <span>Answered in Lessons</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--p-ink-2)', lineHeight: 1.4 }}>
                        Sage has a detailed lesson for this: <b>{validationResult.answeredInLesson.lessonTitle}</b>. Check it out directly!
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            setIsCreating(false)
                            navigate(`/topic/${validationResult.answeredInLesson!.topicId}/subtopic/${validationResult.answeredInLesson!.subTopicId}`)
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'var(--p-mint)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: 'var(--r-md)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Go to Lesson
                        </button>
                        <button
                          onClick={() => handlePublishPost()}
                          style={{
                            padding: '8px 12px',
                            background: '#ffffff',
                            border: '1px solid var(--p-line)',
                            borderRadius: 'var(--r-md)',
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--p-ink-2)',
                            cursor: 'pointer'
                          }}
                        >
                          Post Anyway
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* THREAD DETAILS VIEW / CHAT DIALOG */}
      {(activeThread || isClosingThread) && (
        <div 
          className={`anp-thread-drawer-overlay ${isClosingThread ? 'anp-thread-drawer-overlay--closing' : ''}`}
          style={{
            zIndex: 110,
            overflow: 'hidden'
          }}
        >
          {/* Inner container resized dynamically to fit the visual viewport (above soft keyboard) */}
          <div 
            className={`anp-thread-drawer ${isClosingThread ? 'anp-thread-drawer--closing' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              paddingTop: 'max(14px, env(safe-area-inset-top))',
              background: 'var(--p-bg)',
              borderBottom: '1.5px solid var(--p-line)',
              flexShrink: 0
            }}>
              <button
                onClick={handleCloseThread}
                style={{
                  border: 'none',
                  background: '#ffffff',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                  flexShrink: 0
                }}
                aria-label="Back to forum"
              >
                <ArrowLeft size={16} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--p-ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {activeThread?.title}
                </div>
                {activeThread && (
                  <div style={{ fontSize: 11, color: 'var(--p-ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>{getTopic(activeThread.topic_id)?.title}</span>
                    <span>·</span>
                    <span>{activeThread.user_id === userId ? 'You' : activeThread.author_nickname}</span>
                    {isDbConnected ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--p-mint)', fontWeight: 600 }}>
                        · <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--p-mint)' }} /> Live
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--p-gold)', fontWeight: 600 }}>
                        · <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--p-gold)', animation: 'pulse 1.5s infinite ease-in-out' }} /> Local Only
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages list */}
            <div 
              ref={messagesContainerRef}
              className="anp-scrollable-messages"
              onTouchStart={handleMessageTouchStart}
              onTouchMove={handleMessageTouchMove}
              onTouchEnd={handleMessageTouchEnd}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                scrollbarWidth: 'none'
              }}
            >
              {/* Pull-to-refresh indicator */}
              <div style={{
                height: messagePullY,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: isDraggingMessage ? 'none' : 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                background: 'transparent',
                color: 'var(--p-coral)',
                fontSize: 12,
                fontWeight: 500,
                gap: 8,
                flexShrink: 0
              }}>
                <RotateCw 
                  size={14} 
                  className={isMessageRefreshingState || messagePullY > 50 ? 'spin-animation' : ''} 
                  style={{ 
                    transform: `rotate(${messagePullY * 4}deg)`, 
                    transition: isMessageRefreshingState ? 'none' : 'transform 0.1s linear' 
                  }} 
                />
                <span>{isMessageRefreshingState ? 'Refreshing...' : messagePullY > 50 ? 'Release to refresh' : 'Pull to refresh'}</span>
              </div>
              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '24px 0' }}>
                  <div style={{ width: '60%', height: 40, background: 'var(--p-line)', borderRadius: 12 }} />
                  <div style={{ width: '40%', height: 32, background: 'var(--p-line)', borderRadius: 12, alignSelf: 'flex-end' }} />
                  <div style={{ width: '70%', height: 48, background: 'var(--p-line)', borderRadius: 12 }} />
                </div>
              ) : (
                <>
                  {messages.map((m) => {
                    const isCurrentUser = m.user_id === userId && m.author_nickname === userNickname
                    const isSwipingThis = swipeMsgId === m.id
                    const currentTranslateX = isSwipingThis ? swipeX : 0
                    const isTriggered = isSwipingThis && swipeX < -45

                    return (
                      <div
                        key={m.id}
                        onTouchStart={(e) => handleMsgTouchStart(e, m.id)}
                        onTouchMove={handleMsgTouchMove}
                        onTouchEnd={() => handleMsgTouchEnd(m)}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                          gap: 4,
                          maxWidth: '100%',
                          width: '100%',
                          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                          overflow: 'visible'
                        }}
                      >
                        {/* Hidden Reply Icon behind card on the right (revealed on swipe left) */}
                        <div style={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isTriggered ? 'var(--p-coral)' : 'var(--p-line)',
                          color: isTriggered ? '#ffffff' : 'var(--p-ink-2)',
                          opacity: isSwipingThis ? Math.min(1, Math.abs(swipeX) / 50) : 0,
                          scale: isSwipingThis ? Math.min(1.1, Math.abs(swipeX) / 40) : 0.8,
                          transition: 'background-color 0.1s ease, color 0.1s ease, scale 0.1s ease',
                          zIndex: 1
                        }}>
                          <CornerUpLeft size={15} />
                        </div>

                         {/* Name header */}
                         <span style={{ 
                           fontSize: 10, 
                           color: 'var(--p-ink-3)', 
                           marginLeft: isCurrentUser ? 0 : (m.is_sage_reply ? 42 : 8),
                           marginRight: isCurrentUser ? 8 : 0,
                           alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
                         }}>
                           {isCurrentUser ? 'You' : m.author_nickname}
                         </span>
                         
                         {/* Swipable inner container */}
                         <div 
                           style={{ 
                             display: 'flex', 
                             gap: 8, 
                             alignItems: 'center',
                             flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                             transform: `translate3d(${currentTranslateX}px, 0, 0)`,
                             transition: isSwipingThis ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                             width: '100%',
                             justifyContent: isCurrentUser ? 'flex-start' : 'flex-start',
                             paddingLeft: isCurrentUser ? 0 : (m.is_sage_reply ? 0 : 8),
                             paddingRight: isCurrentUser ? 8 : 0,
                             boxSizing: 'border-box',
                             zIndex: 2
                           }}
                         >
                           {m.is_sage_reply && (
                             <span style={{ marginBottom: 2, display: 'inline-flex', flexShrink: 0 }}>
                               <SageAvatar size={28} />
                             </span>
                           )}
                           <div
                             style={{
                               background: isCurrentUser 
                                 ? 'var(--p-coral)' /* Orange/coral background for sent messages */
                                 : m.is_sage_reply 
                                   ? 'var(--p-coral-tint)' 
                                   : '#ffffff',
                               color: isCurrentUser 
                                 ? '#ffffff' 
                                 : 'var(--p-ink)',
                               padding: '10px 14px',
                               borderRadius: isCurrentUser 
                                 ? '16px 16px 4px 16px' 
                                 : '16px 16px 16px 4px',
                               boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                               fontSize: 15, /* Slightly bigger font size */
                               lineHeight: 1.45,
                               wordBreak: 'break-word',
                               border: m.is_sage_reply ? '1px solid var(--p-coral)' : 'none',
                               maxWidth: '75%'
                             }}
                           >
                             {m.parent_content && (
                               <div style={{
                                 background: isCurrentUser ? 'rgba(255, 255, 255, 0.15)' : 'var(--p-bg-2)',
                                 borderLeft: `3px solid ${isCurrentUser ? '#ffffff' : 'var(--p-coral)'}`,
                                 padding: '6px 10px',
                                 borderRadius: 'var(--r-sm)',
                                 marginBottom: 8,
                                 fontSize: 12,
                                 opacity: 0.9,
                                 textAlign: 'left',
                                 display: 'flex',
                                 flexDirection: 'column',
                                 gap: 2
                               }}>
                                 <div style={{ 
                                   fontWeight: 700, 
                                   fontSize: 11,
                                   color: isCurrentUser ? '#ffffff' : 'var(--p-ink)' 
                                 }}>
                                   {m.parent_nickname === userNickname ? 'You' : m.parent_nickname}
                                 </div>
                                 <div style={{
                                   fontSize: 11,
                                   color: isCurrentUser ? 'rgba(255, 255, 255, 0.85)' : 'var(--p-ink-2)',
                                   display: '-webkit-box',
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: 'vertical',
                                   overflow: 'hidden',
                                   textOverflow: 'ellipsis',
                                   lineHeight: 1.3
                                 }}>
                                   {m.parent_content}
                                 </div>
                               </div>
                             )}
                            <div>{m.content}</div>
                            <div style={{
                              fontSize: 9,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              marginTop: 4,
                              opacity: 0.7,
                              color: isCurrentUser ? 'rgba(255,255,255,0.8)' : 'var(--p-ink-3)'
                            }}>
                              <span>{formatRelativeTime(m.created_at)}</span>
                            </div>
                          </div>

                          {/* Reply symbol button next to the bubble */}
                          <button
                            onClick={() => {
                              setReplyToMessage(m)
                              setReplyWarning(null)
                              setTimeout(() => {
                                replyInputRef.current?.focus()
                              }, 50)
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--p-ink-3)',
                              opacity: 0.6,
                              cursor: 'pointer',
                              padding: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              transition: 'all 0.15s ease',
                              outline: 'none',
                              flexShrink: 0
                            }}
                            className="anp-reply-icon-btn"
                            title="Reply"
                          >
                            <CornerUpLeft size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* LIGHT PEACH-TONED INLINE SAGE BANNER ABOVE INPUT ROW (NEVER CUT OFF AT TOP) */}
            {replyWarning && (
              <div style={{
                padding: '10px 16px',
                background: 'var(--p-gold-tint)',
                borderTop: '1.5px solid var(--p-line)',
                borderBottom: '1.5px solid var(--p-line)',
                fontSize: 13,
                color: 'var(--p-ink-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <SageAvatar size={24} />
                  <span style={{ lineHeight: 1.4 }}>{replyWarning}</span>
                </div>
                <button 
                  onClick={() => setReplyWarning(null)}
                  style={{
                    border: 'none',
                    background: '#ffffff',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--p-ink-2)',
                    fontSize: 12,
                    fontWeight: 'bold',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Replying to message preview */}
            {replyToMessage && (
              <div style={{
                padding: '8px 16px',
                background: 'var(--p-card-2)',
                borderTop: '1.5px solid var(--p-line)',
                fontSize: 12,
                color: 'var(--p-ink-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--p-ink)' }}>Replying to {replyToMessage.author_nickname === userNickname ? 'You' : replyToMessage.author_nickname}</span>
                  <p style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    opacity: 0.8,
                    marginTop: 2
                  }}>
                    {replyToMessage.content}
                  </p>
                </div>
                <button 
                  onClick={() => setReplyToMessage(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: 16,
                    cursor: 'pointer',
                    color: 'var(--p-ink-3)',
                    padding: '2px 6px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Sending indicator */}
            {postingReply && (
              <div style={{
                padding: '8px 16px',
                background: 'var(--p-card-2)',
                borderTop: '1.5px solid var(--p-line)',
                fontSize: 12,
                color: 'var(--p-ink-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0
              }}>
                <div className="spin-animation" style={{
                  width: 12,
                  height: 12,
                  border: '2px solid var(--p-coral)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%'
                }} />
                <span>Sage is analyzing your reply...</span>
              </div>
            )}

            {/* Reply input */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              background: 'var(--p-bg)',
              borderTop: '1.5px solid var(--p-line)',
              flexShrink: 0
            }}>
              <textarea
                ref={replyInputRef}
                className="lcb-textarea"
                placeholder="Reply anonymously"
                rows={1}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                disabled={postingReply}
                style={{
                  maxHeight: 80,
                  fontSize: 16,
                  borderRadius: 18,
                  padding: '8px 14px',
                  background: '#ffffff',
                  border: 'none',
                  resize: 'none',
                  outline: 'none',
                  flex: 1
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyInput.trim() || postingReply}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--p-coral)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease, transform 0.1s ease',
                  opacity: replyInput.trim() && !postingReply ? 1 : 0.4
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS STYLING FOR PREMIUM ENTRY/EXIT ANIMATIONS */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translate3d(0, 100%, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        @keyframes slide-down {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, 100%, 0); }
        }
        @keyframes slide-in-right {
          from { transform: translate3d(100%, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        @keyframes slide-out-right {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(100%, 0, 0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .anp-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: var(--vv-height, 100%);
          background: rgba(28, 26, 36, 0.4);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fade-in 0.24s ease-out both;
        }
        .anp-modal-backdrop--closing {
          animation: fade-out 0.22s ease-out both;
        }

        .anp-modal-drawer {
          width: 100%;
          max-width: 360px;
          background: var(--p-bg-2);
          border-radius: 24px 24px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
          transform: translate3d(0, 100%, 0);
          animation: slide-up 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform;
        }
        .anp-modal-drawer--closing {
          transform: translate3d(0, 0, 0);
          animation: slide-down 0.22s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform;
        }

        .anp-thread-drawer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: var(--vv-height, 100%);
          z-index: 110;
          background: var(--p-bg-2);
          overflow: hidden;
          transform: translate3d(100%, 0, 0);
          animation: slide-in-right 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform;
        }
        .anp-thread-drawer-overlay--closing {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: var(--vv-height, 100%);
          z-index: 110;
          background: var(--p-bg-2);
          overflow: hidden;
          transform: translate3d(0, 0, 0);
          animation: slide-out-right 0.22s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform;
        }

        .anp-thread-drawer {
          /* static container, slides with parent */
        }
        .anp-thread-drawer--closing {
          /* static container */
        }
        
        .lcb-textarea {
          font-family: inherit;
          font-size: 16px;
          color: var(--p-ink);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

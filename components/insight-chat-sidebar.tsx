"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabaseClient'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { X, Paperclip, Send, Chrome, Github, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { LimitReachedBanner } from './limit-reached-banner'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface InsightChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  problemId: string
  problemStatement: string
  persona?: string
  onFreePlanMessage?: () => void
  onMobileUpgradePrompt?: () => void
}

interface SuggestedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1 mb-1">
        Sugestii de întrebări
      </p>
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="text-left text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/90 p-3 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ node, ...props }: any) => <span {...props} />,
              code: ({ node, inline, className, children, ...props }: any) => (
                <code className={`bg-white/10 rounded px-1 ${className || ''}`} {...props}>{children}</code>
              )
            }}
          >
            {q}
          </ReactMarkdown>
        </button>
      ))}
    </div>
  )
}

// Loading messages shown while AI is thinking
const loadingMessages = [
  'Mă gândesc la soluție…',
  'Analizez problema…',
  'Calculez răspunsul…',
  'Un moment, conectez toate ideile…',
  'Procesez informațiile… logic, desigur.',
  'Să vedem ce spune fizica despre asta…',
  'Conectez teoria cu practica…',
  'Să vedem dacă pot face fizica să sune simplu.',
]

const getRandomLoadingMessage = () => {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
}

export default function InsightChatSidebar({
  isOpen,
  onClose,
  problemId,
  problemStatement,
  persona = 'problem_tutor',
  onFreePlanMessage,
  onMobileUpgradePrompt
}: InsightChatSidebarProps) {
  const { user, profile, loginWithGoogle, loginWithGitHub } = useAuth()
  const { toast } = useToast()
  const [loginLoading, setLoginLoading] = useState<'google' | 'github' | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: persona === 'problem_tutor'
        ? 'Ești Insight, un profesor de fizică răbdător.'
        : 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [textareaHeight, setTextareaHeight] = useState(40)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [problemContext, setProblemContext] = useState<string | null>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [limitResetTime, setLimitResetTime] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle mobile keyboard resizing and prevent body scroll
  const [viewportHeight, setViewportHeight] = useState<string | undefined>(undefined)
  const [viewportOffset, setViewportOffset] = useState<number>(0)

  // Block body scroll when chat is open on mobile
  useEffect(() => {
    if (!isOpen) return

    if (isMobile) {
      // Save current scroll position and lock body scroll
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'

      return () => {
        // Restore scroll position when chat closes
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen, isMobile])

  useEffect(() => {
    if (!isMobile || !isOpen) {
      setViewportHeight(undefined)
      setViewportOffset(0)
      return
    }

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        // Set height to visual viewport height 
        const height = window.visualViewport.height
        setViewportHeight(`${height}px`)

        // Calculate offset from top (when keyboard pushes content up)
        const offset = window.visualViewport.offsetTop
        setViewportOffset(offset)
      }
    }

    // Initial check
    if (window.visualViewport) {
      handleVisualViewportResize()
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize)
      }
    }
  }, [isMobile, isOpen])


  const markdownComponents = useMemo(
    () => ({
      p: ({ node, ...props }: any) => (
        <p className="whitespace-pre-wrap break-words text-gray-200 leading-relaxed" {...props} />
      ),
      strong: ({ node, ...props }: any) => (
        <strong className="text-white" {...props} />
      ),
      em: ({ node, ...props }: any) => (
        <em className="text-gray-300" {...props} />
      ),
      h1: ({ node, ...props }: any) => (
        <h1 className="text-xl font-semibold text-white" {...props} />
      ),
      h2: ({ node, ...props }: any) => (
        <h2 className="text-lg font-semibold text-white" {...props} />
      ),
      h3: ({ node, ...props }: any) => (
        <h3 className="text-base font-semibold text-white" {...props} />
      ),
      ul: ({ node, ordered, ...props }: any) => (
        <ul className="list-disc pl-5 space-y-1 text-gray-200" {...props} />
      ),
      ol: ({ node, ordered, ...props }: any) => (
        <ol className="list-decimal pl-5 space-y-1 text-gray-200" {...props} />
      ),
      li: ({ node, ...props }: any) => (
        <li className="leading-relaxed" {...props} />
      ),
      code: ({
        node,
        inline,
        className,
        children,
        ...props
      }: any) => (
        <code
          className={`rounded bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-gray-100 ${className ?? ''}`}
          {...props}
        >
          {children}
        </code>
      ),
    }),
    [],
  )

  // Load session for this problem
  // NOTE: For problem pages, we don't load existing sessions - each visit starts fresh
  // Sessions are still saved for history on the dedicated chat page (/insight/chat)
  const loadProblemSession = async (accessToken: string) => {
    try {
      // Don't load existing session for problem pages
      // Always start with a fresh chat on the problem page
      // Sessions remain saved in database for history on /insight/chat page
      setSessionId(null)
      setMessages([
        {
          role: 'system',
          content: persona === 'problem_tutor'
            ? 'Ești Insight, un profesor de fizică răbdător.'
            : 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.',
        },
      ])
      // Also clear suggestions on session reset if any
      setSuggestedQuestions([])
      return null
    } catch (e: any) {
      console.error('Failed to load problem session:', e)
      return null
    }
  }

  // Load session messages
  const loadSessionMessages = async (sessionIdToLoad: string, accessToken: string) => {
    try {
      const res = await fetch(`/api/insight/messages?sessionId=${sessionIdToLoad}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error('Nu am putut încărca mesajele.')
      }

      const data = await res.json()
      const loadedMessages = (data.messages || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }))

      setMessages([
        {
          role: 'system',
          content: persona === 'problem_tutor'
            ? 'Ești Insight, un profesor de fizică răbdător.'
            : 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.',
        },
        ...loadedMessages,
      ])

      // If the last message is from assistant, we might want to check for suggestions
      // But usually history doesn't persist the raw suggestions format if we strip it?
      // For now we assume history is just content.
      setSuggestedQuestions([])
    } catch (e: any) {
      console.error('Failed to load session messages:', e)
    }
  }

  // Check if chat has messages (excluding system message)
  const hasMessages = messages.filter((m) => m.role !== 'system').length > 0

  // Initialize session when sidebar opens
  useEffect(() => {
    if (!isOpen || !user) return

    // If we already have messages or a session active, don't re-initialize
    if (hasMessages || sessionId) {
      // Just focus if needed
      setTimeout(() => {
        if (window.innerWidth >= 1024) {
          textareaRef.current?.focus()
        }
      }, 100)
      return
    }

    const initializeSession = async () => {
      try {
        setLoadingSession(true)
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          toast({
            title: 'Eroare',
            description: 'Necesită autentificare.',
            variant: 'destructive',
          })
          return
        }

        // Always start with a fresh session for problem pages
        // Don't load existing sessions - they remain in history but not shown here
        await loadProblemSession(accessToken)

        // Auto-fill problem statement for fresh chat as context
        if (problemStatement) {
          setProblemContext(`Rezolva problema asta:\n\n${problemStatement}`)
        }

        // Focus textarea after a short delay only on desktop
        setTimeout(() => {
          if (window.innerWidth >= 1024) {
            textareaRef.current?.focus()
          }
        }, 100)
      } catch (e: any) {
        console.error('Failed to initialize session:', e)
      } finally {
        setLoadingSession(false)
      }
    }

    initializeSession()
  }, [isOpen, user, problemId]) // Dependencies kept, but logic guards against re-run

  // Reset state when problem changes
  useEffect(() => {
    setSessionId(null)
    setMessages([
      {
        role: 'system',
        content: persona === 'problem_tutor'
          ? 'Ești Insight, un profesor de fizică răbdător.'
          : 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.',
      },
    ])
    setInput('')
    setError(null)
    // We don't necessarily set context here because the main effect will do it if isOpen is true
    // or we can set it here if we want it ready before opening.
    // But typically isOpen drives the flow.
    if (problemStatement) {
      // If the sidebar is open, this might conflict with the other effect, 
      // but since we reset messages above, `hasMessages` becomes false, so the other effect will run and setup everything.
      // So this reset is sufficient to trigger re-initialization in the main effect.
      setProblemContext(null)
    }
  }, [problemId])


  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setSessionId(null)
      setMessages([
        {
          role: 'system',
          content: persona === 'problem_tutor'
            ? 'Ești Insight, un profesor de fizică răbdător.'
            : 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.',
        },
      ])
      setInput('')
      setError(null)
      setProblemContext(null)
    }
  }, [])


  // Check if user is at bottom of messages container
  const checkIfAtBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true

    const container = messagesContainerRef.current
    const threshold = 100 // pixels from bottom to consider "at bottom"
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold

    return isAtBottom
  }, [])

  // Handle scroll events to track if user is at bottom
  const handleScroll = useCallback(() => {
    const isAtBottom = checkIfAtBottom()
    setShouldAutoScroll(isAtBottom)
  }, [checkIfAtBottom])

  // Auto-scroll to bottom only when user is already at bottom
  useEffect(() => {
    if (isOpen && shouldAutoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, busy, isOpen, shouldAutoScroll])

  // Function to adjust textarea height
  const adjustTextareaHeight = useCallback(() => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const originalMinHeight = textarea.style.minHeight
    textarea.style.minHeight = '0'
    textarea.style.height = 'auto'

    const lineHeight = 24
    const maxHeight = lineHeight * 5 // Maximum 5 rows
    const scrollHeight = textarea.scrollHeight

    textarea.style.minHeight = originalMinHeight

    if (scrollHeight <= maxHeight) {
      const newHeight = Math.max(40, scrollHeight)
      setTextareaHeight(newHeight)
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = 'hidden'
    } else {
      setTextareaHeight(maxHeight)
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  // Handle suggested question selection
  const handleSuggestionSelect = (question: string) => {
    submitMessage(question)
  }

  const submitMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!user || (!textToSend.trim() && !problemContext) || busy) return

    setBusy(true)
    setError(null)
    setLimitResetTime(null) // Reset limit banner on new attempt
    setIsStreaming(true)
    setSuggestedQuestions([]) // Clear suggestions when new message starts

    // Show upgrade banner logic
    const isFreePlan = !profile?.plan || profile.plan === 'free'
    const userMessageCount = messages.filter(m => m.role === 'user').length

    if (isFreePlan) {
      const isMobile = window.innerWidth < 1024

      if (isMobile) {
        // On mobile: show large card after 2 messages (so when sending the 2nd message, count is 1)
        if (userMessageCount === 1 && onMobileUpgradePrompt) {
          onMobileUpgradePrompt()
        }
      } else {
        // On desktop: show banner on first message
        if (userMessageCount === 0 && onFreePlanMessage) {
          onFreePlanMessage()
        }
      }
    }

    try {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        toast({
          title: 'Eroare',
          description: 'Necesită autentificare.',
          variant: 'destructive',
        })
        setBusy(false)
        setIsStreaming(false)
        return
      }

      // Combine context and input if context exists
      let finalContent = textToSend.trim()
      if (problemContext) {
        finalContent = finalContent ? `${problemContext}\n\n${finalContent}` : problemContext
      }

      const newUserMsg: ChatMessage = {
        role: 'user',
        content: finalContent,
      }

      setMessages((prev) => [...prev, newUserMsg])
      if (!textOverride) setInput('')
      setProblemContext(null) // Clear context after it's sent
      setShouldAutoScroll(true) // Ensure we auto-scroll for the new response

      // If no session, create one with problem title
      let currentSessionId = sessionId
      if (!currentSessionId) {
        const problemSessionTitle = `Problem: ${problemId}`
        const res = await fetch('/api/insight/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title: problemSessionTitle,
          }),
        })

        if (!res.ok) {
          throw new Error('Nu am putut crea sesiunea.')
        }

        const data = await res.json()
        currentSessionId = data.sessionId
        setSessionId(currentSessionId)
      }

      // Add empty assistant message that will be updated incrementally
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      // Set random loading message
      setLoadingMessage(getRandomLoadingMessage())

      const res = await fetch('/api/insight/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          input: newUserMsg.content,
          persona // Pass the persona
        }),
        signal: controller.signal,
      })

      // Check for non-streaming errors (429, etc.)
      if (res.status === 429) {
        const data = await res.json()
        if (data.resetTime) {
          setLimitResetTime(data.resetTime)
        } else {
          setError(data.error || 'Limită zilnică atinsă.')
        }

        // Remove the empty assistant message we added tentatively
        setMessages((prev) => prev.slice(0, -1))

        setBusy(false)
        setIsStreaming(false)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la Insight.')
      }

      // Check if response is streaming (text/event-stream)
      const contentType = res.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // Process streaming response
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullAssistantContent = ''

        if (!reader) {
          throw new Error('Nu s-a putut citi răspunsul.')
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'session' && data.sessionId) {
                  setSessionId(data.sessionId)
                } else if (data.type === 'text' && data.content) {
                  // Clear loading message when first content arrives
                  setLoadingMessage(null)
                  fullAssistantContent += data.content

                  // Parsing for suggestions
                  let displayContent = fullAssistantContent
                  const suggestionsMarker = '---SUGGESTIONS---'

                  if (fullAssistantContent.includes(suggestionsMarker)) {
                    const parts = fullAssistantContent.split(suggestionsMarker)
                    displayContent = parts[0].trim()

                    // Robust JSON extraction
                    const rawSuggestions = parts[1].trim()
                    const jsonStartIndex = rawSuggestions.indexOf('[')
                    const jsonEndIndex = rawSuggestions.lastIndexOf(']')

                    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                      const potentialJson = rawSuggestions.substring(jsonStartIndex, jsonEndIndex + 1)
                      try {
                        const parsedSuggestions = JSON.parse(potentialJson)
                        if (Array.isArray(parsedSuggestions)) {
                          setSuggestedQuestions(parsedSuggestions)
                        }
                      } catch (e) {
                        // Incomplete JSON, ignore for now
                      }
                    }
                  }

                  // Update assistant message incrementally
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    // Find the last assistant message
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i]?.role === 'assistant') {
                        newMessages[i] = {
                          role: 'assistant',
                          content: displayContent,
                        }
                        break
                      }
                    }
                    return newMessages
                  })
                } else if (data.type === 'done') {
                  // Handle final metadata if needed
                  if (!currentSessionId && data.sessionId) {
                    setSessionId(data.sessionId)
                  }
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Eroare la procesarea răspunsului.')
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError)
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming responses (shouldn't happen, but handle gracefully)
        const data = await res.json()
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastIndex = newMessages.length - 1
          if (lastIndex >= 0 && newMessages[lastIndex]?.role === 'assistant') {
            newMessages[lastIndex] = {
              role: 'assistant',
              content: data.output || 'Nu am primit răspuns.',
            }
          }
          return newMessages
        })
      }
    } catch (e: any) {
      if (abortControllerRef.current?.signal?.aborted) {
        // Abort has already been handled by stopGeneration
        return
      }

      if (e?.name === 'AbortError') {
        return
      }

      const errorMsg = e.message || 'Eroare la comunicarea cu Insight.'
      setError(errorMsg)
      toast({
        title: 'Eroare',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      abortControllerRef.current = null
      setBusy(false)
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitMessage()
    }
  }

  const handleGoogleLogin = async () => {
    setLoginLoading('google')
    const { error } = await loginWithGoogle()
    if (error) {
      toast({
        title: 'Eroare la autentificare cu Google',
        description: error.message,
        variant: 'destructive',
      })
      setLoginLoading(null)
    }
  }

  const handleGitHubLogin = async () => {
    setLoginLoading('github')
    const { error } = await loginWithGitHub()
    if (error) {
      toast({
        title: 'Eroare la autentificare cu GitHub',
        description: error.message,
        variant: 'destructive',
      })
      setLoginLoading(null)
    }
  }

  const stopGeneration = useCallback(async () => {
    if (!isStreaming) return

    const controller = abortControllerRef.current
    abortControllerRef.current = null

    try {
      controller?.abort()
    } catch (err) {
      console.error('Failed to abort streaming response:', err)
    }

    setIsStreaming(false)
    setBusy(false)
    setLoadingMessage(null)

    if (!user) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) return

      await fetch('/api/insight/increment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      console.error('Failed to increment usage after manual stop:', err)
    }
  }, [isStreaming, supabase, user])

  const send = () => submitMessage()

  // Prevent page scroll when hovering over sidebar
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return

    const handleMouseEnter = () => {
      document.body.style.overflow = 'hidden'
    }

    const handleMouseLeave = () => {
      document.body.style.overflow = ''
    }

    const sidebarElement = sidebarRef.current
    sidebarElement.addEventListener('mouseenter', handleMouseEnter)
    sidebarElement.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      sidebarElement.removeEventListener('mouseenter', handleMouseEnter)
      sidebarElement.removeEventListener('mouseleave', handleMouseLeave)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[499] lg:hidden touch-none"
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 lg:top-[100px] right-0 h-dvh lg:h-[calc(100dvh-100px)] w-[90vw] lg:w-[33vw] bg-[#101010] border-l border-white/10 z-[500] flex flex-col transition-transform duration-300 ease-in-out overscroll-contain ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{
          maxWidth: '90vw',
          ...(isMobile && viewportHeight ? {
            height: viewportHeight,
            top: `${viewportOffset}px`,
          } : {})
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Insight Chat</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 overscroll-contain"
        >
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <p className="text-gray-300 text-lg mb-6">
                  Ai nevoie de un cont pentru a continua cu Insight
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={loginLoading !== null}
                    className="flex-1 h-11 bg-transparent hover:bg-white/5 text-white border border-white/10 hover:border-white/20 transition-all duration-200"
                  >
                    {loginLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Chrome className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-semibold text-sm">
                      {loginLoading === 'google' ? 'Se conectează...' : 'Google'}
                    </span>
                  </Button>
                  <Button
                    onClick={handleGitHubLogin}
                    disabled={loginLoading !== null}
                    className="flex-1 h-11 bg-transparent hover:bg-white/5 text-white border border-white/10 hover:border-white/20 transition-all duration-200"
                  >
                    {loginLoading === 'github' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Github className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-semibold text-sm">
                      {loginLoading === 'github' ? 'Se conectează...' : 'GitHub'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ) : loadingSession ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-sm">Se încarcă sesiunea Insight...</p>
              </div>
            </div>
          ) : hasMessages ? (
            <div className="space-y-4">
              {messages
                .filter((m) => m.role !== 'system')
                .map((m, i) => {
                  const isAssistant = m.role === 'assistant'
                  return (
                    <div
                      key={i}
                      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAssistant ? (
                        <div className="w-full py-2">
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            {m.content === '' && loadingMessage ? (
                              <span className="flex items-center gap-2">
                                <span className="shimmer-text">{loadingMessage}</span>
                                <span className="flex gap-1">
                                  <span className="animate-pulse">●</span>
                                  <span className="animate-pulse delay-75">●</span>
                                  <span className="animate-pulse delay-150">●</span>
                                </span>
                              </span>
                            ) : (
                              'Insight'
                            )}
                          </div>
                          {m.content && (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                              className="space-y-3 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:scrollbar-thin [&_.katex-display]:scrollbar-track-transparent [&_.katex-display]:scrollbar-thumb-gray-700"
                            >
                              {m.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-[70%] rounded-2xl bg-[#212121] text-white px-4 py-3 shadow-sm">
                          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 opacity-70">
                            Tu
                          </div>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                            className="space-y-3 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:scrollbar-thin [&_.katex-display]:scrollbar-track-transparent [&_.katex-display]:scrollbar-thumb-gray-700"
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )
                })}
              <div ref={endRef} />

              {/* Show suggestions if available and not busy */}
              {!busy &&
                suggestedQuestions.length > 0 &&
                messages.filter(m => m.role !== 'system').length > 0 &&
                messages.filter(m => m.role !== 'system')[messages.filter(m => m.role !== 'system').length - 1]?.role === 'assistant' &&
                !messages.some(m => m.role === 'user' && m.content === "Vreau să văd soluția completă.") && (
                  <SuggestedQuestions
                    questions={suggestedQuestions}
                    onSelect={handleSuggestionSelect}
                  />
                )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <p className="text-lg mb-2">Bunaa, eu sunt Insight, asistentul tau!</p>
                <p className="text-sm">
                  Cu ce te pot ajuta azi, {profile?.nickname || profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'tu'}?
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 pb-2">
            <div className="bg-red-900/20 border border-red-800 text-red-300 rounded p-2 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Chatbox Area */}
        <div className="p-4">
          <div className="flex flex-col relative w-full">
            {limitResetTime ? (
              <LimitReachedBanner resetTime={limitResetTime} />
            ) : (
              <>
                {/* Context Card */}
                {problemContext && !busy && (
                  <div className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 border-b-0 rounded-t-2xl p-3 text-sm text-gray-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-medium uppercase text-blue-400 flex-shrink-0">Context:</span>
                      <p className="truncate opacity-80 text-xs">
                        {problemContext.slice(0, 50)}...
                      </p>
                    </div>
                    <button
                      onClick={() => setProblemContext(null)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2 flex-shrink-0"
                      title="Șterge contextul"
                    >
                      <X className="w-3 h-3 text-white/50" />
                    </button>
                  </div>
                )}

                {/* Solution Request Button */}
                {persona === 'problem_tutor' &&
                  messages.filter(m => m.role === 'user').length >= 3 &&
                  !messages.some(m => m.role === 'user' && m.content === "Vreau să văd soluția completă.") &&
                  !busy && (
                    <div className="flex justify-end mb-0">
                      <button
                        onClick={() => submitMessage("Vreau să văd soluția completă.")}
                        className="bg-[#212121] border border-white/10 border-b-0 rounded-t-xl px-4 py-1.5 text-xs font-semibold text-orange-500 hover:text-orange-400 hover:bg-[#2a2a2a] transition-all ml-auto mr-0 shadow-lg translate-y-[1px] z-10"
                      >
                        Vezi soluția
                      </button>
                    </div>
                  )}

                {/* Input Area */}
                <div className={`relative flex items-end gap-2 bg-[#212121] border border-white/10 p-3 shadow-lg transition-all duration-200 ${problemContext
                  ? 'rounded-b-2xl rounded-t-none border-t-0'
                  : (persona === 'problem_tutor' && messages.filter(m => m.role === 'user').length >= 3 && !messages.some(m => m.role === 'user' && m.content === "Vreau să văd soluția completă.") && !busy)
                    ? 'rounded-b-2xl rounded-tr-none rounded-tl-2xl border-t-0'
                    : 'rounded-2xl'
                  }`}>
                  <button
                    className="h-10 w-10 rounded hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0 self-end"
                    disabled
                    title="Atașează fișier (în curând)"
                  >
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  </button>
                  <Textarea
                    ref={textareaRef}
                    placeholder={problemContext ? (isMobile ? "Scrie..." : "Adaugă detalii sau întreabă...") : "Scrie un mesaj..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] py-2"
                    disabled={busy}
                    style={{
                      height: `${textareaHeight}px`,
                      overflowY: textareaHeight > 24 * 5 ? 'auto' : 'hidden',
                    }}
                  />
                  {busy && isStreaming ? (
                    <button
                      onClick={stopGeneration}
                      className="h-10 w-10 rounded transition-colors flex items-center justify-center flex-shrink-0 self-end disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Oprește răspunsul"
                    >
                      <span className="flex items-center justify-center w-5 h-5">
                        <span className="flex items-center justify-center w-4 h-4 bg-white rounded-full">
                          <span className="w-2 h-2 bg-black" />
                        </span>
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={send}
                      disabled={busy || (!input.trim() && !problemContext)}
                      className="h-10 w-10 rounded hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      <Send className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


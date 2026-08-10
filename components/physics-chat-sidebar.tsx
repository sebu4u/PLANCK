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
import { FreePlanComparisonOverlay } from '@/components/invata/free-plan-comparison-overlay'
import { AnonLimitLockedContent } from '@/components/anon-limit-locked-content'
import {
    ChatMessageLimitHint,
    ChatMessageLimitLockButton,
    CHAT_MESSAGE_LIMIT_PLACEHOLDER,
} from '@/components/chat-message-limit-lock'
import { InsightProblemChatHistory } from '@/components/insight/insight-problem-chat-history'
import {
    resolveLessonTutorSuggestions,
    stripSuggestionsMarker,
} from '@/lib/insight-suggestions'

type ChatMessage = {
    role: 'user' | 'assistant' | 'system'
    content: string
    suggestions?: string[]
    anonLimitLocked?: boolean
}

interface PhysicsChatSidebarProps {
    isOpen: boolean
    onClose: () => void
    lessonContent: string
    lessonId: string
    lessonTitle?: string
    initialQuery?: string | null
}

function SuggestedQuestions({
    questions,
    onSelect,
}: {
    questions: string[]
    onSelect: (question: string) => void
}) {
    if (!questions.length) return null

    return (
        <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="mb-1 ml-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Sugestii de întrebări
            </p>
            {questions.map((q, i) => (
                <button
                    key={`${i}-${q}`}
                    type="button"
                    onClick={() => onSelect(q)}
                    className="rounded-xl border border-gray-200 bg-white p-3 text-left text-sm text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-[#f8fafc] active:scale-[0.98]"
                >
                    {q}
                </button>
            ))}
        </div>
    )
}

// Loading messages shown while AI is thinking
const loadingMessages = [
    'Mă gândesc la răspuns…',
    'Analizez contextul…',
    'Caut în lecție…',
    'Un moment, formulez explicația…',
    'Conectez informațiile…',
    'Verific detaliile…',
]

const getRandomLoadingMessage = () => {
    return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
}

export function PhysicsChatSidebar({
    isOpen,
    onClose,
    lessonContent,
    lessonId,
    lessonTitle,
    initialQuery,
}: PhysicsChatSidebarProps) {
    const { user, profile, loginWithGoogle, loginWithGitHub } = useAuth()
    const { toast } = useToast()
    const [loginLoading, setLoginLoading] = useState<'google' | 'github' | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'system',
            content: `Ești un asistent educațional util pentru o lecție de fizică.
      Folosește următorul conținut al lecției pentru a răspunde la întrebări.
      Fii concis, clar și încurajator.
      
      Conținutul lecției:
      ${lessonContent}`
        },
    ])
    const [input, setInput] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [loadingSession, setLoadingSession] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const [textareaHeight, setTextareaHeight] = useState(24)
    const abortControllerRef = useRef<AbortController | null>(null)
    const [isStreaming, setIsStreaming] = useState(false)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
    // Context specifically from selection (initialQuery)
    const [selectionContext, setSelectionContext] = useState<string | null>(null)
    const [premiumUpgradeOpen, setPremiumUpgradeOpen] = useState(false)
    const [messageLimitReached, setMessageLimitReached] = useState(false)

    const buildSystemMessage = useCallback(
        (): ChatMessage => ({
            role: 'system',
            content: `Ești un asistent educațional util pentru o lecție.
            Folosește următorul conținut al lecției pentru a răspunde la întrebări.
            Fii concis, clar și încurajator.
            
            Conținutul lecției:
            ${lessonContent}`,
        }),
        [lessonContent],
    )

    const markdownComponents = useMemo(
        () => ({
            p: ({ node, ...props }: any) => (
                <p className="whitespace-pre-wrap break-words text-gray-700 leading-relaxed" {...props} />
            ),
            strong: ({ node, ...props }: any) => (
                <strong className="text-gray-900" {...props} />
            ),
            em: ({ node, ...props }: any) => (
                <em className="text-gray-600" {...props} />
            ),
            h1: ({ node, ...props }: any) => (
                <h1 className="text-xl font-semibold text-gray-900" {...props} />
            ),
            h2: ({ node, ...props }: any) => (
                <h2 className="text-lg font-semibold text-gray-900" {...props} />
            ),
            h3: ({ node, ...props }: any) => (
                <h3 className="text-base font-semibold text-gray-900" {...props} />
            ),
            ul: ({ node, ordered, ...props }: any) => (
                <ul className="list-disc pl-5 space-y-1 text-gray-700" {...props} />
            ),
            ol: ({ node, ordered, ...props }: any) => (
                <ol className="list-decimal pl-5 space-y-1 text-gray-700" {...props} />
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
                    className={`rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[13px] text-gray-800 ${className ?? ''}`}
                    {...props}
                >
                    {children}
                </code>
            ),
        }),
        [],
    )

    const hasMessages = messages.filter((m) => m.role !== 'system').length > 0

    const handleHistoryNewChat = useCallback(() => {
        setSessionId(null)
        setMessages([buildSystemMessage()])
        setInput('')
        setError(null)
        setSelectionContext(null)
        setLoadingMessage(null)
    }, [buildSystemMessage])

    const loadSessionMessages = useCallback(
        async (sessionIdToLoad: string, accessToken: string) => {
            const res = await fetch(`/api/insight/messages?sessionId=${sessionIdToLoad}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            if (!res.ok) {
                throw new Error('Nu am putut încărca mesajele.')
            }

            const data = await res.json()
            const loadedMessages: ChatMessage[] = (data.messages || []).map(
                (m: Record<string, unknown>) => {
                    const role = m.role as 'user' | 'assistant' | 'system'
                    const content = String(m.content ?? '')
                    if (role === 'assistant' && content.trim()) {
                        const finalized = resolveLessonTutorSuggestions(content)
                        return {
                            role,
                            content: finalized.displayContent || content,
                            suggestions: finalized.suggestions,
                        }
                    }
                    return { role, content }
                },
            )

            setMessages([buildSystemMessage(), ...loadedMessages.filter((m) => m.role !== 'system')])
        },
        [buildSystemMessage],
    )

    const handleHistorySelectSession = useCallback(
        async (sessionIdToLoad: string) => {
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
                setSessionId(sessionIdToLoad)
                setInput('')
                setError(null)
                setSelectionContext(null)
                await loadSessionMessages(sessionIdToLoad, accessToken)
            } catch (e: any) {
                console.error('Failed to load history session:', e)
                toast({
                    title: 'Eroare',
                    description: 'Nu am putut încărca chat-ul selectat.',
                    variant: 'destructive',
                })
            } finally {
                setLoadingSession(false)
            }
        },
        [loadSessionMessages, toast],
    )

    // Start fresh when the sidebar opens or the lesson changes (history is loaded from the popover).
    useEffect(() => {
        if (!isOpen) return

        setSessionId(null)
        setMessages([buildSystemMessage()])
        setInput('')
        setError(null)
        setLoadingMessage(null)
        setSelectionContext(initialQuery || null)

        setTimeout(() => {
            if (window.innerWidth >= 1024) {
                textareaRef.current?.focus()
            }
        }, 100)
        // Omit buildSystemMessage / initialQuery so loading a history session isn't wiped by re-renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only reopen / lesson switch
    }, [isOpen, lessonId])

    useEffect(() => {
        if (!isOpen || !initialQuery) return
        setSelectionContext(initialQuery)
    }, [initialQuery, isOpen])


    // Check if user is at bottom of messages container
    const checkIfAtBottom = useCallback(() => {
        if (!messagesContainerRef.current) return true

        const container = messagesContainerRef.current
        const threshold = 100
        const isAtBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < threshold

        return isAtBottom
    }, [])

    const handleScroll = useCallback(() => {
        const isAtBottom = checkIfAtBottom()
        setShouldAutoScroll(isAtBottom)
    }, [checkIfAtBottom])

    useEffect(() => {
        if (isOpen && shouldAutoScroll) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, busy, isOpen, shouldAutoScroll])

    const adjustTextareaHeight = useCallback(() => {
        if (!textareaRef.current) return

        const textarea = textareaRef.current
        const originalMinHeight = textarea.style.minHeight
        textarea.style.minHeight = '0'
        textarea.style.height = 'auto'

        const lineHeight = 24
        const maxHeight = lineHeight * 5
        const scrollHeight = textarea.scrollHeight

        textarea.style.minHeight = originalMinHeight

        if (scrollHeight <= maxHeight) {
            const newHeight = Math.max(24, scrollHeight)
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

    useEffect(() => {
        if (!initialQuery) {
            lastProcessedQuery.current = null
            return
        }

        if (initialQuery && initialQuery !== lastProcessedQuery.current && isOpen && !busy) {
            lastProcessedQuery.current = initialQuery
            setSelectionContext(initialQuery)
            submitMessage('', initialQuery)
        }
    }, [initialQuery, isOpen, user, busy])

    const lastProcessedQuery = useRef<string | null>(null)

    const submitMessage = async (textOverride?: string, contextOverride?: string | null) => {
        const textToSend = textOverride !== undefined ? textOverride : input
        const contextToUse = contextOverride !== undefined ? contextOverride : selectionContext

        if ((!textToSend.trim() && !contextToUse) || busy || messageLimitReached) return

        setBusy(true)
        setError(null)
        setPremiumUpgradeOpen(false)
        setIsStreaming(true)

        try {
            abortControllerRef.current?.abort()
            const controller = new AbortController()
            abortControllerRef.current = controller

            const isGuest = !user

            let accessToken: string | null = null
            if (!isGuest) {
                const { data: sessionData } = await supabase.auth.getSession()
                accessToken = sessionData.session?.access_token ?? null

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
            }

            let finalContent = textToSend.trim()
            if (contextToUse) {
                finalContent = finalContent ? `Context selectat: "${contextToUse}"\n\n${finalContent}` : `Explică asta: "${contextToUse}"`
            }

            const priorForApi = messages
                .filter((m) => m.role !== 'system')
                .filter((m) => !(m.role === 'assistant' && !(m.content || '').trim()))

            const newUserMsg: ChatMessage = {
                role: 'user',
                content: finalContent,
            }

            setMessages((prev) => [...prev, newUserMsg])
            if (!textOverride) setInput('')
            setSelectionContext(null) // Clear context after used
            setShouldAutoScroll(true)

            let currentSessionId = sessionId
            if (!isGuest && accessToken && !currentSessionId) {
                const sessionTitle =
                    (finalContent.slice(0, 60) || lessonTitle || 'Chat lecție').trim() || 'Chat lecție'
                const res = await fetch('/api/insight/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        title: sessionTitle,
                        lessonId,
                    }),
                })

                if (!res.ok) {
                    throw new Error('Nu am putut crea sesiunea.')
                }

                const data = await res.json()
                currentSessionId = data.sessionId
                setSessionId(currentSessionId)
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
            setLoadingMessage(getRandomLoadingMessage())

            const lessonContextMsg = {
                role: 'system' as const,
                content: `Conținutul complet al lecției curente, pe care îl vei folosi pentru a răspunde întrebărilor utilizatorului:\n\n${lessonContent}`,
            }

            const fetchHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (accessToken) {
                fetchHeaders.Authorization = `Bearer ${accessToken}`
            }

            const res = await fetch('/api/insight/chat', {
                method: 'POST',
                credentials: 'include',
                headers: fetchHeaders,
                body: JSON.stringify(
                    isGuest
                        ? {
                              messages: [...priorForApi, { role: 'user', content: finalContent }],
                              persona: 'lesson_tutor',
                              contextMessages: [lessonContextMsg],
                          }
                        : {
                              sessionId: currentSessionId,
                              input: newUserMsg.content,
                              persona: 'lesson_tutor',
                              lessonId,
                              contextMessages: [lessonContextMsg],
                          }
                ),
                signal: controller.signal,
            })

            if (res.status === 429) {
                const data = await res.json()
                const isFreeOrGuest = !user || !profile?.plan || profile.plan === 'free'
                if (isFreeOrGuest) {
                    setMessageLimitReached(true)
                    setInput('')
                    setPremiumUpgradeOpen(true)
                    setError(null)
                } else if (data.resetTime) {
                    setPremiumUpgradeOpen(true)
                } else {
                    setError(data.error || 'Limită zilnică atinsă.')
                }
                setMessages((prev) => prev.slice(0, -1))
                setBusy(false)
                setIsStreaming(false)
                return
            }

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Eroare la Insight.')
            }

            const contentType = res.headers.get('content-type')
            if (contentType?.includes('text/event-stream')) {
                const reader = res.body?.getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                let fullAssistantContent = ''

                if (!reader) throw new Error('Nu s-a putut citi răspunsul.')

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
                                    setLoadingMessage(null)
                                    fullAssistantContent += data.content

                                    const displayContent = stripSuggestionsMarker(fullAssistantContent)

                                    setMessages((prev) => {
                                        const newMessages = [...prev]
                                        for (let i = newMessages.length - 1; i >= 0; i--) {
                                            if (newMessages[i]?.role === 'assistant') {
                                                newMessages[i] = {
                                                    ...newMessages[i],
                                                    role: 'assistant',
                                                    content: displayContent,
                                                    suggestions: undefined,
                                                }
                                                break
                                            }
                                        }
                                        return newMessages
                                    })
                                } else if (data.type === 'done') {
                                    if (data.anonLimitReached) {
                                        setMessageLimitReached(true)
                                        setInput('')
                                    }
                                    const finalized = resolveLessonTutorSuggestions(fullAssistantContent)
                                    setMessages((prev) => {
                                        const next = [...prev]
                                        for (let i = next.length - 1; i >= 0; i--) {
                                            if (next[i].role === 'assistant') {
                                                next[i] = {
                                                    ...next[i],
                                                    content: finalized.displayContent || next[i].content,
                                                    suggestions: finalized.suggestions,
                                                    anonLimitLocked: data.anonLimitReached
                                                        ? true
                                                        : next[i].anonLimitLocked,
                                                }
                                                break
                                            }
                                        }
                                        return next
                                    })
                                    if (data.sessionId) {
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
                const data = await res.json()
                const raw = data.output || 'Nu am primit răspuns.'
                const finalized = resolveLessonTutorSuggestions(raw)
                setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastIndex = newMessages.length - 1
                    if (lastIndex >= 0 && newMessages[lastIndex]?.role === 'assistant') {
                        newMessages[lastIndex] = {
                            role: 'assistant',
                            content: finalized.displayContent || raw,
                            suggestions: finalized.suggestions,
                        }
                    }
                    return newMessages
                })
            }
        } catch (e: any) {
            if (abortControllerRef.current?.signal?.aborted) return
            if (e?.name === 'AbortError') return

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
        if (messageLimitReached) {
            e.preventDefault()
            return
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submitMessage()
        }
    }

    const handleGoogleLogin = async () => {
        setLoginLoading('google')
        const { error, popupBlocked } = await loginWithGoogle()
        if (error) {
            toast({
                title: 'Eroare la autentificare cu Google',
                description: popupBlocked
                    ? 'Permite ferestrele pop-up pentru acest site, apoi încearcă din nou.'
                    : error.message,
                variant: 'destructive',
            })
        }
        setLoginLoading(null)
    }

    const handleGitHubLogin = async () => {
        setLoginLoading('github')
        const { error, popupBlocked } = await loginWithGitHub()
        if (error) {
            toast({
                title: 'Eroare la autentificare cu GitHub',
                description: popupBlocked
                    ? 'Permite ferestrele pop-up pentru acest site, apoi încearcă din nou.'
                    : error.message,
                variant: 'destructive',
            })
        }
        setLoginLoading(null)
    }

    const stopGeneration = useCallback(() => {
        if (!isStreaming) return
        const controller = abortControllerRef.current
        abortControllerRef.current = null
        try {
            controller?.abort()
        } catch (err) {
            console.error('Failed to abort streaming response:', err)
        }
        setMessages((prev) => {
            const next = [...prev]
            for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].role === 'assistant') {
                    const content = (next[i].content || '').trim()
                    if (!content) break
                    const finalized = resolveLessonTutorSuggestions(content)
                    next[i] = {
                        ...next[i],
                        content: finalized.displayContent || content,
                        suggestions: finalized.suggestions,
                    }
                    break
                }
            }
            return next
        })
        setIsStreaming(false)
        setBusy(false)
        setLoadingMessage(null)
    }, [isStreaming])

    const send = () => submitMessage()

    useEffect(() => {
        if (!isOpen || !sidebarRef.current) return
        const handleMouseEnter = () => { document.body.style.overflow = 'hidden' }
        const handleMouseLeave = () => { document.body.style.overflow = '' }
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
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[499] lg:hidden"
                    onClick={onClose}
                />
            )}

            <div
                ref={sidebarRef}
                className={`fixed top-0 lg:top-16 right-0 h-dvh lg:h-[calc(100dvh-4rem)] w-[90vw] lg:w-[450px] bg-[#F8FAFD] border-l border-gray-200 z-[500] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ maxWidth: '90vw' }}
            >
                <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200">
                    <h2 className="text-gray-900 font-semibold">Asistent Lecție</h2>
                    <div className="flex shrink-0 items-center gap-0.5">
                        {user ? (
                            <InsightProblemChatHistory
                                lessonId={lessonId}
                                currentSessionId={sessionId}
                                onSelectSession={(id) => {
                                    void handleHistorySelectSession(id)
                                }}
                                onNewChat={handleHistoryNewChat}
                                refreshKey={sessionId}
                                lightTheme
                            />
                        ) : null}
                        <button
                            onClick={onClose}
                            className="p-2 rounded hover:bg-gray-200/70 transition-colors"
                            aria-label="Închide"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-6"
                >
                    {loadingSession ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
                                <p className="text-sm">Se încarcă...</p>
                            </div>
                        </div>
                    ) : hasMessages ? (
                        <div className="space-y-4">
                            {messages
                                .filter((m) => m.role !== 'system')
                                .map((m, i, visible) => {
                                    const isAssistant = m.role === 'assistant'
                                    const isLastVisible = i === visible.length - 1
                                    const hideSuggestionsWhileStreaming =
                                        busy && isStreaming && isLastVisible && isAssistant
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
                                                            'Asistent'
                                                        )}
                                                    </div>
                                                    {m.content && (
                                                        <AnonLimitLockedContent active={Boolean(m.anonLimitLocked)}>
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                                rehypePlugins={[rehypeKatex]}
                                                                components={markdownComponents}
                                                                className="space-y-3 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:scrollbar-thin [&_.katex-display]:scrollbar-track-transparent [&_.katex-display]:scrollbar-thumb-gray-300"
                                                            >
                                                                {m.content}
                                                            </ReactMarkdown>
                                                        </AnonLimitLockedContent>
                                                    )}
                                                    {!hideSuggestionsWhileStreaming && m.suggestions?.length ? (
                                                        <SuggestedQuestions
                                                            questions={m.suggestions}
                                                            onSelect={(question) => {
                                                                void submitMessage(question)
                                                            }}
                                                        />
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="max-w-[70%] rounded-2xl bg-white text-gray-900 px-4 py-3 shadow-sm border border-gray-200">
                                                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 opacity-70">
                                                        Tu
                                                    </div>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm, remarkMath]}
                                                        rehypePlugins={[rehypeKatex]}
                                                        components={markdownComponents}
                                                        className="space-y-3 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:scrollbar-thin [&_.katex-display]:scrollbar-track-transparent [&_.katex-display]:scrollbar-thumb-gray-300"
                                                    >
                                                        {m.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            <div ref={endRef} />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-gray-500 text-center">
                                <p className="text-lg mb-2">Salut! Sunt aici să te ajut cu această lecție.</p>
                                <p className="text-sm">
                                    Ai vreo întrebare sau ceva neclar?
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="px-4 pb-2">
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">
                            {error}
                        </div>
                    </div>
                )}

                <div className="p-4">
                    {!hasMessages && !busy && !loadingSession && (
                        <div className="flex flex-row gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-1 justify-between">
                            <button
                                onClick={() => submitMessage('Fă-mi un rezumat')}
                                className="whitespace-nowrap flex-1 rounded-full bg-white border border-gray-200 px-1 py-1.5 text-[11px] text-gray-800 hover:bg-gray-50 transition-colors text-center truncate"
                            >
                                Fă-mi un rezumat
                            </button>
                            <button
                                onClick={() => submitMessage('Explică-mi mai simplu')}
                                className="whitespace-nowrap flex-1 rounded-full bg-white border border-gray-200 px-1 py-1.5 text-[11px] text-gray-800 hover:bg-gray-50 transition-colors text-center truncate"
                            >
                                Explică-mi mai simplu
                            </button>
                            <button
                                onClick={() => submitMessage('Vreau o problemă')}
                                className="whitespace-nowrap flex-1 rounded-full bg-white border border-gray-200 px-1 py-1.5 text-[11px] text-gray-800 hover:bg-gray-50 transition-colors text-center truncate"
                            >
                                Vreau o problemă
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col relative w-full">
                            <>
                                {selectionContext && !busy && (
                                    <div className="flex items-center justify-between bg-white border border-gray-200 border-b-0 rounded-t-2xl p-3 text-sm text-gray-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-xs font-medium uppercase text-blue-600 flex-shrink-0">Selecție:</span>
                                            <p className="truncate opacity-80 text-xs">
                                                {selectionContext.slice(0, 50)}...
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectionContext(null)}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-2 flex-shrink-0"
                                            title="Șterge selecția"
                                        >
                                            <X className="w-3 h-3 text-gray-400" />
                                        </button>
                                    </div>
                                )}

                                {messageLimitReached ? (
                                    <ChatMessageLimitHint
                                        className="mb-2"
                                        onUpgradeClick={() => setPremiumUpgradeOpen(true)}
                                    />
                                ) : null}

                                <div className={`relative flex items-end gap-2 bg-white border border-gray-200 p-3 shadow-sm transition-all duration-200 ${selectionContext
                                    ? 'rounded-b-2xl rounded-t-none border-t-0'
                                    : 'rounded-2xl'
                                    }`}>
                                    <button
                                        className="p-2 rounded hover:bg-gray-100 transition-colors flex-shrink-0 self-end mb-0.5"
                                        disabled
                                        title="Atașează fișier (în curând)"
                                    >
                                        <Paperclip className="w-4 h-4 text-gray-500" />
                                    </button>
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder={
                                            messageLimitReached
                                                ? CHAT_MESSAGE_LIMIT_PLACEHOLDER
                                                : selectionContext
                                                    ? 'Întreabă despre selecție...'
                                                    : 'Scrie o întrebare...'
                                        }
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        rows={1}
                                        className="flex-1 bg-transparent border-0 text-gray-900 placeholder:text-gray-500 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        disabled={busy || messageLimitReached}
                                        readOnly={messageLimitReached}
                                        style={{
                                            minHeight: '24px',
                                            height: `${textareaHeight}px`,
                                            overflowY: textareaHeight > 24 * 5 ? 'auto' : 'hidden',
                                        }}
                                    />
                                    {messageLimitReached ? (
                                        <ChatMessageLimitLockButton
                                            onClick={() => setPremiumUpgradeOpen(true)}
                                            iconSize={16}
                                            className="mb-0.5 h-8 w-8 self-end"
                                        />
                                    ) : busy && isStreaming ? (
                                        <button
                                            onClick={stopGeneration}
                                            className="p-2 rounded transition-colors flex-shrink-0 self-end mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Oprește răspunsul"
                                        >
                                            <span className="flex items-center justify-center w-5 h-5">
                                                <span className="flex items-center justify-center w-4 h-4 bg-gray-900 rounded-full">
                                                    <span className="w-2 h-2 bg-white" />
                                                </span>
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={send}
                                            disabled={busy || (!input.trim() && !selectionContext)}
                                            className="p-2 rounded hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
                                        >
                                            <Send className="w-4 h-4 text-gray-600" />
                                        </button>
                                    )}
                                </div>
                            </>
                    </div>
                </div>
            </div>
            {premiumUpgradeOpen ? (
                <FreePlanComparisonOverlay onClose={() => setPremiumUpgradeOpen(false)} />
            ) : null}
        </>
    )
}

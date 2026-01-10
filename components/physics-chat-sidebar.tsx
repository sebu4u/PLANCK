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

interface PhysicsChatSidebarProps {
    isOpen: boolean
    onClose: () => void
    lessonContent: string
    initialQuery?: string | null
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
    const [limitResetTime, setLimitResetTime] = useState<string | null>(null)


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

    const hasMessages = messages.filter((m) => m.role !== 'system').length > 0

    // Initialize session when sidebar opens
    useEffect(() => {
        if (!isOpen || !user) return

        if (hasMessages || sessionId) {
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

                // We start fresh for lesson chat too
                setSessionId(null)
                setMessages([
                    {
                        role: 'system',
                        content: `Ești un asistent educațional util pentru o lecție de fizică.
            Folosește următorul conținut al lecției pentru a răspunde la întrebări.
            Fii concis, clar și încurajator.
            
            Conținutul lecției:
            ${lessonContent}`
                    },
                ])

                if (initialQuery) {
                    setSelectionContext(initialQuery)
                }

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
    }, [isOpen, user, lessonContent, initialQuery])

    // Reset when lessonContent changes markedly (though usually it's stable per page load)
    // For lesson viewer, if we navigate to next lesson, lessonContent changes.
    useEffect(() => {
        setMessages([
            {
                role: 'system',
                content: `Ești un asistent educațional util pentru o lecție de fizică.
            Folosește următorul conținut al lecției pentru a răspunde la întrebări.
            Fii concis, clar și încurajator.
            
            Conținutul lecției:
            ${lessonContent}`
            },
        ])
        setSessionId(null)
        setInput('')
        setError(null)
        if (initialQuery) {
            setSelectionContext(initialQuery)
        } else {
            setSelectionContext(null)
        }
    }, [lessonContent, initialQuery])


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

        if (initialQuery && initialQuery !== lastProcessedQuery.current && isOpen && user && !busy) {
            lastProcessedQuery.current = initialQuery
            setSelectionContext(initialQuery)
            submitMessage('', initialQuery)
        }
    }, [initialQuery, isOpen, user, busy])

    const lastProcessedQuery = useRef<string | null>(null)

    const submitMessage = async (textOverride?: string, contextOverride?: string | null) => {
        const textToSend = textOverride !== undefined ? textOverride : input
        const contextToUse = contextOverride !== undefined ? contextOverride : selectionContext

        if (!user || (!textToSend.trim() && !contextToUse) || busy) return

        setBusy(true)
        setError(null)
        setLimitResetTime(null)
        setIsStreaming(true)

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

            let finalContent = textToSend.trim()
            if (contextToUse) {
                finalContent = finalContent ? `Context selectat: "${contextToUse}"\n\n${finalContent}` : `Explică asta: "${contextToUse}"`
            }

            const newUserMsg: ChatMessage = {
                role: 'user',
                content: finalContent,
            }

            setMessages((prev) => [...prev, newUserMsg])
            if (!textOverride) setInput('')
            setSelectionContext(null) // Clear context after used
            setShouldAutoScroll(true)

            let currentSessionId = sessionId
            if (!currentSessionId) {
                // Create session
                const sessionTitle = `Lesson Chat`
                const res = await fetch('/api/insight/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        title: sessionTitle,
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

            const res = await fetch('/api/insight/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    input: newUserMsg.content,
                    persona: 'lesson_tutor',
                    contextMessages: [
                        {
                            role: 'system',
                            content: `Conținutul complet al lecției curente, pe care îl vei folosi pentru a răspunde întrebărilor utilizatorului:\n\n${lessonContent}`
                        }
                    ]
                }),
                signal: controller.signal,
            })

            if (res.status === 429) {
                const data = await res.json()
                if (data.resetTime) {
                    setLimitResetTime(data.resetTime)
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

                                    // Strip suggestions if any (Insight API might send them)
                                    let displayContent = fullAssistantContent
                                    const suggestionsMarker = '---SUGGESTIONS---'
                                    if (fullAssistantContent.includes(suggestionsMarker)) {
                                        displayContent = fullAssistantContent.split(suggestionsMarker)[0].trim()
                                    }

                                    setMessages((prev) => {
                                        const newMessages = [...prev]
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
                    className="fixed inset-0 bg-black/50 z-[95] lg:hidden"
                    onClick={onClose}
                />
            )}

            <div
                ref={sidebarRef}
                className={`fixed top-[100px] right-0 h-[calc(100dvh-100px)] w-[90vw] lg:w-[450px] bg-[#101010] border-l border-white/10 z-[100] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ maxWidth: '90vw' }}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-white font-semibold">Asistent Lecție</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-6"
                >
                    {!user ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-center max-w-sm">
                                <p className="text-gray-300 text-lg mb-6">
                                    Ai nevoie de un cont pentru a discuta cu asistentul.
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
                                <p className="text-sm">Se inițializează...</p>
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
                                                            'Asistent'
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
                        <div className="bg-red-900/20 border border-red-800 text-red-300 rounded p-2 text-sm">
                            {error}
                        </div>
                    </div>
                )}

                <div className="p-4">
                    {!hasMessages && !busy && !loadingSession && (
                        <div className="flex flex-row gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-1 justify-between">
                            <button
                                onClick={() => submitMessage('Fă-mi un rezumat')}
                                className="whitespace-nowrap flex-1 rounded-full bg-[#1a1a1a] border border-white/10 px-1 py-1.5 text-[11px] text-white hover:bg-white/5 transition-colors text-center truncate"
                            >
                                Fă-mi un rezumat
                            </button>
                            <button
                                onClick={() => submitMessage('Explică-mi mai simplu')}
                                className="whitespace-nowrap flex-1 rounded-full bg-[#1a1a1a] border border-white/10 px-1 py-1.5 text-[11px] text-white hover:bg-white/5 transition-colors text-center truncate"
                            >
                                Explică-mi mai simplu
                            </button>
                            <button
                                onClick={() => submitMessage('Vreau o problemă')}
                                className="whitespace-nowrap flex-1 rounded-full bg-[#1a1a1a] border border-white/10 px-1 py-1.5 text-[11px] text-white hover:bg-white/5 transition-colors text-center truncate"
                            >
                                Vreau o problemă
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col relative w-full">
                        {limitResetTime ? (
                            <LimitReachedBanner resetTime={limitResetTime} />
                        ) : (
                            <>
                                {selectionContext && !busy && (
                                    <div className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 border-b-0 rounded-t-2xl p-3 text-sm text-gray-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-xs font-medium uppercase text-blue-400 flex-shrink-0">Selecție:</span>
                                            <p className="truncate opacity-80 text-xs">
                                                {selectionContext.slice(0, 50)}...
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectionContext(null)}
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2 flex-shrink-0"
                                            title="Șterge selecția"
                                        >
                                            <X className="w-3 h-3 text-white/50" />
                                        </button>
                                    </div>
                                )}

                                <div className={`relative flex items-end gap-2 bg-[#212121] border border-white/10 p-3 shadow-lg transition-all duration-200 ${selectionContext
                                    ? 'rounded-b-2xl rounded-t-none border-t-0'
                                    : 'rounded-2xl'
                                    }`}>
                                    <button
                                        className="p-2 rounded hover:bg-gray-700 transition-colors flex-shrink-0 self-end mb-0.5"
                                        disabled
                                        title="Atașează fișier (în curând)"
                                    >
                                        <Paperclip className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder={selectionContext ? "Întreabă despre selecție..." : "Scrie o întrebare..."}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        rows={1}
                                        className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        disabled={busy}
                                        style={{
                                            minHeight: '24px',
                                            height: `${textareaHeight}px`,
                                            overflowY: textareaHeight > 24 * 5 ? 'auto' : 'hidden',
                                        }}
                                    />
                                    {busy && isStreaming ? (
                                        <button
                                            onClick={stopGeneration}
                                            className="p-2 rounded transition-colors flex-shrink-0 self-end mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            disabled={busy || (!input.trim() && !selectionContext)}
                                            className="p-2 rounded hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
                                        >
                                            <Send className="w-4 h-4 text-gray-400" />
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

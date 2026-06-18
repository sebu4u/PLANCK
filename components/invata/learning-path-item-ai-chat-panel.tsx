"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Send, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { LP_AI_CHAT_PANEL_WIDTH_CLASS } from "@/lib/learning-path-ai-chat-layout"
import { PROBLEMS_BG_AVATAR_SRC } from "@/lib/planck-catalog-avatar"

type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

const SYSTEM_MESSAGE: ChatMessage = {
  role: "system",
  content: "Ești Insight, un profesor de fizică răbdător.",
}

function buildAttachedContext(statement: string, preamble: string | undefined): string | null {
  const trimmed = statement.trim()
  if (!trimmed) return null
  if (preamble === undefined) {
    return `Rezolva problema asta:\n\n${trimmed}`
  }
  if (preamble === "") return trimmed
  return `${preamble}\n\n${trimmed}`
}

function LearningPathAiChatDelimiter() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-px bg-[#d4d4d4]" />
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-7 w-1.5 rounded-full bg-[#9ca3af]" />
      </div>
    </div>
  )
}

export interface LearningPathItemAiChatPanelProps {
  isOpen: boolean
  onClose: () => void
  resetKey: string
  problemId: string
  getContextStatement: () => string
  problemContextPreamble?: string
  initialUserMessage?: string | null
  initialUserMessageDisplay?: string | null
  onInitialMessageSent?: () => void
}

export function LearningPathItemAiChatPanel({
  isOpen,
  onClose,
  resetKey,
  problemId,
  getContextStatement,
  problemContextPreamble = "",
  initialUserMessage,
  initialUserMessageDisplay,
  onInitialMessageSent,
}: LearningPathItemAiChatPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([SYSTEM_MESSAGE])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initialMessageSentRef = useRef(false)
  const lastInitialMessageRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const getContextStatementRef = useRef(getContextStatement)
  getContextStatementRef.current = getContextStatement

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system" && m.content.trim()),
    [messages],
  )
  const showEmptyStateDecor = visibleMessages.length === 0

  useEffect(() => {
    setMessages([SYSTEM_MESSAGE])
    setSessionId(null)
    setInput("")
    setError(null)
    initialMessageSentRef.current = false
    lastInitialMessageRef.current = null
    abortControllerRef.current?.abort()
  }, [resetKey])

  useEffect(() => {
    if (!isOpen) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [isOpen, visibleMessages, busy])

  useEffect(() => {
    if (!isOpen || busy || !initialUserMessage?.trim()) return
    const trimmed = initialUserMessage.trim()
    if (lastInitialMessageRef.current === trimmed) return
    lastInitialMessageRef.current = trimmed
    initialMessageSentRef.current = true
    const display =
      initialUserMessageDisplay !== undefined && initialUserMessageDisplay !== null
        ? initialUserMessageDisplay
        : trimmed
    void submitMessage(trimmed, display).finally(() => {
      onInitialMessageSent?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialUserMessage, initialUserMessageDisplay, busy])

  useEffect(() => {
    if (isOpen && window.innerWidth >= 1024) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 150)
      return () => window.clearTimeout(t)
    }
  }, [isOpen])

  const submitMessage = useCallback(
    async (textOverride?: string, displayContentOverride?: string) => {
      const textToSend = textOverride ?? input
      if (!textToSend.trim() || busy) return

      if (!user) {
        toast({
          title: "Cont necesar",
          description: "Autentifică-te pentru a folosi asistentul AI.",
          variant: "destructive",
        })
        return
      }

      setBusy(true)
      setError(null)

      try {
        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          toast({
            title: "Eroare",
            description: "Necesită autentificare.",
            variant: "destructive",
          })
          return
        }

        let currentSessionId = sessionId
        if (!currentSessionId) {
          const sessRes = await fetch("/api/insight/sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ title: `Problem: ${problemId}` }),
          })
          if (!sessRes.ok) throw new Error("Nu am putut crea sesiunea.")
          const sessData = await sessRes.json()
          currentSessionId = sessData.sessionId
          setSessionId(currentSessionId)
        }

        const contextBlock = buildAttachedContext(
          getContextStatementRef.current(),
          problemContextPreamble,
        )
        let finalContent = textToSend.trim()
        if (contextBlock) {
          finalContent = finalContent ? `${contextBlock}\n\n${finalContent}` : contextBlock
        }

        const priorForApi = messages
          .filter((m) => m.role !== "system")
          .filter((m) => !(m.role === "assistant" && !m.content.trim()))

        const displayContent =
          displayContentOverride !== undefined && displayContentOverride !== null
            ? displayContentOverride
            : textToSend.trim()

        setMessages((prev) => [
          ...prev,
          { role: "user", content: displayContent },
          { role: "assistant", content: "" },
        ])
        if (!textOverride) setInput("")

        const res = await fetch("/api/insight/chat", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            input: finalContent,
            visibleInput: displayContent,
            persona: "problem_tutor",
          }),
          signal: controller.signal,
        })

        if (res.status === 429) {
          const data = await res.json()
          setMessages((prev) => prev.slice(0, -2))
          setError(data.error || "Limită zilnică atinsă.")
          return
        }

        if (!res.ok) {
          const data = await res.json()
          setMessages((prev) => prev.slice(0, -2))
          throw new Error(data.error || "Eroare la Insight.")
        }

        const contentType = res.headers.get("content-type")
        if (!contentType?.includes("text/event-stream")) {
          const data = await res.json()
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: data.output || "Nu am primit răspuns." }
            }
            return next
          })
          return
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) throw new Error("Nu s-a putut citi răspunsul.")

        let buffer = ""
        let fullAssistantContent = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "session" && data.sessionId) {
                setSessionId(data.sessionId)
              } else if (data.type === "text" && data.content) {
                fullAssistantContent += data.content
                let displayContent = fullAssistantContent
                const marker = "---SUGGESTIONS---"
                if (fullAssistantContent.includes(marker)) {
                  displayContent = fullAssistantContent.split(marker)[0].trim()
                }
                setMessages((prev) => {
                  const next = [...prev]
                  for (let i = next.length - 1; i >= 0; i--) {
                    if (next[i]?.role === "assistant") {
                      next[i] = { role: "assistant", content: displayContent }
                      break
                    }
                  }
                  return next
                })
              } else if (data.type === "error") {
                throw new Error(data.error || "Eroare la procesarea răspunsului.")
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message.includes("Eroare")) {
                throw parseError
              }
            }
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          const secondLast = prev[prev.length - 2]
          if (
            last?.role === "assistant" &&
            secondLast?.role === "user" &&
            !(last.content || "").trim()
          ) {
            return prev.slice(0, -2)
          }
          return prev
        })
        const errorMsg = e instanceof Error ? e.message : "Eroare la comunicarea cu Insight."
        setError(errorMsg)
        toast({ title: "Eroare", description: errorMsg, variant: "destructive" })
      } finally {
        abortControllerRef.current = null
        setBusy(false)
      }
    },
    [busy, input, messages, problemContextPreamble, problemId, sessionId, toast, user],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void submitMessage()
    }
  }

  return (
    <div
      className={cn(
        "relative fixed right-0 top-14 bottom-0 z-[500] hidden flex-col bg-white lg:flex",
        LP_AI_CHAT_PANEL_WIDTH_CLASS,
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
      aria-hidden={!isOpen}
    >
      <LearningPathAiChatDelimiter />

      <div className="flex min-h-0 flex-1 flex-col overflow-visible">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/streak-icon.png"
              alt=""
              className="h-8 w-8 object-contain"
              width={32}
              height={32}
            />
            <span className="text-sm font-semibold text-[#1a1a1a]">Insight</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-black/[0.05] hover:text-[#111]"
            aria-label="Închide chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className={cn(
            "relative min-h-0 flex-1 overscroll-contain px-4 py-2",
            showEmptyStateDecor ? "overflow-visible" : "overflow-y-auto",
          )}
        >
          {visibleMessages.length === 0 ? (
            <p className="relative z-[1] text-center text-sm text-[#888]">
              Întreabă orice despre exercițiul curent.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-[#f0f0f0] text-[#222]"
                      : "mr-auto bg-[#eef6ff] text-[#1a1a1a]",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {message.content || (busy ? "…" : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              ))}
              {busy && visibleMessages[visibleMessages.length - 1]?.role === "user" ? (
                <div className="mr-auto flex items-center gap-2 rounded-2xl bg-[#eef6ff] px-3.5 py-2.5 text-sm text-[#666]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Insight scrie…
                </div>
              ) : null}
            </div>
          )}
          {error ? <p className="mt-3 text-center text-xs text-red-500">{error}</p> : null}
        </div>

        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2">
          <div className="relative">
            {showEmptyStateDecor ? (
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-full left-0 right-0 z-0 flex translate-y-4 justify-end pr-1"
              >
                <img
                  src={PROBLEMS_BG_AVATAR_SRC}
                  alt=""
                  className="h-auto w-[55%] max-w-[150px] select-none object-contain object-bottom"
                />
              </div>
            ) : null}
            <div className="relative z-[1] flex items-end gap-2 rounded-full border border-[#e8e8e8] bg-[#f5f5f5] px-3 py-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cum te pot ajuta?"
              rows={1}
              disabled={busy}
              className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-[#222] placeholder:text-[#999] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void submitMessage()}
              disabled={busy || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white transition-opacity disabled:opacity-40"
              aria-label="Trimite mesaj"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

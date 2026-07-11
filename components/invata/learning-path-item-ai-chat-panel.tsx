"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowUp, Loader2, Mic, Send, Square, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { LP_AI_CHAT_PANEL_WIDTH_CLASS } from "@/lib/learning-path-ai-chat-layout"
import { PROBLEMS_BG_AVATAR_SRC } from "@/lib/planck-catalog-avatar"
import { InvataAskThinkingDots } from "@/components/invata/invata-ask-thinking"

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
  mobile?: boolean
  isOpen: boolean
  onClose: () => void
  onMobileDisplacementChange?: (displacesContent: boolean) => void
  mobileDefaultHeightRatio?: number
  resetKey: string
  problemId: string
  getContextStatement: () => string
  problemContextPreamble?: string
  initialUserMessage?: string | null
  initialUserMessageDisplay?: string | null
  onInitialMessageSent?: () => void
}

export function LearningPathItemAiChatPanel({
  mobile = false,
  isOpen,
  onClose,
  onMobileDisplacementChange,
  mobileDefaultHeightRatio = 1 / 3,
  resetKey,
  problemId,
  getContextStatement,
  problemContextPreamble = "",
  initialUserMessage,
  initialUserMessageDisplay,
  onInitialMessageSent,
}: LearningPathItemAiChatPanelProps) {
  const { user } = useAuth()
  const { isFree } = useSubscriptionPlan()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([SYSTEM_MESSAGE])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freePromptLimitReached, setFreePromptLimitReached] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initialMessageSentRef = useRef(false)
  const lastInitialMessageRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const getContextStatementRef = useRef(getContextStatement)
  const mobileDragRef = useRef<{ startY: number; startHeight: number } | null>(null)
  const [mobileHeight, setMobileHeight] = useState<number | null>(null)
  const [mobileDragging, setMobileDragging] = useState(false)
  getContextStatementRef.current = getContextStatement

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system" && m.content.trim()),
    [messages],
  )
  const isWaitingForAssistant = Boolean(
    busy &&
      messages[messages.length - 1]?.role === "assistant" &&
      !messages[messages.length - 1]?.content.trim(),
  )
  const showEmptyStateDecor = visibleMessages.length === 0 && !busy && !mobile

  useEffect(() => {
    setMessages([SYSTEM_MESSAGE])
    setSessionId(null)
    setInput("")
    setError(null)
    setFreePromptLimitReached(false)
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

  const getMobileDefaultHeight = useCallback(
    () => Math.round(window.innerHeight * mobileDefaultHeightRatio),
    [mobileDefaultHeightRatio],
  )

  const getMobileMaxHeight = useCallback(
    () => Math.round(window.innerHeight * 0.9),
    [],
  )

  useEffect(() => {
    if (!mobile || !isOpen) {
      if (mobile) onMobileDisplacementChange?.(false)
      return
    }

    const resetHeight = () => setMobileHeight(getMobileDefaultHeight())
    resetHeight()
    onMobileDisplacementChange?.(true)
    window.addEventListener("resize", resetHeight)
    return () => window.removeEventListener("resize", resetHeight)
  }, [getMobileDefaultHeight, isOpen, mobile, onMobileDisplacementChange])

  useEffect(() => {
    if (!mobile || !isOpen || mobileHeight === null) return
    onMobileDisplacementChange?.(mobileHeight <= getMobileDefaultHeight() + 2)
  }, [
    getMobileDefaultHeight,
    isOpen,
    mobile,
    mobileHeight,
    onMobileDisplacementChange,
  ])

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
            source: "learning_path_item",
          }),
          signal: controller.signal,
        })

        if (res.status === 429) {
          const data = await res.json()
          setMessages((prev) => prev.slice(0, -2))
          if (isFree) {
            setFreePromptLimitReached(true)
            setError(null)
          } else {
            setError(data.error || "Limită zilnică atinsă.")
          }
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
    [busy, input, isFree, messages, problemContextPreamble, problemId, sessionId, toast, user],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void submitMessage()
    }
  }

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setBusy(false)
  }, [])

  const handleMobilePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mobile || !isOpen) return
    event.currentTarget.setPointerCapture(event.pointerId)
    mobileDragRef.current = {
      startY: event.clientY,
      startHeight: mobileHeight ?? getMobileDefaultHeight(),
    }
    setMobileDragging(true)
  }

  const handleMobilePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mobileDragRef.current
    if (!mobile || !drag) return
    const nextHeight = Math.min(
      getMobileMaxHeight(),
      Math.max(getMobileDefaultHeight(), drag.startHeight - (event.clientY - drag.startY)),
    )
    setMobileHeight(nextHeight)
  }

  const handleMobilePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mobileDragRef.current
    if (!mobile || !drag) return
    const pulledDown = event.clientY - drag.startY
    mobileDragRef.current = null
    setMobileDragging(false)
    if (pulledDown > 72) {
      onClose()
      return
    }
    setMobileHeight((height) =>
      Math.min(getMobileMaxHeight(), Math.max(getMobileDefaultHeight(), height ?? 0)),
    )
  }

  return (
    <div
      className={cn(
        mobile
          ? "fixed inset-x-0 bottom-0 z-[500] flex flex-col overflow-hidden rounded-t-[28px] border border-[#dedede] bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-[height,transform] duration-300 ease-out lg:hidden"
          : cn(
              "relative fixed right-0 top-14 bottom-0 z-[500] hidden flex-col bg-white lg:flex",
              LP_AI_CHAT_PANEL_WIDTH_CLASS,
              "transition-transform duration-300 ease-out",
            ),
        mobile
          ? isOpen
            ? "translate-y-0"
            : "translate-y-full pointer-events-none"
          : isOpen
            ? "translate-x-0"
            : "translate-x-full",
        mobileDragging && "transition-none",
      )}
      style={
        mobile
          ? {
              height:
                mobileHeight === null
                  ? `${mobileDefaultHeightRatio * 100}dvh`
                  : `${mobileHeight}px`,
            }
          : undefined
      }
      aria-hidden={!isOpen}
    >
      {!mobile ? <LearningPathAiChatDelimiter /> : null}
      {freePromptLimitReached ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(88%,34rem)] bg-[radial-gradient(ellipse_120%_95%_at_50%_100%,rgba(205,131,219,0.72)_0%,rgba(143,145,241,0.52)_28%,rgba(242,185,61,0.2)_52%,transparent_92%)] blur-[32px]"
        />
      ) : null}

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-visible">
        {mobile ? (
          <div
            className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            onPointerDown={handleMobilePointerDown}
            onPointerMove={handleMobilePointerMove}
            onPointerUp={handleMobilePointerUp}
            onPointerCancel={handleMobilePointerUp}
            role="presentation"
          >
            <div className="h-1 w-12 rounded-full bg-[#bdbdbd]" />
          </div>
        ) : (
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
        )}

        <div
          ref={scrollRef}
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overscroll-contain px-4 py-2",
            showEmptyStateDecor ? "overflow-visible" : "overflow-y-auto",
          )}
        >
          {visibleMessages.length === 0 ? (
            isWaitingForAssistant ? (
              <div className="relative z-[1] flex py-2">
                {mobile ? <InvataAskThinkingDots /> : <Loader2 className="h-4 w-4 animate-spin text-[#666]" />}
              </div>
            ) : (
              <p className="relative z-[1] text-center text-sm text-[#888]">
                Întreabă orice despre exercițiul curent.
              </p>
            )
          ) : (
            <div className="flex flex-col gap-3">
              {visibleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    message.role === "user"
                      ? "ml-auto max-w-[92%] rounded-2xl bg-[#f0f0f0] px-3.5 py-2.5 text-sm leading-relaxed text-[#222]"
                      : "w-full py-1 text-[16px] leading-7 text-[#1a1a1a]",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-base max-w-none text-[16px] leading-7 prose-p:my-2 prose-headings:my-3">
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
              {isWaitingForAssistant ? (
                <div className="mr-auto flex items-center gap-2 py-2 text-base text-[#666]">
                  {mobile ? <InvataAskThinkingDots /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  {!mobile ? "Insight scrie…" : null}
                </div>
              ) : null}
            </div>
          )}
          {freePromptLimitReached ? (
            <div className="relative z-[1] mt-auto px-1 pb-3 pt-5">
              <p className="text-center text-base font-bold text-black">
                Ai rămas fără mesaje disponibile
              </p>
              <a
                href="/pricing"
                className="dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#9a5aa8] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#9a5aa8]"
                style={
                  {
                    "--start-glow-tint": "rgba(248, 220, 228, 0.88)",
                    backgroundImage: "linear-gradient(to right, #8f91f1, #cd83db, #f2b93d)",
                  } as React.CSSProperties
                }
              >
                Încearcă Premium
              </a>
            </div>
          ) : null}
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
            <div
              className={cn(
                "relative z-[1] flex gap-2 rounded-full border border-[#e8e8e8] bg-[#f5f5f5] px-3",
                mobile ? "items-center py-1.5" : "items-end py-2",
              )}
            >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cum te pot ajuta?"
              rows={1}
              disabled={busy || freePromptLimitReached}
              className={cn(
                "max-h-28 flex-1 resize-none bg-transparent text-sm text-[#222] placeholder:text-[#999] focus:outline-none",
                mobile ? "min-h-5 leading-5" : "min-h-[24px]",
              )}
            />
            <button
              type="button"
              onClick={() => {
                if (busy) {
                  stopGeneration()
                  return
                }
                void submitMessage()
              }}
              disabled={freePromptLimitReached || (!busy && !input.trim())}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40",
                mobile
                  ? busy
                    ? "bg-[#e5e5e5] text-[#565656]"
                    : input.trim()
                      ? "bg-[#58b9b3]"
                      : "bg-transparent text-[#b6b6b6]"
                  : "bg-[#7c3aed]",
              )}
              aria-label={busy ? "Oprește generarea" : "Trimite mesaj"}
            >
              {busy ? (
                mobile ? <Square className="h-3.5 w-3.5 fill-current" /> : <Loader2 className="h-4 w-4 animate-spin" />
              ) : mobile ? (
                input.trim() ? <ArrowUp className="h-4 w-4" strokeWidth={2.5} /> : <Mic className="h-4 w-4" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

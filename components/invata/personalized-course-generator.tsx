"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CornerDownRight, Loader2, LogIn, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { pushRecentPrompt, readRecentPrompts } from "@/lib/personalized-courses/recent-prompts"
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from "@/lib/personalized-courses/validate-prompt"
import {
  getCachedAskResponse,
  setCachedAskResponse,
} from "@/lib/invata/ask-cache"
import { readShownRecommendationKeys, trackShownRecommendations } from "@/lib/invata/shown-recommendations"
import type { PlanckResourceReference } from "@/lib/insight/agent/types"
import type { InvataAskMessage, InvataAskStreamEvent } from "@/lib/invata/ask-types"
import { InvataAskConversation } from "@/components/invata/invata-ask-conversation"
import { usePersonalizedCourseGeneration } from "@/components/invata/personalized-course-generation-context"
import { INVATA_ASK_CARD_Z } from "@/components/invata/invata-hub-top-glow"

interface PersonalizedCourseGeneratorProps {
  isAuthenticated: boolean
  canGeneratePersonalizedPath?: boolean
  personalizedPathBlockedReason?: string | null
  loginHref?: string
  className?: string
}

type CardPhase = "open" | "thinking" | "streaming" | "conversation" | "generating"

const INITIAL_PLACEHOLDER = "Ce vrei să înveți?"
const FOLLOW_UP_PLACEHOLDER = "Răspunde aici…"
const PILL_BORDER_CLASS = "border-[1.5px] border-[#d8d8d8]"
const PILL_HEIGHT_CLASS = "h-14"

const ASK_CARD_BASE_CLASS =
  "flex max-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-2xl border border-[#e6e6e6] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"

const ASK_CARD_DROPDOWN_CLASS = cn(
  ASK_CARD_BASE_CLASS,
  "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full max-sm:shadow-[0_12px_40px_rgba(0,0,0,0.14)]",
)

function SearchPill({
  prompt,
  onPromptChange,
  onSubmit,
  isDisabled,
  isLoading,
  inputRef,
  placeholder,
  readOnly = false,
  className,
}: {
  prompt: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  isDisabled: boolean
  isLoading: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  placeholder?: string
  readOnly?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-full bg-white px-4 transition-colors focus-within:border-[#bdbdbd]",
        PILL_HEIGHT_CLASS,
        PILL_BORDER_CLASS,
        readOnly && "opacity-95",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-[#9a9a9a]" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !readOnly) {
            event.preventDefault()
            onSubmit()
          }
        }}
        placeholder={placeholder ?? INITIAL_PLACEHOLDER}
        maxLength={MAX_PROMPT_LENGTH}
        disabled={isDisabled || readOnly}
        readOnly={readOnly}
        aria-label="Obiectiv de învățare"
        className="min-w-0 flex-1 bg-transparent text-sm text-[#111111] placeholder:text-[#9a9a9a] focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={isDisabled || readOnly}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] px-3.5 py-1.5 text-sm font-medium text-[#5f5f5f] transition-colors hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Întreabă"}
      </button>
    </div>
  )
}

export function PersonalizedCourseGenerator({
  isAuthenticated,
  canGeneratePersonalizedPath = true,
  personalizedPathBlockedReason = null,
  loginHref = "/login?next=/invata",
  className,
}: PersonalizedCourseGeneratorProps) {
  const router = useRouter()
  const { startActiveGeneration } = usePersonalizedCourseGeneration()
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [prompt, setPrompt] = useState("")
  const [lockedPrompt, setLockedPrompt] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState<CardPhase>("open")
  const [recentPrompts, setRecentPrompts] = useState<string[]>([])
  const [messages, setMessages] = useState<InvataAskMessage[]>([])
  const [resources, setResources] = useState<{
    primary: PlanckResourceReference | null
    secondary: PlanckResourceReference | null
  }>({ primary: null, secondary: null })
  const [topicPrompt, setTopicPrompt] = useState("")
  const [topicLabel, setTopicLabel] = useState("")
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const cardScrollRef = useRef<HTMLDivElement>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)")
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches)
    syncViewport()
    mediaQuery.addEventListener("change", syncViewport)
    return () => mediaQuery.removeEventListener("change", syncViewport)
  }, [])

  useEffect(() => {
    setRecentPrompts(readRecentPrompts())
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const resetConversation = useCallback(() => {
    setMessages([])
    setResources({ primary: null, secondary: null })
    setTopicPrompt("")
    setTopicLabel("")
    setLockedPrompt(null)
    setStreamingMessage(null)
    setGenerateError(null)
    setPhase("open")
  }, [])

  const closeCard = useCallback(() => {
    setIsOpen(false)
    resetConversation()
    setPrompt("")
    setStatus("idle")
    setErrorMessage(null)
  }, [resetConversation])

  const openCard = useCallback(() => {
    setIsOpen(true)
    setPhase((current) => (current === "generating" ? current : messages.length ? "conversation" : "open"))
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [messages.length])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCard()
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (cardRef.current?.contains(target)) return
      closeCard()
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onMouseDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [isOpen, closeCard])

  const handlePromptChange = useCallback(
    (value: string) => {
      setPrompt(value)
      if (status === "error") {
        setStatus("idle")
        setErrorMessage(null)
      }
    },
    [status],
  )

  const validateBeforeSubmit = useCallback(
    (trimmed: string): string | null => {
      if (!isAuthenticated) {
        return "Trebuie să fii autentificat pentru a folosi advisorul Planck."
      }
      if (trimmed.length < MIN_PROMPT_LENGTH) {
        return "Scrie ce vrei să înveți în cel puțin câteva cuvinte."
      }
      if (trimmed.length > MAX_PROMPT_LENGTH) {
        return `Promptul poate avea maximum ${MAX_PROMPT_LENGTH} de caractere.`
      }
      return null
    },
    [isAuthenticated],
  )

  const handleAskSubmit = useCallback(
    async (event?: React.FormEvent, overridePrompt?: string) => {
      event?.preventDefault()
      const trimmed = (overridePrompt ?? prompt).trim()
      const validationError = validateBeforeSubmit(trimmed)

      if (validationError) {
        setStatus("error")
        setErrorMessage(validationError)
        if (!isOpen) openCard()
        return
      }

      if (!isOpen) openCard()

      setStatus("loading")
      setErrorMessage(null)
      setGenerateError(null)
      setLockedPrompt(trimmed)
      setStreamingMessage(null)
      setPhase("thinking")

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const history = messages
      const excludeKeys = readShownRecommendationKeys()
      const cachedDone = getCachedAskResponse<
        Extract<InvataAskStreamEvent, { type: "done" }>
      >(trimmed, history.length)

      if (cachedDone) {
        const assistantMessage =
          cachedDone.message.trim() ||
          "Iată câteva resurse care te pot ajuta."
        const cachedMessages: InvataAskMessage[] = [
          ...history,
          { role: "user", content: trimmed },
          { role: "assistant", content: assistantMessage },
        ]
        if (!topicPrompt) setTopicPrompt(trimmed)
        const cachedLabel =
          cachedDone.intent?.topic?.trim() || trimmed.slice(0, 60) || "acest subiect"
        setTopicLabel(cachedLabel)
        const cachedPrimary = cachedDone.primary ?? null
        const cachedSecondary = cachedDone.secondary ?? null
        setResources({ primary: cachedPrimary, secondary: cachedSecondary })
        trackShownRecommendations(
          [cachedPrimary, cachedSecondary].filter(Boolean) as PlanckResourceReference[],
        )
        setMessages(cachedMessages)
        setRecentPrompts(pushRecentPrompt(trimmed))
        setPrompt("")
        setLockedPrompt(null)
        setStreamingMessage(null)
        setPhase("conversation")
        setStatus("idle")
        return
      }

      try {
        const response = await fetch("/api/invata/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, messages: history, excludeKeys }),
          credentials: "same-origin",
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          let errorText = "Nu am putut răspunde acum. Încearcă din nou."
          try {
            const payload = (await response.json()) as { error?: string }
            if (payload.error?.trim()) errorText = payload.error.trim()
          } catch {
            // ignore
          }
          if (response.status === 401) {
            errorText = "Trebuie să fii autentificat pentru a folosi advisorul Planck."
          }
          setPhase(messages.length ? "conversation" : "open")
          setLockedPrompt(null)
          setStreamingMessage(null)
          setStatus("error")
          setErrorMessage(errorText)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let streamedText = ""
        let doneEvent: Extract<InvataAskStreamEvent, { type: "done" }> | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.trim()) continue
            const event = JSON.parse(line) as InvataAskStreamEvent

            if (event.type === "error") {
              throw new Error(event.error)
            }

            if (event.type === "delta") {
              if (!streamedText) {
                setPhase("streaming")
              }
              streamedText += event.content
              setStreamingMessage(streamedText)
            }

            if (event.type === "done") {
              doneEvent = event
            }
          }
        }

        if (!doneEvent) {
          throw new Error("Răspuns incomplet de la advisor.")
        }

        setCachedAskResponse(trimmed, history.length, doneEvent)

        const assistantMessage = doneEvent.message.trim() || streamedText.trim() || "Iată câteva resurse care te pot ajuta."
        const updatedMessages: InvataAskMessage[] = [
          ...history,
          { role: "user", content: trimmed },
          { role: "assistant", content: assistantMessage },
        ]

        if (!topicPrompt) {
          setTopicPrompt(trimmed)
        }

        const label =
          doneEvent.intent?.topic?.trim() ||
          trimmed.slice(0, 60) ||
          "acest subiect"
        setTopicLabel(label)
        const nextPrimary = doneEvent.primary ?? null
        const nextSecondary = doneEvent.secondary ?? null
        setResources({
          primary: nextPrimary,
          secondary: nextSecondary,
        })
        trackShownRecommendations([nextPrimary, nextSecondary].filter(Boolean) as PlanckResourceReference[])
        setMessages(updatedMessages)
        setRecentPrompts(pushRecentPrompt(trimmed))
        setPrompt("")
        setLockedPrompt(null)
        setStreamingMessage(null)
        setPhase("conversation")
        setStatus("idle")
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        setPhase(messages.length ? "conversation" : "open")
        setLockedPrompt(null)
        setStreamingMessage(null)
        setStatus("error")
        setErrorMessage(
          error instanceof Error && error.message
            ? error.message
            : "Conexiunea a eșuat. Verifică internetul și încearcă din nou.",
        )
      }
    },
    [prompt, validateBeforeSubmit, isOpen, openCard, messages, topicPrompt],
  )

  const handleGeneratePath = useCallback(async () => {
    const generationPrompt = topicPrompt.trim() || prompt.trim()
    const validationError = validateBeforeSubmit(generationPrompt)

    if (validationError) {
      setGenerateError(validationError)
      return
    }

    if (!canGeneratePersonalizedPath) {
      setGenerateError(
        personalizedPathBlockedReason ??
          "Planul gratuit include un singur traseu personalizat. Treci la Plus pentru a genera mai multe.",
      )
      return
    }

    setPhase("generating")
    setGenerateError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch("/api/personalized-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generationPrompt }),
        credentials: "same-origin",
        signal: controller.signal,
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        chapterId?: string
        chapterSlug?: string
        title?: string
        description?: string | null
      }

      if (!response.ok) {
        setPhase("conversation")
        setGenerateError(
          data?.error?.trim() ||
            (response.status === 403
              ? "Planul gratuit include un singur traseu personalizat. Treci la Plus pentru a genera mai multe."
              : "Nu am putut genera traseul personalizat acum. Încearcă din nou."),
        )
        return
      }

      if (data.chapterId) {
        const label =
          topicLabel.trim() ||
          generationPrompt.slice(0, 60) ||
          data.title?.trim() ||
          "acest subiect"

        startActiveGeneration({
          chapterId: data.chapterId,
          chapterSlug: data.chapterSlug ?? "",
          title: data.title ?? (generationPrompt.slice(0, 60) || "Curs personalizat"),
          topicLabel: label,
        })
      }

      closeCard()
      router.refresh()
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return
      setPhase("conversation")
      setGenerateError("Conexiunea a eșuat. Verifică internetul și încearcă din nou.")
    }
  }, [
    topicPrompt,
    prompt,
    validateBeforeSubmit,
    canGeneratePersonalizedPath,
    personalizedPathBlockedReason,
    topicLabel,
    startActiveGeneration,
    closeCard,
    router,
  ])

  const isLoading = status === "loading" || phase === "thinking" || phase === "streaming"
  const isInputDisabled = isLoading || phase === "generating"
  const showConversation =
    phase === "thinking" || phase === "streaming" || phase === "conversation" || phase === "generating"
  const inputPlaceholder = messages.length > 0 ? FOLLOW_UP_PLACEHOLDER : INITIAL_PLACEHOLDER
  const barPrompt = phase === "thinking" || phase === "streaming" ? (lockedPrompt ?? "") : prompt
  const barReadOnly = phase === "thinking" || phase === "streaming"
  const displayPrompt = prompt.trim() || INITIAL_PLACEHOLDER

  useEffect(() => {
    // Auto-scroll only while the model is thinking/streaming so the latest tokens stay
    // visible. Once the full response + recommendations are rendered, leave the scroll
    // position alone so the user can read from the top.
    if (!isOpen) return
    if (phase !== "thinking" && phase !== "streaming") return
    const node = cardScrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [isOpen, phase, streamingMessage])

  const askCard = isOpen ? (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Advisor Planck"
      className={ASK_CARD_DROPDOWN_CLASS}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#f0f0f0] px-4 pb-3 pt-4">
        <h2 className="text-base font-bold text-[#111111]">Ce vrei să înveți?</h2>
        <button
          type="button"
          onClick={closeCard}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#707070] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]"
          aria-label="Închide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={cardScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {showConversation ? (
          <InvataAskConversation
            messages={messages}
            primary={resources.primary}
            secondary={resources.secondary}
            topicLabel={topicLabel || topicPrompt || "acest subiect"}
            isThinking={phase === "thinking"}
            thinkingUserMessage={lockedPrompt}
            streamingMessage={streamingMessage}
            isStreaming={phase === "streaming"}
            showRecommendations={phase === "conversation" || phase === "generating"}
            canGeneratePersonalizedPath={canGeneratePersonalizedPath}
            personalizedPathBlockedReason={personalizedPathBlockedReason}
            isGeneratingPath={phase === "generating"}
            generateError={generateError}
            onGeneratePath={() => {
              void handleGeneratePath()
            }}
          />
        ) : null}

        {status === "error" && errorMessage ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#e6e6e6] bg-[#fafafa] px-3 py-2.5 text-sm text-[#1f1f1f]">
            {isAuthenticated ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9a9a9a]" />
            ) : (
              <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-[#9a9a9a]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{errorMessage}</p>
              {!isAuthenticated ? (
                <p className="mt-1 text-[#707070]">
                  <Link
                    href={loginHref}
                    className="font-semibold underline underline-offset-2 hover:text-[#1f1f1f]"
                  >
                    Autentifică-te
                  </Link>{" "}
                  sau{" "}
                  <Link
                    href="/register?next=/invata"
                    className="font-semibold underline underline-offset-2 hover:text-[#1f1f1f]"
                  >
                    creează un cont
                  </Link>{" "}
                  ca să folosești advisorul Planck.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {!showConversation && recentPrompts.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {recentPrompts.map((recentPrompt) => (
              <li key={recentPrompt}>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(recentPrompt)
                    void handleAskSubmit(undefined, recentPrompt)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm text-[#707070] transition-colors hover:bg-[#f7f7f7] hover:text-[#111111]"
                >
                  <CornerDownRight className="h-4 w-4 shrink-0 text-[#9a9a9a]" aria-hidden="true" />
                  <span className="truncate">{recentPrompt}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  ) : null

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        PILL_HEIGHT_CLASS,
        className,
        isOpen && isMobileViewport && "max-sm:isolate",
        isOpen && !isMobileViewport && "z-50",
      )}
      style={isOpen && isMobileViewport ? { zIndex: INVATA_ASK_CARD_Z } : undefined}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={openCard}
          aria-expanded={false}
          aria-haspopup="dialog"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-full bg-white px-4 text-left transition-colors hover:border-[#bdbdbd]",
            PILL_HEIGHT_CLASS,
            PILL_BORDER_CLASS,
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-[#9a9a9a]" aria-hidden="true" />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              prompt.trim() ? "text-[#111111]" : "text-[#9a9a9a]",
            )}
          >
            {isLoading ? "Mă gândesc…" : displayPrompt}
          </span>
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] px-3.5 py-1.5 text-sm font-medium text-[#5f5f5f]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Întreabă"}
          </span>
        </button>
      ) : (
        <form
          onSubmit={(event) => {
            void handleAskSubmit(event)
          }}
        >
          <SearchPill
            prompt={barPrompt}
            onPromptChange={handlePromptChange}
            onSubmit={() => {
              void handleAskSubmit()
            }}
            isDisabled={isInputDisabled}
            isLoading={isLoading}
            inputRef={inputRef}
            placeholder={inputPlaceholder}
            readOnly={barReadOnly}
          />
        </form>
      )}

      {askCard}
    </div>
  )
}

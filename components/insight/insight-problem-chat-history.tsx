"use client"

import { useCallback, useEffect, useState } from "react"
import { History, Loader2, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/dashboard-data"
import { supabase } from "@/lib/supabaseClient"

export type ProblemChatHistorySession = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  last_message_at: string | null
  problem_id?: string | null
  lesson_id?: string | null
}

type InsightProblemChatHistoryProps = {
  problemId?: string
  lessonId?: string
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  /** Refresh token — bump when a new session is created so the list reloads. */
  refreshKey?: string | number | null
  lightTheme?: boolean
  className?: string
  emptyLabel?: string
}

export function InsightProblemChatHistory({
  problemId,
  lessonId,
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshKey = null,
  lightTheme = false,
  className,
  emptyLabel,
}: InsightProblemChatHistoryProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<ProblemChatHistorySession[]>([])
  const [error, setError] = useState<string | null>(null)

  const scopeKey = problemId
    ? `problemId=${encodeURIComponent(problemId)}`
    : lessonId
      ? `lessonId=${encodeURIComponent(lessonId)}`
      : null

  const loadSessions = useCallback(async () => {
    if (!scopeKey) {
      setSessions([])
      setError("Context de chat lipsă.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      if (!accessToken) {
        setSessions([])
        setError("Necesită autentificare.")
        return
      }

      const res = await fetch(`/api/insight/sessions?${scopeKey}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        throw new Error("Nu am putut încărca istoricul.")
      }

      const json = (await res.json()) as { sessions?: ProblemChatHistorySession[] }
      setSessions(Array.isArray(json.sessions) ? json.sessions : [])
    } catch (err) {
      console.error("Failed to load chat history:", err)
      setError("Nu am putut încărca istoricul.")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [scopeKey])

  useEffect(() => {
    if (!open) return
    void loadSessions()
  }, [open, loadSessions, refreshKey])

  const handleNewChat = () => {
    onNewChat()
    setOpen(false)
  }

  const handleSelect = (sessionId: string) => {
    if (sessionId === currentSessionId) {
      setOpen(false)
      return
    }
    onSelectSession(sessionId)
    setOpen(false)
  }

  const emptyText =
    emptyLabel ||
    (lessonId
      ? "Niciun chat salvat pe această lecție."
      : "Niciun chat salvat pe această problemă.")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Istoric chat"
          title="Istoric chat"
          className={cn(
            "shrink-0 rounded-md p-2 transition-colors",
            lightTheme
              ? "text-[#4b5563] hover:bg-[#e5e7eb] hover:text-[#111827]"
              : "text-white/60 hover:bg-white/10 hover:text-white",
            className,
          )}
        >
          <History className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "z-[600] w-72 p-0",
          lightTheme
            ? "border-[#0b0d10]/10 bg-white text-[#0b0d10]"
            : "border-white/10 bg-[#181818] text-white",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b px-3 py-2.5",
            lightTheme ? "border-[#0b0d10]/10" : "border-white/10",
          )}
        >
          <span className={cn("text-sm font-medium", lightTheme ? "text-[#111827]" : "text-white")}>
            Istoric
          </span>
          <button
            type="button"
            onClick={handleNewChat}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              lightTheme
                ? "bg-[#f3f4f6] text-[#111827] hover:bg-[#e5e7eb]"
                : "bg-white/10 text-white hover:bg-white/15",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Chat nou
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {loading ? (
            <div
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-8 text-sm",
                lightTheme ? "text-[#6b7280]" : "text-white/50",
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Se încarcă...
            </div>
          ) : error ? (
            <p className={cn("px-3 py-6 text-center text-sm", lightTheme ? "text-red-600" : "text-red-400")}>
              {error}
            </p>
          ) : sessions.length === 0 ? (
            <p
              className={cn(
                "px-3 py-6 text-center text-sm",
                lightTheme ? "text-[#6b7280]" : "text-white/50",
              )}
            >
              {emptyText}
            </p>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId
              const when = session.last_message_at || session.updated_at || session.created_at
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => handleSelect(session.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors",
                    lightTheme
                      ? isActive
                        ? "bg-[#f3f4f6]"
                        : "hover:bg-[#f9fafb]"
                      : isActive
                        ? "bg-white/10"
                        : "hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "line-clamp-2 w-full text-sm font-medium",
                      lightTheme ? "text-[#111827]" : "text-white",
                    )}
                  >
                    {session.title?.trim() || "Chat nou"}
                  </span>
                  <span
                    className={cn("text-xs", lightTheme ? "text-[#6b7280]" : "text-white/45")}
                  >
                    {formatRelativeTime(when)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

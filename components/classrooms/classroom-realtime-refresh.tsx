"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ClassroomRealtimeRefreshProps {
  classroomId?: string | null
  assignmentId?: string | null
  sessionId?: string | null
}

export function ClassroomRealtimeRefresh({
  classroomId,
  assignmentId,
  sessionId,
}: ClassroomRealtimeRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    if (!classroomId && !assignmentId && !sessionId) return
    const supabase = createClient()
    const channel = supabase.channel(
      `classroom-live-${classroomId ?? "none"}-${assignmentId ?? "none"}-${sessionId ?? "none"}`,
    )

    const refresh = () => router.refresh()

    if (assignmentId) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `assignment_id=eq.${assignmentId}` },
        refresh,
      )
    }
    if (classroomId) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classroom_sessions", filter: `classroom_id=eq.${classroomId}` },
        refresh,
      )
    }
    if (sessionId) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "classroom_session_attendance",
          filter: `session_id=eq.${sessionId}`,
        },
        refresh,
      )
    }

    channel.subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [assignmentId, classroomId, router, sessionId])

  return null
}

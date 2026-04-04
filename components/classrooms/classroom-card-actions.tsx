"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { MoreVertical, LogOut, Users } from "lucide-react"
import { leaveClassroomAction } from "@/app/classrooms/actions"
import { cn } from "@/lib/utils"

interface ClassroomCardActionsProps {
  classroomId: string
  isTeacher: boolean
}

export function ClassroomCardActions({ classroomId, isTeacher }: ClassroomCardActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [isMenuOpen])

  return (
    <div ref={menuRef} className="relative flex items-center gap-1.5">
      <Link
        href={`/classrooms/${classroomId}/students`}
        aria-label="Open classroom students"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#4f4f4f] transition hover:bg-[#f1f3f4] hover:text-[#1f1f1f]"
      >
        <Users className="h-[18px] w-[18px]" />
      </Link>

      <button
        type="button"
        aria-label="Open classroom actions"
        onClick={() => setIsMenuOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#4f4f4f] transition hover:bg-[#f1f3f4] hover:text-[#1f1f1f]"
      >
        <MoreVertical className="h-[18px] w-[18px]" />
      </button>

      <div
        className={cn(
          "absolute bottom-10 right-0 z-20 min-w-[180px] translate-x-[calc(100%+8px)] rounded-xl border border-[#dadce0] bg-white p-2 shadow-lg transition",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <form action={leaveClassroomAction}>
          <input type="hidden" name="classroom_id" value={classroomId} />
          <button
            type="submit"
            disabled={isTeacher}
            title={isTeacher ? "The teacher cannot leave this classroom." : "Leave this classroom"}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
              isTeacher
                ? "cursor-not-allowed text-[#9aa0a6]"
                : "text-[#d93025] hover:bg-[#fce8e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28b82]"
            )}
          >
            <LogOut className="h-4 w-4" />
            Leave classroom
          </button>
        </form>
      </div>
    </div>
  )
}

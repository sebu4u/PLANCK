"use client"

import Image from "next/image"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  TrendingUp,
  Trophy,
  User,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { formatGrade } from "@/lib/parent/grade-estimate"
import { getRankIconPath } from "@/lib/rank-icon"
import type { TeacherStudentProfileSnapshot } from "@/lib/teacher/server"
import { cn } from "@/lib/utils"

interface ClassroomStudentProfileDialogProps {
  profile: TeacherStudentProfileSnapshot | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Niciodată"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min"
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

const STAT_ITEMS = [
  { key: "estimated_grade", label: "Notă estimată", icon: GraduationCap },
  { key: "elo", label: "ELO", icon: TrendingUp },
  { key: "rank", label: "Rank", icon: Trophy },
  { key: "streak", label: "Streak curent", icon: Flame },
  { key: "problems", label: "Probleme rezolvate", icon: CheckCircle2 },
  { key: "total_time", label: "Timp petrecut", icon: Clock },
  { key: "last_activity", label: "Ultima activitate", icon: Calendar },
] as const

export function ClassroomStudentProfileDialog({
  profile,
  open,
  onOpenChange,
}: ClassroomStudentProfileDialogProps) {
  if (!profile) return null

  const initial = (profile.display_name || "U").trim().charAt(0).toUpperCase()
  const rankIconSrc = getRankIconPath(profile.stats.rank)

  const values: Record<(typeof STAT_ITEMS)[number]["key"], string> = {
    estimated_grade: formatGrade(profile.estimated_grade),
    elo: String(profile.stats.elo),
    rank: profile.stats.rank,
    streak: `${profile.stats.current_streak} zile`,
    problems: String(profile.stats.problems_solved_total),
    total_time: formatDuration(profile.stats.total_time_minutes),
    last_activity: formatDate(profile.stats.last_activity_date),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        overlayClassName="z-[300] bg-black/35 backdrop-blur-[2px]"
        className={cn(
          "fixed left-1/2 top-1/2 z-[300] flex w-[min(94vw,28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-[28px] border border-[#dbe5f0] bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.24)]",
        )}
      >
        <div className="relative border-b border-[#e8eaed] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 pb-4 pt-12">
          <DialogTitle className="sr-only">Profil elev</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-full p-2 text-[#5f6368] transition-colors hover:bg-[#eef1f6] hover:text-[#111827]"
            aria-label="Închide"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>

          <div className="flex w-full flex-col items-center text-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#e5e7eb] bg-[#f3f4f6]">
              {profile.user_icon ? (
                <img
                  src={profile.user_icon}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#4b5563]">
                  {initial}
                </span>
              )}
            </div>

            <p className="mt-3 w-full text-lg font-semibold text-[#111827]">{profile.display_name}</p>

            {profile.username ? (
              <p className="mt-0.5 flex w-full items-center justify-center gap-1 text-sm text-[#6b7280]">
                <User className="h-3.5 w-3.5 shrink-0" aria-hidden />@{profile.username}
              </p>
            ) : null}

            <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4338ca]">
                {profile.classroom_name}
              </span>
              {profile.school_grade ? (
                <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-[#374151]">
                  Clasa {profile.school_grade}
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex w-full items-center justify-center gap-2">
              <Image
                src={rankIconSrc}
                alt={profile.stats.rank}
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="text-sm font-medium text-[#6b7280]">{profile.stats.rank}</span>
            </div>
          </div>
        </div>

        <div className="max-h-[min(50vh,24rem)] overflow-y-auto p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
            Statistici
          </h3>
          <div className="mt-3 space-y-2">
            {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3",
                  key === "estimated_grade"
                    ? "border-[#ddd6fe] bg-[#f5f3ff]"
                    : "border-[#eceff3] bg-[#fafafa]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-full p-2",
                      key === "estimated_grade"
                        ? "bg-[#ede9fe] text-[#7c3aed]"
                        : "bg-[#f3f3f3] text-[#9e9e9e]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-[#6b7280]">{label}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    key === "estimated_grade" ? "text-[#6d28d9]" : "text-[#111827]",
                  )}
                >
                  {values[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Users,
  Video,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import {
  formatWorkshopDateTime,
  isWorkshopPast,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopDetail,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

export function WorkshopDetailPanel({
  workshop: initial,
  isLoggedIn,
  onBalanceChange,
  onUnlocked,
  showBack = true,
  compact = false,
}: {
  workshop: WorkshopDetail
  isLoggedIn: boolean
  onBalanceChange?: (next: { balance: number; carryoverBalance: number }) => void
  onUnlocked?: (workshop: WorkshopDetail) => void
  showBack?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [workshop, setWorkshop] = useState(initial)
  const [unlocking, setUnlocking] = useState(false)

  const past = isWorkshopPast(workshop.starts_at, workshop.duration_minutes)
  const full = workshop.seats_remaining === 0 && !workshop.unlocked
  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]

  const handleUnlock = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/pregatire/${workshop.id}`)}`)
      return
    }
    if (
      !window.confirm(
        `Deblochezi „${workshop.title}” pentru ${workshop.energy_cost} energie? Accesul rămâne permanent.`,
      )
    ) {
      return
    }

    setUnlocking(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        router.push(`/login?next=${encodeURIComponent(`/pregatire/${workshop.id}`)}`)
        return
      }

      const response = await fetch(`/api/pregatire/${workshop.id}/unlock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json()
      if (!response.ok) {
        toast({
          title: "Nu am putut debloca",
          description: payload.error ?? "Încearcă din nou.",
          variant: "destructive",
        })
        return
      }

      const next: WorkshopDetail = {
        ...workshop,
        unlocked: true,
        meet_url: payload.meet_url,
        recording_url: payload.recording_url,
        unlock_count: workshop.unlock_count + (payload.already_unlocked ? 0 : 1),
        seats_remaining:
          workshop.max_seats == null
            ? null
            : Math.max(0, (workshop.seats_remaining ?? workshop.max_seats) - (payload.already_unlocked ? 0 : 1)),
      }
      setWorkshop(next)
      onUnlocked?.(next)
      if (typeof payload.balance === "number") {
        onBalanceChange?.({
          balance: payload.balance,
          carryoverBalance: typeof payload.carryoverBalance === "number" ? payload.carryoverBalance : 0,
        })
      }
      toast({
        title: payload.already_unlocked ? "Deja deblocat" : "Pregătire deblocată",
        description: past
          ? "Poți accesa înregistrarea."
          : "Link-ul Google Meet este disponibil.",
      })
    } catch {
      toast({
        title: "Eroare",
        description: "Nu am putut debloca pregătirea.",
        variant: "destructive",
      })
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div className={cn(!compact && "mx-auto max-w-2xl")}>
      {showBack ? (
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-[#6b7280]">
          <Link href="/pregatire">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Înapoi la pregătiri
          </Link>
        </Button>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: color }}
            >
              {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
            </span>
            {workshop.unlocked ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Deblocat
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
            {workshop.title}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">{formatWorkshopDateTime(workshop.starts_at)}</p>

          <div className="mt-5 flex items-center gap-3">
            {workshop.teacher?.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={workshop.teacher.icon_url}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6] text-lg font-semibold text-[#374151]">
                {(workshop.teacher?.name ?? "?").slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-medium text-[#111827]">{workshop.teacher?.name ?? "Profesor"}</p>
              {workshop.teacher?.description ? (
                <p className="text-sm text-[#6b7280] line-clamp-2">{workshop.teacher.description}</p>
              ) : null}
            </div>
          </div>

          {workshop.description ? (
            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-[#374151]">
              {workshop.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-[#6b7280]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {workshop.duration_minutes} minute
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
              {workshop.energy_cost} energie
            </span>
            {workshop.max_seats != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {workshop.seats_remaining ?? 0}/{workshop.max_seats} locuri
              </span>
            ) : null}
          </div>

          <div className="mt-8 space-y-3">
            {!workshop.unlocked ? (
              <Button
                type="button"
                size="lg"
                className="w-full bg-[#111827] text-white hover:bg-[#1f2937]"
                disabled={unlocking || full}
                onClick={() => void handleUnlock()}
              >
                {unlocking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4 fill-amber-300 text-amber-300" />
                )}
                {full
                  ? "Locuri epuizate"
                  : isLoggedIn
                    ? `Deblochează · ${workshop.energy_cost} energie`
                    : "Autentifică-te pentru a debloca"}
              </Button>
            ) : null}

            {workshop.unlocked && !past && workshop.meet_url ? (
              <Button asChild size="lg" className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]">
                <a href={workshop.meet_url} target="_blank" rel="noopener noreferrer">
                  Intră pe Google Meet
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}

            {workshop.unlocked && past && workshop.recording_url ? (
              <Button asChild size="lg" className="w-full bg-sky-600 hover:bg-sky-700">
                <a href={workshop.recording_url} target="_blank" rel="noopener noreferrer">
                  <Video className="mr-2 h-4 w-4" />
                  Vezi înregistrarea
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}

            {workshop.unlocked && past && !workshop.recording_url ? (
              <p className="rounded-xl bg-[#f9fafb] px-4 py-3 text-sm text-[#6b7280]">
                Pregătirea s-a încheiat. Înregistrarea va apărea aici când este disponibilă.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

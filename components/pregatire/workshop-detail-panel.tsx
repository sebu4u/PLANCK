"use client"

import { useEffect, useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import {
  formatWorkshopDateTime,
  formatWorkshopMeetWait,
  isWorkshopMeetVisible,
  isWorkshopPast,
} from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopDetail,
} from "@/lib/pregatire/types"
import { WorkshopMaterialsTabs } from "@/components/pregatire/workshop-materials-tabs"
import { WorkshopWhiteboardCard } from "@/components/pregatire/workshop-whiteboard-card"
import { WorkshopBacBadge } from "@/components/pregatire/workshop-bac-badge"

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
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    setWorkshop(initial)
  }, [initial])

  const past = isWorkshopPast(workshop.starts_at, workshop.duration_minutes)
  const waitingForMeet = workshop.unlocked && !past && !workshop.meet_url
  const meetWindowOpen = isWorkshopMeetVisible(workshop.starts_at, new Date(nowMs))

  useEffect(() => {
    if (!waitingForMeet) return
    const id = window.setInterval(() => {
      if (!document.hidden) setNowMs(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [waitingForMeet])

  useEffect(() => {
    if (!waitingForMeet || !meetWindowOpen) return
    let cancelled = false

    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token || cancelled) return
      try {
        const detailRes = await fetch(`/api/pregatire/${workshop.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!detailRes.ok || cancelled) return
        const detailPayload = await detailRes.json()
        if (detailPayload.workshop) {
          setWorkshop(detailPayload.workshop)
        }
      } catch {
        // Keep waiting; the interval retries.
      }
    }

    void load()
    const id = window.setInterval(() => {
      if (!document.hidden) void load()
    }, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [waitingForMeet, meetWindowOpen, workshop.id])

  const full = workshop.seats_remaining === 0 && !workshop.unlocked
  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]
  const unlockCtaLabel = full
    ? "Locuri epuizate"
    : isLoggedIn
      ? "Rezervă-ți locul gratuit."
      : "Autentifică-te pentru a rezerva"

  const handleUnlock = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/pregatire/${workshop.id}`)}`)
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
          title: "Nu am putut rezerva locul",
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

      try {
        const detailRes = await fetch(`/api/pregatire/${workshop.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (detailRes.ok) {
          const detailPayload = await detailRes.json()
          if (detailPayload.workshop) {
            setWorkshop(detailPayload.workshop)
            onUnlocked?.(detailPayload.workshop)
          }
        }
      } catch {
        // Meet/recording already applied above.
      }
      if (typeof payload.balance === "number") {
        onBalanceChange?.({
          balance: payload.balance,
          carryoverBalance: typeof payload.carryoverBalance === "number" ? payload.carryoverBalance : 0,
        })
      }
      toast({
        title: payload.already_unlocked ? "Ești deja înscris" : "Te-ai înscris",
        description: past
          ? "Locul tău este rezervat. Poți accesa înregistrarea."
          : "Locul tău a fost rezervat gratuit.",
      })
    } catch {
      toast({
        title: "Eroare",
        description: "Nu am putut rezerva locul.",
        variant: "destructive",
      })
    } finally {
      setUnlocking(false)
    }
  }

  const primaryCta = (
    <>
      {!workshop.unlocked ? (
        <Button
          type="button"
          size="lg"
          className="w-full bg-[#111827] text-white hover:bg-[#1f2937]"
          disabled={unlocking || full}
          onClick={() => void handleUnlock()}
        >
          {unlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {unlockCtaLabel}
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

      {waitingForMeet ? (
        <p className="rounded-xl bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
          Link-ul Google Meet apare cu 10 minute înainte de începere
          {meetWindowOpen ? "." : ` (${formatWorkshopMeetWait(workshop.starts_at, new Date(nowMs))}).`}
        </p>
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
    </>
  )

  const detailsBody = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: color }}
        >
          {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
        </span>
        {workshop.is_bac ? <WorkshopBacBadge /> : null}
        {workshop.unlocked ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Înscris
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
        <span className="inline-flex items-center gap-1.5 text-emerald-700">Gratuit</span>
        {workshop.max_seats != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {workshop.seats_remaining ?? 0}/{workshop.max_seats} locuri
          </span>
        ) : null}
      </div>
    </>
  )

  const extras = (
    <>
      {workshop.has_whiteboard || workshop.whiteboard_url ? (
        <WorkshopWhiteboardCard
          url={workshop.whiteboard_url}
          compact={compact}
          locked={!workshop.unlocked}
          onUnlock={() => void handleUnlock()}
          unlocking={unlocking}
          unlockDisabled={full}
          unlockLabel={unlockCtaLabel}
        />
      ) : null}

      {workshop.has_notes ||
      workshop.has_homework ||
      workshop.notes_markdown ||
      workshop.notes_pdf_url ||
      workshop.homework_pdf_url ||
      (workshop.homework_items?.length ?? 0) > 0 ? (
        <WorkshopMaterialsTabs
          notesMarkdown={workshop.notes_markdown ?? null}
          notesPdfUrl={workshop.notes_pdf_url ?? null}
          homeworkPdfUrl={workshop.homework_pdf_url ?? null}
          homeworkItems={workshop.homework_items ?? []}
          compact={compact}
          locked={!workshop.unlocked}
          hasNotes={workshop.has_notes}
          hasHomework={workshop.has_homework}
          onUnlock={() => void handleUnlock()}
          unlocking={unlocking}
          unlockDisabled={full}
          unlockLabel={unlockCtaLabel}
        />
      ) : null}
    </>
  )

  if (compact) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-6">
          {detailsBody}
          {extras}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white from-40% via-white/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-10">
          <div className="pointer-events-auto space-y-3">{primaryCta}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
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
          {detailsBody}
          <div className="mt-8 space-y-3">{primaryCta}</div>
        </div>
      </div>

      {extras}
    </div>
  )
}

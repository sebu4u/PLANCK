"use client"

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Loader2, X } from "lucide-react"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import { PLANCK_WEEK_CTA, PLANCK_WEEK_SUBJECT_OPTIONS } from "@/lib/planck-week"
import { PLANCK_WEEK_FIZICA_CTA } from "@/lib/planck-week-fizica"
import { cn } from "@/lib/utils"
import {
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopSubject,
} from "@/lib/pregatire/types"

function lockIosBodyScroll() {
  const scrollY = window.scrollY
  const body = document.body
  const html = document.documentElement
  const prev = {
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
  }

  body.style.overflow = "hidden"
  body.style.position = "fixed"
  body.style.top = `-${scrollY}px`
  body.style.left = "0"
  body.style.right = "0"
  body.style.width = "100%"
  html.style.overflow = "hidden"
  html.style.overscrollBehavior = "none"

  return () => {
    body.style.overflow = prev.bodyOverflow
    body.style.position = prev.bodyPosition
    body.style.top = prev.bodyTop
    body.style.left = prev.bodyLeft
    body.style.right = prev.bodyRight
    body.style.width = prev.bodyWidth
    html.style.overflow = prev.htmlOverflow
    html.style.overscrollBehavior = prev.htmlOverscroll
    window.scrollTo(0, scrollY)
  }
}

const fieldClass =
  "h-12 w-full rounded-xl border border-[#E8E4F8] bg-white px-4 text-[16px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/15"

type LeadStep = "form" | "done"

function toggleSubject(current: WorkshopSubject[], id: WorkshopSubject): WorkshopSubject[] {
  if (current.includes(id)) return current.filter((item) => item !== id)
  return [...current, id]
}

function SubjectCards({
  selected,
  onToggle,
}: {
  selected: WorkshopSubject[]
  onToggle: (id: WorkshopSubject) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLANCK_WEEK_SUBJECT_OPTIONS.map((option) => {
        const active = selected.includes(option.id)
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            aria-pressed={active}
            className={cn(
              "rounded-xl px-3 py-2 text-[13px] font-semibold tracking-tight transition",
              active
                ? "bg-[#7C5CFC] text-white shadow-[0_2px_0_#5B47D6]"
                : "bg-white text-gray-800 ring-1 ring-[#E8E4F8]",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function PlanckWeekLeadForm({
  open,
  onOpenChange,
  lockSubject,
  initialSubject,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lockSubject?: WorkshopSubject
  initialSubject?: WorkshopSubject | null
}) {
  const locked = Boolean(lockSubject)
  const [mounted, setMounted] = useState(false)
  const [viewportBox, setViewportBox] = useState({ top: 0, height: 0 })
  const [step, setStep] = useState<LeadStep>("form")
  const [subjects, setSubjects] = useState<WorkshopSubject[]>(lockSubject ? [lockSubject] : [])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setName("")
      setPhone("")
      setError(null)
      setSubmitting(false)
      setStep("form")
      setSubjects(lockSubject ? [lockSubject] : initialSubject ? [initialSubject] : [])
      return
    }
    setStep("form")
    setSubjects(lockSubject ? [lockSubject] : initialSubject ? [initialSubject] : [])
    return lockIosBodyScroll()
  }, [open, initialSubject, lockSubject, locked])

  useEffect(() => {
    if (!open) return
    const update = () => {
      const vv = window.visualViewport
      if (vv) {
        setViewportBox({ top: vv.offsetTop, height: vv.height })
        return
      }
      setViewportBox({ top: 0, height: window.innerHeight })
    }
    update()
    window.visualViewport?.addEventListener("resize", update)
    window.visualViewport?.addEventListener("scroll", update)
    window.addEventListener("resize", update)
    return () => {
      window.visualViewport?.removeEventListener("resize", update)
      window.visualViewport?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [open])

  const onToggleSubject = useCallback(
    (id: WorkshopSubject) => {
      if (locked) return
      setSubjects((current) => toggleSubject(current, id))
      setError(null)
    },
    [locked],
  )

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (submitting) return
      if (subjects.length === 0) {
        setError("Alege cel puțin o materie.")
        return
      }
      setError(null)
      setSubmitting(true)
      try {
        const response = await fetch("/api/planck-week/fizica-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, subjects }),
        })
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null
        if (!response.ok || !payload?.ok) {
          setError(payload?.error ?? "Nu am putut salva rezervarea. Încearcă din nou.")
          return
        }
        trackFunnelEvent("form_submitted", {
          cta_id: lockSubject ? "planck_week_subject_lead" : "planck_week_lead",
          destination: "registered",
          subjects,
        })
        setStep("done")
      } catch {
        setError("Nu am putut salva rezervarea. Încearcă din nou.")
      } finally {
        setSubmitting(false)
      }
    },
    [lockSubject, name, phone, subjects, submitting],
  )

  if (!open || !mounted) return null

  const overlayStyle: CSSProperties = {
    top: viewportBox.top,
    height: viewportBox.height > 0 ? viewportBox.height : "100dvh",
  }
  const ctaLabel = lockSubject ? PLANCK_WEEK_FIZICA_CTA : PLANCK_WEEK_CTA
  const selectedLabels = subjects.map((id) => WORKSHOP_SUBJECT_LABELS[id]).join(", ")

  return createPortal(
    <div
      data-mobile-scroll-lock=""
      role="dialog"
      aria-modal="true"
      aria-label={step === "done" ? "Ești înregistrat" : "Rezervă locul"}
      className="fixed inset-x-0 z-[500] overflow-y-auto overscroll-y-contain bg-[#F7F6FC] [-webkit-overflow-scrolling:touch]"
      style={overlayStyle}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[34rem] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between py-2">
          <span className="w-11" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C5CFC]">
            Planck Week
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-white"
            aria-label="Închide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-2 pb-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-[#2BCC56]" aria-hidden />
            <h2 className="mt-5 text-[1.75rem] font-black tracking-tight text-gray-900">
              Ești înregistrat
            </h2>
            <p className="mt-3 max-w-sm text-[15px] leading-6 text-gray-500">
              Te vom contacta pentru confirmare
              {selectedLabels ? ` (${selectedLabels})` : ""}.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6]"
            >
              Închide
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="flex flex-1 flex-col pb-6">
            <h2 className="mt-4 text-[1.65rem] font-black leading-[1.15] tracking-tight text-gray-900">
              Rezervă-ți locul
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-gray-500">
              Nume și număr de telefon. Te contactăm pentru confirmare.
            </p>

            {locked ? null : (
              <div className="mt-6">
                <p className="mb-2 text-[13px] font-semibold text-gray-700">Materii</p>
                <SubjectCards selected={subjects} onToggle={onToggleSubject} />
              </div>
            )}

            <label className="mt-6 block text-[13px] font-semibold text-gray-700" htmlFor="planck-week-lead-name">
              Nume
            </label>
            <input
              id="planck-week-lead-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`mt-1.5 ${fieldClass}`}
              placeholder="Numele tău"
              required
              minLength={2}
              maxLength={80}
            />

            <label className="mt-4 block text-[13px] font-semibold text-gray-700" htmlFor="planck-week-lead-phone">
              Număr de telefon
            </label>
            <input
              id="planck-week-lead-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`mt-1.5 ${fieldClass}`}
              placeholder="07xx xxx xxx"
              required
            />

            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || subjects.length === 0}
              className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Trimitem…
                </span>
              ) : (
                ctaLabel
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

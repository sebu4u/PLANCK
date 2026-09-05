"use client"

import { useActionState, useEffect, useLayoutEffect, useState, type ComponentType } from "react"
import { useFormStatus } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { submitPlanckWeekLead, getPlanckWeekSubjectSeats, type PlanckWeekLeadActionState, type PlanckWeekSubjectSeats } from "@/app/planck-week/actions"
import { PLANCK_WEEK_CTA, PLANCK_WEEK_SUBJECT_OPTIONS } from "@/lib/planck-week"
import { rememberPlanckWeekLeadEmail } from "@/lib/planck-week-pixels"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import { metaPixel } from "@/lib/meta-pixel"
import { tiktokPixel } from "@/lib/tiktok-pixel"
import { cn } from "@/lib/utils"

const BURGER_BREAKPOINT = 948
const initialState: PlanckWeekLeadActionState = { error: null }

const fieldClass =
  "h-11 w-full rounded-xl border border-[#EBE8FF] bg-[#F8F7FF] px-4 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-shadow focus:ring-2 focus:ring-[#7C5CFC]/40"

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean | null>(null)
  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BURGER_BREAKPOINT - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return mobile
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-sm text-red-600" role="alert">
      {message}
    </p>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Se rezervă…" : PLANCK_WEEK_CTA}
    </button>
  )
}

function ReserveForm({
  Title,
  Description,
  state,
  formAction,
  seats,
}: {
  Title: ComponentType<{ className?: string; children?: React.ReactNode }>
  Description: ComponentType<{ className?: string; children?: React.ReactNode }>
  state: PlanckWeekLeadActionState
  formAction: (payload: FormData) => void
  seats: PlanckWeekSubjectSeats | null
}) {
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const email = String(new FormData(event.currentTarget).get("email") || "")
        rememberPlanckWeekLeadEmail(email)
        void tiktokPixel.identify({ email })
        metaPixel.identify({ email })
        trackFunnelEvent("planck_week_reserve_submitted", { placement: "reserve_modal" })
      }}
      className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-2 sm:px-6 sm:pb-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7C5CFC]">
        Planck Week
      </p>
      <Title className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
        Rezervă-ți locul gratuit
      </Title>
      <Description className="mt-2 text-[15px] leading-relaxed text-[#6b7280]">
        Fără card. Fără abonament ascuns. Anulezi oricând.
      </Description>

      <label className="mt-5 block text-sm font-semibold text-gray-900" htmlFor="planck-week-name">
        Nume
      </label>
      <input
        id="planck-week-name"
        name="name"
        type="text"
        autoComplete="name"
        required
        placeholder="Numele tău"
        className={cn(fieldClass, "mt-1.5")}
      />
      <FieldError message={state.fieldErrors?.name} />

      <label className="mt-4 block text-sm font-semibold text-gray-900" htmlFor="planck-week-email">
        Email
      </label>
      <input
        id="planck-week-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="email@exemplu.ro"
        className={cn(fieldClass, "mt-1.5")}
      />
      <FieldError message={state.fieldErrors?.email} />

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-gray-900">Materie(le)</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLANCK_WEEK_SUBJECT_OPTIONS.map((subject) => {
            const seat = seats?.[subject.id]
            const full = seat?.remaining === 0
            return (
              <label
                key={subject.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#EBE8FF] bg-[#F8F7FF] px-3 py-2.5 text-sm font-medium text-gray-800 has-[:checked]:border-[#7C5CFC] has-[:checked]:bg-[#7C5CFC]/10",
                  full && "cursor-not-allowed opacity-55 has-[:checked]:border-[#EBE8FF] has-[:checked]:bg-[#F8F7FF]",
                )}
              >
                <input
                  type="checkbox"
                  name="subjects"
                  value={subject.id}
                  disabled={full}
                  className="h-4 w-4 rounded border-gray-300 text-[#7C5CFC] focus:ring-[#7C5CFC]"
                />
                <span className="min-w-0 flex-1">{subject.label}</span>
                <span className="shrink-0 tabular-nums text-xs font-semibold text-gray-500">
                  {seat ? `${seat.remaining}/${seat.max}` : "…"}
                </span>
              </label>
            )
          })}
        </div>
        <FieldError message={state.fieldErrors?.subjects} />
      </fieldset>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="planck-week-company">Companie</label>
        <input
          id="planck-week-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.error && !state.fieldErrors ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  )
}

export function PlanckWeekReserveModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [state, formAction] = useActionState(submitPlanckWeekLead, initialState)
  const [seats, setSeats] = useState<PlanckWeekSubjectSeats | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void getPlanckWeekSubjectSeats().then((next) => {
      if (!cancelled) setSeats(next)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open || isMobile) return
    const first = document.getElementById("planck-week-name")
    first?.focus()
  }, [open, isMobile])

  if (isMobile === null) return null

  const inner = (
    <ReserveForm
      Title={isMobile ? SheetTitle : DialogTitle}
      Description={isMobile ? SheetDescription : DialogDescription}
      state={state}
      formAction={formAction}
      seats={seats}
    />
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          overlayClassName="!z-[450] bg-black/30"
          className="!z-[451] flex max-h-[92dvh] flex-col gap-0 overflow-y-auto rounded-t-[1.75rem] border-x border-t border-[#EBE8FF] bg-white p-0 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] outline-none"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-[#d1d5db]" aria-hidden />
          </div>
          {inner}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="!z-[450] bg-black/40"
        className="z-[451] w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-3xl border border-[#EBE8FF] bg-white p-0 shadow-[0_20px_50px_rgba(124,92,252,0.16)] outline-none sm:rounded-3xl"
      >
        {inner}
      </DialogContent>
    </Dialog>
  )
}

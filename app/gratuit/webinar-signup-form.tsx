"use client"

import {
  useActionState,
  useState,
  useRef,
  useEffect,
  type CSSProperties,
} from "react"
import Link from "next/link"
import { ArrowRight, Calculator, Home, Rocket } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PROBLEMS_BG_AVATAR_SRC } from "@/lib/planck-catalog-avatar"
import { submitWebinarLead } from "./actions"
import {
  WEBINAR_CLASA_OPTIONS,
  WEBINAR_METODA_OPTIONS,
  WEBINAR_NOTA_OPTIONS,
  type WebinarLeadActionState,
} from "./webinar-options"
import { WEBINAR_QUESTION_ICON_SRC, type WebinarQuestionIndex } from "./webinar-question-icons"

const initialState: WebinarLeadActionState = { error: null }

const accentRadio =
  "h-4 w-4 shrink-0 border-gray-300/80 bg-white/50 text-[hsl(348,83%,47%)] focus:ring-[hsl(348,83%,47%)] dark:border-white/25 dark:bg-white/10"

/** Pill-shaped glass row: white frosted bg, lit top/sides, soft bottom, subtle drop shadow */
const webinarOptionGlassPillClass =
  "flex w-full min-h-[2.75rem] cursor-pointer flex-row items-center gap-2.5 rounded-full " +
  "border border-b-white/18 border-l-white/55 border-r-white/55 border-t-white/95 " +
  "bg-white/[0.78] backdrop-blur-xl " +
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.92),0_6px_22px_-4px_rgba(15,23,42,0.09),0_2px_6px_-2px_rgba(15,23,42,0.05)] " +
  "px-4 py-2.5 sm:min-h-[3rem] sm:py-3 " +
  "transition-[background-color,box-shadow] hover:bg-white/88 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_8px_26px_-4px_rgba(15,23,42,0.1),0_2px_8px_-2px_rgba(15,23,42,0.06)] " +
  "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[hsl(348,83%,47%)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-white " +
  "dark:border-b-white/10 dark:border-l-white/16 dark:border-r-white/16 dark:border-t-white/28 " +
  "dark:bg-gray-950/45 dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_6px_22px_-4px_rgba(0,0,0,0.35)] " +
  "dark:hover:bg-gray-950/55 dark:has-[:focus-visible]:ring-offset-gray-900"

/** Glass surface for text fields — same lighting/border/blur language as option pills */
const webinarGlassFieldBase =
  "border border-b-white/18 border-l-white/55 border-r-white/55 border-t-white/95 " +
  "bg-white/[0.78] backdrop-blur-xl " +
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.92),0_6px_22px_-4px_rgba(15,23,42,0.09),0_2px_6px_-2px_rgba(15,23,42,0.05)] " +
  "text-foreground placeholder:text-muted-foreground/85 " +
  "transition-[background-color,box-shadow,border-color] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(348,83%,47%)] focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "hover:bg-white/88 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_8px_26px_-4px_rgba(15,23,42,0.1),0_2px_8px_-2px_rgba(15,23,42,0.06)] " +
  "dark:border-b-white/10 dark:border-l-white/16 dark:border-r-white/16 dark:border-t-white/28 " +
  "dark:bg-gray-950/45 dark:backdrop-blur-xl " +
  "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_6px_22px_-4px_rgba(0,0,0,0.35)] " +
  "dark:hover:bg-gray-950/55 dark:focus-visible:ring-offset-gray-900"

const webinarGlassTextareaClass = cn(
  webinarGlassFieldBase,
  "min-h-[100px] w-full resize-y rounded-2xl px-4 py-3 text-base leading-relaxed sm:text-sm",
)

const webinarGlassInputClass = cn(
  webinarGlassFieldBase,
  "h-11 w-full rounded-full px-4 text-base sm:h-10 sm:text-sm",
)

/** Same pattern as dashboard learning-path „Start” (purple gradient + dashboard-start-glow) */
const dashboardContinueClassName = cn(
  "dashboard-start-glow inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#5b21b6] active:translate-y-1 active:shadow-[0_1px_0_#5b21b6]",
)

const dashboardContinueGlowStyle = {
  "--start-glow-tint": "rgba(221, 211, 255, 0.84)",
} as CSSProperties

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-destructive mt-1.5" role="alert">
      {message}
    </p>
  )
}

function WebinarQuestionIcon({ index }: { index: WebinarQuestionIndex }) {
  return (
    <img
      src={WEBINAR_QUESTION_ICON_SRC[index]}
      alt=""
      width={44}
      height={44}
      decoding="async"
      className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
    />
  )
}

function validateStep1(form: HTMLFormElement): string | null {
  const fd = new FormData(form)
  if (!fd.get("clasa")) return "Selectează clasa."
  if (!fd.get("nota_tintita")) return "Selectează nota pe care o țintești la BAC."
  if (!fd.get("metoda_pregatire")) return "Selectează cum te pregătești acum."
  if (!String(fd.get("provocare") ?? "").trim()) return "Completează răspunsul la întrebarea 4."
  if (!String(fd.get("instrument_ideal") ?? "").trim()) return "Completează răspunsul la întrebarea 5."
  return null
}

export function WebinarSignupForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [continueError, setContinueError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(submitWebinarLead, initialState)

  useEffect(() => {
    if (!state.fieldErrors) return
    const f = state.fieldErrors
    if (
      f.clasa ||
      f.nota_tintita ||
      f.metoda_pregatire ||
      f.provocare ||
      f.instrument_ideal
    ) {
      setStep(1)
    }
  }, [state.fieldErrors])

  const handleContinue = () => {
    setContinueError(null)
    const form = formRef.current
    if (!form) return
    const msg = validateStep1(form)
    if (msg) {
      setContinueError(msg)
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="w-full flex flex-col min-h-screen">
      <header className="w-full px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 w-fit text-xl sm:text-2xl font-bold text-black dark:text-white title-font">
          <Rocket className="w-6 h-6 text-black dark:text-white shrink-0" />
          <span>PLANCK</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 transition-colors hover:text-black dark:hover:text-white text-sm font-medium"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            <span>Acasă</span>
          </Link>
          <Link
            href="/probleme"
            className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 transition-colors hover:text-black dark:hover:text-white text-sm font-medium"
          >
            <Calculator className="h-4 w-4 shrink-0" aria-hidden />
            <span>Exersează</span>
          </Link>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-12",
          step === 1 && "pt-2 sm:pt-6",
          step === 2 && "min-h-0 justify-center overflow-y-auto py-6 sm:py-10",
        )}
      >
        {step === 1 ? (
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
              Ai nevoie de ajutor la fizică?
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 sm:text-lg">
              Completează formularul să vedem cum te putem ajuta. Îți ia sub 2 minute.
            </p>
          </div>
        ) : (
          <div className="mb-8 space-y-4 text-left text-black dark:text-white">
            <p className="text-lg font-semibold leading-snug sm:text-xl">
              Și acum… surpriza de care ți-am promis!
            </p>
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 sm:text-[1.05rem]">
              Pentru că ai ajuns până aici, îți oferim o sesiune de pregătire la fizică complet gratuită cu
              unul dintre profesorii noștri!
            </p>
            <p className="text-base font-medium leading-relaxed text-gray-800 dark:text-gray-200">
              Avem nevoie doar de următoarele informații despre tine:
            </p>
          </div>
        )}

        <form
          ref={formRef}
          action={formAction}
          className={cn("space-y-8", step === 2 && "w-full shrink-0")}
        >
          {state.error ? (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </div>
          ) : null}

          <div className={cn(step !== 1 && "hidden")} aria-hidden={step !== 1}>
            <fieldset className="min-w-0 space-y-3 overflow-visible">
              <legend className="mb-3 flex w-full items-center gap-3 text-sm font-medium leading-snug text-black dark:text-white">
                <WebinarQuestionIcon index={0} />
                <span className="min-w-0 flex-1">
                  1. În ce clasă ești acum? <span className="text-destructive">*</span>
                </span>
              </legend>
              <div className="relative pt-2">
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-2 top-0 z-0 -translate-y-[65%] sm:right-4 sm:-translate-y-[68%] lg:right-[8%] lg:-translate-y-[72%]"
                >
                  <img
                    src={PROBLEMS_BG_AVATAR_SRC}
                    alt=""
                    className="h-auto w-[110px] select-none sm:w-[120px] lg:w-[135px]"
                  />
                </div>
                <div className="relative z-10 space-y-2.5">
                  {WEBINAR_CLASA_OPTIONS.map((opt) => (
                    <label key={opt} className={webinarOptionGlassPillClass}>
                      <input
                        type="radio"
                        name="clasa"
                        value={opt}
                        required
                        className={accentRadio}
                      />
                      <span className="min-w-0 flex-1 text-sm leading-snug text-black dark:text-white sm:text-base">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <FieldError message={state.fieldErrors?.clasa} />
            </fieldset>

            <fieldset className="mt-8 space-y-3 min-w-0">
              <legend className="mb-3 flex w-full items-center gap-3 text-sm font-medium leading-snug text-black dark:text-white">
                <WebinarQuestionIcon index={1} />
                <span className="min-w-0 flex-1">
                  2. Ce notă țintești la Fizică la BAC? <span className="text-destructive">*</span>
                </span>
              </legend>
              <div className="space-y-2.5">
                {WEBINAR_NOTA_OPTIONS.map((opt) => (
                  <label key={opt} className={webinarOptionGlassPillClass}>
                    <input
                      type="radio"
                      name="nota_tintita"
                      value={opt}
                      required
                      className={accentRadio}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-snug text-black dark:text-white sm:text-base">
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError message={state.fieldErrors?.nota_tintita} />
            </fieldset>

            <fieldset className="mt-8 space-y-3 min-w-0">
              <legend className="mb-3 flex w-full items-center gap-3 text-sm font-medium leading-snug text-black dark:text-white">
                <WebinarQuestionIcon index={2} />
                <span className="min-w-0 flex-1">
                  3. Cum te pregătești în momentul ăsta pentru fizică?{" "}
                  <span className="text-destructive">*</span>
                </span>
              </legend>
              <div className="space-y-2.5">
                {WEBINAR_METODA_OPTIONS.map((opt) => (
                  <label key={opt} className={webinarOptionGlassPillClass}>
                    <input
                      type="radio"
                      name="metoda_pregatire"
                      value={opt}
                      required
                      className={accentRadio}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-snug text-black dark:text-white sm:text-base">
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError message={state.fieldErrors?.metoda_pregatire} />
            </fieldset>

            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3">
                <WebinarQuestionIcon index={3} />
                <Label htmlFor="provocare" className="min-w-0 flex-1 cursor-pointer text-sm font-medium leading-snug text-black dark:text-white">
                  4. Care e cea mai mare provocare a ta la fizică acum?{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Textarea
                id="provocare"
                name="provocare"
                required
                rows={4}
                placeholder="Scrie în cuvintele tale — ce te blochează cel mai tare la fizică?"
                className={webinarGlassTextareaClass}
              />
              <FieldError message={state.fieldErrors?.provocare} />
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3">
                <WebinarQuestionIcon index={4} />
                <Label htmlFor="instrument_ideal" className="min-w-0 flex-1 cursor-pointer text-sm font-medium leading-snug text-black dark:text-white">
                  5. Dacă ai avea instrumentul perfect pentru a te pregăti la fizică, cum ar arăta?{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Textarea
                id="instrument_ideal"
                name="instrument_ideal"
                required
                rows={4}
                placeholder="Ex: Ar avea explicații scurte, exerciții după fiecare lecție, și cineva care să îmi răspundă la întrebări.."
                className={webinarGlassTextareaClass}
              />
              <FieldError message={state.fieldErrors?.instrument_ideal} />
            </div>

            <div className="mt-12 pt-2 sm:mt-14 sm:pt-1">
              {continueError ? (
                <p
                  className="mb-3 text-sm leading-snug text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {continueError}
                </p>
              ) : null}
              <button
                type="button"
                className={cn(dashboardContinueClassName, "w-full")}
                style={dashboardContinueGlowStyle}
                onClick={handleContinue}
              >
                <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                  Continuă
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </button>
            </div>
          </div>

          <div className={cn(step !== 2 && "hidden")} aria-hidden={step !== 2}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <WebinarQuestionIcon index={5} />
                <Label htmlFor="email" className="min-w-0 flex-1 cursor-pointer text-sm font-medium leading-snug text-black dark:text-white">
                  6. Emailul tău <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                required={step === 2}
                autoComplete="email"
                inputMode="email"
                className={webinarGlassInputClass}
              />
              <FieldError message={state.fieldErrors?.email} />
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3">
                <WebinarQuestionIcon index={6} />
                <Label htmlFor="telefon" className="min-w-0 flex-1 cursor-pointer text-sm font-medium leading-snug text-black dark:text-white">
                  7. Numărul tău de telefon <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="telefon"
                name="telefon"
                type="tel"
                required={step === 2}
                autoComplete="tel"
                inputMode="tel"
                className={webinarGlassInputClass}
              />
              <FieldError message={state.fieldErrors?.telefon} />
            </div>

            <button
              type="submit"
              className={cn(
                dashboardContinueClassName,
                "mt-12 sm:mt-14 disabled:cursor-not-allowed disabled:opacity-70",
              )}
              style={dashboardContinueGlowStyle}
              disabled={pending}
            >
              <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                {pending ? "Se trimite…" : "Mă înscriu la webinar"}
                {!pending ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </span>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

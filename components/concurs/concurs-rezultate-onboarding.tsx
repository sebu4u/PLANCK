"use client"

import Image from "next/image"
import { type CSSProperties, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const mainCtaClassName =
  "inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] active:translate-y-1 active:shadow-[0_1px_0_#050505]"

const secondaryButtonClassName =
  "inline-flex min-w-[200px] items-center justify-center rounded-full border border-[#d8dbe3] bg-white px-6 py-3 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#f5f6fa] active:bg-[#eef0f6]"

type ConcursRezultateOnboardingProps = {
  onFinish: () => void
  /** Doar persistă flag-ul în localStorage, fără a închide onboarding-ul (ex. înainte de navigare către /pricing). */
  markOnboardingSeen: () => void
}

export function ConcursRezultateOnboarding({ onFinish, markOnboardingSeen }: ConcursRezultateOnboardingProps) {
  const router = useRouter()
  const [pricingNavPending, startPricingTransition] = useTransition()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const blurredScore = useMemo(() => Math.floor(Math.random() * 90) + 10, [])

  const progressPercent = (step / 3) * 100
  const showBackButton = step > 1

  const handleGoPricing = () => {
    markOnboardingSeen()
    startPricingTransition(() => {
      router.push("/pricing")
    })
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#ffffff] sm:min-h-screen sm:h-auto sm:overflow-visible">
      <style jsx global>{`
        @keyframes contestResultsStepEnter {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes contestResultsButtonEnter {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Fade-only: nu folosi transform aici — altfel hover translate pe buton nu mai funcționează corect */
        @keyframes contestResultsButtonFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>

      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col sm:min-h-screen sm:h-auto">
        <header className="w-full px-4 pb-1 pt-4 sm:px-8 sm:pt-7">
          <div className="mx-auto hidden w-full max-w-[520px] items-center gap-4 sm:flex">
            <div className="w-6">
              {showBackButton ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#16181d] transition-colors hover:bg-[#f0f1f5]"
                  aria-label="Înapoi"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ebebef]">
              <div
                className="h-full rounded-full bg-[#8043f0] transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center sm:hidden">
            {showBackButton ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
                className="absolute left-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#16181d] transition-colors active:bg-[#f0f1f5]"
                aria-label="Înapoi"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            <div className="h-1.5 w-[78%] overflow-hidden rounded-full bg-[#ebebef]">
              <div
                className="h-full rounded-full bg-[#8043f0] transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <main
          className={`flex min-h-0 flex-1 items-center justify-center px-4 sm:px-6 ${
            step === 1
              ? "overflow-y-auto py-6 sm:py-10"
              : step === 2
                ? "pb-28 pt-5 sm:pb-24 sm:py-8"
                : "py-5 sm:py-8"
          }`}
        >
          {step === 1 && (
            <div
              className="mx-auto w-full max-w-[520px] text-center opacity-0"
              style={{ animation: "contestResultsStepEnter 450ms ease-out forwards" }}
            >
              <div className="flex justify-center">
                <Image src="/streak-icon.png" alt="" width={88} height={88} className="h-20 w-20 object-contain sm:h-24 sm:w-24" />
              </div>

              <h1 className="mt-5 text-[30px] font-bold leading-tight text-[#0f1115] sm:text-[36px]">Ai terminat concursul!</h1>

              <p className="mx-auto mt-3 max-w-[470px] text-[15px] leading-relaxed text-[#666a73] sm:text-base">
                Rezultatele tale sunt gata. Înainte să le vezi, hai să-ți arătăm cum poți să te asiguri că data viitoare mergi și mai departe.
              </p>

              <div className="mt-7 rounded-2xl border border-[#ececf1] bg-[#f8f8fb] p-6 sm:p-7">
                <p className="select-none text-[40px] font-extrabold tracking-tight text-[#0f1115] blur-md sm:text-[48px]">
                  {blurredScore}/100
                </p>
                <p className="mt-3 text-sm font-medium text-[#666a73]">scorul tău — deblochează mai jos</p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8">
                <button
                  type="button"
                  className={cn(
                    "dashboard-start-glow inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white opacity-0 transition-[transform,box-shadow] duration-200 ease-out hover:translate-y-1 hover:shadow-[0_1px_0_#5b21b6] active:translate-y-1 active:shadow-[0_1px_0_#5b21b6]",
                    "from-[#8b5cf6] to-[#7c3aed]",
                    "shadow-[0_4px_0_#5b21b6]"
                  )}
                  style={
                    {
                      animation: "contestResultsButtonFadeIn 380ms ease-out 140ms forwards",
                      "--start-glow-tint": "rgba(221, 211, 255, 0.84)",
                    } as CSSProperties
                  }
                  onClick={() => setStep(2)}
                >
                  <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                    Arată-mi cum
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </span>
                </button>
                <button
                  type="button"
                  className={`${secondaryButtonClassName} w-full opacity-0`}
                  style={{ animation: "contestResultsButtonEnter 380ms ease-out 220ms forwards" }}
                  onClick={onFinish}
                >
                  Mergi direct la rezultate
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div
              className="mx-auto w-full max-w-[520px] opacity-0"
              style={{ animation: "contestResultsStepEnter 450ms ease-out forwards" }}
            >
              <div className="mb-1 flex items-start gap-3 sm:mb-2 sm:gap-4">
                <div className="-mt-0.5 flex-shrink-0">
                  <Image
                    src="/streak-icon.png"
                    alt=""
                    width={56}
                    height={56}
                    className="h-12 w-12 rounded-lg object-contain sm:h-14 sm:w-14"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[26px] font-bold leading-tight text-[#0f1115] sm:text-[30px]">
                    Insight îți explică fiecare greșeală
                  </h1>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#666a73] sm:text-base">
                    Nu e de ajuns să știi că ai greșit. Trebuie să știi de ce.
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 rounded-2xl border border-[#ececf1] bg-[#f8f8fb] p-5 text-sm text-[#111111] sm:text-[15px]">
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Analiză problemă cu problemă din concurs</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Explică pas cu pas unde a mers logica greșit</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Recomandă probleme similare pentru antrenament</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Disponibil oricând, nu doar după concurs</span>
                </li>
              </ul>
            </div>
          )}

          {step === 3 && (
            <div
              className="mx-auto w-full max-w-[520px] opacity-0"
              style={{ animation: "contestResultsStepEnter 450ms ease-out forwards" }}
            >
              <div className="mb-1 flex items-start gap-3 sm:mb-2 sm:gap-4">
                <div className="-mt-0.5 flex-shrink-0">
                  <Image
                    src="/streak-icon.png"
                    alt=""
                    width={56}
                    height={56}
                    className="h-12 w-12 rounded-lg object-contain sm:h-14 sm:w-14"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[26px] font-bold leading-tight text-[#0f1115] sm:text-[30px]">
                    Deblochează feedback complet cu Premium
                  </h1>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#666a73] sm:text-base">
                    Elevii cu Premium primesc de 3× mai mult feedback după fiecare concurs.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#ececf1] bg-[#f8f8fb] px-5 py-5 text-center sm:px-6 sm:py-6">
                <p className="text-sm font-semibold text-[#111111] sm:text-[15px]">Mai puțin de 0,93* de lei/zi.</p>
                <p className="mt-2 text-xs font-normal leading-relaxed text-[#666a73] sm:text-sm">
                  Anulezi oricând. Fără angajamente.
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8">
                <button
                  type="button"
                  className={`${mainCtaClassName} w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_#050505]`}
                  disabled={pricingNavPending}
                  aria-busy={pricingNavPending}
                  onClick={handleGoPricing}
                >
                  {pricingNavPending ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      Se încarcă...
                    </>
                  ) : (
                    "Vreau feedback complet"
                  )}
                </button>
                <button type="button" className={`${secondaryButtonClassName} w-full`} onClick={onFinish}>
                  Continuă cu planul gratuit
                </button>
              </div>
            </div>
          )}
        </main>

        {step === 2 && (
          <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 sm:px-6 sm:pb-6 sm:pt-3">
            <div className="mx-auto flex max-w-[520px] justify-center">
              <button type="button" className={`${mainCtaClassName} w-full gap-2 sm:w-auto`} onClick={() => setStep(3)}>
                Continuă
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, CheckCircle2, Rocket } from "lucide-react"
import {
  formatPlanckWeekSubjects,
  parsePlanckWeekSubjects,
  PLANCK_WEEK_PREGATIRE_PATH,
} from "@/lib/planck-week"
import { trackFunnelEvent } from "@/lib/funnel-analytics"

const REDIRECT_MS = 4000

export function PlanckWeekConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subjects = useMemo(
    () => parsePlanckWeekSubjects(searchParams.get("materii")),
    [searchParams],
  )
  const subjectsLabel = formatPlanckWeekSubjects(subjects)

  useEffect(() => {
    trackFunnelEvent("planck_week_reserved", {
      subjects: subjects.join(","),
    })
    const timer = window.setTimeout(() => {
      router.replace(PLANCK_WEEK_PREGATIRE_PATH)
    }, REDIRECT_MS)
    return () => window.clearTimeout(timer)
  }, [router, subjects])

  const preview = [
    subjectsLabel ? `Materiile tale: ${subjectsLabel}` : "Materiile alese pentru Planck Week",
    "2 ședințe live / materie, rămase și înregistrate",
    "Mentor dedicat + teme verificate pe platformă",
  ]

  return (
    <div className="flex min-h-screen w-full flex-col bg-white px-4 py-10 sm:py-16">
      <header className="mx-auto mb-10 flex w-full max-w-lg justify-center">
        <Link
          href="/"
          className="title-font flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl"
        >
          <Rocket className="h-6 w-6 shrink-0" />
          <span>PLANCK</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F7FF] ring-1 ring-[#EBE8FF]">
          <CheckCircle2 className="h-8 w-8 text-[#7C5CFC]" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          Loc rezervat. Fără card.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-500 sm:text-lg">
          Te ducem acum la programul live, ca să vezi imediat ce ai câștigat.
        </p>

        <ul className="mt-8 w-full space-y-3 text-left">
          {preview.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-2xl bg-[#F8F7FF] px-4 py-3 ring-1 ring-[#EBE8FF]"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7C5CFC]" aria-hidden />
              <span className="text-sm font-medium text-gray-700 sm:text-[15px]">{item}</span>
            </li>
          ))}
        </ul>

        <Link
          href={PLANCK_WEEK_PREGATIRE_PATH}
          className="mt-10 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110"
        >
          Vezi programul live
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
        <p className="mt-3 text-xs text-gray-400">Te redirecționăm automat în câteva secunde.</p>
      </main>
    </div>
  )
}

"use client"

import Image from "next/image"
import { CheckCircle2, Sparkles } from "lucide-react"
import {
  QUIZ_COUNT_LABEL,
  VIDEO_SOLUTIONS_LABEL,
} from "@/lib/platform-marketing"

const PATH_STEPS = [
  {
    title: "Capitole structurate",
    description: "Materia e împărțită pe capitole clare, de la clasa a IX-a până la a XII-a.",
  },
  {
    title: "Lecții, grile și video",
    description: `${QUIZ_COUNT_LABEL}, ${VIDEO_SOLUTIONS_LABEL.toLowerCase()} și exerciții interactive.`,
  },
  {
    title: "Progres salvat",
    description: "Continui de unde ai rămas — pe telefon, tabletă sau laptop.",
  },
] as const

const MOCK_LESSONS = [
  { title: "Traiectoria unui corp", progress: 72 },
  { title: "Viteza medie", progress: 45 },
  { title: "Mișcarea rectilinie uniformă", progress: 18 },
] as const

function PathPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#7C5CFC]/10 via-transparent to-[#ffb56b]/10 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.12)]">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7C5CFC]">
                Traseu · Fizică
              </p>
              <p className="mt-0.5 text-base font-bold text-gray-900">Cinematica punctului material</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#EBE8FF] px-3 py-1 text-xs font-semibold text-[#5B47D6]">
              Clasa a IX-a
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {MOCK_LESSONS.map((lesson) => (
            <div
              key={lesson.title}
              className="flex items-center gap-3 rounded-xl border-[3px] border-[#e6e6e6] bg-white px-3.5 py-3 shadow-[0_4px_0_#e6e6e6]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f3f0ff]">
                <Image
                  src="/images/icons/Untitled%20design%20(47).png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{lesson.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                nou
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="h-3.5 w-3.5 text-[#7C5CFC]" aria-hidden />
            Insight îți recomandă următoarea lecție din traseu
          </div>
        </div>
      </div>
    </div>
  )
}

/** Card traseu + 3 bullets — fără titlu, selector materii sau CTA. */
export function HomePageLearningPathPreviewSection() {
  return (
    <section
      id="home-courses"
      className="bg-white py-16 sm:py-20 lg:py-24"
      aria-label="Trasee de învățare"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="scroll-animate-fade-left order-1">
            <PathPreviewMockup />
          </div>

          <div className="scroll-animate-fade-right animate-delay-200 order-2 space-y-6">
            {PATH_STEPS.map((step) => (
              <div key={step.title} className="flex gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                  <CheckCircle2 className="h-4 w-4 text-[#7C5CFC]" aria-hidden />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 sm:text-lg">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 sm:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

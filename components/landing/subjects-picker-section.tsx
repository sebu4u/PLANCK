"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { LANDING_SUBJECT_GROUPS } from "@/lib/landing-subjects"
import { EARLYBIRD_YEARLY_RON } from "@/lib/landing-earlybird"
import { tiktokPixel } from "@/lib/tiktok-pixel"
import { cn } from "@/lib/utils"

export function LandingSubjectsPickerSection() {
  const [selectedId, setSelectedId] = useState(LANDING_SUBJECT_GROUPS[0].id)
  const selected =
    LANDING_SUBJECT_GROUPS.find((subject) => subject.id === selectedId) ?? LANDING_SUBJECT_GROUPS[0]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <FadeInUp className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-md bg-[#7C5CFC] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Alege materia
            </span>
            <span className="inline-flex rounded-md bg-gray-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Începem de pe 10 septembrie
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Găsește grupa de meditații potrivită
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500 sm:text-lg">
            Selectează materia — îți arătăm cum arată grupa live și ce lucrezi acolo.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.08} className="mt-8 sm:mt-10">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">
            La ce materie vrei să lucrezi?
          </p>
          <div
            role="tablist"
            aria-label="Materii"
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
          >
            {LANDING_SUBJECT_GROUPS.map((subject) => {
              const isSelected = subject.id === selected.id
              return (
                <button
                  key={subject.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedId(subject.id)
                    tiktokPixel.trackAddToWishlist({
                      contents: [
                        {
                          content_id: `workshop_${subject.id}`,
                          content_type: "product",
                          content_name: subject.heading,
                        },
                      ],
                      value: EARLYBIRD_YEARLY_RON,
                      currency: "RON",
                    })
                  }}
                  className={cn(
                    "shrink-0 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4",
                    isSelected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-300",
                  )}
                >
                  {subject.shortLabel}
                </button>
              )
            })}
          </div>
        </FadeInUp>

        <FadeInUp delay={0.14} className="mx-auto mt-6 w-full max-w-5xl sm:mt-8">
          <div className="rounded-r-2xl border border-l-[6px] border-gray-100 border-l-[#7C5CFC] bg-[#F7F7F8] px-6 py-6 sm:px-10 sm:py-8">
            <span className="inline-flex rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {selected.badge}
            </span>
            <h3 className="mt-4 text-xl font-black tracking-tight text-gray-900 sm:text-2xl sm:leading-snug">
              {selected.heading}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
              {selected.description}
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700">{selected.groupNote}</p>
            <Link
              href={`/pregatire?subject=${selected.id}`}
              onClick={() =>
                tiktokPixel.trackSchedule(
                  `workshop_${selected.id}`,
                  selected.heading,
                  EARLYBIRD_YEARLY_RON,
                )
              }
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-gray-900 px-6 text-sm font-bold text-white transition-[filter] hover:brightness-110 sm:px-7"
            >
              Înscrie-te la meditație
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}

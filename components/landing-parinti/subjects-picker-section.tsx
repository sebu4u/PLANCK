"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import {
  PARENT_CTA_LABEL_ENROLL,
  PARENT_LANDING_CTA_HREF,
  PARENT_SUBJECT_GROUPS,
} from "@/lib/landing-parinti"
import { cn } from "@/lib/utils"

export function ParentSubjectsPickerSection() {
  const [selectedId, setSelectedId] = useState(PARENT_SUBJECT_GROUPS[0].id)
  const selected =
    PARENT_SUBJECT_GROUPS.find((subject) => subject.id === selectedId) ?? PARENT_SUBJECT_GROUPS[0]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <FadeInUp className="text-center">
          <span className="inline-flex rounded-md bg-[#7C5CFC] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Alege materia
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Alege materia la care copilul trebuie să recupereze
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500 sm:text-lg">
            Selectează materia — vezi cum arată grupa live și ce lucrează acolo pentru BAC.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.08} className="mt-8 sm:mt-10">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">
            La ce materie are nevoie de ajutor?
          </p>
          <div
            role="tablist"
            aria-label="Materii"
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
          >
            {PARENT_SUBJECT_GROUPS.map((subject) => {
              const isSelected = subject.id === selected.id
              return (
                <button
                  key={subject.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(subject.id)}
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
              href={PARENT_LANDING_CTA_HREF}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-gray-900 px-6 text-sm font-bold text-white transition-[filter] hover:brightness-110 sm:px-7"
            >
              {PARENT_CTA_LABEL_ENROLL}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}

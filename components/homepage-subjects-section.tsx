"use client"

import { useState } from "react"
import Link from "next/link"
import { MathGraphSim } from "@/components/onboarding/MathGraphSim"
import { CsPathfindingSim } from "@/components/onboarding/CsPathfindingSim"
import { PhysicsPendulumSim } from "@/components/onboarding/PhysicsPendulumSim"
import { BiologyDnaPairingSim } from "@/components/onboarding/BiologyDnaPairingSim"

type SubjectId = "matematica" | "informatica" | "fizica" | "biologie"

const SUBJECTS: {
  id: SubjectId
  label: string
  chapters: string[]
  additionalCount: number
}[] = [
  {
    id: "matematica",
    label: "Matematică",
    chapters: [
      "Introducere în vectori",
      "Funcția de gradul I",
      "Funcția de gradul II",
      "Ecuații și inecuații",
      "Geometrie în plan",
      "Trigonometrie",
      "Șiruri și progresii",
    ],
    additionalCount: 12,
  },
  {
    id: "informatica",
    label: "Informatică",
    chapters: [
      "Introducere în Python",
      "Structuri de control",
      "Liste și dicționare",
      "Algoritmi de căutare",
      "Sortări",
      "Structuri de date",
      "Complexitate",
    ],
    additionalCount: 8,
  },
  {
    id: "fizica",
    label: "Fizică",
    chapters: [
      "Cinematica",
      "Dinamica",
      "Lucru și energie",
      "Oscilații",
      "Termodinamică",
      "Circuite electrice",
      "Optică geometrică",
    ],
    additionalCount: 18,
  },
  {
    id: "biologie",
    label: "Biologie",
    chapters: [
      "Celula",
      "Țesuturi",
      "Sistemul osos",
      "Sistemul muscular",
      "Sistemul nervos",
      "Nutriție",
      "Reproducere",
    ],
    additionalCount: 9,
  },
]

const MOBILE_VISIBLE_CHAPTERS = 4
const DESKTOP_VISIBLE_CHAPTERS = 7

const MOBILE_SIM_FRAME: Record<SubjectId, string> = {
  matematica: "max-lg:aspect-square",
  informatica: "max-lg:aspect-[5/4]",
  fizica: "max-lg:aspect-[10/11]",
  biologie: "max-lg:aspect-[5/6]",
}

function SubjectSimulation({ subject }: { subject: SubjectId }) {
  switch (subject) {
    case "matematica":
      return <MathGraphSim />
    case "informatica":
      return <CsPathfindingSim />
    case "fizica":
      return <PhysicsPendulumSim />
    case "biologie":
      return <BiologyDnaPairingSim />
  }
}

export function HomePageSubjectsSection() {
  const [activeId, setActiveId] = useState<SubjectId>("matematica")

  const active = SUBJECTS.find((s) => s.id === activeId) ?? SUBJECTS[0]!
  const desktopChapters = active.chapters.slice(0, DESKTOP_VISIBLE_CHAPTERS)
  const mobileChapters = active.chapters.slice(0, MOBILE_VISIBLE_CHAPTERS)
  const mobileAdditionalCount =
    active.additionalCount + Math.max(0, active.chapters.length - MOBILE_VISIBLE_CHAPTERS)

  return (
    <section
      id="home-subjects"
      className="bg-[#F5F3F1] py-12 sm:py-14 lg:bg-white lg:py-20"
      aria-labelledby="home-subjects-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="scroll-animate-fade-up lg:rounded-[2.5rem] lg:border lg:border-[#E8E8E8] lg:bg-[#F5F3F1] lg:px-12 lg:py-14">
          <h2
            id="home-subjects-heading"
            className="text-center font-serif text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem]"
          >
            De la clasa a V-a până la admitere și mai departe
          </h2>

          <div
            className="mt-6 flex flex-nowrap items-center justify-center gap-1 sm:mt-8 sm:gap-1.5 lg:mt-10 lg:flex-wrap lg:gap-3"
            role="tablist"
            aria-label="Materii"
          >
            {SUBJECTS.map((subject) => {
              const isActive = subject.id === activeId
              return (
                <button
                  key={subject.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(subject.id)}
                  className={`shrink-0 rounded-full font-semibold transition-colors max-lg:px-2 max-lg:py-1.5 max-lg:text-[10px] max-lg:leading-none sm:max-lg:px-2.5 sm:max-lg:text-[11px] lg:px-5 lg:py-2.5 lg:text-base ${
                    isActive
                      ? "bg-[#111111] text-white"
                      : "border border-[#E0E0E0] bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {subject.label}
                </button>
              )
            })}
          </div>

          <div className="relative mx-auto mt-6 w-full lg:mt-10 lg:max-w-5xl lg:overflow-hidden lg:rounded-3xl lg:bg-[#EAE8E7]">
            <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
              <div className="flex min-w-0 flex-col justify-center max-lg:px-0 max-lg:py-5 lg:py-8 lg:pl-7 lg:pr-1">
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Capitole acoperite</h3>
                <ul className="mt-3 space-y-1.5 lg:mt-5 lg:space-y-3">
                  {desktopChapters.map((chapter) => (
                    <li
                      key={chapter}
                      className={`text-base text-gray-800 sm:text-lg ${
                        mobileChapters.includes(chapter) ? "" : "hidden lg:list-item"
                      }`}
                    >
                      {chapter}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/invata"
                  className="mt-4 w-fit text-sm font-medium text-gray-500 underline decoration-dotted decoration-gray-400 underline-offset-4 transition-colors hover:text-gray-800 lg:mt-6 lg:text-base"
                >
                  <span className="lg:hidden">{mobileAdditionalCount} capitole adiționale</span>
                  <span className="hidden lg:inline">{active.additionalCount} capitole adiționale</span>
                </Link>
              </div>

              <div className="min-w-0 max-lg:pt-1 lg:py-6 lg:pl-0 lg:pr-6">
                <div
                  className={`relative w-full overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white p-3 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)] transition-[aspect-ratio] duration-300 sm:rounded-3xl sm:p-5 lg:aspect-auto lg:h-full lg:min-h-[24rem] ${MOBILE_SIM_FRAME[activeId]}`}
                >
                  <div className="flex h-full min-h-0 w-full flex-col justify-center">
                    <SubjectSimulation key={activeId} subject={activeId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

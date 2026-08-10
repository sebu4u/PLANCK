"use client"

import { useEffect, useState } from "react"
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

const AUTO_ROTATE_MS = 15_000

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const index = SUBJECTS.findIndex((s) => s.id === current)
        const next = SUBJECTS[(index + 1) % SUBJECTS.length]
        return next?.id ?? "matematica"
      })
    }, AUTO_ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [activeId])

  const active = SUBJECTS.find((s) => s.id === activeId) ?? SUBJECTS[0]!

  return (
    <section
      id="home-subjects"
      className="bg-white py-14 sm:py-16 lg:py-20"
      aria-labelledby="home-subjects-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="scroll-animate-fade-up rounded-[2rem] border border-[#E8E8E8] bg-[#F5F3F1] px-5 py-10 sm:rounded-[2.5rem] sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <h2
            id="home-subjects-heading"
            className="text-center font-serif text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem]"
          >
            De la clasa a V-a până la admitere și mai departe
          </h2>

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10 sm:gap-3"
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
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 sm:py-2.5 sm:text-base ${
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

          <div className="relative mx-auto mt-8 w-full max-w-4xl overflow-hidden rounded-2xl bg-[#EAE8E7] sm:mt-10 sm:rounded-3xl lg:max-w-5xl">
            <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
              <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-6 sm:py-8 lg:py-8 lg:pl-7 lg:pr-1">
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Capitole acoperite</h3>
                <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
                  {active.chapters.slice(0, 7).map((chapter) => (
                    <li key={chapter} className="text-base text-gray-800 sm:text-lg">
                      {chapter}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/invata"
                  className="mt-5 w-fit text-sm font-medium text-gray-500 underline decoration-dotted decoration-gray-400 underline-offset-4 transition-colors hover:text-gray-800 sm:mt-6 sm:text-base"
                >
                  {active.additionalCount} capitole adiționale
                </Link>
              </div>

              {/* Distanță fixă față de sus / jos / dreapta cardului gri */}
              <div className="min-w-0 px-5 pb-5 sm:px-6 sm:pb-6 lg:py-6 lg:pr-6 lg:pl-0">
                <div className="relative aspect-[16/10] h-full w-full overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white p-3 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)] sm:rounded-3xl sm:p-5 lg:aspect-auto lg:min-h-[24rem]">
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
